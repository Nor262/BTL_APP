import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { View, Text, Pressable, ScrollView } from '@/tw';
import { IconOutline } from '@ant-design/icons-react-native';
import { useRouter } from 'expo-router';
import api from '@/api/client';

export default function BatchScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [scanning, setScanning] = useState(true);
  const [mode, setMode] = useState<'transaction' | 'info'>('transaction');
  const [condition, setCondition] = useState<'Good' | 'Broken'>('Good');
  const router = useRouter();

  if (!permission) {
    return <View className="flex-1 justify-center items-center"><ActivityIndicator /></View>;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center px-8">
        <Text className="text-center mb-4">Chúng tôi cần quyền truy cập Camera để quét mã QR</Text>
        <Pressable className="bg-primary px-6 py-3 rounded-ant" onPress={requestPermission}>
          <Text className="text-white font-bold">CẤP QUYỀN CAMERA</Text>
        </Pressable>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!scanning) return;

    setScanning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      if (mode === 'info') {
        // Just verify and show info (redirect to detail)
        const response = await api.get(`/equipment/verify?qr_data=${data}`);
        router.push(`/equipment/${response.data.equipment_id}`);
        return;
      }

      // Transaction mode
      if (scannedItems.find(item => item.qr_code_data === data)) {
        Alert.alert('Thông báo', 'Thiết bị này đã có trong danh sách');
        setTimeout(() => setScanning(true), 1500);
        return;
      }

      const response = await api.get(`/equipment/verify?qr_data=${data}`);
      setScannedItems(prev => [...prev, { ...response.data, qr_code_data: data }]);
    } catch (error) {
      Alert.alert('Lỗi', 'Mã QR không hợp lệ hoặc không tồn tại trong hệ thống');
    } finally {
      if (mode === 'transaction') {
        setTimeout(() => setScanning(true), 1500);
      }
    }
  };

  const handleConfirm = async () => {
    if (scannedItems.length === 0) return;
    
    try {
      // Logic for batch processing based on transaction type
      for (const item of scannedItems) {
        const endpoint = item.status === 'available' ? 'checkout' : 'checkin';
        await api.put(`/transactions/${item.transaction_id}/${endpoint}`, {
          qr_code_data: item.qr_code_data,
          condition: condition === 'Good' ? 'Tình trạng tốt' : 'Phát hiện hỏng hóc/lỗi'
        });
      }
      Alert.alert('Thành công', `Đã xử lý ${scannedItems.length} thiết bị`);
      router.back();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xử lý yêu cầu hàng loạt');
    }
  };


  const removeItem = (index: number) => {
    setScannedItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <View className="flex-1 bg-black">
      {/* Top 50%: Camera */}
      <View className="h-1/2 relative">
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        <View className="absolute inset-0 items-center justify-center">
          <View className="w-64 h-64 border-2 border-white/50 rounded-3xl" />
          {!scanning && (
            <View className="absolute bg-green-500/80 px-4 py-2 rounded-full">
              <Text className="text-white font-bold">ĐÃ QUÉT!</Text>
            </View>
          )}
        </View>
        <Pressable 
          className="absolute top-12 left-4 w-10 h-10 bg-black/50 rounded-full items-center justify-center"
          onPress={() => router.back()}
        >
          <IconOutline name="arrow-left" size={24} color="white" />
        </Pressable>

        <View className="absolute top-12 right-4 flex-row bg-black/50 p-1 rounded-full border border-white/20">
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

      {/* Bottom 50%: Scanned List */}
      <View className="h-1/2 bg-white rounded-t-[30px] p-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold">
            {mode === 'transaction' ? `Danh sách đã quét (${scannedItems.length})` : 'Thông tin thiết bị'}
          </Text>
          {scannedItems.length > 0 && mode === 'transaction' && (
            <Pressable onPress={() => setScannedItems([])}>
              <Text className="text-red-500 font-medium">Xóa hết</Text>
            </Pressable>
          )}
        </View>

        <ScrollView className="flex-1">
          {mode === 'transaction' && scannedItems.length === 0 ? (
            <View className="items-center justify-center py-10">
              <IconOutline name="qrcode" size={48} color="#ddd" />
              <Text className="text-gray-400 mt-2">Vui lòng đưa mã QR vào khung hình</Text>
            </View>
          ) : mode === 'info' ? (
            <View className="items-center justify-center py-10">
              <IconOutline name="search" size={48} color="#ddd" />
              <Text className="text-gray-400 mt-2">Quét mã để xem thông tin chi tiết</Text>
            </View>
          ) : (
            <>
              <View className="mb-4 bg-gray-50 p-4 rounded-ant border border-gray-100">
                <Text className="text-xs font-bold text-gray-500 mb-2 uppercase">Xác nhận tình trạng thiết bị:</Text>
                <View className="flex-row">
                  <Pressable 
                    className={`flex-1 flex-row items-center justify-center py-2 rounded-ant mr-2 ${condition === 'Good' ? 'bg-green-500' : 'bg-white border border-gray-200'}`}
                    onPress={() => setCondition('Good')}
                  >
                    <IconOutline name="check-circle" size={16} color={condition === 'Good' ? 'white' : '#52c41a'} />
                    <Text className={`ml-1 text-xs font-bold ${condition === 'Good' ? 'text-white' : 'text-gray-600'}`}>TỐT</Text>
                  </Pressable>
                  <Pressable 
                    className={`flex-1 flex-row items-center justify-center py-2 rounded-ant ${condition === 'Broken' ? 'bg-red-500' : 'bg-white border border-gray-200'}`}
                    onPress={() => setCondition('Broken')}
                  >
                    <IconOutline name="warning" size={16} color={condition === 'Broken' ? 'white' : '#f5222d'} />
                    <Text className={`ml-1 text-xs font-bold ${condition === 'Broken' ? 'text-white' : 'text-gray-600'}`}>HỎNG/LỖI</Text>
                  </Pressable>
                </View>
              </View>

              {scannedItems.map((item, index) => (
                <View key={index} className="flex-row items-center bg-gray-50 p-3 rounded-ant mb-2">
                  <View className="w-10 h-10 bg-primary/10 rounded-ant items-center justify-center mr-3">
                    <IconOutline name="laptop" size={20} color="#CC0D00" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-sm" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-xs text-gray-500">SN: {item.serial_number}</Text>
                  </View>
                  <Pressable onPress={() => removeItem(index)} className="p-2">
                    <IconOutline name="close-circle" size={20} color="#ff4d4f" />
                  </Pressable>
                </View>
              ))}
            </>
          )}
        </ScrollView>

        {mode === 'transaction' && (
          <Pressable 
            className={`mt-4 py-4 rounded-ant items-center ${scannedItems.length > 0 ? 'bg-primary' : 'bg-gray-300'}`}
            onPress={handleConfirm}
            disabled={scannedItems.length === 0}
          >
            <Text className="text-white font-bold text-lg">XÁC NHẬN HÀNG LOẠT</Text>
          </Pressable>
        )}
      </View>

    </View>
  );
}
