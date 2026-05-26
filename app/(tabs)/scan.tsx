import React, { useState } from 'react';
import { StyleSheet, ActivityIndicator, View, Text, Pressable, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import Button from '@/components/ui/Button';
import { handleApiError } from '@/utils/error-handler';

/**
 * Màn hình quét cho Người mượn (Borrower): chỉ TRA CỨU thiết bị.
 * Theo flow nhánh backup:
 *  - quét QR / nhập serial -> GET /equipment/verify -> mở trang chi tiết thiết bị.
 *  - KHÔNG thực hiện check-in/check-out (việc đó do thủ kho làm tại quầy).
 */
export default function BorrowerScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
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
        <Text className="text-[#94A3B8] text-center text-sm">Cần cấp quyền camera để quét mã QR tra cứu thiết bị.</Text>
        <View style={{ width: 200, marginTop: 8 }}>
          <Button title="CẤP QUYỀN" onPress={requestPermission} />
        </View>
      </View>
    );
  }

  const lookup = async (data: string) => {
    setLoading(true);
    try {
      const response = await api.get('/equipment/verify', { params: { qr_data: data } });
      const eqData = response.data.data || response.data;
      const eqId = eqData.equipment_id || eqData.id;
      if (eqId) {
        router.push(`/equipment/${eqId}`);
      } else {
        throw new Error('Không tìm thấy thiết bị');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      handleApiError(error, 'Mã QR không hợp lệ');
      setTimeout(() => setScanning(true), 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!scanning) return;
    setScanning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await lookup(data);
  };

  const submitManual = () => {
    const code = manualCode.trim();
    if (!code) return;
    setManualCode('');
    lookup(code);
  };

  return (
    <View style={{ flex: 1 }}>
      <View className="flex-1 bg-[#0F172A]">
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
          <Text className="text-white text-base font-bold">Tra cứu thiết bị</Text>
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
            {loading && (
              <View className="absolute inset-0 items-center justify-center bg-black/40">
                <ActivityIndicator color="#FFFFFF" size="large" />
              </View>
            )}
          </View>
        </View>

        {/* Instruction + manual input */}
        <View className="items-center" style={{ paddingVertical: 18, gap: 6, paddingHorizontal: 20 }}>
          <Text className="text-white text-sm font-semibold">Đưa mã QR vào khung hình để tra cứu</Text>
          <Text className="text-[#94A3B8] text-xs text-center" style={{ marginTop: 2 }}>
            Quét để xem thông tin, thông số và lịch sử thiết bị.
          </Text>
          <View
            className="flex-row items-center bg-[#1E293B] rounded-[12px] border border-[#334155]"
            style={{ marginTop: 16, paddingHorizontal: 16, gap: 12, width: '100%', maxWidth: 320 }}
          >
            <Feather name="edit-3" size={16} color="#94A3B8" />
            <TextInput
              className="flex-1 text-white text-sm"
              style={{ paddingVertical: 14 }}
              placeholder="Hoặc nhập số Serial thiết bị..."
              placeholderTextColor="#64748B"
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              onSubmitEditing={submitManual}
            />
            <Pressable
              className={`w-8 h-8 rounded-lg items-center justify-center ${manualCode.trim() ? 'bg-[#CC0D00]' : 'bg-[#334155]'}`}
              onPress={submitManual}
            >
              <Feather name="arrow-right" size={16} color={manualCode.trim() ? '#FFFFFF' : '#94A3B8'} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
