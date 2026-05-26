import React, { useState, useRef } from 'react';
import { StyleSheet, ActivityIndicator, Alert, View, Text, Pressable, ScrollView, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import Button from '@/components/ui/Button';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { handleApiError } from '@/utils/error-handler';

/**
 * Màn hình quét cho Thủ kho (Storekeeper): bàn giao / nhận thiết bị theo lô.
 * Theo flow nhánh backup:
 *  - verify qua GET /equipment/verify?qr_data=
 *  - endpoint checkout/checkin TỰ ĐỘNG suy ra theo item.status === 'available'
 */
export default function StorekeeperScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [scanning, setScanning] = useState(true);
  const [condition, setCondition] = useState<'Good' | 'Broken'>('Good');
  const [evidenceImage, setEvidenceImage] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lockRef = useRef(false);
  const router = useRouter();

  if (!permission) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0F172A]">
        <ActivityIndicator color="#CC0D00" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0F172A]" style={{ padding: 32, gap: 16 }}>
        <View className="w-20 h-20 bg-[#1E293B] rounded-full items-center justify-center">
          <Feather name="camera" size={36} color="#94A3B8" />
        </View>
        <Text className="text-white text-xl font-bold text-center">Truy cập Camera</Text>
        <Text className="text-[#94A3B8] text-center text-sm">Cần cấp quyền camera để bàn giao, nhận thiết bị.</Text>
        <View style={{ width: 200, marginTop: 8 }}>
          <Button title="CẤP QUYỀN" onPress={requestPermission} />
        </View>
      </View>
    );
  }

  const addItem = async (data: string) => {
    if (scannedItems.find(item => item.qr_code_data === data)) {
      Alert.alert('Thông báo', 'Thiết bị này đã được quét');
      return;
    }
    // Theo backup: verify qua /equipment/verify
    const response = await api.get('/equipment/verify', { params: { qr_data: data } });
    const itemData = response.data.data || response.data;

    // Thiết bị 'available' -> luồng BÀN GIAO (check-out): cần có đơn mượn đã DUYỆT.
    if (itemData.status === 'available' && itemData.transaction_status !== 'approved') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Không thể bàn giao', 'Thiết bị này chưa có yêu cầu mượn đã được duyệt để bàn giao.');
      return;
    }

    setScannedItems(prev => [...prev, { ...itemData, qr_code_data: data }]);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Khóa đồng bộ: chặn camera bắn nhiều lần gây xử lý/thông báo lặp
    if (lockRef.current) return;
    lockRef.current = true;
    setScanning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await addItem(data);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const notFound = error?.response?.status === 404;
      Alert.alert(
        notFound ? 'Không tìm thấy thiết bị' : 'Mã QR không hợp lệ',
        notFound
          ? 'Không tìm thấy thông tin thiết bị cho mã QR/serial này.'
          : 'Mã QR không hợp lệ hoặc không đọc được. Vui lòng thử lại.',
      );
    } finally {
      // Mở khóa & cho quét tiếp sau 1.2s
      setTimeout(() => { setScanning(true); lockRef.current = false; }, 1200);
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
    if (scannedItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      for (const item of scannedItems) {
        // Theo backup: tự động suy ra checkout/checkin theo trạng thái thiết bị
        const endpoint = item.status === 'available' ? 'checkout' : 'checkin';
        const formData = new FormData();
        formData.append('qr_code_data', item.qr_code_data);
        formData.append('condition', condition === 'Good' ? 'Tình trạng tốt' : 'Phát hiện hỏng hóc/lỗi');

        if (evidenceImage) {
          const filename = evidenceImage.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          formData.append('image', { uri: evidenceImage, name: filename, type } as any);
        }

        await api.put(`/transactions/${item.transaction_id || item.id}/${endpoint}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Thành công', `Đã xử lý ${scannedItems.length} thiết bị!`);
      router.back();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      handleApiError(error, 'Lỗi xử lý giao dịch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeItem = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScannedItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView className="flex-1 bg-[#0F172A]" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Top Bar */}
        <View
          className="flex-row items-center justify-between px-5"
          style={{ paddingTop: 58, paddingBottom: 12 }}
        >
          <Pressable
            className="w-10 h-10 bg-[#1E293B] rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Feather name="x" size={20} color="#FFFFFF" />
          </Pressable>
          <Text className="text-white text-base font-bold">Bàn giao / Nhận thiết bị</Text>
          <Pressable
            className="w-10 h-10 bg-[#1E293B] rounded-full items-center justify-center"
            onPress={() => setFlashOn(!flashOn)}
          >
            <Feather name="zap" size={18} color={flashOn ? '#FBBF24' : '#FFFFFF'} />
          </Pressable>
        </View>

        {/* Camera Viewfinder */}
        <View className="items-center" style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <View
            className="overflow-hidden"
            style={{
              width: 280,
              height: 280,
              borderRadius: 24,
            }}
          >
            <CameraView
              style={StyleSheet.absoluteFill}
              onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              enableTorch={flashOn}
            />
            {/* Corner markers */}
            <View className="absolute inset-0">
              <View className="absolute top-4 left-4" style={{ width: 40, height: 40 }}>
                <View className="absolute top-0 left-0 bg-[#CC0D00]" style={{ width: 40, height: 4, borderRadius: 2 }} />
                <View className="absolute top-0 left-0 bg-[#CC0D00]" style={{ width: 4, height: 40, borderRadius: 2 }} />
              </View>
              <View className="absolute top-4 right-4" style={{ width: 40, height: 40 }}>
                <View className="absolute top-0 right-0 bg-[#CC0D00]" style={{ width: 40, height: 4, borderRadius: 2 }} />
                <View className="absolute top-0 right-0 bg-[#CC0D00]" style={{ width: 4, height: 40, borderRadius: 2 }} />
              </View>
              <View className="absolute bottom-4 left-4" style={{ width: 40, height: 40 }}>
                <View className="absolute bottom-0 left-0 bg-[#CC0D00]" style={{ width: 40, height: 4, borderRadius: 2 }} />
                <View className="absolute bottom-0 left-0 bg-[#CC0D00]" style={{ width: 4, height: 40, borderRadius: 2 }} />
              </View>
              <View className="absolute bottom-4 right-4" style={{ width: 40, height: 40 }}>
                <View className="absolute bottom-0 right-0 bg-[#CC0D00]" style={{ width: 40, height: 4, borderRadius: 2 }} />
                <View className="absolute bottom-0 right-0 bg-[#CC0D00]" style={{ width: 4, height: 40, borderRadius: 2 }} />
              </View>
            </View>
            {!scanning && (
              <View className="absolute inset-0 items-center justify-center bg-black/30">
                <View className="bg-[#15803D] rounded-full" style={{ paddingVertical: 6, paddingHorizontal: 16 }}>
                  <Text className="text-white text-xs font-bold">ĐÃ QUÉT!</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Instruction */}
        <View className="items-center" style={{ paddingVertical: 14, gap: 6 }}>
          <Text className="text-white text-sm font-semibold">Đưa mã QR vào khung hình</Text>
        </View>

        {/* Bottom Panel */}
        <View
          className="bg-[#1E293B]"
          style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12, minHeight: 500 }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-[15px] font-bold">
              Đã quét ({scannedItems.length})
            </Text>
            {scannedItems.length > 0 && (
              <Pressable onPress={() => setScannedItems([])}>
                <Text className="text-[#CC0D00] text-xs font-semibold">Xóa tất cả</Text>
              </Pressable>
            )}
          </View>

          <View style={{ flex: 1 }}>
            {scannedItems.length === 0 ? (
              <View
                className="items-center justify-center rounded-2xl"
                style={{ paddingVertical: 32, gap: 8, borderWidth: 1.5, borderColor: '#334155', borderStyle: 'dashed' }}
              >
                <Feather name="maximize" size={32} color="#475569" />
                <Text className="text-[#475569] text-xs">Chưa có thiết bị nào được quét</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {/* Condition selector */}
                <View className="bg-[#0F172A] rounded-xl" style={{ padding: 12, gap: 10 }}>
                  <Text className="text-[#94A3B8] text-[10px] font-bold">TÌNH TRẠNG THIẾT BỊ</Text>
                  <View className="flex-row" style={{ gap: 8 }}>
                    <Pressable
                      className={`flex-1 flex-row items-center justify-center rounded-lg ${condition === 'Good' ? 'bg-[#052E16]' : 'bg-[#1E293B]'}`}
                      style={{ gap: 6, paddingVertical: 10, borderWidth: 1.5, borderColor: condition === 'Good' ? '#15803D' : '#334155' }}
                      onPress={() => setCondition('Good')}
                    >
                      <Feather name="check-circle" size={14} color={condition === 'Good' ? '#22C55E' : '#475569'} />
                      <Text className={`text-xs font-bold ${condition === 'Good' ? 'text-[#22C55E]' : 'text-[#475569]'}`}>TỐT</Text>
                    </Pressable>
                    <Pressable
                      className={`flex-1 flex-row items-center justify-center rounded-lg ${condition === 'Broken' ? 'bg-[#450A0A]' : 'bg-[#1E293B]'}`}
                      style={{ gap: 6, paddingVertical: 10, borderWidth: 1.5, borderColor: condition === 'Broken' ? '#DC2626' : '#334155' }}
                      onPress={() => setCondition('Broken')}
                    >
                      <Feather name="alert-triangle" size={14} color={condition === 'Broken' ? '#EF4444' : '#475569'} />
                      <Text className={`text-xs font-bold ${condition === 'Broken' ? 'text-[#EF4444]' : 'text-[#475569]'}`}>HỎNG</Text>
                    </Pressable>
                  </View>

                  {condition === 'Broken' && (
                    <View style={{ gap: 8, paddingTop: 4 }}>
                      <Text className="text-[#94A3B8] text-[10px] font-bold">HÌNH ẢNH MINH CHỨNG</Text>
                      {evidenceImage ? (
                        <View className="relative overflow-hidden" style={{ height: 100, borderRadius: 12 }}>
                          <Image source={{ uri: evidenceImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          <Pressable
                            className="absolute top-2 right-2 bg-black/60 w-7 h-7 rounded-full items-center justify-center"
                            onPress={() => setEvidenceImage(null)}
                          >
                            <Feather name="x" size={14} color="white" />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          className="items-center justify-center rounded-xl"
                          style={{ height: 60, gap: 4, borderWidth: 1.5, borderColor: '#334155', borderStyle: 'dashed' }}
                          onPress={pickImage}
                        >
                          <Feather name="camera" size={18} color="#CC0D00" />
                          <Text className="text-[#CC0D00] text-[11px] font-semibold">Tải ảnh lên</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>

                {/* Scanned items */}
                {scannedItems.map((item, index) => {
                  const endpoint = item.status === 'available' ? 'checkout' : 'checkin';
                  return (
                    <Animated.View key={index} entering={FadeInDown.delay(index * 60)}>
                      <View
                        className="bg-[#0F172A] rounded-xl flex-row items-center"
                        style={{ padding: 12, gap: 10 }}
                      >
                        {item.image_url ? (
                          <Image source={{ uri: item.image_url }} style={{ width: 44, height: 44, borderRadius: 10 }} />
                        ) : (
                          <View className="w-11 h-11 bg-[#FEE5E3] rounded-[10px] items-center justify-center">
                            <Feather name="monitor" size={20} color="#CC0D00" />
                          </View>
                        )}
                        <View className="flex-1" style={{ gap: 4 }}>
                          <Text className="text-white text-[14px] font-bold" numberOfLines={1}>{item.name}</Text>
                          <View className="flex-row items-center" style={{ gap: 6 }}>
                            <Text className="text-[#94A3B8] text-xs">SN: {item.serial_number}</Text>
                            <View className="w-1 h-1 rounded-full bg-[#475569]" />
                            <Text className={`text-[11px] font-bold ${endpoint === 'checkout' ? 'text-[#60A5FA]' : 'text-[#FBBF24]'}`}>
                              {endpoint === 'checkout' ? 'Bàn giao' : 'Nhận trả'}
                            </Text>
                          </View>
                        </View>
                        <Pressable
                          className="w-9 h-9 rounded-lg items-center justify-center"
                          onPress={() => removeItem(index)}
                        >
                          <Feather name="trash-2" size={16} color="#EF4444" />
                        </Pressable>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Confirm Button */}
          <View style={{ paddingTop: 4, paddingBottom: 40 }}>
            <Pressable
              className={`h-[52px] rounded-[14px] flex-row items-center justify-center ${scannedItems.length > 0 && !isSubmitting ? 'bg-[#CC0D00]' : 'bg-[#334155]'}`}
              style={{ gap: 8 }}
              onPress={handleConfirm}
              disabled={scannedItems.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Feather name="check" size={18} color={scannedItems.length > 0 ? '#FFFFFF' : '#64748B'} />
              )}
              <Text className={`text-[15px] font-bold ${scannedItems.length > 0 && !isSubmitting ? 'text-white' : 'text-[#64748B]'}`}>
                {isSubmitting ? 'Đang xử lý...' : `Xác nhận (${scannedItems.length})`}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
