import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/client';
import Badge from '../ui/Badge';
import LoadingScreen from '../ui/LoadingScreen';

export default function StorekeeperHome() {
  const [stats, setStats] = useState<any>({
    pending: 0,
    in_use: 0,
    overdue: 0,
    available: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuthStore();
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [statsRes, transRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/transactions')
      ]);
      
      const dashboardData = statsRes.data.data;
      setStats({
        pending: dashboardData.alerts.pending_requests,
        in_use: dashboardData.summary.in_use_count,
        overdue: dashboardData.alerts.overdue_transactions,
        available: dashboardData.summary.available_count
      });
      
      setRecentTransactions(transRes.data.data.slice(0, 5));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC0D00" />
        }
      >
        <View className="bg-primary pt-16 pb-20 px-6 rounded-b-[40px] shadow-lg">
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-white/70 text-sm font-medium">Hệ thống Quản lý</Text>
              <Text className="text-white text-2xl font-bold">Thủ kho PTIT</Text>
            </View>
            <View className="flex-row items-center">
              <Pressable 
                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
                onPress={() => router.push('/notifications')}
              >
                <Feather name="bell" size={20} color="white" />
              </Pressable>
              <Pressable 
                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                onPress={() => router.push('/(tabs)/explore')}
              >
                <Feather name="user" size={20} color="white" />
              </Pressable>
            </View>
          </View>

          <Animated.View entering={FadeInDown.delay(200)}>
            <Pressable 
              className="bg-white/10 border border-white/20 rounded-3xl p-6 flex-row items-center justify-between"
              onPress={() => router.push('/scan')}
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center shadow-lg">
                  <Feather name="maximize" size={30} color="#CC0D00" />
                </View>
                <View className="ml-4">
                  <Text className="text-white font-bold text-xl">Quét mã QR</Text>
                  <Text className="text-white/60 text-xs mt-1">Check-in / Check-out nhanh chóng</Text>
                </View>
              </View>
              <View className="w-8 h-8 bg-white/10 rounded-full items-center justify-center">
                <Feather name="chevron-right" size={20} color="white" />
              </View>
            </Pressable>
          </Animated.View>
        </View>

        <View className="px-6 -mt-8">
          <View className="flex-row flex-wrap justify-between">
            <StatCard 
              label="Chờ duyệt" 
              value={stats.pending} 
              icon="shield" 
              color="#007AFF" 
              delay={300}
            />
            <StatCard 
              label="Đang mượn" 
              value={stats.in_use} 
              icon="clock" 
              color="#FF9500" 
              delay={400}
            />
            <StatCard 
              label="Quá hạn" 
              value={stats.overdue} 
              icon="alert-triangle" 
              color="#FF3B30" 
              delay={500}
            />
            <StatCard 
              label="Sẵn sàng" 
              value={stats.available} 
              icon="check-circle" 
              color="#34C759" 
              delay={600}
            />
          </View>

          <View className="flex-row justify-between items-center mt-6 mb-4">
            <Text className="font-bold text-xl text-gray-900">Yêu cầu mới nhất</Text>
            <Pressable onPress={() => router.push('/my-loans')}>
              <Text className="text-primary font-bold text-sm">Xem tất cả</Text>
            </Pressable>
          </View>

          {recentTransactions.map((item, index) => (
            <Animated.View 
              key={item.id} 
              entering={FadeInDown.delay(700 + index * 100)}
              className="bg-white p-4 rounded-2xl shadow-sm mb-3 border border-gray-100 flex-row items-center"
            >
              <View className="w-12 h-12 bg-gray-50 rounded-xl items-center justify-center mr-4">
                <View className="w-10 h-10 bg-white rounded-lg items-center justify-center shadow-sm">
                  <Feather name="monitor" size={20} color="#CC0D00" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-900 text-sm" numberOfLines={1}>
                  {item.equipment?.name}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Feather name="user" size={10} color="#999" />
                  <Text className="text-[10px] text-gray-500 ml-1">
                    {item.borrower?.full_name}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Badge status={item.status} />
                <Text className="text-[9px] text-gray-400 mt-1 italic">
                  {new Date(item.created_at).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </Animated.View>
          ))}
          
          {recentTransactions.length === 0 && (
            <View className="items-center py-12 bg-white rounded-[30px] border border-dashed border-gray-200">
              <Feather name="inbox" size={40} color="#eee" />
              <Text className="text-gray-400 font-medium mt-2">Không có giao dịch gần đây</Text>
            </View>
          )}
        </View>
        <View className="h-32" />
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon, color, delay }: any) {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(500)}
      style={{ width: '48%' }} 
      className="bg-white p-4 rounded-2xl shadow-sm mb-4 border border-gray-100"
    >
      <View 
        className="w-10 h-10 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: `${color}15` }}
      >
        <Feather name={icon} size={24} color={color} />
      </View>
      <Text className="font-bold text-gray-500 text-xs">{label}</Text>
      <Text 
        className="text-2xl font-bold mt-1"
        style={{ color: color }}
      >
        {value}
      </Text>
    </Animated.View>
  );
}
