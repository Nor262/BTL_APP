import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { IconOutline } from '@ant-design/icons-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/client';
import Badge from '../ui/Badge';

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
      // Fallback for demo if API fails
      setRecentTransactions([
        { id: 1, equipment: { name: 'MacBook Pro M2' }, borrower: { full_name: 'Nguyễn Văn A' }, status: 'pending' },
        { id: 2, equipment: { name: 'Sony A7IV' }, borrower: { full_name: 'Trần Thị B' }, status: 'approved' },
      ]);
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

  return (
    <View className="flex-1 bg-surface-muted">
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC0D00" />
        }
      >
        <View className="bg-secondary-dark pt-16 pb-16 px-6 rounded-b-[40px] shadow-premium overflow-hidden">
          <LinearGradient
            colors={['#CC0D00', '#8B0000']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.8 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-white/70 text-base">Chào thủ kho,</Text>
              <Text className="text-white text-2xl font-bold">{user?.full_name || 'Admin'}</Text>
            </View>
            <Pressable 
              className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center border border-white/30"
              onPress={() => router.push('/(tabs)/profile')}
            >
              <IconOutline name="setting" size={24} color="white" />
            </Pressable>
          </View>

          <Animated.View entering={FadeInDown.delay(200)}>
            <Pressable 
              className="bg-white rounded-3xl p-6 shadow-premium flex-row items-center justify-between"
              onPress={() => router.push('/scan')}
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center">
                  <IconOutline name="scan" size={32} color="#CC0D00" />
                </View>
                <View className="ml-4">
                  <Text className="text-secondary font-bold text-lg">Quét mã bàn giao</Text>
                  <Text className="text-gray-400 text-sm">Check-in / Check-out nhanh</Text>
                </View>
              </View>
              <IconOutline name="right" size={20} color="#CC0D00" />
            </Pressable>
          </Animated.View>
        </View>

        <View className="px-6 -mt-8">
          <View className="flex-row flex-wrap justify-between">
            <StatCard 
              label="Chờ duyệt" 
              value={stats.pending} 
              icon="file-protect" 
              color="#007AFF" 
              delay={300}
            />
            <StatCard 
              label="Đang mượn" 
              value={stats.in_use} 
              icon="clock-circle" 
              color="#FF9500" 
              delay={400}
            />
            <StatCard 
              label="Quá hạn" 
              value={stats.overdue} 
              icon="warning" 
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

          <View className="flex-row justify-between items-center mt-8 mb-4">
            <Text className="font-bold text-xl text-secondary">Yêu cầu mới nhất</Text>
            <Pressable onPress={() => router.push('/(tabs)/transactions')}>
              <Text className="text-primary font-bold text-sm">Tất cả</Text>
            </Pressable>
          </View>

          {recentTransactions.map((item, index) => (
            <Animated.View 
              key={item.id} 
              entering={FadeInDown.delay(700 + index * 100)}
              className="bg-white p-4 rounded-3xl shadow-sm mb-3 border border-gray-100 flex-row items-center"
            >
              <View className="w-12 h-12 bg-surface-muted rounded-2xl items-center justify-center mr-4">
                <IconOutline name="laptop" size={24} color="#666" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-secondary text-base" numberOfLines={1}>
                  {item.equipment?.name}
                </Text>
                <Text className="text-xs text-gray-400 mt-1">
                  Mượn bởi: {item.borrower?.full_name}
                </Text>
              </View>
              <Badge status={item.status} />
            </Animated.View>
          ))}
          
          {recentTransactions.length === 0 && (
            <View className="items-center py-10">
              <Text className="text-gray-400 italic">Không có giao dịch gần đây</Text>
            </View>
          )}
        </View>
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon, color, delay }: any) {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(500)}
      style={{ width: '48%' }} 
      className="bg-white p-5 rounded-3xl shadow-sm mb-4 border border-gray-50"
    >
      <View 
        className="w-10 h-10 rounded-2xl items-center justify-center mb-3"
        style={{ backgroundColor: `${color}15` }}
      >
        <IconOutline name={icon} size={24} color={color} />
      </View>
      <Text className="font-bold text-gray-400 text-sm uppercase">{label}</Text>
      <Text 
        className="text-3xl font-bold mt-1"
        style={{ color: color }}
      >
        {value}
      </Text>
    </Animated.View>
  );
}
