import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/client';
import LoadingScreen from '../ui/LoadingScreen';
import Badge from '../ui/Badge';

export default function StorekeeperHome() {
  const [dashData, setDashData] = useState<any>(null);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [overdueTx, setOverdueTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuthStore();
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [statsRes, transRes] = await Promise.all([
        api.get('/analytics/dashboard').catch(() => ({ data: { data: null } })),
        api.get('/transactions').catch(() => ({ data: { data: [] } })),
      ]);
      const d = statsRes.data?.data;
      setDashData(d);
      const txs = transRes.data?.data || [];
      setRecentTx(txs.slice(0, 5));
      setOverdueTx(txs.filter((t: any) => t.status === 'overdue').slice(0, 3));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const totalEquipment = dashData?.summary?.total_count || 0;
  const pendingCount = dashData?.alerts?.pending_requests || 0;
  const initials = user?.full_name?.charAt(0).toUpperCase() || 'A';

  if (loading) return <LoadingScreen />;

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC0D00" />}
      >
        {/* Dark Header */}
        <View className="bg-[#0F172A]" style={{ padding: 20, paddingTop: 62, gap: 14 }}>
          {/* Greeting */}
          <View className="flex-row items-center justify-between">
            <View style={{ gap: 2 }}>
              <Text className="text-[#94A3B8] text-xs">Xin chào, Admin</Text>
              <Text className="text-white text-lg font-bold">{user?.full_name || 'Admin'}</Text>
            </View>
            <Pressable
              className="w-10 h-10 bg-[#CC0D00] rounded-full items-center justify-center"
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text className="text-white text-sm font-bold">{initials}</Text>
            </Pressable>
          </View>

          {/* KPI Cards */}
          <View className="flex-row" style={{ gap: 10 }}>
            <Animated.View
              entering={FadeInDown.delay(100)}
              className="flex-1 bg-white rounded-[14px]"
              style={{ padding: 14, gap: 6, borderWidth: 1.5, borderColor: '#E2E8F0' }}
            >
              <View className="flex-row items-center justify-between">
                <View className="w-8 h-8 bg-[#DCFCE7] rounded-lg items-center justify-center">
                  <Feather name="box" size={16} color="#15803D" />
                </View>
                <Text className="text-[#94A3B8] text-[10px] font-medium">Thiết bị</Text>
              </View>
              <Text className="text-[#0F172A] text-[22px] font-bold">{totalEquipment}</Text>
              <Text className="text-[#15803D] text-[10px]">Tổng kho</Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(200)}
              className="flex-1 bg-white rounded-[14px]"
              style={{ padding: 14, gap: 6, borderWidth: 1.5, borderColor: '#CC0D00' }}
            >
              <View className="flex-row items-center justify-between">
                <View className="w-8 h-8 bg-[#FEE5E3] rounded-lg items-center justify-center">
                  <Feather name="clock" size={16} color="#CC0D00" />
                </View>
                <Text className="text-[#94A3B8] text-[10px] font-medium">Chờ duyệt</Text>
              </View>
              <Text className="text-[#CC0D00] text-[22px] font-bold">{pendingCount}</Text>
              <Text className="text-[#94A3B8] text-[10px]">Cần xử lý</Text>
            </Animated.View>
          </View>
        </View>

        {/* Content */}
        <View style={{ padding: 20, paddingBottom: 110, gap: 12 }}>
          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(300)} className="flex-row" style={{ gap: 10 }}>
            {[
              { icon: 'check-square' as const, iconColor: '#7C3AED', bg: '#F3E8FF', label: 'Phê duyệt', badge: pendingCount, onPress: () => router.push('/my-loans') },
              { icon: 'package' as const, iconColor: '#CC0D00', bg: '#FEE5E3', label: 'Quản lý kho', sub: `${totalEquipment} thiết bị`, onPress: () => {} },
              { icon: 'users' as const, iconColor: '#16A34A', bg: '#DCFCE7', label: 'Người dùng', sub: 'Quản lý', onPress: () => {} },
            ].map((item, i) => (
              <Pressable
                key={i}
                className="flex-1 bg-white rounded-[14px] items-center"
                style={{ padding: 12, paddingHorizontal: 10, gap: 6 }}
                onPress={item.onPress}
              >
                <View
                  className="w-9 h-9 rounded-[10px] items-center justify-center"
                  style={{ backgroundColor: item.bg }}
                >
                  <Feather name={item.icon} size={18} color={item.iconColor} />
                </View>
                <Text className="text-[#0F172A] text-[11px] font-semibold">{item.label}</Text>
                {item.badge ? (
                  <View className="bg-[#CC0D00] rounded-full" style={{ paddingVertical: 1, paddingHorizontal: 7 }}>
                    <Text className="text-white text-[10px] font-bold">{item.badge}</Text>
                  </View>
                ) : (
                  <Text className="text-[#94A3B8] text-[10px]">{item.sub}</Text>
                )}
              </Pressable>
            ))}
          </Animated.View>

          {/* Overdue Section */}
          {overdueTx.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(400)}
              className="bg-white rounded-2xl"
              style={{ padding: 12, gap: 8 }}
            >
              <View className="flex-row items-center justify-between" style={{ paddingHorizontal: 2 }}>
                <Text className="text-[#0F172A] text-[13px] font-bold">Quá hạn cần xử lý</Text>
                <Pressable><Text className="text-[#CC0D00] text-[11px] font-semibold">Xem tất cả</Text></Pressable>
              </View>
              {overdueTx.map((item: any) => (
                <View
                  key={item.id}
                  className="bg-[#FEF2F2] rounded-xl flex-row items-center"
                  style={{ padding: 10, gap: 10 }}
                >
                  <View className="w-8 h-8 bg-[#FEE2E2] rounded-lg items-center justify-center">
                    <Feather name="alert-triangle" size={16} color="#DC2626" />
                  </View>
                  <View className="flex-1" style={{ gap: 1 }}>
                    <Text className="text-[#0F172A] text-xs font-semibold" numberOfLines={1}>{item.equipment?.name}</Text>
                    <Text className="text-[#94A3B8] text-[10px]">{item.borrower?.full_name}</Text>
                  </View>
                  <Text className="text-[#DC2626] text-[11px] font-bold">Nhắc</Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Recent Transactions */}
          <Animated.View entering={FadeInDown.delay(500)} className="bg-white rounded-2xl" style={{ padding: 12, gap: 8 }}>
            <View className="flex-row items-center justify-between" style={{ paddingHorizontal: 2 }}>
              <Text className="text-[#0F172A] text-[13px] font-bold">Giao dịch gần đây</Text>
              <Pressable onPress={() => router.push('/my-loans')}>
                <Text className="text-[#CC0D00] text-[11px] font-semibold">Xem tất cả</Text>
              </Pressable>
            </View>
            {recentTx.length > 0 ? recentTx.map((item: any) => (
              <View key={item.id} className="flex-row items-center" style={{ gap: 10, paddingVertical: 6 }}>
                <View className="w-9 h-9 bg-[#F1F5F9] rounded-lg items-center justify-center">
                  <Feather name="monitor" size={16} color="#64748B" />
                </View>
                <View className="flex-1" style={{ gap: 2 }}>
                  <Text className="text-[#0F172A] text-xs font-semibold" numberOfLines={1}>{item.equipment?.name}</Text>
                  <Text className="text-[#94A3B8] text-[10px]">{item.borrower?.full_name}</Text>
                </View>
                <Badge status={item.status} />
              </View>
            )) : (
              <View className="items-center py-6">
                <Text className="text-[#94A3B8] text-xs">Không có giao dịch</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
