import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Dimensions, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/client';
import Badge from '../ui/Badge';
import LoadingScreen from '../ui/LoadingScreen';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function StorekeeperHome() {
  const [stats, setStats] = useState<any>({
    pending: 0,
    in_use: 0,
    overdue: 0,
    available: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [equipmentFilter, setEquipmentFilter] = useState<'all' | 'available' | 'in_use'>('all');
  
  const { user } = useAuthStore();
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [statsRes, transRes, eqRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/transactions'),
        api.get('/equipment').catch(e => { console.error('Eq error:', e.message); return { data: { data: [] } }; })
      ]);
      
      const dashboardData = statsRes.data.data;
      setStats({
        pending: dashboardData.alerts.pending_requests,
        in_use: dashboardData.summary.in_use_count,
        overdue: dashboardData.alerts.overdue_transactions,
        available: dashboardData.summary.available_count
      });
      
      setRecentTransactions(transRes.data.data.slice(0, 5));
      setEquipment(eqRes.data?.data || eqRes.data || []);
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
              onPress={() => router.push({ pathname: '/my-loans', params: { filter: 'pending' } })}
            />
            <StatCard 
              label="Đang mượn" 
              value={stats.in_use} 
              icon="clock" 
              color="#FF9500" 
              delay={400}
              isActive={equipmentFilter === 'in_use'}
              onPress={() => setEquipmentFilter(prev => prev === 'in_use' ? 'all' : 'in_use')}
            />
            <StatCard 
              label="Quá hạn" 
              value={stats.overdue} 
              icon="alert-triangle" 
              color="#FF3B30" 
              delay={500}
              onPress={() => router.push({ pathname: '/my-loans', params: { filter: 'overdue' } })}
            />
            <StatCard 
              label="Sẵn sàng" 
              value={stats.available} 
              icon="check-circle" 
              color="#34C759" 
              delay={600}
              isActive={equipmentFilter === 'available'}
              onPress={() => setEquipmentFilter(prev => prev === 'available' ? 'all' : 'available')}
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

        {/* Thiết bị hiện có (Equipment list for storekeeper) */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mt-6 mb-4">
            <Text className="font-bold text-xl text-gray-900 tracking-tight">
              {equipmentFilter === 'available' ? 'Thiết bị sẵn sàng' : 
               equipmentFilter === 'in_use' ? 'Thiết bị đang mượn' : 'Thiết bị hiện có'}
            </Text>
            {equipmentFilter !== 'all' && (
              <Pressable 
                onPress={() => setEquipmentFilter('all')} 
                className="bg-primary/10 px-3 py-1.5 rounded-full active:scale-95"
              >
                <Text className="text-primary font-bold text-xs">Xóa bộ lọc</Text>
              </Pressable>
            )}
          </View>
          
          <FlatList
            data={equipment.filter((item: any) => {
              if (equipmentFilter === 'all') return true;
              return item.status === equipmentFilter;
            })}
            renderItem={({ item, index }) => (
              <Animated.View 
                entering={FadeInDown.delay(300 + index * 100).duration(500)}
                style={{ width: CARD_WIDTH }}
                className="mb-4"
              >
                <Pressable 
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
                  onPress={() => router.push(`/equipment/${item.id}`)}
                >
                  <View className="w-full h-32 bg-gray-50 items-center justify-center relative">
                    {item.image_url ? (
                      <Image 
                        source={{ uri: item.image_url }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="items-center justify-center">
                         <Feather name="box" size={32} color="#D1D1D6" />
                      </View>
                    )}
                    <View className="absolute top-2 right-2">
                      <Badge status={item.status} />
                    </View>
                  </View>
                  <View className="p-3">
                    <Text className="font-bold text-gray-900 text-sm" numberOfLines={1}>{item.name}</Text>
                    <View className="flex-row items-center mt-1">
                       <Feather name="tag" size={10} color="#999" />
                       <Text className="text-[10px] text-gray-500 ml-1" numberOfLines={1}>{item.category?.name || 'Thiết bị'}</Text>
                    </View>
                    <View className="flex-row items-center justify-between mt-3">
                      <Text className="text-primary font-bold text-[10px] uppercase">Chi tiết</Text>
                      <Feather name="arrow-right" size={12} color="#CC0D00" />
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            )}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            ListEmptyComponent={
              <View className="items-center py-12 bg-white rounded-[30px] border border-dashed border-gray-200">
                <Feather name="box" size={40} color="#eee" />
                <Text className="text-gray-400 font-medium mt-2">Chưa có thiết bị nào</Text>
              </View>
            }
          />
        </View>

        <View className="h-32" />
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon, color, delay, isActive, onPress }: any) {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(500)}
      style={{ width: '48%' }} 
      className="mb-4"
    >
      <Pressable 
        onPress={onPress}
        className="bg-white p-4 rounded-2xl shadow-sm active:scale-95 transition-all border"
        style={isActive ? { borderColor: color, borderWidth: 1.5, shadowColor: color, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 } : { borderColor: '#F2F2F7' }}
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
