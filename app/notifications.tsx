import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '@/api/client';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const getStyle = (type: string) => {
  switch (type) {
    case 'return': return { icon: 'check-circle' as const, color: '#15803D', bg: '#DCFCE7' };
    case 'reminder': return { icon: 'clock' as const, color: '#D97706', bg: '#FEF3C7' };
    case 'rejection': return { icon: 'alert-circle' as const, color: '#B91C1C', bg: '#FEE2E2' };
    case 'borrow': return { icon: 'package' as const, color: '#CC0D00', bg: '#FEE5E3' };
    default: return { icon: 'bell' as const, color: '#D97706', bg: '#FEF3C7' };
  }
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return date.toLocaleDateString('vi-VN');
};

const isToday = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const isYesterday = (dateStr: string) => {
  const d = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  const [selected, setSelected] = useState<Notification | null>(null);

  const openDetail = (item: Notification) => {
    setSelected(item);
    if (!item.is_read) markAsRead(item.id);
  };

  const formatFull = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchNotifications(); };

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'important') return n.type === 'rejection' || n.type === 'reminder';
    return true;
  });

  const todayItems = filtered.filter(n => isToday(n.created_at));
  const yesterdayItems = filtered.filter(n => isYesterday(n.created_at));
  const olderItems = filtered.filter(n => !isToday(n.created_at) && !isYesterday(n.created_at));
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filters = [
    { key: 'all' as const, label: 'Tất cả', count: notifications.length },
    { key: 'unread' as const, label: 'Chưa đọc' },
    { key: 'important' as const, label: 'Quan trọng' },
  ];

  const renderItem = (item: Notification, index: number) => {
    const style = getStyle(item.type);
    return (
      <Animated.View key={item.id} entering={FadeInDown.delay(index * 80)}>
        <Pressable
          className="bg-white rounded-2xl flex-row p-3.5"
          style={{ gap: 12, opacity: item.is_read ? 0.7 : 1 }}
          onPress={() => openDetail(item)}
        >
          <View
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: style.bg }}
          >
            <Feather name={style.icon} size={20} color={style.color} />
          </View>
          <View className="flex-1" style={{ gap: 4 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[#0F172A] text-[13px] font-bold flex-1" numberOfLines={1}>{item.title}</Text>
              <Text className="text-[#94A3B8] text-[10px] ml-2">{formatTime(item.created_at)}</Text>
            </View>
            <Text className="text-[#475569] text-xs" numberOfLines={2}>{item.message}</Text>
            {!item.is_read && (
              <View style={{ paddingTop: 4 }}>
                <View className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full" />
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderSection = (label: string, items: Notification[]) => {
    if (items.length === 0) return null;
    return (
      <>
        <View style={{ paddingVertical: 6, paddingHorizontal: 4 }}>
          <Text className="text-[#94A3B8] text-[10px] font-bold">{label}</Text>
        </View>
        {items.map((item, i) => renderItem(item, i))}
      </>
    );
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <StatusBar style="dark" />

      {/* Nav Bar */}
      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: 62, height: 118 }}
      >
        <Pressable
          className="w-10 h-10 bg-white rounded-full items-center justify-center"
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#0F172A" />
        </Pressable>
        <Text className="text-[#0F172A] text-base font-bold">Thông báo</Text>
        <Pressable onPress={markAllRead}>
          <Text className="text-[#CC0D00] text-xs font-medium">Đã đọc</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC0D00" />}
      >
        <View style={{ gap: 12 }}>
          {/* Filter Tabs */}
          <View className="flex-row" style={{ gap: 8 }}>
            {filters.map(f => (
              <Pressable
                key={f.key}
                className={`rounded-full flex-row items-center ${filter === f.key ? 'bg-[#0F172A]' : 'bg-white'}`}
                style={{ gap: 6, paddingVertical: 6, paddingHorizontal: 12 }}
                onPress={() => setFilter(f.key)}
              >
                <Text className={`text-[11px] font-semibold ${filter === f.key ? 'text-white' : 'text-[#475569]'}`}>
                  {f.label}
                </Text>
                {f.count !== undefined && filter === f.key && (
                  <View className="bg-white rounded-full" style={{ paddingVertical: 1, paddingHorizontal: 6 }}>
                    <Text className="text-[#0F172A] text-[10px] font-bold">{f.count}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#CC0D00" style={{ marginTop: 50 }} />
          ) : filtered.length > 0 ? (
            <>
              {renderSection('HÔM NAY', todayItems)}
              {renderSection('HÔM QUA', yesterdayItems)}
              {renderSection('TRƯỚC ĐÓ', olderItems)}
            </>
          ) : (
            <View className="items-center justify-center py-20" style={{ gap: 12 }}>
              <View className="w-16 h-16 bg-white rounded-full items-center justify-center">
                <Feather name="bell-off" size={32} color="#E2E8F0" />
              </View>
              <Text className="text-[#94A3B8] text-sm">Không có thông báo nào</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Chi tiết thông báo */}
      <Modal visible={!!selected} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setSelected(null)}>
        <Pressable className="flex-1 bg-black/40 justify-center" style={{ padding: 24 }} onPress={() => setSelected(null)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-2xl" style={{ padding: 20, gap: 14 }}>
              {/* Nút đóng ở góc trên bên phải */}
              <Pressable
                onPress={() => setSelected(null)}
                className="absolute w-8 h-8 bg-[#F1F5F9] rounded-full items-center justify-center"
                style={{ top: 12, right: 12, zIndex: 10 }}
                hitSlop={8}
              >
                <Feather name="x" size={18} color="#0F172A" />
              </Pressable>
              {selected && (() => { const s = getStyle(selected.type); return (
                <>
                  <View className="flex-row items-center" style={{ gap: 12, paddingRight: 36 }}>
                    <View className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: s.bg }}>
                      <Feather name={s.icon} size={22} color={s.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#0F172A] text-base font-bold">{selected.title}</Text>
                      <Text className="text-[#94A3B8] text-[11px]">{formatFull(selected.created_at)}</Text>
                    </View>
                  </View>
                  <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                    <Text className="text-[#334155] text-sm" style={{ lineHeight: 21 }}>{selected.message}</Text>
                  </ScrollView>
                  <Pressable
                    className="bg-[#0F172A] rounded-xl items-center justify-center"
                    style={{ paddingVertical: 12 }}
                    onPress={() => setSelected(null)}
                  >
                    <Text className="text-white text-sm font-bold">Đóng</Text>
                  </Pressable>
                </>
              ); })()}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
