import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import api from '@/api/client';
import { handleApiError } from '@/utils/error-handler';
import { useAlertStore } from '@/store/useAlertStore';
import { useAuthStore } from '@/store/useAuthStore';

type StatusKey = 'pending' | 'approved' | 'active' | 'overdue' | 'completed' | 'rejected' | 'cancelled';
const STATUS_MAP: Record<StatusKey, [string, string, string]> = {
  pending: ['CHỜ DUYỆT', '#B45309', '#FEF3C7'],
  approved: ['ĐÃ DUYỆT', '#15803D', '#DCFCE7'],
  active: ['ĐANG MƯỢN', '#15803D', '#DCFCE7'],
  overdue: ['QUÁ HẠN', '#CC0D00', '#FEE2E2'],
  completed: ['HOÀN TẤT', '#475569', '#E2E8F0'],
  rejected: ['TỪ CHỐI', '#CC0D00', '#FEE2E2'],
  cancelled: ['ĐÃ HỦY', '#64748B', '#F1F5F9'],
};

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showAlert } = useAlertStore();
  const { user } = useAuthStore();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [extendVisible, setExtendVisible] = useState(false);
  const [rateVisible, setRateVisible] = useState(false);
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const ep = user?.role === 'borrower' ? '/transactions/my' : '/transactions';
      const res = await api.get(ep);
      const list = res.data.data || res.data || [];
      const found = list.find((t: any) => String(t.id || t.transaction_id) === String(id));
      setTx(found);
    } catch (e) {
      handleApiError(e, 'Lỗi tải giao dịch');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const doExtend = async () => {
    setBusy(true);
    try {
      const newDate = new Date(new Date(tx.due_date).getTime() + 7 * 86400000);
      await api.patch(`/transactions/${id}/extend`, { new_due_date: newDate.toISOString() });
      showAlert({ type: 'success', title: 'Thành công', message: 'Đã gia hạn +7 ngày' });
      setExtendVisible(false);
      load();
    } catch (e) { handleApiError(e, 'Lỗi gia hạn'); } finally { setBusy(false); }
  };

  const doCancel = async () => {
    setBusy(true);
    try {
      await api.patch(`/transactions/${id}/cancel`);
      showAlert({ type: 'success', title: 'Đã hủy', message: 'Giao dịch đã hủy' });
      router.back();
    } catch (e) { handleApiError(e, 'Lỗi hủy'); } finally { setBusy(false); }
  };

  const doRemind = async () => {
    setBusy(true);
    try {
      await api.post(`/transactions/${id}/remind`);
      showAlert({ type: 'success', title: 'Đã gửi nhắc', message: 'Người mượn đã nhận thông báo' });
    } catch (e) { handleApiError(e, 'Lỗi gửi nhắc'); } finally { setBusy(false); }
  };

  const doRate = async () => {
    setBusy(true);
    try {
      await api.patch(`/transactions/${id}/rate`, { rating: parseInt(rating), comment });
      showAlert({ type: 'success', title: 'Cảm ơn!', message: 'Đã ghi nhận đánh giá' });
      setRateVisible(false);
      load();
    } catch (e) { handleApiError(e, 'Lỗi đánh giá'); } finally { setBusy(false); }
  };

  if (loading) return <View className="flex-1 items-center justify-center bg-[#F1F5F9]"><ActivityIndicator color="#CC0D00" /></View>;
  if (!tx) return (
    <View className="flex-1 items-center justify-center bg-[#F1F5F9]">
      <Text className="text-[#94A3B8]">Không tìm thấy giao dịch</Text>
      <Pressable onPress={() => router.back()} className="mt-3 px-4 py-2 bg-[#0F172A] rounded-xl">
        <Text className="text-white text-xs font-bold">Quay lại</Text>
      </Pressable>
    </View>
  );

  const sk = (tx.status as StatusKey) || 'pending';
  const [sLabel, sColor, sBg] = STATUS_MAP[sk] || STATUS_MAP.pending;
  const due = tx.due_date ? new Date(tx.due_date) : null;
  const now = new Date();
  const daysLeft = due ? Math.ceil((due.getTime() - now.getTime()) / 86400000) : null;
  const isOverdue = sk === 'overdue' || (sk === 'active' && daysLeft !== null && daysLeft < 0);

  const isAdmin = user?.role === 'admin' || user?.role === 'storekeeper';
  const isOwner = tx.borrower_id === user?.id || tx.user_id === user?.id;
  const equipment = tx.equipment || { name: tx.equipment_name, serial_number: tx.serial_number };

  const timeline: any[] = [
    tx.request_date && { time: tx.request_date, label: 'Tạo yêu cầu', actor: tx.borrower_name, done: true },
    tx.reviewed_at && { time: tx.reviewed_at, label: sk === 'rejected' ? 'Bị từ chối' : 'Admin duyệt', actor: tx.reviewer_name, done: true },
    tx.checkout_at && { time: tx.checkout_at, label: 'Bàn giao kho', actor: tx.storekeeper_name, done: true },
    tx.return_date && { time: tx.return_date, label: 'Đã trả', actor: tx.storekeeper_name, done: true },
    tx.due_date && !tx.return_date && { time: tx.due_date, label: 'Hạn trả (dự kiến)', done: false },
  ].filter(Boolean);

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <View className="flex-row items-center justify-between px-5" style={{ paddingTop: 58, paddingBottom: 8 }}>
        <Pressable className="w-10 h-10 bg-white rounded-full items-center justify-center" onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#0F172A" />
        </Pressable>
        <Text className="text-[#0F172A] text-lg font-bold">TX-{tx.id || tx.transaction_id}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 140, gap: 14 }}>
        <View className="rounded-2xl" style={{ padding: 14, gap: 4, backgroundColor: sBg }}>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Feather name={isOverdue ? 'alert-triangle' : sk === 'completed' ? 'check-circle' : 'clock'} size={18} color={sColor} />
            <Text className="text-[13px] font-bold" style={{ color: sColor }}>{sLabel}</Text>
          </View>
          {due && (
            <Text className="text-[#0F172A] text-xs">
              {isOverdue ? `Quá hạn ${Math.abs(daysLeft || 0)} ngày` : `Hạn trả: còn ${daysLeft} ngày (${due.toLocaleDateString('vi-VN')})`}
            </Text>
          )}
        </View>

        <Text className="text-[#64748B] text-[11px] font-bold tracking-wider">THIẾT BỊ</Text>
        <View className="bg-white rounded-2xl flex-row items-center" style={{ padding: 12, gap: 12 }}>
          <View className="w-12 h-12 bg-[#F1F5F9] rounded-xl items-center justify-center">
            <Feather name="package" size={22} color="#64748B" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text className="text-[#0F172A] text-sm font-bold">{equipment.name || 'Thiết bị'}</Text>
            <Text className="text-[#64748B] text-[11px]">SN: {equipment.serial_number || '—'}</Text>
          </View>
        </View>

        {tx.borrower_name && (
          <>
            <Text className="text-[#64748B] text-[11px] font-bold tracking-wider">NGƯỜI MƯỢN</Text>
            <View className="bg-white rounded-2xl flex-row items-center" style={{ padding: 12, gap: 12 }}>
              <View className="rounded-full bg-[#CC0D00] items-center justify-center" style={{ width: 44, height: 44 }}>
                <Text className="text-white text-lg font-extrabold">{(tx.borrower_name || '?')[0]}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text className="text-[#0F172A] text-sm font-bold">{tx.borrower_name}</Text>
                {tx.borrower_email && <Text className="text-[#64748B] text-[11px]">{tx.borrower_email}</Text>}
                {tx.borrower_phone && <Text className="text-[#64748B] text-[11px]">{tx.borrower_phone}</Text>}
              </View>
            </View>
          </>
        )}

        {timeline.length > 0 && (
          <>
            <Text className="text-[#64748B] text-[11px] font-bold tracking-wider">TIMELINE</Text>
            <View className="bg-white rounded-2xl" style={{ padding: 14, gap: 14 }}>
              {timeline.map((e, i) => (
                <View key={i} className="flex-row items-start" style={{ gap: 12 }}>
                  <View className="rounded-full" style={{ width: 12, height: 12, marginTop: 3, backgroundColor: e.done ? '#CC0D00' : '#E2E8F0' }} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text className="text-[#0F172A] text-xs font-bold">{new Date(e.time).toLocaleString('vi-VN')}</Text>
                    <Text className="text-[#475569] text-[11px]">{e.label}</Text>
                    {e.actor && <Text className="text-[#94A3B8] text-[10px]">{e.actor}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {tx.note && (
          <>
            <Text className="text-[#64748B] text-[11px] font-bold tracking-wider">GHI CHÚ</Text>
            <View className="bg-white rounded-2xl" style={{ padding: 14 }}>
              <Text className="text-[#0F172A] text-xs">{tx.note}</Text>
            </View>
          </>
        )}
      </ScrollView>

      <View className="absolute left-0 right-0 bottom-0 bg-white" style={{ paddingTop: 12, paddingBottom: 28, paddingHorizontal: 16 }}>
        <View className="flex-row" style={{ gap: 8 }}>
          {sk === 'active' && isOwner && (
            <Pressable onPress={() => showAlert({
                type: 'info',
                title: 'Trả thiết bị',
                message: 'Vui lòng mang thiết bị đến phòng quản lý để thủ kho xác nhận trả.',
                showCancel: false,
              })}
              className="flex-1 bg-[#CC0D00] rounded-2xl flex-row items-center justify-center" style={{ paddingVertical: 14, gap: 6 }}>
              <Feather name="check-circle" size={14} color="#FFFFFF" />
              <Text className="text-white font-bold text-sm">Trả thiết bị</Text>
            </Pressable>
          )}
          {sk === 'active' && !tx.is_extended && (
            <Pressable onPress={() => setExtendVisible(true)} className="flex-1 bg-[#F1F5F9] rounded-2xl items-center justify-center" style={{ paddingVertical: 14 }}>
              <Text className="text-[#0F172A] text-sm font-bold">Gia hạn</Text>
            </Pressable>
          )}
          {(sk === 'active' || sk === 'overdue') && isAdmin && (
            <Pressable onPress={doRemind} disabled={busy} className="flex-1 bg-[#0F172A] rounded-2xl items-center justify-center" style={{ paddingVertical: 14 }}>
              <Text className="text-white text-sm font-bold">Nhắc trả</Text>
            </Pressable>
          )}
          {sk === 'pending' && isOwner && (
            <Pressable onPress={doCancel} disabled={busy} className="flex-1 bg-[#FEE2E2] rounded-2xl items-center justify-center" style={{ paddingVertical: 14 }}>
              <Text className="text-[#CC0D00] text-sm font-bold">Hủy yêu cầu</Text>
            </Pressable>
          )}
          {sk === 'completed' && isOwner && !tx.rating && (
            <Pressable onPress={() => setRateVisible(true)} className="flex-1 bg-[#FBBF24] rounded-2xl flex-row items-center justify-center" style={{ paddingVertical: 14, gap: 6 }}>
              <Feather name="star" size={14} color="#0F172A" />
              <Text className="text-[#0F172A] text-sm font-bold">Đánh giá</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Modal visible={extendVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="bg-white rounded-2xl m-6" style={{ padding: 20, gap: 12, width: 320 }}>
            <Text className="text-[#0F172A] text-lg font-bold">Gia hạn 7 ngày?</Text>
            <Text className="text-[#64748B] text-sm">Hạn mới: {due ? new Date(due.getTime() + 7 * 86400000).toLocaleDateString('vi-VN') : ''}</Text>
            <View className="flex-row" style={{ gap: 8 }}>
              <Pressable onPress={() => setExtendVisible(false)} className="flex-1 bg-[#F1F5F9] rounded-xl py-3 items-center"><Text className="font-bold text-[#0F172A]">Hủy</Text></Pressable>
              <Pressable onPress={doExtend} className="flex-1 bg-[#0F172A] rounded-xl py-3 items-center"><Text className="font-bold text-white">Xác nhận</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={rateVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="bg-white rounded-2xl m-6" style={{ padding: 20, gap: 12, width: 320 }}>
            <Text className="text-[#0F172A] text-lg font-bold">Đánh giá trải nghiệm</Text>
            <View className="flex-row justify-center" style={{ gap: 6 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <Pressable key={n} onPress={() => setRating(String(n))}>
                  <Feather name="star" size={28} color={n <= parseInt(rating) ? '#F59E0B' : '#E2E8F0'} />
                </Pressable>
              ))}
            </View>
            <TextInput value={comment} onChangeText={setComment} placeholder="Bình luận (tùy chọn)..."
              placeholderTextColor="#94A3B8" multiline className="bg-[#F1F5F9] rounded-xl text-[#0F172A]"
              style={{ padding: 12, minHeight: 70, textAlignVertical: 'top' }} />
            <View className="flex-row" style={{ gap: 8 }}>
              <Pressable onPress={() => setRateVisible(false)} className="flex-1 bg-[#F1F5F9] rounded-xl py-3 items-center"><Text className="font-bold text-[#0F172A]">Hủy</Text></Pressable>
              <Pressable onPress={doRate} className="flex-1 bg-[#CC0D00] rounded-xl py-3 items-center"><Text className="font-bold text-white">Gửi</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
