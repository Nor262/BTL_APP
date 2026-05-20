import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '@/api/client';
import { useAlertStore } from '@/store/useAlertStore';

const TABS = [
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
];

export default function AdminApproval() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlertStore();
  const [tab, setTab] = useState('pending');
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get('/transactions');
      const all = res.data?.data || res.data || [];
      setItems(all.filter((t: any) => t.status === tab));
    } catch {}
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, [tab]);

  const review = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/transactions/${id}/review`, { status });
      showAlert({ type: 'success', title: 'Đã cập nhật', message: status === 'approved' ? 'Yêu cầu đã được duyệt' : 'Đã từ chối yêu cầu' });
      fetchData();
    } catch (e: any) {
      showAlert({ type: 'error', title: 'Lỗi', message: e.response?.data?.message || 'Không thể xử lý' });
    }
  };

  const pendingCount = items.length;

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="dark" />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8 }}>
        <View className="flex-row items-center justify-between" style={{ height: 44 }}>
          <Pressable
            className="w-10 h-10 bg-white rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={18} color="#0F172A" />
          </Pressable>
          <View className="items-center">
            <Text className="text-[#0F172A] text-base font-bold">Phê duyệt đơn</Text>
            <Text className="text-[#94A3B8] text-[10px] font-bold">BOR-09</Text>
          </View>
          <Pressable className="w-10 h-10 bg-white rounded-full items-center justify-center">
            <Feather name="sliders" size={18} color="#0F172A" />
          </Pressable>
        </View>

        {/* Tabs */}
        <View className="flex-row" style={{ gap: 8, marginTop: 12 }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                className={`rounded-full flex-row items-center ${active ? 'bg-[#FEE5E3]' : 'bg-white'}`}
                style={{ paddingVertical: 6, paddingHorizontal: 12, gap: 6, borderWidth: 1.5, borderColor: active ? '#CC0D00' : '#E2E8F0' }}
              >
                <Text className={`text-[11px] font-bold ${active ? 'text-[#CC0D00]' : 'text-[#64748B]'}`}>{t.label}</Text>
                {active && t.key === 'pending' && pendingCount > 0 && (
                  <View className="bg-[#CC0D00] rounded-full" style={{ paddingHorizontal: 6 }}>
                    <Text className="text-white text-[10px] font-bold">{pendingCount}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#CC0D00" />}
      >
        <View style={{ gap: 12 }}>
          {items.length === 0 ? (
            <View className="items-center justify-center py-20" style={{ gap: 12 }}>
              <Feather name="inbox" size={32} color="#CBD5E1" />
              <Text className="text-[#94A3B8] text-sm">Không có đơn nào</Text>
            </View>
          ) : (
            items.map((it: any, idx: number) => (
              <Animated.View
                key={it.id}
                entering={FadeInDown.delay(idx * 60)}
                className="bg-white rounded-[16px]"
                style={{ padding: 14, gap: 12 }}
              >
                {/* Header */}
                <View className="flex-row items-center" style={{ gap: 10 }}>
                  <View className="w-10 h-10 bg-[#FEF3C7] rounded-full items-center justify-center">
                    <Text className="text-[#D97706] text-sm font-bold">
                      {(it.borrower?.full_name || 'L').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1" style={{ gap: 2 }}>
                    <Text className="text-[#0F172A] text-sm font-bold">{it.borrower?.full_name || 'Lê Thanh Hà'}</Text>
                    <Text className="text-[#94A3B8] text-[10px]">
                      CNTT K23 · Vừa nãy
                    </Text>
                  </View>
                  {tab === 'pending' && (
                    <View className="bg-[#FEF3C7] rounded-full" style={{ paddingVertical: 2, paddingHorizontal: 8 }}>
                      <Text className="text-[#D97706] text-[10px] font-bold">Gấp</Text>
                    </View>
                  )}
                </View>
                {/* Equipment */}
                <View
                  className="flex-row items-center bg-[#F8FAFC] rounded-[12px]"
                  style={{ padding: 10, gap: 10 }}
                >
                  <View className="w-9 h-9 bg-[#FEE5E3] rounded-lg items-center justify-center">
                    <Feather name="box" size={16} color="#CC0D00" />
                  </View>
                  <View className="flex-1" style={{ gap: 2 }}>
                    <Text className="text-[#0F172A] text-[13px] font-bold" numberOfLines={1}>
                      {it.equipment?.name || 'MacBook Pro 14" M3'}
                    </Text>
                    <Text className="text-[#94A3B8] text-[10px]">
                      Hạn: {it.due_date ? new Date(it.due_date).toLocaleDateString('vi-VN') : '---'}
                    </Text>
                  </View>
                </View>
                {/* Actions */}
                {tab === 'pending' && (
                  <View className="flex-row" style={{ gap: 8 }}>
                    <Pressable
                      className="flex-1 bg-[#FEE2E2] rounded-[10px] items-center justify-center"
                      style={{ paddingVertical: 10 }}
                      onPress={() => review(it.id, 'rejected')}
                    >
                      <Text className="text-[#B91C1C] text-[12px] font-bold">Từ chối</Text>
                    </Pressable>
                    <Pressable
                      className="flex-1 bg-[#F1F5F9] rounded-[10px] items-center justify-center"
                      style={{ paddingVertical: 10 }}
                      onPress={() => router.push(`/equipment/${it.equipment_id}`)}
                    >
                      <Text className="text-[#0F172A] text-[12px] font-bold">Chi tiết</Text>
                    </Pressable>
                    <Pressable
                      className="flex-1 bg-[#15803D] rounded-[10px] flex-row items-center justify-center"
                      style={{ paddingVertical: 10, gap: 4 }}
                      onPress={() => review(it.id, 'approved')}
                    >
                      <Feather name="check" size={12} color="#FFFFFF" />
                      <Text className="text-white text-[12px] font-bold">Duyệt</Text>
                    </Pressable>
                  </View>
                )}
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
