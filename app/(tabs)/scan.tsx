import React, { useState } from 'react';
import { StyleSheet, ActivityIndicator, Alert, Dimensions, View as RNView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import Button from '@/components/ui/Button';

import { handleApiError } from '@/utils/error-handler';

export default function BatchScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [scanning, setScanning] = useState(true);
  const [mode, setMode] = useState<'transaction' | 'info'>('transaction');
  const [condition, setCondition] = useState<'Good' | 'Broken'>('Good');
  const [evidenceImage, setEvidenceImage] = useState<string | null>(null);
  const router = useRouter();

  if (!permission) {
    return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator color="#CC0D00" /></View>;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center px-8 bg-white">
        <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-6">
          <Feather name="camera" size={32} color="#666" />
        </View>
        <Text className="text-gray-900 text-xl font-bold text-center mb-2">Truy cập Camera</Text>
        <Text className="text-gray-500 text-center mb-8">Cần cấp quyền camera để quét mã QR thiết bị.</Text>
        <Button title="CẤP QUYỀN CAMERA" onPress={requestPermission} />
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!scanning) return;

    setScanning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      if (mode === 'info') {
        const response = await api.get(`/equipment/verify?qr_data=${data}`);
        router.push(`/equipment/${response.data.data?.equipment_id || response.data.equipment_id}`);
        return;
      }

      if (scannedItems.find(item => item.qr_code_data === data)) {
        Alert.alert('Thông báo', 'Thiết bị này đã được quét');
        setTimeout(() => setScanning(true), 1500);
        return;
      }

      const response = await api.get(`/equipment/verify?qr_data=${data}`);
      const itemData = response.data.data || response.data;
      setScannedItems(prev => [...prev, { ...itemData, qr_code_data: data }]);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      handleApiError(error, 'Mã QR không hợp lệ');
    } finally {
      if (mode === 'transaction') {
        setTimeout(() => setScanning(true), 1500);
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setEvidenceImage(result.assets[0].uri);
      }
    } catch (error) {
      handleApiError(error, 'Không thể chọn ảnh');
    }
  };

  const handleConfirm = async () => {
    if (scannedItems.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      for (const item of scannedItems) {
        const endpoint = item.status === 'available' ? 'checkout' : 'checkin';
        const formData = new FormData();
        formData.append('qr_code_data', item.qr_code_data);
        formData.append('condition', condition === 'Good' ? 'Tình trạng tốt' : 'Phát hiện hỏng hóc/lỗi');
        
        if (evidenceImage) {
          const filename = evidenceImage.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image`;
          
          formData.append('image', { uri: evidenceImage, name: filename, type } as any);
        }

        await api.put(`/transactions/${item.transaction_id}/${endpoint}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Thành công', `Đã xử lý ${scannedItems.length} thiết bị!`);
      router.back();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      handleApiError(error, 'Lỗi xử lý giao dịch');
    }
  };

  const removeItem = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScannedItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="h-[50%] relative">
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        
        <View className="absolute inset-0 items-center justify-center">
          <View className="w-64 h-64 border-2 border-white/50 rounded-2xl" />
          {!scanning && (
            <View className="absolute bg-green-500 px-4 py-2 rounded-full">
              <Text className="text-white font-bold">ĐÃ QUÉT!</Text>
            </View>
          )}
        </View>

        <Pressable 
          className="absolute top-12 left-4 w-10 h-10 bg-black/50 rounded-full items-center justify-center"
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="white" />
        </Pressable>

        <View className="absolute top-12 right-4 flex-row bg-black/50 p-1 rounded-full">
          <Pressable 
            className={`px-4 py-1.5 rounded-full ${mode === 'transaction' ? 'bg-primary' : ''}`}
            onPress={() => { setMode('transaction'); setScannedItems([]); }}
          >
            <Text className="text-white text-xs font-bold">GIAO DỊCH</Text>
          </Pressable>
          <Pressable 
            className={`px-4 py-1.5 rounded-full ${mode === 'info' ? 'bg-primary' : ''}`}
            onPress={() => { setMode('info'); setScannedItems([]); }}
          >
            <Text className="text-white text-xs font-bold">TRA CỨU</Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-1 bg-white rounded-t-[30px] -mt-6 shadow-sm p-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">
            {mode === 'transaction' ? `Đã quét (${scannedItems.length})` : 'Thông tin'}
          </Text>
          {scannedItems.length > 0 && mode === 'transaction' && (
            <Pressable onPress={() => setScannedItems([])}>
              <Text className="text-red-500 font-medium">Xóa</Text>
            </Pressable>
          )}
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {mode === 'transaction' && scannedItems.length === 0 ? (
            <View className="items-center justify-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Feather name="maximize" size={40} color="#D1D1D6" />
              <Text className="text-gray-400 mt-2 text-center text-sm">Đưa mã QR vào khung hình camera</Text>
            </View>
          ) : (
            <>
              {mode === 'transaction' && (
                <View className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <Text className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">Tình trạng thiết bị</Text>
                  <View className="flex-row">
                    <Pressable 
                      className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg mr-2 ${condition === 'Good' ? 'bg-green-50 border-green-500' : 'bg-white border-transparent shadow-sm'} border`}
                      onPress={() => setCondition('Good')}
                    >
                      <Feather name="check-circle" size={16} color={condition === 'Good' ? '#34C759' : '#C7C7CC'} />
                      <Text className={`ml-2 font-bold text-xs ${condition === 'Good' ? 'text-green-600' : 'text-gray-500'}`}>TỐT</Text>
                    </Pressable>
                    <Pressable 
                      className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${condition === 'Broken' ? 'bg-red-50 border-red-500' : 'bg-white border-transparent shadow-sm'} border`}
                      onPress={() => setCondition('Broken')}
                    >
                      <Feather name="alert-triangle" size={16} color={condition === 'Broken' ? '#FF3B30' : '#C7C7CC'} />
                      <Text className={`ml-2 font-bold text-xs ${condition === 'Broken' ? 'text-red-600' : 'text-gray-500'}`}>HỎNG</Text>
                    </Pressable>
                  </View>
                  
                  {condition === 'Broken' && (
                    <View className="mt-4">
                      <Text className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Hình ảnh minh chứng</Text>
                      {evidenceImage ? (
                        <View className="relative h-32 w-full rounded-xl overflow-hidden mb-2">
                          <Image source={{ uri: evidenceImage }} className="w-full h-full bg-gray-200" resizeMode="cover" />
                          <Pressable 
                            className="absolute top-2 right-2 bg-black/50 w-8 h-8 rounded-full items-center justify-center"
                            onPress={() => setEvidenceImage(null)}
                          >
                            <Feather name="x" size={16} color="white" />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable 
                          className="h-20 w-full border border-dashed border-gray-300 rounded-xl items-center justify-center bg-white"
                          onPress={pickImage}
                        >
                          <Feather name="camera" size={24} color="#007AFF" />
                          <Text className="text-xs text-primary font-medium mt-1">Tải ảnh lên</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              )}

              {scannedItems.map((item, index) => (
                <View key={index} className="flex-row items-center bg-white p-3 rounded-xl mb-2 shadow-sm border border-gray-100">
                  <View className="w-10 h-10 bg-red-50 rounded-lg items-center justify-center mr-3">
                    <Feather name="monitor" size={20} color="#CC0D00" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900 text-sm" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-xs text-gray-500 mt-1">SN: {item.serial_number}</Text>
                  </View>
                  <Pressable onPress={() => removeItem(index)} className="p-2">
                    <Feather name="delete" size={16} color="#FF3B30" />
                  </Pressable>
                </View>
              ))}
            </>
          )}
        </ScrollView>

        {mode === 'transaction' && (
          <View className="pt-2">
            <Button 
              title={`Xác nhận (${scannedItems.length})`} 
              onPress={handleConfirm} 
              disabled={scannedItems.length === 0}
            />
          </View>
        )}
      </View>
    </View>
  );
}
