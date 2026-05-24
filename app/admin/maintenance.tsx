import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '@/api/client';
import { handleApiError } from '@/utils/error-handler';
import { useAlertStore } from '@/store/useAlertStore';

type Tab = 'active' | 'pending' | 'completed';

export default function MaintenanceScreen() {
  const router = useRouter();
  const { showAlert } = useAlertStore();
  const [data, setData] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/maintenance');
      setData(res.data.data || res.data || []);
    } catch (e) {
      handleApiError(e, 'Lỗi tải danh sách bảo trì');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const filtered = data.filter(m => {
    if (tab === 'active') return m.status === 'in_progress' || m.status === 'pending_part';
    if (tab === 'pending') return m.status === 'pending';
    return m.status === 'completed';
  });

  const counts = {
    active: data.filter(m => m.status === 'in_progress' || m.status === 'pending_part').length,
    pending: data.filter(m => m.status === 'pending').length,
    completed: data.filter(m => m.status === 'completed').length,
  };

  const completeMaintenance = async (equipmentId: number | string) => {
    try {
      await api.put(`/maintenance/complete/${equipmentId}`);
      await api.patch(`/equipment/${equipmentId}/resolve-maintenance`).catch(() => {});
      showAlert({ type: 'success', title: 'Đã hoàn tất', message: 'Bảo trì hoàn thành' });
      fetchData();
    } catch (e) {
      handleApiError(e, 'Lỗi hoàn tất bảo trì');
    }
  };

  const statusBadge = (s: string): [string, string, string] => {
    if (s === 'in_progress') return ['Đang sửa', '#CC0D00', '#FEE2E2'];
    if (s === 'pending_part') return ['Chờ linh kiện', '#B45309', '#FEF3C7'];
    if (s === 'completed') return ['Hoàn tất', '#15803D', '#DCFCE7'];
    return ['Chờ duyệt', '#64748B', '#F1F5F9'];
  };

  if (loading) {
    return <View className="flex-1 items-center justify-center bg-[#F1F5F9]"><ActivityIndicator color="#CC0D00" /></View>;
  }

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <View style={{ paddingTop: 58 }}>
        <View className="flex-row items-center justify-between px-5 pb-2">
          <View>
            <Text className="text-[#0F172A] text-lg font-bold">Bảo trì thiết bị</Text>
            <Text className="text-[#64748B] text-[11px]">{counts.active} mục đang xử lý</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5" contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
          {([['active', 'Đang bảo trì', counts.active], ['pending', 'Chờ duyệt', counts.pending], ['completed', 'Hoàn tất', counts.completed]] as [Tab, string, number][]).map(([k, l, c]) => (
            <Pressable key={k} onPress={() => setTab(k)}
              className="flex-row items-center rounded-full"
              style={{ paddingHorizontal: 14, paddingVertical: 8, gap: 6, backgroundColor: tab === k ? '#0F172A' : '#FFFFFF' }}>
              <Text className="font-bold text-xs" style={{ color: tab === k ? '#FFFFFF' : '#0F172A' }}>{l}</Text>
              <View className="rounded-full" style={{ paddingHorizontal: 8, paddingVertical: 2, backgroundColor: tab === k ? '#CC0D00' : '#F1F5F9' }}>
                <Text className="text-[10px] font-bold" style={{ color: tab === k ? '#FFFFFF' : '#64748B' }}>{c}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        className="px-5 pt-2"
        contentContainerStyle={{ paddingBottom: 100, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        {filtered.length === 0 ? (
          <View className="items-center justify-center bg-white rounded-2xl" style={{ padding: 40, gap: 10 }}>
            <Feather name="tool" size={32} color="#CBD5E1" />
            <Text className="text-[#94A3B8] text-sm">Không có mục nào</Text>
          </View>
        ) : filtered.map((m, idx) => {
          const [label, color, bg] = statusBadge(m.status);
          return (
            <Animated.View key={m.id || idx} entering={FadeInDown.delay(idx * 60)}>
              <Pressable className="bg-white rounded-2xl" style={{ padding: 14, gap: 10 }}
                onPress={() => router.push({ pathname: '/admin/maintenance/[equipmentId]', params: { equipmentId: String(m.equipment_id) } } as any)}>
                <View className="flex-row justify-between items-start">
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text className="text-[#64748B] text-[11px] font-semibold">{m.equipment_code || `EQ-${m.equipment_id}`}</Text>
                    <Text className="text-[#0F172A] text-sm font-bold">{m.equipment_name || 'Thiết bị'}</Text>
                  </View>
                  <View className="rounded-full" style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: bg }}>
                    <Text className="text-[10px] font-bold" style={{ color }}>{label}</Text>
                  </View>
                </View>
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Feather name="tool" size={12} color="#94A3B8" />
                  <Text className="text-[#475569] text-xs flex-1" numberOfLines={2}>{m.reason || m.description || 'Bảo trì định kỳ'}</Text>
                </View>
                <View className="flex-row justify-between bg-[#F8FAFC] rounded-xl" style={{ padding: 10, gap: 8 }}>
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Feather name="calendar" size={12} color="#64748B" />
                    <Text className="text-[#64748B] text-[11px] font-semibold">{m.start_date ? new Date(m.start_date).toLocaleDateString('vi-VN') : '—'}</Text>
                  </View>
                  {m.technician_name && (
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Feather name="user" size={12} color="#64748B" />
                      <Text className="text-[#64748B] text-[11px] font-semibold">{m.technician_name}</Text>
                    </View>
                  )}
                </View>
                {tab === 'active' && (
                  <View className="flex-row" style={{ gap: 8 }}>
                    <Pressable onPress={() => completeMaintenance(m.equipment_id || m.id)}
                      className="flex-1 bg-[#0F172A] rounded-xl flex-row items-center justify-center" style={{ paddingVertical: 10, gap: 6 }}>
                      <Feather name="check" size={12} color="#FFFFFF" />
                      <Text className="text-white text-xs font-bold">Hoàn tất</Text>
                    </Pressable>
                    <Pressable onPress={() => router.push({ pathname: '/admin/maintenance/[equipmentId]', params: { equipmentId: String(m.equipment_id) } } as any)}
                      className="flex-1 bg-[#F1F5F9] rounded-xl flex-row items-center justify-center" style={{ paddingVertical: 10, gap: 6 }}>
                      <Feather name="eye" size={12} color="#0F172A" />
                      <Text className="text-[#0F172A] text-xs font-bold">Chi tiết</Text>
                    </Pressable>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}
