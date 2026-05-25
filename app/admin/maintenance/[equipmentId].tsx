import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import api from '@/api/client';
import { handleApiError } from '@/utils/error-handler';
import { useAlertStore } from '@/store/useAlertStore';

export default function MaintenanceDetailScreen() {
  const router = useRouter();
  const { equipmentId } = useLocalSearchParams<{ equipmentId: string }>();
  const { showAlert } = useAlertStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/maintenance/equipment/${equipmentId}`);
        setData(res.data.data || res.data);
      } catch (e) {
        handleApiError(e, 'Lỗi tải chi tiết');
      } finally { setLoading(false); }
    })();
  }, [equipmentId]);

  const handleComplete = async () => {
    setSubmitting(true);


    try {
      await api.put(`/maintenance/complete/${equipmentId}`);
      await api.patch(`/equipment/${equipmentId}/resolve-maintenance`).catch(() => { });
      showAlert({ type: 'success', title: 'Hoàn tất bảo trì', message: 'Thiết bị đã sẵn sàng sử dụng' });
      router.back();
    } catch (e) {
      handleApiError(e, 'Lỗi hoàn tất');
    } finally { setSubmitting(false); }
  };

  if (loading) return <View className="flex-1 items-center justify-center bg-[#F1F5F9]"><ActivityIndicator color="#CC0D00" /></View>;
  if (!data) return <View className="flex-1 items-center justify-center bg-[#F1F5F9]"><Text className="text-[#94A3B8]">Không tìm thấy</Text></View>;

  const events = data.timeline || data.events || [];
  const status = data.status || 'in_progress';
  const statusMap: Record<string, [string, string, string]> = {
    in_progress: ['Đang sửa', '#CC0D00', '#FEE2E2'],
    pending_part: ['Chờ linh kiện', '#B45309', '#FEF3C7'],
    completed: ['Hoàn tất', '#15803D', '#DCFCE7'],
  };
  const [label, color, bg] = statusMap[status] || ['Đang xử lý', '#64748B', '#F1F5F9'];

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <View className="flex-row items-center justify-between px-5" style={{ paddingTop: 58, paddingBottom: 8 }}>
        <Pressable className="w-10 h-10 bg-white rounded-full items-center justify-center" onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#0F172A" />
        </Pressable>
        <Text className="text-[#0F172A] text-lg font-bold">Chi tiết bảo trì</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 140, gap: 14 }}>
        <View className="bg-white rounded-2xl" style={{ padding: 14, gap: 10 }}>
          <View className="flex-row items-start justify-between">
            <View style={{ flex: 1, gap: 3 }}>
              <Text className="text-[#64748B] text-[11px] font-semibold">{data.equipment_code || `EQ-${equipmentId}`}</Text>
              <Text className="text-[#0F172A] text-base font-bold">{data.equipment_name || 'Thiết bị'}</Text>
            </View>
            <View className="rounded-full" style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: bg }}>
              <Text className="text-[10px] font-bold" style={{ color }}>{label}</Text>
            </View>
          </View>

          <View className="bg-[#F8FAFC] rounded-xl" style={{ padding: 10, gap: 8 }}>
            {[
              ['Người giữ', data.holder_name || '—'],
              ['Bắt đầu', data.start_date ? new Date(data.start_date).toLocaleDateString('vi-VN') : '—'],
              ['Kỹ thuật viên', data.technician_name || '—'],
              ['Dự kiến xong', data.expected_end_date ? new Date(data.expected_end_date).toLocaleDateString('vi-VN') : '—'],
            ].map(([k, v]) => (
              <View key={k} className="flex-row justify-between items-center">
                <Text className="text-[#64748B] text-[11px]">{k}</Text>
                <Text className="text-[#0F172A] text-xs font-bold">{v}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text className="text-[#64748B] text-[11px] font-bold tracking-wider">MÔ TẢ SỰ CỐ</Text>
        <View className="bg-white rounded-2xl" style={{ padding: 14 }}>
          <Text className="text-[#0F172A] text-sm">{data.reason || data.description || 'Không có mô tả'}</Text>
        </View>

        {events.length > 0 && (
          <>
            <Text className="text-[#64748B] text-[11px] font-bold tracking-wider">TIẾN ĐỘ</Text>
            <View className="bg-white rounded-2xl" style={{ padding: 14, gap: 14 }}>
              {events.map((e: any, i: number) => (
                <View key={i} className="flex-row items-start" style={{ gap: 12 }}>
                  <View className="rounded-full" style={{ width: 12, height: 12, marginTop: 4, backgroundColor: e.done ? '#CC0D00' : '#E2E8F0' }} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text className="text-[#0F172A] text-xs font-bold">{e.time}</Text>
                    <Text className="text-[#475569] text-[11px]">{e.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View className="absolute left-0 right-0 bottom-0 bg-white flex-row" style={{ paddingTop: 14, paddingBottom: 28, paddingHorizontal: 20, gap: 8 }}>
        <Pressable className="flex-1 bg-[#F1F5F9] rounded-2xl items-center justify-center" style={{ paddingVertical: 14 }}
          onPress={() => router.back()}>
          <Text className="text-[#0F172A] font-bold text-sm">Quay lại</Text>
        </Pressable>
        {status !== 'completed' && (
          <Pressable onPress={handleComplete} disabled={submitting}
            className="flex-1 bg-[#0F172A] rounded-2xl flex-row items-center justify-center" style={{ paddingVertical: 14, gap: 6 }}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Feather name="check" size={14} color="#FFFFFF" />}
            <Text className="text-white font-bold text-sm">Hoàn tất bảo trì</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
