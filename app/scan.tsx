import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, Alert, Dimensions, View as RNView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { IconOutline } from '@ant-design/icons-react-native';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const { width, height } = Dimensions.get('window');

export default function BatchScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [scanning, setScanning] = useState(true);
  const [mode, setMode] = useState<'transaction' | 'info'>('transaction');
  const [condition, setCondition] = useState<'Good' | 'Broken'>('Good');
  const router = useRouter();

  if (!permission) {
    return <View className="flex-1 justify-center items-center bg-secondary-dark"><ActivityIndicator color="#CC0D00" /></View>;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center px-10 bg-secondary-dark">
        <View className="w-20 h-20 bg-white/10 rounded-3xl items-center justify-center mb-6">
          <IconOutline name="camera" size={40} color="white" />
        </View>
        <Text className="text-white text-2xl font-bold text-center mb-2">Quyền truy cập Camera</Text>
        <Text className="text-gray-400 text-center mb-10 leading-6">Chúng tôi cần quyền truy cập Camera để quét mã QR thiết bị và thực hiện các giao dịch mượn/trả.</Text>
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
        Alert.alert('Thông báo', 'Thiết bị này đã có trong danh sách quét');
        setTimeout(() => setScanning(true), 1500);
        return;
      }

      const response = await api.get(`/equipment/verify?qr_data=${data}`);
      const itemData = response.data.data || response.data;
      setScannedItems(prev => [...prev, { ...itemData, qr_code_data: data }]);
    } catch (error) {
      Alert.alert('Lỗi', 'Mã QR không hợp lệ hoặc thiết bị không tồn tại');
    } finally {
      if (mode === 'transaction') {
        setTimeout(() => setScanning(true), 1500);
      }
    }
  };

  const handleConfirm = async () => {
    if (scannedItems.length === 0) return;
    
    try {
      for (const item of scannedItems) {
        const endpoint = item.status === 'available' ? 'checkout' : 'checkin';
        await api.put(`/transactions/${item.transaction_id}/${endpoint}`, {
          qr_code_data: item.qr_code_data,
          condition: condition === 'Good' ? 'Tình trạng tốt' : 'Phát hiện hỏng hóc/lỗi'
        });
      }
      Alert.alert('Thành công', `Đã xử lý bàn giao cho ${scannedItems.length} thiết bị thành công!`);
      router.back();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xử lý yêu cầu hàng loạt');
    }
  };

  const removeItem = (index: number) => {
    setScannedItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <View className="flex-1 bg-secondary-dark">
      <View className="h-[60%] relative">
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        
        <View className="absolute inset-0 items-center justify-center">
          <Animated.View entering={ZoomIn.duration(1000)}>
            <RNView className="w-72 h-72 border-[3px] border-primary rounded-[50px] items-center justify-center">
              <RNView className="absolute top-0 left-0 w-10 h-10 border-t-[5px] border-l-[5px] border-white rounded-tl-3xl" />
              <RNView className="absolute top-0 right-0 w-10 h-10 border-t-[5px] border-r-[5px] border-white rounded-tr-3xl" />
              <RNView className="absolute bottom-0 left-0 w-10 h-10 border-b-[5px] border-l-[5px] border-white rounded-bl-3xl" />
              <RNView className="absolute bottom-0 right-0 w-10 h-10 border-b-[5px] border-r-[5px] border-white rounded-br-3xl" />
              
              {!scanning && (
                <Animated.View entering={FadeIn} className="bg-success px-6 py-2 rounded-full shadow-lg">
                  <Text className="text-white font-bold text-lg">ĐÃ NHẬN!</Text>
                </Animated.View>
              )}
            </RNView>
          </Animated.View>
        </View>

        <View className="absolute top-14 left-6 right-6 flex-row justify-between items-center">
          <Pressable 
            className="w-12 h-12 bg-black/40 rounded-2xl items-center justify-center border border-white/20"
            onPress={() => router.back()}
          >
            <IconOutline name="close" size={24} color="white" />
          </Pressable>
          
          <View className="flex-row bg-black/40 p-1.5 rounded-2xl border border-white/20">
            <Pressable 
              className={`px-4 py-2 rounded-xl ${mode === 'transaction' ? 'bg-primary' : ''}`}
              onPress={() => { setMode('transaction'); setScannedItems([]); }}
            >
              <Text className="text-white text-xs font-bold">GIAO DỊCH</Text>
            </Pressable>
            <Pressable 
              className={`px-4 py-2 rounded-xl ${mode === 'info' ? 'bg-primary' : ''}`}
              onPress={() => { setMode('info'); setScannedItems([]); }}
            >
              <Text className="text-white text-xs font-bold">TRA CỨU</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Animated.View 
        entering={FadeInDown.duration(800)}
        className="flex-1 bg-surface-muted -mt-10 rounded-t-[40px] shadow-premium p-8"
      >
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-secondary">
            {mode === 'transaction' ? `Đã quét (${scannedItems.length})` : 'Thông tin'}
          </Text>
          {scannedItems.length > 0 && mode === 'transaction' && (
            <Pressable onPress={() => setScannedItems([])}>
              <Text className="text-primary font-bold">Xóa tất cả</Text>
            </Pressable>
          )}
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {mode === 'transaction' && scannedItems.length === 0 ? (
            <View className="items-center justify-center py-10 border-2 border-dashed border-gray-200 rounded-[30px]">
              <IconOutline name="qrcode" size={48} color="#D1D1D6" />
              <Text className="text-gray-400 mt-4 text-center font-medium">Đưa mã QR vào khung hình camera</Text>
            </View>
          ) : (
            <>
              {mode === 'transaction' && (
                <View className="mb-6 bg-white p-6 rounded-[30px] shadow-sm border border-gray-50">
                  <Text className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest">Xác nhận tình trạng hiện tại</Text>
                  <View className="flex-row">
                    <Pressable 
                      className={`flex-1 flex-row items-center justify-center py-3 rounded-2xl mr-2 ${condition === 'Good' ? 'bg-success/10 border-success' : 'bg-gray-50 border-transparent'} border`}
                      onPress={() => setCondition('Good')}
                    >
                      <IconOutline name="check-circle" size={18} color={condition === 'Good' ? '#34C759' : '#C7C7CC'} />
                      <Text className={`ml-2 font-bold ${condition === 'Good' ? 'text-success' : 'text-gray-400'}`}>TỐT</Text>
                    </Pressable>
                    <Pressable 
                      className={`flex-1 flex-row items-center justify-center py-3 rounded-2xl ${condition === 'Broken' ? 'bg-error/10 border-error' : 'bg-gray-50 border-transparent'} border`}
                      onPress={() => setCondition('Broken')}
                    >
                      <IconOutline name="warning" size={18} color={condition === 'Broken' ? '#FF3B30' : '#C7C7CC'} />
                      <Text className={`ml-2 font-bold ${condition === 'Broken' ? 'text-error' : 'text-gray-400'}`}>HỎNG</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {scannedItems.map((item, index) => (
                <Animated.View 
                  key={index} 
                  entering={FadeInDown.delay(index * 100)}
                  className="flex-row items-center bg-white p-4 rounded-3xl mb-3 shadow-sm border border-gray-50"
                >
                  <RNView className="w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center mr-4">
                    <IconOutline name="laptop" size={24} color="#CC0D00" />
                  </RNView>
                  <RNView className="flex-1">
                    <Text className="font-bold text-secondary text-base" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-xs text-gray-400 mt-1">SN: {item.serial_number}</Text>
                  </RNView>
                  <Pressable onPress={() => removeItem(index)} className="p-2 bg-gray-50 rounded-full">
                    <IconOutline name="delete" size={18} color="#FF3B30" />
                  </Pressable>
                </Animated.View>
              ))}
            </>
          )}
        </ScrollView>

        {mode === 'transaction' && (
          <RNView className="pt-4">
            <Button 
              title={`XÁC NHẬN ${scannedItems.length} THIẾT BỊ`} 
              onPress={handleConfirm} 
              disabled={scannedItems.length === 0}
            />
          </RNView>
        )}
      </Animated.View>
    </View>
  );
}
