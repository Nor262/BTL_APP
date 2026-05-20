import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ total: 0, pending: 0, overdue: 0 });
  const [pendingItems, setPendingItems] = useState<any[]>([]);

  useEffect(() => {
    api.get('/analytics/dashboard').then((res) => {
      const d = res.data?.data || res.data || {};
      setStats({
        total: d.total_equipment || 1284,
        pending: d.pending_requests || 0,
        overdue: d.overdue_transactions || 0,
      });
    }).catch(() => setStats({ total: 1284, pending: 23, overdue: 18 }));

    api.get('/transactions?status=pending').then((res) => {
      setPendingItems((res.data?.data || res.data || []).slice(0, 3));
    }).catch(() => {});
  }, []);

  const initials = (user?.full_name?.split(' ').pop() || 'A').charAt(0).toUpperCase();
  const bars = [3, 5, 7, 4, 6, 8, 5]; // 30-day frequency mock
  const maxBar = Math.max(...bars);

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="light" />
      {/* Dark header */}
      <View className="bg-[#0F172A]" style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 18, gap: 14 }}>
        <View className="flex-row items-center justify-between">
          <View style={{ gap: 2 }}>
            <Text className="text-[#94A3B8] text-xs">Xin chào, Admin</Text>
            <Text className="text-white text-xl font-bold">{user?.full_name || 'Trần Quang Anh'}</Text>
          </View>
          <Pressable className="w-11 h-11 bg-[#CC0D00] rounded-full items-center justify-center">
            <Text className="text-white text-base font-bold">{initials}</Text>
          </Pressable>
        </View>

        {/* KPI Row */}
        <View className="flex-row" style={{ gap: 10 }}>
          <View className="flex-1 bg-[#1E293B] rounded-[14px]" style={{ padding: 12, gap: 4 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[#94A3B8] text-[10px] font-bold">Tổng thiết bị</Text>
              <Feather name="box" size={12} color="#94A3B8" />
            </View>
            <Text className="text-white text-2xl font-bold">{stats.total.toLocaleString()}</Text>
            <Text className="text-[#22C55E] text-[10px] font-bold">+24 tháng này</Text>
          </View>
          <View className="flex-1 bg-[#1E293B] rounded-[14px]" style={{ padding: 12, gap: 4 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[#94A3B8] text-[10px] font-bold">Quá hạn</Text>
              <Feather name="alert-triangle" size={12} color="#EF4444" />
            </View>
            <Text className="text-[#EF4444] text-2xl font-bold">{stats.overdue}</Text>
            <Text className="text-[#94A3B8] text-[10px] font-bold">cần xử lý ngay</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 140 }}>
        <View style={{ gap: 14 }}>
          {/* Quick actions */}
          <Animated.View entering={FadeInDown.delay(100)} className="flex-row" style={{ gap: 10 }}>
            <Pressable
              className="flex-1 bg-white rounded-[14px] items-center"
              style={{ padding: 14, gap: 6 }}
              onPress={() => router.push('/admin/approval')}
            >
              <View className="w-10 h-10 bg-[#FEE5E3] rounded-xl items-center justify-center">
                <Feather name="check-square" size={18} color="#CC0D00" />
              </View>
              <Text className="text-[#0F172A] text-[12px] font-bold">Phê duyệt</Text>
              {stats.pending > 0 && (
                <View className="absolute top-2 right-2 bg-[#CC0D00] rounded-full" style={{ paddingHorizontal: 6, paddingVertical: 1 }}>
                  <Text className="text-white text-[9px] font-bold">{stats.pending}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              className="flex-1 bg-white rounded-[14px] items-center"
              style={{ padding: 14, gap: 6 }}
              onPress={() => router.push('/admin/equipment')}
            >
              <View className="w-10 h-10 bg-[#FEE5E3] rounded-xl items-center justify-center">
                <Feather name="grid" size={18} color="#CC0D00" />
              </View>
              <Text className="text-[#0F172A] text-[12px] font-bold">Quản lý kho</Text>
              <Text className="text-[#94A3B8] text-[9px]">{stats.total.toLocaleString()} thiết bị</Text>
            </Pressable>
            <Pressable
              className="flex-1 bg-white rounded-[14px] items-center"
              style={{ padding: 14, gap: 6 }}
              onPress={() => router.push('/admin/users')}
            >
              <View className="w-10 h-10 bg-[#DCFCE7] rounded-xl items-center justify-center">
                <Feather name="users" size={18} color="#15803D" />
              </View>
              <Text className="text-[#0F172A] text-[12px] font-bold">Người dùng</Text>
            </Pressable>
          </Animated.View>

          {/* Chart */}
          <Animated.View entering={FadeInDown.delay(150)} className="bg-white rounded-[16px]" style={{ padding: 14, gap: 10 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[#0F172A] text-[13px] font-bold">Tần suất mượn · 30 ngày</Text>
              <Text className="text-[#94A3B8] text-[10px]">T5</Text>
            </View>
            <View className="flex-row items-end justify-between" style={{ height: 100, gap: 8 }}>
              {bars.map((v, i) => (
                <View key={i} className="flex-1 items-center" style={{ gap: 4 }}>
                  <View
                    className="w-full rounded-t-md"
                    style={{ height: (v / maxBar) * 80, backgroundColor: i === 5 ? '#CC0D00' : '#FCA5A5' }}
                  />
                  <Text className="text-[#94A3B8] text-[9px]">
                    {['Lap', 'Cam', 'Aud', 'Cáp', 'Lk', 'TB', 'Khác'][i]}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Pending items */}
          <Animated.View entering={FadeInDown.delay(200)} style={{ gap: 8 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[#0F172A] text-[13px] font-bold">Quá hạn cần xử lý</Text>
              <Pressable onPress={() => router.push('/admin/equipment')}>
                <Text className="text-[#CC0D00] text-[11px] font-bold">Xem tất cả</Text>
              </Pressable>
            </View>
            {(pendingItems.length > 0 ? pendingItems : [{ id: 0, equipment: { name: 'MacBook Pro 14 — Lê Hà' }, due_date: new Date() }]).map((p: any) => (
              <View
                key={p.id}
                className="bg-white rounded-[14px] flex-row items-center"
                style={{ padding: 12, gap: 12, borderLeftWidth: 4, borderLeftColor: '#EF4444' }}
              >
                <View className="w-10 h-10 bg-[#FEE2E2] rounded-xl items-center justify-center">
                  <Feather name="alert-circle" size={18} color="#EF4444" />
                </View>
                <View className="flex-1" style={{ gap: 2 }}>
                  <Text className="text-[#0F172A] text-sm font-bold" numberOfLines={1}>
                    {p.equipment?.name || 'Thiết bị'}
                  </Text>
                  <Text className="text-[#94A3B8] text-[11px]">Quá hạn 5 ngày · #IRR-301</Text>
                </View>
                <Pressable className="bg-[#0F172A] rounded-[10px]" style={{ paddingVertical: 6, paddingHorizontal: 12 }}>
                  <Text className="text-white text-[11px] font-bold">Nhắc</Text>
                </Pressable>
              </View>
            ))}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
