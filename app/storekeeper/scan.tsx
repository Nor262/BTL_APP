import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, Alert, Pressable, ScrollView, Image, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { handleApiError } from '@/utils/error-handler';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function StorekeeperScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [scanning, setScanning] = useState(true);
  const [condition, setCondition] = useState<'Good' | 'Broken'>('Good');
  const [evidenceImage, setEvidenceImage] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!permission) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#CC0D00" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center px-8 bg-white">
        <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-6">
          <Feather name="camera" size={32} color="#666" />
        </View>
        <Text className="text-gray-900 text-xl font-bold text-center mb-2">Truy cập Camera</Text>
        <Text className="text-gray-500 text-center mb-8">Cần cấp quyền camera để bàn giao, nhận thiết bị.</Text>
        <Button title="CẤP QUYỀN CAMERA" onPress={requestPermission} />
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!scanning) return;

    setScanning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);

    try {
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
      setLoading(false);
      setTimeout(() => setScanning(true), 1500);
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
    setLoading(true);
    
    try {
      for (const item of scannedItems) {
        const endpoint = item.status === 'available' ? 'checkout' : 'checkin';
        const formData = new FormData();
        formData.append('qr_code_data', item.qr_code_data || '');
        formData.append('condition', condition === 'Good' ? 'Tình trạng tốt' : 'Phát hiện hỏng hóc/lỗi');
        
        if (evidenceImage) {
          const filename = evidenceImage.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          
          formData.append('image', { uri: evidenceImage, name: filename, type } as any);
        }

        await api.put(`/transactions/${item.transaction_id || item.id}/${endpoint}`, formData, {
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
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!serialNumber.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập số Serial');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/transactions/verify-item', { serial_number: serialNumber.trim() });
      const itemData = response.data.data || response.data;
      
      if (scannedItems.find(item => item.id === itemData.id)) {
        Alert.alert('Thông báo', 'Thiết bị này đã được nhập');
        return;
      }

      setScannedItems(prev => [...prev, { ...itemData, qr_code_data: itemData.qr_code_data || itemData.serial_number }]);
      setShowManualInput(false);
      setSerialNumber('');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      handleApiError(error, 'Không tìm thấy thiết bị với số Serial đã nhập');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScannedItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-gray-50"
    >
      <View className="h-[45%] relative bg-black">
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        
        <View className="absolute inset-0 items-center justify-center">
          <View className="w-56 h-56 border-2 rounded-2xl" style={{ borderColor: 'rgba(255, 255, 255, 0.5)' }} />
        </View>

        <Pressable 
          className="absolute top-12 left-4 w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="white" />
        </Pressable>

        <View className="absolute top-12 right-4 flex-row">
          <Pressable 
            className="w-11 h-11 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowManualInput(!showManualInput);
            }}
          >
            <Feather name={showManualInput ? 'camera' : 'edit'} size={20} color="white" />
          </Pressable>
        </View>
      </View>

      <View 
        className="flex-1 bg-white rounded-t-[30px] -mt-6 p-6" 
        style={{ 
          shadowColor: '#000', 
          shadowOffset: { width: 0, height: -2 }, 
          shadowOpacity: 0.05, 
          shadowRadius: 3, 
          elevation: 2 
        }}
      >
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">
            Da quet ({scannedItems.length})
          </Text>
          {scannedItems.length > 0 && (
            <Pressable onPress={() => setScannedItems([])}>
              <Text className="text-red-500 font-medium">Xóa tất cả</Text>
            </Pressable>
          )}
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {scannedItems.length === 0 ? (
            <View className="items-center justify-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Feather name="maximize" size={40} color="#D1D1D6" />
              <Text className="text-gray-400 mt-2 text-center text-sm font-medium">Đưa mã QR thiết bị vào khung hình camera</Text>
            </View>
          ) : (
            <>
              <View className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <Text className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">Tình trạng thiết bị</Text>
                <View className="flex-row">
                  <Pressable 
                    className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg mr-2 ${condition === 'Good' ? 'bg-green-50 border-green-500' : 'bg-white border-transparent'} border`}
                    style={condition !== 'Good' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 } : undefined}
                    onPress={() => setCondition('Good')}
                  >
                    <Feather name="check-circle" size={16} color={condition === 'Good' ? '#34C759' : '#C7C7CC'} />
                    <Text className={`ml-2 font-bold text-xs ${condition === 'Good' ? 'text-green-600' : 'text-gray-500'}`}>TỐT</Text>
                  </Pressable>
                  <Pressable 
                    className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${condition === 'Broken' ? 'bg-red-50 border-red-500' : 'bg-white border-transparent'} border`}
                    style={condition !== 'Broken' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 } : undefined}
                    onPress={() => setCondition('Broken')}
                  >
                    <Feather name="alert-triangle" size={16} color={condition === 'Broken' ? '#FF3B30' : '#C7C7CC'} />
                    <Text className={`ml-2 font-bold text-xs ${condition === 'Broken' ? 'text-red-600' : 'text-gray-500'}`}>HỎNG HÓC</Text>
                  </Pressable>
                </View>
                
                {condition === 'Broken' && (
                  <View className="mt-4">
                    <Text className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Hinh anh minh chung</Text>
                    {evidenceImage ? (
                      <View className="relative h-32 w-full rounded-xl overflow-hidden mb-2">
                        <Image source={{ uri: evidenceImage }} className="w-full h-full bg-gray-200" resizeMode="cover" />
                        <Pressable 
                          className="absolute top-2 right-2 w-8 h-8 rounded-full items-center justify-center"
                          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
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
                        <Feather name="camera" size={24} color="#CC0D00" />
                        <Text className="text-xs text-primary font-medium mt-1">Tải ảnh lên</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>

              {scannedItems.map((item, index) => (
                <View 
                  key={index} 
                  className="flex-row items-center bg-white p-3 rounded-xl mb-2 border border-gray-100"
                  style={{ 
                    shadowColor: '#000', 
                    shadowOffset: { width: 0, height: 1 }, 
                    shadowOpacity: 0.05, 
                    shadowRadius: 1, 
                    elevation: 1 
                  }}
                >
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

        <View className="pt-2">
          <Button 
            title={`Xác nhận thực hiện (${scannedItems.length})`} 
            onPress={handleConfirm} 
            disabled={scannedItems.length === 0 || loading}
            loading={loading}
          />
        </View>

        {showManualInput && (
          <Animated.View 
            entering={FadeInDown} 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[30px] p-6"
            style={{ 
              shadowColor: '#000', 
              shadowOffset: { width: 0, height: -4 }, 
              shadowOpacity: 0.1, 
              shadowRadius: 12, 
              elevation: 8 
            }}
          >
            <Text className="text-lg font-bold text-gray-900 mb-4">Nhập số Serial thiết bị</Text>
            <Input
              label="Số Serial"
              placeholder="VD: SN-123456"
              value={serialNumber}
              onChangeText={setSerialNumber}
              autoCapitalize="characters"
              icon="tag"
            />
            <View className="flex-row mt-4">
              <Button 
                title="Hủy" 
                variant="secondary" 
                onPress={() => setShowManualInput(false)} 
                containerClassName="flex-1 mr-2"
              />
              <Button 
                title="Nhập" 
                onPress={handleManualSubmit} 
                containerClassName="flex-1 ml-2"
              />
            </View>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
