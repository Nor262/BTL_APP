import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/client';
import LoadingScreen from '../ui/LoadingScreen';

const { width } = Dimensions.get('window');

export default function AdminHome() {
  const [stats, setStats] = useState<any>({
    users: 0,
    equipment: 0,
    categories: 0,
    pending_transactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuthStore();
  const router = useRouter();

  const fetchData = async () => {
    try {
      // In a real app, you might want a dedicated admin dashboard API.
      // Here we fetch some basics or use the analytics endpoint if it supports admin stats.
      const [usersRes, eqRes, catRes, transRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: { data: [] } })),
        api.get('/equipment').catch(() => ({ data: { data: [] } })),
        api.get('/categories').catch(() => ({ data: { data: [] } })),
        api.get('/analytics/dashboard').catch(() => ({ data: { data: { alerts: { pending_requests: 0 } } } }))
      ]);
      
      setStats({
        users: usersRes.data?.data?.length || 0,
        equipment: eqRes.data?.data?.length || 0,
        categories: catRes.data?.data?.length || 0,
        pending_transactions: transRes.data?.data?.alerts?.pending_requests || 0
      });
    } catch (error) {
      console.error('AdminHome fetch error:', error);
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
              <Text className="text-white text-2xl font-bold">Admin Dashboard</Text>
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
                  <Text className="text-white/60 text-xs mt-1">Kiểm tra thông tin thiết bị</Text>
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
              label="Người dùng" 
              value={stats.users} 
              icon="users" 
              color="#007AFF" 
              delay={300}
              onPress={() => router.push('/(admin)/users')}
            />
            <StatCard 
              label="Thiết bị" 
              value={stats.equipment} 
              icon="monitor" 
              color="#FF9500" 
              delay={400}
              onPress={() => router.push('/(admin)/equipment')}
            />
            <StatCard 
              label="Danh mục" 
              value={stats.categories} 
              icon="layers" 
              color="#34C759" 
              delay={500}
              onPress={() => router.push('/(admin)/categories')}
            />
            <StatCard 
              label="Yêu cầu chờ" 
              value={stats.pending_transactions} 
              icon="clock" 
              color="#FF3B30" 
              delay={600}
              onPress={() => router.push({ pathname: '/my-loans', params: { filter: 'pending' } })}
            />
          </View>

          <View className="mt-6 mb-4">
            <Text className="font-bold text-xl text-gray-900">Tính năng quản trị</Text>
          </View>

          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
            <AdminMenuCard 
              icon="users"
              title="Quản lý Người dùng"
              description="Xem, phân quyền và khóa tài khoản"
              onPress={() => router.push('/(admin)/users')}
              delay={700}
              color="#007AFF"
            />
            <AdminMenuCard 
              icon="layers"
              title="Quản lý Danh mục"
              description="Thêm, sửa, xóa danh mục thiết bị"
              onPress={() => router.push('/(admin)/categories')}
              delay={800}
              color="#34C759"
            />
            <AdminMenuCard 
              icon="map-pin"
              title="Quản lý Vị trí lưu trữ"
              description="Quản lý phòng/kho chứa thiết bị"
              onPress={() => router.push('/(admin)/locations')}
              delay={900}
              color="#FF9500"
            />
            <AdminMenuCard
              icon="truck"
              title="Quản lý Nhà cung cấp"
              description="Danh sách đối tác, nhà cung cấp"
              onPress={() => router.push('/(admin)/suppliers')}
              delay={1000}
              color="#AF52DE"
            />
            <AdminMenuCard
              icon="tool"
              title="Bảo trì thiết bị"
              description="Theo dõi và quản lý các lần bảo trì"
              onPress={() => router.push('/admin/maintenance' as any)}
              delay={1100}
              color="#B45309"
            />
            <AdminMenuCard
              icon="bar-chart-2"
              title="Báo cáo & Thống kê"
              description="KPI, biểu đồ, xuất Excel/CSV"
              onPress={() => router.push('/admin/reports' as any)}
              delay={1200}
              color="#15803D"
            />
            <AdminMenuCard
              icon="file-text"
              title="Nhật ký hệ thống"
              description="Audit log mọi thao tác trên hệ thống"
              onPress={() => router.push('/admin/audit-log' as any)}
              delay={1300}
              color="#0F172A"
              isLast={true}
            />
          </View>

        </View>
        <View className="h-32" />
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon, color, delay, onPress }: any) {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(500)}
      style={{ width: '48%' }} 
      className="mb-4"
    >
      <Pressable 
        onPress={onPress}
        className="bg-white p-4 rounded-2xl shadow-sm active:scale-95 transition-all border border-gray-100"
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
      </Pressable>
    </Animated.View>
  );
}

function AdminMenuCard({ icon, title, description, onPress, delay, color, isLast = false }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)}>
      <Pressable 
        onPress={onPress}
        className={`flex-row items-center py-4 ${!isLast ? 'border-b border-gray-50' : ''}`}
      >
        <View 
          className="w-12 h-12 rounded-xl items-center justify-center mr-4"
          style={{ backgroundColor: `${color}15` }}
        >
          <Feather name={icon} size={24} color={color} />
        </View>
        <View className="flex-1">
          <Text className="font-bold text-gray-900 text-base">{title}</Text>
          <Text className="text-gray-500 text-xs mt-1">{description}</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#ccc" />
      </Pressable>
    </Animated.View>
  );
}
