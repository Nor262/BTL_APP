import React, { useState } from 'react';
import { StyleSheet, ActivityIndicator, Alert, View, Text, Pressable, ScrollView, Image, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/api/client';
import Button from '@/components/ui/Button';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { handleApiError } from '@/utils/error-handler';
import { useAuthStore } from '@/store/useAuthStore';

export default function BatchScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { user } = useAuthStore();
  const isBorrower = user?.role === 'borrower';
  const { mode: initialMode } = useLocalSearchParams<{ mode?: 'checkout' | 'checkin' }>();

  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [scanning, setScanning] = useState(true);
  const [mode, setMode] = useState<'checkout' | 'checkin'>(isBorrower ? 'checkin' : (initialMode || 'checkout'));
  const [condition, setCondition] = useState<'Good' | 'Broken'>('Good');
  const [evidenceImage, setEvidenceImage] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [remoteSync, setRemoteSync] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const remoteSessionId = React.useMemo(
    () => '#' + Math.random().toString(36).slice(2, 6).toUpperCase(),
    [],
  );
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
        <Text className="text-[#94A3B8] text-center text-sm">Cần cấp quyền camera để quét mã QR thiết bị.</Text>
        <View style={{ width: 200, marginTop: 8 }}>
          <Button title="CẤP QUYỀN" onPress={requestPermission} />
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!scanning) return;
    setScanning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      if (scannedItems.find(item => item.qr_code_data === data)) {
        Alert.alert('Thông báo', 'Thiết bị này đã được quét');
        setTimeout(() => setScanning(true), 1500);
        return;
      }

      // Backend: POST /transactions/verify-item { serial_number }
      const response = await api.post('/transactions/verify-item', { serial_number: data });
      const itemData = response.data.data || response.data;

      if (mode === 'checkout' && itemData.transaction_status !== 'approved') {
        Alert.alert('Lỗi', 'Thiết bị này không có yêu cầu mượn đã duyệt để bàn giao.');
        setTimeout(() => setScanning(true), 1500);
        return;
      }

      if (mode === 'checkin' && itemData.transaction_status !== 'active') {
        Alert.alert('Lỗi', 'Thiết bị này hiện không có giao dịch mượn nào đang mượn để trả.');
        setTimeout(() => setScanning(true), 1500);
        return;
      }

      if (isBorrower && mode === 'checkin' && itemData.borrower_id !== user?.id) {
        Alert.alert('Lỗi', 'Thiết bị này không phải do bạn đăng ký mượn.');
        setTimeout(() => setScanning(true), 1500);
        return;
      }

      setScannedItems(prev => [...prev, { ...itemData, qr_code_data: data }]);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      handleApiError(error, 'Mã QR không hợp lệ');
    } finally {
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
    if (scannedItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      for (const item of scannedItems) {
        const endpoint = mode;
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView className="flex-1 bg-[#0F172A]" showsVerticalScrollIndicator={false}>
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
        <Text className="text-white text-base font-bold">Quét mã QR</Text>
        <Pressable
          className="w-10 h-10 bg-[#1E293B] rounded-full items-center justify-center"
          onPress={() => setFlashOn(!flashOn)}
        >
          <Feather name="zap" size={18} color={flashOn ? '#FBBF24' : '#FFFFFF'} />
        </Pressable>
      </View>

      {/* Remote Scanner Banner */}
      <View className="items-center" style={{ paddingBottom: 10 }}>
        <Pressable
          onPress={() => setRemoteSync((v) => !v)}
          className={`flex-row items-center rounded-full ${remoteSync ? 'bg-[#6B0700]' : 'bg-[#1E293B]'}`}
          style={{ paddingVertical: 4, paddingHorizontal: 12, gap: 8 }}
        >
          <View
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: remoteSync ? '#22C55E' : '#64748B',
            }}
          />
          <Text className="text-white text-[11px] font-bold">
            {remoteSync ? `Remote Scanner — Synced ${remoteSessionId}` : 'Local mode — chạm để bật Remote'}
          </Text>
          <Feather name={remoteSync ? 'wifi' : 'wifi-off'} size={12} color="#FCA5A5" />
        </Pressable>
      </View>

      {/* Segment Control */}
      {isBorrower ? (
        <View className="items-center" style={{ paddingBottom: 16 }}>
          <View
            className="bg-[#1E293B] rounded-full items-center justify-center"
            style={{ height: 40, paddingHorizontal: 24 }}
          >
            <Text className="text-white text-xs font-bold">
              Chế độ: Trả thiết bị (Check-in)
            </Text>
          </View>
        </View>
      ) : (
        <View className="items-center" style={{ paddingBottom: 16 }}>
          <View
            className="bg-[#1E293B] rounded-full flex-row"
            style={{ height: 40, padding: 3, width: 260 }}
          >
            <Pressable
              className={`flex-1 rounded-full items-center justify-center ${mode === 'checkout' ? 'bg-[#CC0D00]' : ''}`}
              onPress={() => { setMode('checkout'); setScannedItems([]); }}
            >
              <Text className={`text-xs font-bold ${mode === 'checkout' ? 'text-white' : 'text-[#94A3B8]'}`}>
                Check-out
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 rounded-full items-center justify-center ${mode === 'checkin' ? 'bg-[#CC0D00]' : ''}`}
              onPress={() => { setMode('checkin'); setScannedItems([]); }}
            >
              <Text className={`text-xs font-bold ${mode === 'checkin' ? 'text-white' : 'text-[#94A3B8]'}`}>
                Check-in
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Camera Viewfinder */}
      <View className="items-center" style={{ paddingHorizontal: 20 }}>
        <View
          className="overflow-hidden"
          style={{ 
            width: 280, 
            height: isFocused ? 0 : 280,
            opacity: isFocused ? 0 : 1,
            borderRadius: 24
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
            {/* Top-left */}
            <View className="absolute top-4 left-4" style={{ width: 40, height: 40 }}>
              <View className="absolute top-0 left-0 bg-[#CC0D00]" style={{ width: 40, height: 4, borderRadius: 2 }} />
              <View className="absolute top-0 left-0 bg-[#CC0D00]" style={{ width: 4, height: 40, borderRadius: 2 }} />
            </View>
            {/* Top-right */}
            <View className="absolute top-4 right-4" style={{ width: 40, height: 40 }}>
              <View className="absolute top-0 right-0 bg-[#CC0D00]" style={{ width: 40, height: 4, borderRadius: 2 }} />
              <View className="absolute top-0 right-0 bg-[#CC0D00]" style={{ width: 4, height: 40, borderRadius: 2 }} />
            </View>
            {/* Bottom-left */}
            <View className="absolute bottom-4 left-4" style={{ width: 40, height: 40 }}>
              <View className="absolute bottom-0 left-0 bg-[#CC0D00]" style={{ width: 40, height: 4, borderRadius: 2 }} />
              <View className="absolute bottom-0 left-0 bg-[#CC0D00]" style={{ width: 4, height: 40, borderRadius: 2 }} />
            </View>
            {/* Bottom-right */}
            <View className="absolute bottom-4 right-4" style={{ width: 40, height: 40 }}>
              <View className="absolute bottom-0 right-0 bg-[#CC0D00]" style={{ width: 40, height: 4, borderRadius: 2 }} />
              <View className="absolute bottom-0 right-0 bg-[#CC0D00]" style={{ width: 4, height: 40, borderRadius: 2 }} />
            </View>
          </View>
          {/* Scanned overlay */}
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
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <View
            className="rounded-full"
            style={{ paddingVertical: 2, paddingHorizontal: 8, backgroundColor: '#1E293B' }}
          >
            <Text className="text-[#94A3B8] text-[10px] font-bold">Local</Text>
          </View>
          <View
            className="rounded-full"
            style={{
              paddingVertical: 2,
              paddingHorizontal: 8,
              backgroundColor: remoteSync ? '#15803D' : '#1E293B',
            }}
          >
            <Text className={`text-[10px] font-bold ${remoteSync ? 'text-white' : 'text-[#94A3B8]'}`}>
              Remote
            </Text>
          </View>
        </View>
        <View
          className="flex-row items-center bg-[#1E293B] rounded-[12px] border border-[#334155]"
          style={{ marginTop: 12, paddingHorizontal: 16, gap: 12, width: '100%', maxWidth: 320 }}
        >
          <Feather name="edit-3" size={16} color="#94A3B8" />
          <TextInput
            className="flex-1 text-white text-sm"
            style={{ paddingVertical: 14 }}
            placeholder="Hoặc nhập mã thiết bị thủ công..."
            placeholderTextColor="#64748B"
            value={manualCode}
            onChangeText={setManualCode}
            autoCapitalize="characters"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={() => {
              if (manualCode.trim()) {
                handleBarCodeScanned({ data: manualCode.trim() });
                setManualCode('');
              }
            }}
          />
          <Pressable
            className={`w-8 h-8 rounded-lg items-center justify-center ${manualCode.trim() ? 'bg-[#CC0D00]' : 'bg-[#334155]'}`}
            onPress={() => {
              if (manualCode.trim()) {
                handleBarCodeScanned({ data: manualCode.trim() });
                setManualCode('');
              }
            }}
          >
            <Feather name="arrow-right" size={16} color={manualCode.trim() ? '#FFFFFF' : '#94A3B8'} />
          </Pressable>
        </View>
      </View>

      {/* Bottom Panel */}
      <View
        className="bg-[#1E293B]"
        style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12, minHeight: 500 }}
      >
        {/* Panel Header */}
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
              {scannedItems.map((item, index) => (
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
                        <Text className={`text-[11px] font-bold ${
                          item.transaction_status === 'approved' ? 'text-[#60A5FA]' : 
                          item.transaction_status === 'active' ? 'text-[#FBBF24]' : 
                          'text-[#34D399]'
                        }`}>
                          {item.transaction_status === 'approved' ? 'Chờ nhận' : 
                           item.transaction_status === 'active' ? 'Đang mượn' : 
                           'Hợp lệ'}
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
              ))}
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
    </KeyboardAvoidingView>
  );
}
