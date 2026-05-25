import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '@/api/client';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';

export default function StorekeeperInventory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [items, setItems] = useState<any[]>([]);
  const [scannedIds, setScannedIds] = useState<number[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    api.get('/equipment').then((res) => {
      setItems((res.data?.data || res.data || []));
    }).catch(() => {});
  }, []);

  const total = items.length;
  const availableItems = items.filter(it => it.status === 'available');
  const totalToScan = availableItems.length;
  
  const ok = scannedIds.length;
  const pending = totalToScan - ok;
  const skip = items.filter(it => it.status !== 'available').length;
  
  const progress = ok + skip; // progress means what has been checked or skipped

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanning) return;
    setScanning(false);
    
    const item = items.find(it => it.qr_code_data === data);
    
    if (item) {
      if (item.status !== 'available') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Cảnh báo', `Thiết bị này đang ở trạng thái: ${item.status}. Không cần kiểm kê.`);
      } else if (scannedIds.includes(item.id)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        // Already scanned
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setScannedIds(prev => [...prev, item.id]);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Lỗi', 'Mã QR không khớp với bất kỳ thiết bị nào trong kho.');
    }
    
    setTimeout(() => setScanning(true), 1500);
  };

  const toggleScanned = (id: number) => {
    setScannedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleComplete = async () => {
    const missingItems = items.filter(it => it.status === 'available' && !scannedIds.includes(it.id));
    const missingItemIds = missingItems.map(it => it.id);

    try {
      await api.post('/audit/inventory', {
        total_items: total,
        matched_count: ok,
        missing_count: pending,
        skipped_count: skip,
        missing_item_ids: missingItemIds
      });
      
      Alert.alert(
        'Hoàn tất kiểm kê',
        `Tổng kết phiên kiểm kê:\n\n- Đã quét (Khớp): ${ok}/${totalToScan}\n- Chưa quét (Mất): ${pending}\n- Bỏ qua (Đang mượn/Bảo trì...): ${skip}\n\nĐã lưu kết quả kiểm kê vào Nhật ký hệ thống.`,
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu phiên kiểm kê vào hệ thống.');
      console.error(error);
    }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Lỗi', 'Cần cấp quyền camera để quét mã QR thiết bị.');
        return;
      }
    }
    setShowScanner(true);
    setScanning(true);
  };

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="dark" />

      {/* Nav */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8 }}>
        <View className="flex-row items-center justify-between" style={{ height: 44 }}>
          <View className="w-10 h-10" />
          <View className="items-center">
            <Text className="text-[#0F172A] text-base font-bold">Kiểm kê kho</Text>
            <Text className="text-[#94A3B8] text-[10px]">Phiên lúc 09:05</Text>
          </View>
          <View className="w-10 h-10" />
        </View>
      </View>

      {/* Progress card */}
      <View style={{ paddingHorizontal: 20 }}>
        <Animated.View entering={FadeInDown.delay(80)} className="bg-white rounded-[16px]" style={{ padding: 14, gap: 10 }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-[#0F172A] text-[13px] font-bold">Tiến độ kiểm kê</Text>
            <Text className="text-[#0F172A] text-[12px] font-bold">{progress} / {total} thiết bị</Text>
          </View>
          {/* Bar */}
          <View className="bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
            <View
              className="h-full bg-[#15803D]"
              style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
            />
          </View>
          <View className="flex-row justify-between" style={{ gap: 8 }}>
            <ProgressCell value={ok} label="Khớp" color="#15803D" bg="#DCFCE7" />
            <ProgressCell value={pending} label="Chưa quét" color="#B91C1C" bg="#FEE2E2" />
            <ProgressCell value={skip} label="Bỏ qua" color="#D97706" bg="#FEF3C7" />
          </View>
        </Animated.View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 200 }}>
        <View style={{ gap: 12 }}>
          {/* Quick scan banner */}
          <Pressable
            className="bg-[#0F172A] rounded-[14px] flex-row items-center"
            style={{ padding: 14, gap: 12 }}
            onPress={openScanner}
          >
            <View className="w-10 h-10 bg-[#1E293B] rounded-xl items-center justify-center">
              <Feather name="camera" size={18} color="#FFFFFF" />
            </View>
            <View className="flex-1" style={{ gap: 2 }}>
              <Text className="text-white text-sm font-bold">Mở máy quét (Camera)</Text>
              <Text className="text-[#94A3B8] text-[10px]">Quét QR để đánh dấu thiết bị đã khớp</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#FFFFFF" />
          </Pressable>

          {/* Section title */}
          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-[#0F172A] text-[13px] font-bold">Danh sách thiết bị</Text>
            <Text className="text-[#94A3B8] text-[11px]">Chạm để đánh dấu thủ công</Text>
          </View>

          {items.map((it: any, idx: number) => {
            const isAvailable = it.status === 'available';
            const isScanned = scannedIds.includes(it.id);
            const statusType = !isAvailable ? 'skip' : isScanned ? 'ok' : 'pending';
            
            return (
              <Animated.View key={it.id || idx} entering={FadeInDown.delay(idx * 40)}>
                <Pressable
                  onPress={() => {
                    if (isAvailable) {
                      toggleScanned(it.id);
                    } else {
                      Alert.alert('Thông báo', `Thiết bị này đang ở trạng thái: ${it.status}, không cần kiểm kê.`);
                    }
                  }}
                  className={`bg-white rounded-[14px] flex-row items-center ${statusType === 'pending' ? 'border-[1px] border-[#FEE2E2]' : ''}`} 
                  style={{ padding: 12, gap: 10 }}
                >
                  <View
                    className="w-9 h-9 rounded-lg items-center justify-center"
                    style={{
                      backgroundColor: statusType === 'ok' ? '#DCFCE7' : statusType === 'skip' ? '#FEF3C7' : '#FEE2E2',
                    }}
                  >
                    <Feather
                      name={statusType === 'ok' ? 'check' : statusType === 'skip' ? 'minus' : 'x'}
                      size={16}
                      color={statusType === 'ok' ? '#15803D' : statusType === 'skip' ? '#D97706' : '#B91C1C'}
                    />
                  </View>
                  <View className="flex-1" style={{ gap: 2 }}>
                    <Text className="text-[#0F172A] text-sm font-bold" numberOfLines={1}>{it.name}</Text>
                    <Text className="text-[#94A3B8] text-[10px]">
                      {it.location?.name || 'Kệ A-12'} · SN: {it.serial_number || '---'}
                    </Text>
                  </View>
                  <Text
                    className="text-[11px] font-bold"
                    style={{ color: statusType === 'ok' ? '#15803D' : statusType === 'skip' ? '#D97706' : '#B91C1C' }}
                  >
                    {statusType === 'ok' ? 'Đã kiểm tra' : statusType === 'skip' ? 'Bỏ qua' : 'Chưa quét (Mất)'}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Scanner Modal */}
      <Modal visible={showScanner} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowScanner(false)}>
        <View className="flex-1 bg-[#0F172A]">
          <View className="flex-row items-center justify-between px-5" style={{ paddingTop: 20, paddingBottom: 16 }}>
            <Pressable className="w-10 h-10 bg-[#1E293B] rounded-full items-center justify-center" onPress={() => setShowScanner(false)}>
              <Feather name="x" size={20} color="#FFFFFF" />
            </Pressable>
            <Text className="text-white text-base font-bold">Quét mã thiết bị</Text>
            <View className="w-10 h-10" />
          </View>
          
          <View className="flex-1 overflow-hidden" style={{ borderRadius: 30, marginHorizontal: 16, marginBottom: 40 }}>
            {showScanner && (
              <CameraView
                style={StyleSheet.absoluteFill}
                onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              />
            )}
            
            <View className="absolute inset-0 items-center justify-center border-[2px] border-white/20" style={{ borderRadius: 30 }} pointerEvents="none">
              <View style={{ width: 200, height: 200, borderWidth: 2, borderColor: '#CC0D00', borderRadius: 20, backgroundColor: 'transparent' }} />
            </View>

            {!scanning && (
              <View className="absolute inset-0 items-center justify-center bg-black/40">
                <View className="bg-[#15803D] rounded-full" style={{ paddingVertical: 8, paddingHorizontal: 20 }}>
                  <Text className="text-white text-sm font-bold">ĐÃ QUÉT!</Text>
                </View>
              </View>
            )}
          </View>

          <View className="items-center pb-10">
            <Text className="text-white text-sm font-semibold">Đưa mã QR của thiết bị vào khung hình</Text>
            <Text className="text-[#94A3B8] text-xs mt-2 text-center px-10">Máy quét sẽ tự động đánh dấu thiết bị là "Khớp" trong danh sách kiểm kê.</Text>
          </View>
        </View>
      </Modal>

      {/* CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white flex-row"
        style={{ padding: 16, paddingBottom: insets.bottom + 16, gap: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}
      >
        <Pressable 
          className="flex-1 bg-[#CC0D00] rounded-[14px] flex-row items-center justify-center" 
          style={{ height: 52, gap: 8 }}
          onPress={handleComplete}
        >
          <Feather name="check-circle" size={16} color="#FFFFFF" />
          <Text className="text-white text-sm font-bold">Hoàn tất phiên kiểm kê</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProgressCell({ value, label, color, bg }: { value: number; label: string; color: string; bg: string }) {
  return (
    <View className="flex-1 rounded-[10px] items-center" style={{ paddingVertical: 8, backgroundColor: bg, gap: 2 }}>
      <Text className="text-base font-bold" style={{ color }}>{value}</Text>
      <Text className="text-[10px] font-bold" style={{ color }}>{label}</Text>
    </View>
  );
}
