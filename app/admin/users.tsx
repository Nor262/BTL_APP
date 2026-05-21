import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '@/api/client';
import { useAlertStore } from '@/store/useAlertStore';

const ROLES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'admin', label: 'Admin' },
  { key: 'storekeeper', label: 'Thủ kho' },
  { key: 'borrower', label: 'Người mượn' },
];

const ROLE_INFO: Record<string, { bg: string; color: string; label: string }> = {
  admin: { bg: '#FEE5E3', color: '#CC0D00', label: 'Admin' },
  storekeeper: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Thủ kho' },
  borrower: { bg: '#F1F5F9', color: '#64748B', label: 'Người mượn' },
};

export default function AdminUsers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlertStore();
  const [tab, setTab] = useState('all');
  const [users, setUsers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data?.data || res.data || []);
    } catch {}
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const filtered = users.filter((u: any) => tab === 'all' || u.role === tab);

  const toggleActive = async (u: any) => {
    try {
      await api.patch(`/users/${u.id}/status`, { is_active: !u.is_active });
      fetchData();
    } catch (e: any) {
      showAlert({ type: 'error', title: 'Lỗi', message: e.response?.data?.message || 'Không thể đổi trạng thái' });
    }
  };

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="dark" />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8 }}>
        <View className="flex-row items-center justify-between" style={{ height: 44 }}>
          <Pressable
            className="w-10 h-10 bg-white rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={18} color="#0F172A" />
          </Pressable>
          <View className="items-center">
            <Text className="text-[#0F172A] text-base font-bold">Quản lý người dùng</Text>
            <Text className="text-[#94A3B8] text-[10px]">{users.length} tài khoản</Text>
          </View>
          <Pressable className="w-10 h-10 bg-white rounded-full items-center justify-center">
            <Feather name="sliders" size={18} color="#0F172A" />
          </Pressable>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 4 }}
          style={{ marginTop: 12, marginHorizontal: -20, paddingHorizontal: 20 }}
        >
          {ROLES.map((r) => {
            const active = tab === r.key;
            const count = r.key === 'all' ? users.length : users.filter((u) => u.role === r.key).length;
            return (
              <Pressable
                key={r.key}
                onPress={() => setTab(r.key)}
                className={`rounded-full flex-row items-center ${active ? 'bg-[#CC0D00]' : 'bg-white'}`}
                style={{ paddingVertical: 5, paddingHorizontal: 12, gap: 6, borderWidth: 1.5, borderColor: active ? '#CC0D00' : '#E2E8F0' }}
              >
                <Text className={`text-[11px] font-bold ${active ? 'text-white' : 'text-[#64748B]'}`}>{r.label}</Text>
                <Text className={`text-[10px] font-bold ${active ? 'text-white' : 'text-[#94A3B8]'}`}>· {count}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#CC0D00" />}
      >
        <View style={{ gap: 10 }}>
          {filtered.map((u: any, idx: number) => {
            const info = ROLE_INFO[u.role] || ROLE_INFO.borrower;
            const initials = (u.full_name || 'U').charAt(0).toUpperCase();
            return (
              <Animated.View key={u.id} entering={FadeInDown.delay(idx * 50)} className="bg-white rounded-[16px]" style={{ padding: 12, gap: 10 }}>
                <View className="flex-row items-center" style={{ gap: 10 }}>
                  <View
                    className="w-11 h-11 rounded-full items-center justify-center"
                    style={{ backgroundColor: u.role === 'admin' ? '#CC0D00' : u.role === 'storekeeper' ? '#1D4ED8' : '#94A3B8' }}
                  >
                    <Text className="text-white text-sm font-bold">{initials}</Text>
                  </View>
                  <View className="flex-1" style={{ gap: 2 }}>
                    <Text className="text-[#0F172A] text-sm font-bold">{u.full_name}</Text>
                    <Text className="text-[#94A3B8] text-[11px]">{u.email}</Text>
                    <View className="flex-row items-center" style={{ gap: 6, marginTop: 2 }}>
                      <View
                        className="rounded-full"
                        style={{ width: 6, height: 6, backgroundColor: u.is_active ? '#15803D' : '#94A3B8' }}
                      />
                      <Text className="text-[#94A3B8] text-[10px]">
                        {u.is_active ? 'Hoạt động' : 'Đã khóa'}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="rounded-full"
                    style={{ paddingVertical: 2, paddingHorizontal: 8, backgroundColor: info.bg }}
                  >
                    <Text className="text-[10px] font-bold" style={{ color: info.color }}>{info.label}</Text>
                  </View>
                </View>
                {/* Actions */}
                <View className="flex-row" style={{ gap: 8 }}>
                  <Pressable className="flex-1 bg-[#FEE5E3] rounded-[10px] items-center" style={{ paddingVertical: 8 }}>
                    <Text className="text-[#CC0D00] text-[11px] font-bold">Đổi vai trò</Text>
                  </Pressable>
                  <Pressable
                    className={`flex-1 rounded-[10px] items-center ${u.is_active ? 'bg-[#FEE2E2]' : 'bg-[#DCFCE7]'}`}
                    style={{ paddingVertical: 8 }}
                    onPress={() => toggleActive(u)}
                  >
                    <Text
                      className="text-[11px] font-bold"
                      style={{ color: u.is_active ? '#B91C1C' : '#15803D' }}
                    >
                      {u.is_active ? 'Khóa TK' : 'Mở khóa'}
                    </Text>
                  </Pressable>
                  <Pressable className="flex-1 bg-[#F1F5F9] rounded-[10px] items-center" style={{ paddingVertical: 8 }}>
                    <Text className="text-[#0F172A] text-[11px] font-bold">Chi tiết</Text>
                  </Pressable>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
