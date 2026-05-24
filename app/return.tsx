import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '@/api/client';
import { handleApiError } from '@/utils/error-handler';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlertStore } from '@/store/useAlertStore';

type ScannedItem = {
  transaction_id: number | string;
  qr_code_data: string;
  serial_number: string;
  name: string;
  image_url?: string;
  borrower_name?: string;
  borrowed_at?: string;
  due_date?: string;
  is_overdue?: boolean;
  overdue_days?: number;
};

export default function ReturnScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();
  const { transactionId } = useLocalSearchParams<{ transactionId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();

  const [items, setItems] = useState<ScannedItem[]>([]);
  const [scanning, setScanning] = useState(true);
  const [condition, setCondition] = useState<'Good' | 'Broken'>('Good');
  const [note, setNote] = useState('');
  const [evidence, setEvidence] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);

  const verifyAndAdd = useCallback(async (qrData: string) => {
    if (items.find(i => i.qr_code_data === qrData)) {
      showAlert({ title: 'Thông báo', message: 'Thiết bị đã được quét', type: 'info' });
      return;
    }
    try {
      const res = await api.post('/transactions/verify-item', { serial_number: qrData });
      const d = res.data.data || res.data;
      if (d.transaction_status !== 'active') {
        showAlert({ title: 'Không thể trả', message: 'Thiết bị này không có giao dịch đang mượn.', type: 'error' });
        return;
      }
      if (user?.role === 'borrower' && d.borrower_id !== user.id) {
        showAlert({ title: 'Lỗi', message: 'Thiết bị không phải do bạn mượn.', type: 'error' });
        return;
      }
      const dueDate = d.due_date ? new Date(d.due_date) : null;
      const now = new Date();
      const isOverdue = !!dueDate && dueDate < now;
      const overdueDays = isOverdue && dueDate ? Math.floor((now.getTime() - dueDate.getTime()) / 86400000) : 0;
      setItems(prev => [...prev, { ...d, qr_code_data: qrData, is_overdue: isOverdue, overdue_days: overdueDays }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      handleApiError(e, 'Mã không hợp lệ');
    }
  }, [items, user, showAlert]);

  useEffect(() => {
    if (transactionId && items.length === 0) {
      (async () => {
        try {
          const res = await api.get('/transactions/my');
          const list = res.data.data || res.data || [];
          const tx = list.find((t: any) => String(t.transaction_id) === String(transactionId));
          if (tx?.serial_number) await verifyAndAdd(tx.serial_number);
        } catch {}
      })();
    }
  }, [transactionId]);

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!r.canceled) setEvidence(r.assets[0].uri);
  };

  const onScan = async ({ data }: { data: string }) => {
    if (!scanning) return;
    setScanning(false);
    await verifyAndAdd(data);
    setTimeout(() => setScanning(true), 1500);
  };

  const submit = async () => {
    if (items.length === 0 || submitting) return;
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      for (const it of items) {
        const fd = new FormData();
        fd.append('qr_code_data', it.qr_code_data);
        fd.append('condition', condition === 'Good' ? 'Tình trạng tốt' : 'Phát hiện hỏng hóc/lỗi');
        if (note) fd.append('note', note);
        if (evidence) {
          const fn = evidence.split('/').pop() || 'img.jpg';
          const m = /\.(\w+)$/.exec(fn);
          fd.append('image', { uri: evidence, name: fn, type: m ? `image/${m[1]}` : 'image' } as any);
        }
        await api.put(`/transactions/${it.transaction_id}/checkin`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert({ title: 'Thành công', message: `Đã trả ${items.length} thiết bị`, type: 'success' });
      router.back();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      handleApiError(e, 'Lỗi xử lý trả thiết bị');
    } finally {
      setSubmitting(false);
    }
  };

  const totalOverdue = items.filter(i => i.is_overdue).length;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F1F5F9' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between px-5" style={{ paddingTop: 58, paddingBottom: 8 }}>
          <Pressable className="w-10 h-10 bg-white rounded-full items-center justify-center" onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </Pressable>
          <Text className="text-[#0F172A] text-lg font-bold">Trả thiết bị</Text>
          <View style={{ width: 40 }} />
        </View>

        {totalOverdue > 0 && (
          <View className="mx-5 mb-3 flex-row items-center bg-[#FEE2E2] rounded-2xl" style={{ padding: 12, gap: 10 }}>
            <Feather name="alert-triangle" size={18} color="#CC0D00" />
            <View style={{ flex: 1 }}>
              <Text className="text-[#CC0D00] font-bold text-[13px]">{totalOverdue} thiết bị quá hạn</Text>
              <Text className="text-[#7F1D1D] text-[11px]">Có thể bị nhắc nhở từ quản trị viên</Text>
            </View>
          </View>
        )}

        {/* Scanner toggle */}
        <View className="mx-5 mb-3">
          <Pressable
            onPress={() => setScannerVisible(v => !v)}
            className="bg-[#0F172A] rounded-2xl flex-row items-center justify-center"
            style={{ paddingVertical: 14, gap: 8 }}
          >
            <Feather name={scannerVisible ? 'chevron-up' : 'camera'} size={18} color="#FFFFFF" />
            <Text className="text-white font-bold text-sm">{scannerVisible ? 'Ẩn camera' : 'Quét mã QR thiết bị'}</Text>
          </Pressable>
        </View>

        {scannerVisible && (
          <View className="mx-5 mb-3 overflow-hidden" style={{ height: 260, borderRadius: 20 }}>
            {!permission ? (
              <View className="flex-1 items-center justify-center bg-[#1E293B]">
                <ActivityIndicator color="#CC0D00" />
              </View>
            ) : !permission.granted ? (
              <View className="flex-1 items-center justify-center bg-[#1E293B]" style={{ gap: 10 }}>
                <Text className="text-white text-sm">Cần cấp quyền camera</Text>
                <Pressable onPress={requestPermission} className="bg-[#CC0D00] rounded-full" style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text className="text-white font-bold text-xs">CẤP QUYỀN</Text>
                </Pressable>
              </View>
            ) : (
              <CameraView
                style={{ flex: 1 }}
                onBarcodeScanned={scanning ? onScan : undefined}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              />
            )}
          </View>
        )}

        {/* Manual input */}
        <View className="mx-5 mb-4 bg-white rounded-2xl flex-row items-center" style={{ paddingHorizontal: 14, gap: 10 }}>
          <Feather name="edit-3" size={16} color="#94A3B8" />
          <TextInput
            className="flex-1 text-[#0F172A]"
            style={{ paddingVertical: 14, fontSize: 14 }}
            placeholder="Nhập mã thiết bị thủ công..."
            placeholderTextColor="#94A3B8"
            value={manualCode}
            onChangeText={setManualCode}
            autoCapitalize="characters"
            onSubmitEditing={() => { if (manualCode.trim()) { verifyAndAdd(manualCode.trim()); setManualCode(''); } }}
          />
          <Pressable
            onPress={() => { if (manualCode.trim()) { verifyAndAdd(manualCode.trim()); setManualCode(''); } }}
            className={`w-8 h-8 rounded-lg items-center justify-center ${manualCode.trim() ? 'bg-[#CC0D00]' : 'bg-[#E2E8F0]'}`}
          >
            <Feather name="arrow-right" size={14} color={manualCode.trim() ? '#FFFFFF' : '#94A3B8'} />
          </Pressable>
        </View>

        {/* Items list */}
        <View className="mx-5 mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[#0F172A] font-bold text-[14px]">Thiết bị cần trả ({items.length})</Text>
            {items.length > 0 && (
              <Pressable onPress={() => setItems([])}>
                <Text className="text-[#CC0D00] text-xs font-semibold">Xóa hết</Text>
              </Pressable>
            )}
          </View>
          {items.length === 0 ? (
            <View className="bg-white items-center justify-center rounded-2xl" style={{ padding: 28, gap: 6 }}>
              <Feather name="package" size={28} color="#CBD5E1" />
              <Text className="text-[#94A3B8] text-xs">Chưa có thiết bị nào</Text>
            </View>
          ) : items.map((it, idx) => (
            <Animated.View key={idx} entering={FadeInDown.delay(idx * 50)}>
              <View className="bg-white rounded-2xl flex-row items-center mb-2" style={{ padding: 12, gap: 10 }}>
                {it.image_url ? (
                  <Image source={{ uri: it.image_url }} style={{ width: 48, height: 48, borderRadius: 10 }} />
                ) : (
                  <View className="w-12 h-12 bg-[#FEE2E2] rounded-[10px] items-center justify-center">
                    <Feather name="monitor" size={22} color="#CC0D00" />
                  </View>
                )}
                <View className="flex-1" style={{ gap: 3 }}>
                  <Text className="text-[#0F172A] font-bold text-[13px]" numberOfLines={1}>{it.name}</Text>
                  <Text className="text-[#64748B] text-[11px]">SN: {it.serial_number}</Text>
                  {it.borrower_name && <Text className="text-[#64748B] text-[11px]">Người mượn: {it.borrower_name}</Text>}
                  {it.is_overdue ? (
                    <View className="self-start bg-[#FEE2E2] rounded-full" style={{ paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text className="text-[#CC0D00] text-[10px] font-bold">Quá hạn {it.overdue_days} ngày</Text>
                    </View>
                  ) : (
                    <View className="self-start bg-[#DCFCE7] rounded-full" style={{ paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text className="text-[#15803D] text-[10px] font-bold">Đúng hạn</Text>
                    </View>
                  )}
                </View>
                <Pressable onPress={() => setItems(prev => prev.filter((_, i) => i !== idx))} className="w-8 h-8 items-center justify-center">
                  <Feather name="x" size={16} color="#94A3B8" />
                </Pressable>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Condition */}
        {items.length > 0 && (
          <View className="mx-5 mb-3 bg-white rounded-2xl" style={{ padding: 14, gap: 10 }}>
            <Text className="text-[#64748B] text-[10px] font-bold tracking-wider">TÌNH TRẠNG THIẾT BỊ</Text>
            <View className="flex-row" style={{ gap: 8 }}>
              <Pressable
                onPress={() => setCondition('Good')}
                className="flex-1 flex-row items-center justify-center rounded-xl"
                style={{ gap: 6, paddingVertical: 12, backgroundColor: condition === 'Good' ? '#DCFCE7' : '#F1F5F9' }}
              >
                <Feather name="check-circle" size={16} color={condition === 'Good' ? '#15803D' : '#94A3B8'} />
                <Text className="font-bold text-xs" style={{ color: condition === 'Good' ? '#15803D' : '#94A3B8' }}>NGUYÊN VẸN</Text>
              </Pressable>
              <Pressable
                onPress={() => setCondition('Broken')}
                className="flex-1 flex-row items-center justify-center rounded-xl"
                style={{ gap: 6, paddingVertical: 12, backgroundColor: condition === 'Broken' ? '#FEE2E2' : '#F1F5F9' }}
              >
                <Feather name="alert-triangle" size={16} color={condition === 'Broken' ? '#CC0D00' : '#94A3B8'} />
                <Text className="font-bold text-xs" style={{ color: condition === 'Broken' ? '#CC0D00' : '#94A3B8' }}>HỎNG / MẤT</Text>
              </Pressable>
            </View>

            {condition === 'Broken' && (
              <View style={{ gap: 8 }}>
                <Text className="text-[#64748B] text-[10px] font-bold tracking-wider">ẢNH MINH CHỨNG</Text>
                {evidence ? (
                  <View className="relative overflow-hidden" style={{ height: 120, borderRadius: 12 }}>
                    <Image source={{ uri: evidence }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <Pressable onPress={() => setEvidence(null)} className="absolute top-2 right-2 bg-black/60 w-7 h-7 rounded-full items-center justify-center">
                      <Feather name="x" size={14} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable onPress={pickImage} className="items-center justify-center rounded-xl"
                    style={{ height: 80, gap: 4, borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed' }}>
                    <Feather name="camera" size={20} color="#CC0D00" />
                    <Text className="text-[#CC0D00] text-[11px] font-semibold">Tải ảnh lên</Text>
                  </Pressable>
                )}
              </View>
            )}

            <Text className="text-[#64748B] text-[10px] font-bold tracking-wider">GHI CHÚ</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Ghi chú thêm về tình trạng (tùy chọn)..."
              placeholderTextColor="#94A3B8"
              multiline
              className="bg-[#F1F5F9] rounded-xl text-[#0F172A] text-sm"
              style={{ padding: 12, minHeight: 70, textAlignVertical: 'top' }}
            />
          </View>
        )}

        <View className="mx-5">
          <Pressable
            onPress={() => router.push('/damage-report' as any)}
            className="flex-row items-center justify-center"
            style={{ paddingVertical: 10, gap: 6 }}
          >
            <Feather name="tool" size={14} color="#CC0D00" />
            <Text className="text-[#CC0D00] text-xs font-semibold">Báo sự cố / hỏng chi tiết</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute left-0 right-0 bottom-0 bg-white" style={{ paddingTop: 14, paddingBottom: 28, paddingHorizontal: 20 }}>
        <Pressable
          onPress={submit}
          disabled={items.length === 0 || submitting}
          className="rounded-2xl flex-row items-center justify-center"
          style={{ paddingVertical: 16, gap: 8, backgroundColor: items.length > 0 && !submitting ? '#CC0D00' : '#E2E8F0' }}
        >
          {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Feather name="check" size={18} color={items.length > 0 ? '#FFFFFF' : '#94A3B8'} />}
          <Text className="font-bold text-[15px]" style={{ color: items.length > 0 && !submitting ? '#FFFFFF' : '#94A3B8' }}>
            {submitting ? 'Đang xử lý...' : `Xác nhận trả (${items.length})`}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
