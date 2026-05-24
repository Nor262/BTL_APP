import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/api/client';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/store/useAuthStore';
import LoadingScreen from '../ui/LoadingScreen';
import Badge from '../ui/Badge';
import { useAlertStore } from '@/store/useAlertStore';

const getCategoryStyle = (name: string) => {
  const normalized = (name || '').toLowerCase();
  if (normalized.includes('laptop') || normalized.includes('máy tính')) {
    return { icon: 'monitor' as const, bg: '#FEE5E3' };
  }
  if (normalized.includes('camera') || normalized.includes('ảnh') || normalized.includes('quay')) {
    return { icon: 'camera' as const, bg: '#FEF3C7' };
  }
  if (normalized.includes('mic') || normalized.includes('audio') || normalized.includes('âm thanh') || normalized.includes('microphone') || normalized.includes('loa')) {
    return { icon: 'mic' as const, bg: '#DCFCE7' };
  }
  if (normalized.includes('cable') || normalized.includes('cáp') || normalized.includes('dây')) {
    return { icon: 'link' as const, bg: '#FCE7F3' };
  }
  if (normalized.includes('chiếu') || normalized.includes('projector')) {
    return { icon: 'tv' as const, bg: '#E0F2FE' };
  }
  return { icon: 'box' as const, bg: '#F1F5F9' };
};

export default function BorrowerHome() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fetchData = async () => {
    try {
      const [eqRes, transRes, countRes, catRes] = await Promise.all([
        api.get('/equipment').catch(() => ({ data: { data: [] } })),
        api.get('/transactions/my').catch(() => ({ data: { data: [] } })),
        api.get('/notifications/unread-count').catch(() => ({ data: { data: { count: 0 } } })),
        api.get('/categories').catch(() => ({ data: [] }))
      ]);

      setEquipment(eqRes.data?.data || eqRes.data || []);
      const transactions = transRes.data?.data || transRes.data || [];
      const active = transactions.filter((t: any) => t.status === 'active' || t.status === 'overdue' || t.status === 'approved');
      setActiveLoans(active);
      setUnreadCount(countRes.data?.data?.count || countRes.data?.count || 0);
      setCategories(catRes.data?.data || catRes.data || []);
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Refresh data (especially unread count) when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const firstName = user?.full_name?.split(' ').pop() || 'bạn';
  const avatarChar = firstName.charAt(0).toUpperCase();

  if (loading) return <LoadingScreen />;

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 140, paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC0D00" />}
      >
        <View style={{ gap: 24 }}>
          {/* Greeting Row */}
          <Animated.View entering={FadeInDown.delay(100)} className="flex-row items-center justify-between" style={{ width: '100%' }}>
            <View style={{ gap: 2 }}>
              <Text className="text-[#64748B] text-[13px]">Xin chào, {firstName} 👋</Text>
              <Text className="text-[#0F172A] text-2xl font-bold">Hôm nay mượn gì?</Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <Pressable
                className="w-11 h-11 bg-white rounded-full items-center justify-center"
                onPress={() => router.push('/notifications')}
              >
                <Feather name="bell" size={20} color="#0F172A" />
                {unreadCount > 0 && (
                  <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#CC0D00] rounded-full" />
                )}
              </Pressable>
              <Pressable
                className="w-11 h-11 bg-[#CC0D00] rounded-full items-center justify-center"
                onPress={() => router.push('/(tabs)/explore')}
              >
                <Text className="text-white text-[17px] font-bold">
                  {avatarChar}
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Search Bar */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <View
              className="flex-row items-center bg-white rounded-[14px] h-[52px] px-4"
              style={{ gap: 10, width: '100%' }}
            >
              <Feather name="search" size={16} color="#94A3B8" />
              <TextInput
                className="flex-1 text-sm text-[#0F172A]"
                placeholder="Tìm thiết bị, mã QR..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(300)} className="flex-row justify-between" style={{ width: '100%', gap: 12 }}>
            <Pressable
              className="bg-[#CC0D00] rounded-[18px] justify-between"
              style={{ flex: 1, height: 96, padding: 14, paddingHorizontal: 12 }}
              onPress={() => router.push('/(tabs)/scan')}
            >
              <Feather name="maximize" size={26} color="#FFFFFF" />
              <Text className="text-white text-[13px] font-semibold">Quét QR</Text>
            </Pressable>
            <Pressable
              className="bg-white rounded-[18px] justify-between"
              style={{ flex: 1, height: 96, padding: 14, paddingHorizontal: 12 }}
              onPress={() => router.push('/equipment')}
            >
              <Feather name="plus-circle" size={26} color="#0F172A" />
              <Text className="text-[#0F172A] text-[13px] font-semibold">Mượn mới</Text>
            </Pressable>
            <Pressable
              className="bg-white rounded-[18px] justify-between"
              style={{ flex: 1, height: 96, padding: 14, paddingHorizontal: 12 }}
              onPress={() => router.push('/my-loans')}
            >
              <Feather name="clipboard" size={26} color="#0F172A" />
              <Text className="text-[#0F172A] text-[13px] font-semibold">Lịch sử</Text>
            </Pressable>
          </Animated.View>

          {/* Active Loans */}
          <Animated.View entering={FadeInDown.delay(400)} style={{ gap: 12, width: '100%' }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[#0F172A] text-[17px] font-bold">Đang mượn</Text>
              {activeLoans.length > 0 && (
                <Pressable onPress={() => router.push('/my-loans')}>
                  <Text className="text-[#CC0D00] text-xs font-medium">Xem tất cả →</Text>
                </Pressable>
              )}
            </View>

            {activeLoans.length > 0 ? (
              activeLoans.slice(0, 2).map((loan: any) => (
                <Pressable
                  key={loan.id}
                  className="bg-white rounded-[18px] p-4"
                  style={{ gap: 14 }}
                  onPress={() => router.push(`/equipment/${loan.equipment_id}`)}
                >
                  {/* Card Top */}
                  <View className="flex-row items-center" style={{ gap: 12 }}>
                    <View className="w-14 h-14 bg-[#FEE5E3] rounded-xl items-center justify-center overflow-hidden">
                      {loan.equipment?.image_url ? (
                        <Image source={{ uri: loan.equipment.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      ) : (
                        <Feather name="box" size={24} color="#CC0D00" />
                      )}
                    </View>
                    <View className="flex-1" style={{ gap: 4 }}>
                      <Text className="text-[#0F172A] text-sm font-bold" numberOfLines={1}>
                        {loan.equipment?.name || 'Thiết bị'}
                      </Text>
                      <View className="flex-row items-center" style={{ gap: 6 }}>
                        <Text className="text-[#64748B] text-xs">
                          SN: {loan.equipment?.serial_number || '---'}
                        </Text>
                        <View className="w-1 h-1 rounded-full bg-[#94A3B8]" />
                        <Text className="text-[#64748B] text-xs font-medium">
                          {loan.status === 'overdue' ? 'Quá hạn trả' : 
                           loan.status === 'approved' ? 'Chờ nhận' : 'Đang sử dụng'}
                        </Text>
                      </View>
                    </View>
                    <Badge status={loan.status} />
                  </View>
                  {/* Divider */}
                  <View className="h-px bg-[#F1F5F9]" />
                  {/* Card Footer */}
                  <View className="flex-row items-center justify-between">
                    <View style={{ gap: 2 }}>
                      <Text className="text-[#94A3B8] text-[10px]">Hạn trả</Text>
                      <Text className="text-[#0F172A] text-xs font-semibold">
                        {loan.due_date ? (() => {
                          const d = new Date(loan.due_date);
                          const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
                          return `${d.toLocaleDateString('vi-VN')} · còn ${days} ngày`;
                        })() : '---'}
                      </Text>
                    </View>
                    <Pressable
                      className="bg-[#0F172A] rounded-[10px] flex-row items-center active:scale-95"
                      style={{ gap: 6, paddingVertical: 8, paddingHorizontal: 14 }}
                      onPress={() => {
                        showAlert({
                          type: 'info',
                          title: 'Trả thiết bị',
                          message: 'Vui lòng mang thiết bị đến phòng quản lý để thủ kho xác nhận trả. Hoặc quét mã QR thiết bị tại quầy.',
                          showCancel: false,
                          onConfirm: () => router.push({ pathname: '/(tabs)/scan', params: { mode: 'checkin' } }),
                        });
                      }}
                    >
                      <Feather name="rotate-ccw" size={12} color="#FFFFFF" />
                      <Text className="text-white text-xs font-semibold">Trả thiết bị</Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))
            ) : (
              <View className="bg-white rounded-[18px] p-6 items-center" style={{ gap: 8 }}>
                <Feather name="inbox" size={32} color="#E2E8F0" />
                <Text className="text-[#94A3B8] text-sm">Bạn hiện không mượn thiết bị nào</Text>
              </View>
            )}
          </Animated.View>

          {/* Categories */}
          <Animated.View entering={FadeInDown.delay(500)} style={{ gap: 12, width: '100%' }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[#0F172A] text-[17px] font-bold">Danh mục</Text>
              <Pressable onPress={() => router.push('/equipment')}>
                <Text className="text-[#CC0D00] text-xs font-medium">Tất cả →</Text>
              </Pressable>
            </View>
            <View className="flex-row justify-between" style={{ gap: 10 }}>
              {categories.slice(0, 4).map((cat) => {
                const style = getCategoryStyle(cat.name);
                return (
                  <Pressable
                    key={cat.id}
                    className="bg-white rounded-2xl items-center justify-center active:scale-95"
                    style={{ flex: 1, height: 86, gap: 6, padding: 10 }}
                    onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: cat.name } })}
                  >
                    <View
                      className="w-10 h-10 rounded-[10px] items-center justify-center"
                      style={{ backgroundColor: style.bg }}
                    >
                      <Feather name={style.icon} size={20} color="#0F172A" />
                    </View>
                    <Text
                      className="text-[#0F172A] text-[11px] font-semibold"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
