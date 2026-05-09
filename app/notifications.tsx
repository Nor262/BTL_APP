import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
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

export default function NotificationsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getStyle = (type: string) => {
    switch (type) {
      case 'borrow': return { icon: 'package', color: '#007AFF' };
      case 'return': return { icon: 'check-circle', color: '#34C759' };
      default: return { icon: 'info', color: '#FF9500' };
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

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      <View className="bg-white pt-14 pb-4 px-6 border-b border-gray-100 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 mr-4"
        >
          <Feather name="arrow-left" size={20} color="#333" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Thông báo</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC0D00" />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#CC0D00" style={{ marginTop: 50 }} />
        ) : notifications.length > 0 ? (
          notifications.map((item, index) => {
            const style = getStyle(item.type);
            return (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 100)}
              >
                <Pressable 
                  onPress={() => !item.is_read && markAsRead(item.id)}
                  className={`bg-white p-4 rounded-2xl shadow-sm mb-4 border flex-row items-center ${item.is_read ? 'border-gray-100 opacity-80' : 'border-blue-100'}`}
                >
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: `${style.color}15` }}
                  >
                    <Feather name={style.icon as any} size={24} color={style.color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between items-center">
                      <Text className={`font-bold text-gray-900 text-base ${item.is_read ? 'font-medium' : ''}`}>
                        {item.title}
                      </Text>
                      <Text className="text-[10px] text-gray-400">{formatTime(item.created_at)}</Text>
                    </View>
                    <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>
                      {item.message}
                    </Text>
                  </View>
                  {!item.is_read && <View className="w-2 h-2 rounded-full bg-blue-500 ml-2" />}
                </Pressable>
              </Animated.View>
            );
          })
        ) : (
          <View className="items-center justify-center py-20">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Feather name="bell-off" size={40} color="#ccc" />
            </View>
            <Text className="text-gray-400 font-medium text-lg">Không có thông báo nào</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
