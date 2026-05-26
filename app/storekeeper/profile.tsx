import React, { useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlertStore } from '@/store/useAlertStore';
import { useFocusEffect } from '@react-navigation/native';

export default function StorekeeperProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshMe } = useAuthStore();
  const { showAlert } = useAlertStore();

  useFocusEffect(
    useCallback(() => {
      refreshMe();
    }, [])
  );

  const initials = (user?.full_name?.split(' ').pop() || 'K').charAt(0).toUpperCase();

  const handleLogout = () => {
    showAlert({
      type: 'warning',
      title: 'Đăng xuất',
      message: 'Bạn có chắc muốn đăng xuất?',
      showCancel: true,
      onConfirm: () => logout(),
    });
  };

  const MENU = [
    { icon: 'user' as const, color: '#15803D', bg: '#DCFCE7', label: 'Thông tin cá nhân', onPress: () => router.push('/edit-profile') },
    { icon: 'bell' as const, color: '#D97706', bg: '#FEF3C7', label: 'Thông báo', onPress: () => router.push('/notifications') },
    { icon: 'lock' as const, color: '#1D4ED8', bg: '#DBEAFE', label: 'Đổi mật khẩu', onPress: () => router.push('/edit-profile') },
    { icon: 'help-circle' as const, color: '#DB2777', bg: '#FCE7F3', label: 'Trợ giúp & Hỗ trợ', onPress: () => showAlert({ type: 'info', title: 'Trợ giúp & Hỗ trợ', message: 'Tính năng đang được phát triển.', showCancel: false }) },
  ];

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 140, paddingHorizontal: 20 }}
      >
        <View style={{ gap: 14 }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-[#0F172A] text-2xl font-bold">Hồ sơ</Text>
            <Pressable className="w-10 h-10 bg-white rounded-full items-center justify-center" onPress={() => router.push('/edit-profile')}>
              <Feather name="settings" size={18} color="#0F172A" />
            </Pressable>
          </View>

          <Animated.View
            entering={FadeInDown.delay(80)}
            className="bg-[#0F172A] rounded-[20px] items-center"
            style={{ padding: 20, gap: 12 }}
          >
            <View className="w-[76px] h-[76px] bg-[#15803D] rounded-full items-center justify-center overflow-hidden">
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <Text className="text-white text-[32px] font-bold">{initials}</Text>
              )}
            </View>
            <Text className="text-white text-lg font-bold">{user?.full_name || 'Thủ kho'}</Text>
            <View className="bg-[#DCFCE7] rounded-full" style={{ paddingVertical: 3, paddingHorizontal: 10 }}>
              <Text className="text-[#15803D] text-[11px] font-bold">THỦ KHO</Text>
            </View>
            <Text className="text-[#94A3B8] text-[11px]">{user?.email}</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(120)}
            className="bg-white rounded-[18px]"
            style={{ padding: 6 }}
          >
            {MENU.map((m, i) => (
              <Pressable
                key={i}
                className="flex-row items-center rounded-xl p-3"
                style={{ gap: 12 }}
                onPress={m.onPress}
              >
                <View
                  className="w-9 h-9 rounded-[10px] items-center justify-center"
                  style={{ backgroundColor: m.bg }}
                >
                  <Feather name={m.icon} size={18} color={m.color} />
                </View>
                <Text className="flex-1 text-[#0F172A] text-sm font-medium">{m.label}</Text>
                <Feather name="chevron-right" size={18} color="#94A3B8" />
              </Pressable>
            ))}
          </Animated.View>

          <Pressable
            className="bg-[#FEF2F2] rounded-[14px] flex-row items-center justify-center"
            style={{ gap: 10, padding: 14 }}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={18} color="#B91C1C" />
            <Text className="text-[#B91C1C] text-sm font-semibold">Đăng xuất</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
