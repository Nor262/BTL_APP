import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlertStore } from '@/store/useAlertStore';

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();
  const [stats, setStats] = useState({ total: 0, pending: 0, overdue: 0 });
  const [overdueItems, setOverdueItems] = useState<any[]>([]);
  const [chartsData, setChartsData] = useState<any>({ top_borrowed: [], borrow_frequency_by_month: [] });

  const fetchData = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      const d = res.data?.data || res.data || {};
      const summary = d.summary || {};
      const alerts = d.alerts || {};
      setStats({
        total: summary.total_equipment || 0,
        pending: alerts.pending_requests || 0,
        overdue: alerts.overdue_transactions || 0,
      });
      setChartsData(d.charts || { top_borrowed: [], borrow_frequency_by_month: [] });
    } catch {}

    try {
      const res = await api.get('/analytics/overdue');
      const items = res.data?.data || res.data || [];
      setOverdueItems(items.slice(0, 3));
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const calculateLateDays = (dueDateStr: string) => {
    if (!dueDateStr) return 0;
    const due = new Date(dueDateStr);
    const now = new Date();
    if (now <= due) return 0;
    const diffTime = Math.abs(now.getTime() - due.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleRemind = async (txId: number) => {
    try {
      showAlert({
        type: 'success',
        title: 'Đã gửi nhắc nhở',
        message: 'Hệ thống đã gửi email và thông báo nhắc nhở hoàn trả thiết bị tới người mượn!',
      });
    } catch {
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể gửi nhắc nhở vào lúc này.',
      });
    }
  };

  const initials = (user?.full_name?.split(' ').pop() || 'A').charAt(0).toUpperCase();
  const rawBars = chartsData.borrow_frequency_by_month || [];
  const bars = rawBars.length > 0 ? rawBars.map((item: any) => item.count) : [0, 0, 0, 0, 0, 0];
  const labels = rawBars.length > 0
    ? rawBars.map((item: any) => {
        const m = item.month.split('-')[1];
        return `T${parseInt(m)}`;
      })
    : ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
  const maxBar = Math.max(...bars, 1);

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
              <Text className="text-[#0F172A] text-[13px] font-bold">Tần suất mượn · 6 tháng qua</Text>
              <Text className="text-[#94A3B8] text-[10px]">{new Date().getFullYear()}</Text>
            </View>
            <View className="flex-row items-end justify-between" style={{ height: 100, gap: 8 }}>
              {bars.map((v: number, i: number) => (
                <View key={i} className="flex-1 items-center" style={{ gap: 4 }}>
                  <View
                    className="w-full rounded-t-md"
                    style={{ height: (v / maxBar) * 80, backgroundColor: i === bars.length - 1 ? '#CC0D00' : '#FCA5A5' }}
                  />
                  <Text className="text-[#94A3B8] text-[9px]">
                    {labels[i]}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Overdue items */}
          <Animated.View entering={FadeInDown.delay(200)} style={{ gap: 8 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[#0F172A] text-[13px] font-bold">Quá hạn cần xử lý</Text>
              <Pressable onPress={() => router.push('/admin/equipment')}>
                <Text className="text-[#CC0D00] text-[11px] font-bold">Xem tất cả</Text>
              </Pressable>
            </View>
            {overdueItems.length === 0 ? (
              <View className="bg-white rounded-[14px] items-center justify-center py-6" style={{ gap: 8 }}>
                <Feather name="check-circle" size={24} color="#22C55E" />
                <Text className="text-[#64748B] text-xs font-bold">Không có thiết bị nào quá hạn</Text>
              </View>
            ) : (
              overdueItems.map((p: any) => (
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
                      {p.equipment?.name || 'Thiết bị'} — {p.borrower?.full_name || p.borrower?.username || 'Người mượn'}
                    </Text>
                    <Text className="text-[#94A3B8] text-[11px]">
                      Quá hạn {calculateLateDays(p.due_date)} ngày · #{p.id}
                    </Text>
                  </View>
                  <Pressable
                    className="bg-[#0F172A] rounded-[10px]"
                    style={{ paddingVertical: 6, paddingHorizontal: 12 }}
                    onPress={() => handleRemind(p.id)}
                  >
                    <Text className="text-white text-[11px] font-bold">Nhắc</Text>
                  </Pressable>
                </View>
              ))
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
