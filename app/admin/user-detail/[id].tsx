import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '@/api/client';
import { useAlertStore } from '@/store/useAlertStore';

const ROLE_INFO: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  admin: { bg: '#FEE5E3', color: '#CC0D00', label: 'Admin', icon: 'shield' },
  storekeeper: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Thủ kho', icon: 'package' },
  borrower: { bg: '#F1F5F9', color: '#64748B', label: 'Người mượn', icon: 'user' },
};

const ROLE_OPTIONS = ['admin', 'storekeeper', 'borrower'];

export default function UserDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlertStore();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await api.get(`/users/${id}`);
      setUser(res.data?.data || res.data);
    } catch (e: any) {
      showAlert({ type: 'error', title: 'Lỗi', message: 'Không thể tải thông tin người dùng' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [id])
  );

  const toggleActive = async () => {
    if (!user) return;
    try {
      await api.patch(`/users/${user.id}/status`, { is_active: !user.is_active });
      fetchUser();
      showAlert({
        type: 'success',
        title: 'Thành công',
        message: user.is_active ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản',
      });
    } catch (e: any) {
      showAlert({ type: 'error', title: 'Lỗi', message: e.response?.data?.message || 'Không thể đổi trạng thái' });
    }
  };

  const changeRole = async (newRole: string) => {
    if (!user || newRole === user.role) {
      setShowRolePicker(false);
      return;
    }
    try {
      await api.patch(`/users/${user.id}/role`, { role: newRole });
      setShowRolePicker(false);
      fetchUser();
      showAlert({ type: 'success', title: 'Thành công', message: `Đã đổi vai trò thành ${ROLE_INFO[newRole]?.label || newRole}` });
    } catch (e: any) {
      showAlert({ type: 'error', title: 'Lỗi', message: e.response?.data?.message || 'Không thể đổi vai trò' });
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F1F5F9] items-center justify-center">
        <ActivityIndicator size="large" color="#CC0D00" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 bg-[#F1F5F9] items-center justify-center" style={{ paddingHorizontal: 40 }}>
        <Feather name="alert-circle" size={48} color="#94A3B8" />
        <Text className="text-[#94A3B8] text-base mt-4 text-center">Không tìm thấy người dùng</Text>
        <Pressable className="mt-6 bg-[#CC0D00] rounded-full" style={{ paddingVertical: 10, paddingHorizontal: 24 }} onPress={() => router.back()}>
          <Text className="text-white font-bold text-sm">Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const info = ROLE_INFO[user.role] || ROLE_INFO.borrower;
  const initials = (user.full_name || 'U').charAt(0).toUpperCase();
  const avatarBg = user.role === 'admin' ? '#CC0D00' : user.role === 'storekeeper' ? '#1D4ED8' : '#94A3B8';

  const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View className="flex-row items-center" style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
      <View className="w-9 h-9 rounded-[10px] bg-[#F8FAFC] items-center justify-center" style={{ marginRight: 12 }}>
        <Feather name={icon as any} size={16} color="#64748B" />
      </View>
      <View className="flex-1">
        <Text className="text-[#94A3B8] text-[10px] font-medium">{label}</Text>
        <Text className="text-[#0F172A] text-[13px] font-semibold" style={{ marginTop: 1 }}>{value || '—'}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="light" />

      {/* Header */}
      <View style={{ backgroundColor: '#0F172A', paddingTop: insets.top, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <View className="flex-row items-center justify-between" style={{ paddingHorizontal: 20, height: 52 }}>
          <Pressable className="w-10 h-10 rounded-full bg-white/10 items-center justify-center" onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </Pressable>
          <Text className="text-white text-base font-bold">Chi tiết người dùng</Text>
          <View className="w-10" />
        </View>

        {/* Avatar & Name */}
        <View className="items-center" style={{ paddingBottom: 24, paddingTop: 8 }}>
          <View
            className="w-[80px] h-[80px] rounded-full items-center justify-center overflow-hidden"
            style={{ backgroundColor: avatarBg, borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <Text className="text-white text-[32px] font-bold">{initials}</Text>
            )}
          </View>
          <Text className="text-white text-lg font-bold" style={{ marginTop: 10 }}>{user.full_name || user.username}</Text>
          <Text className="text-[#94A3B8] text-[12px]" style={{ marginTop: 2 }}>@{user.username}</Text>
          <View className="flex-row items-center" style={{ marginTop: 8, gap: 8 }}>
            <View className="rounded-full" style={{ paddingVertical: 3, paddingHorizontal: 12, backgroundColor: info.bg }}>
              <Text className="text-[11px] font-bold" style={{ color: info.color }}>{info.label}</Text>
            </View>
            <View className="flex-row items-center rounded-full" style={{ paddingVertical: 3, paddingHorizontal: 10, backgroundColor: user.is_active ? 'rgba(21,128,61,0.15)' : 'rgba(148,163,184,0.15)' }}>
              <View className="rounded-full" style={{ width: 6, height: 6, backgroundColor: user.is_active ? '#15803D' : '#94A3B8', marginRight: 5 }} />
              <Text className="text-[11px] font-bold" style={{ color: user.is_active ? '#15803D' : '#94A3B8' }}>
                {user.is_active ? 'Hoạt động' : 'Đã khóa'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUser(); }} tintColor="#CC0D00" />}
      >
        {/* Personal Info */}
        <Animated.View entering={FadeInDown.delay(80)} className="bg-white rounded-[18px]" style={{ padding: 16, marginBottom: 12 }}>
          <View className="flex-row items-center" style={{ marginBottom: 4, gap: 8 }}>
            <Feather name="user" size={16} color="#CC0D00" />
            <Text className="text-[#0F172A] text-sm font-bold">Thông tin cá nhân</Text>
          </View>
          <InfoRow icon="user" label="Họ và tên" value={user.full_name} />
          <InfoRow icon="at-sign" label="Username" value={user.username} />
          <InfoRow icon="mail" label="Email" value={user.email} />
          <InfoRow icon="phone" label="Số điện thoại" value={user.phone} />
        </Animated.View>

        {/* Academic Info */}
        <Animated.View entering={FadeInDown.delay(140)} className="bg-white rounded-[18px]" style={{ padding: 16, marginBottom: 12 }}>
          <View className="flex-row items-center" style={{ marginBottom: 4, gap: 8 }}>
            <Feather name="book-open" size={16} color="#1D4ED8" />
            <Text className="text-[#0F172A] text-sm font-bold">Thông tin học vấn</Text>
          </View>
          <InfoRow icon="hash" label="Mã sinh viên" value={user.student_id} />
          <InfoRow icon="layers" label="Lớp" value={user.class} />
          <InfoRow icon="briefcase" label="Khoa / Bộ môn" value={user.department} />
        </Animated.View>

        {/* Account Info */}
        <Animated.View entering={FadeInDown.delay(200)} className="bg-white rounded-[18px]" style={{ padding: 16, marginBottom: 12 }}>
          <View className="flex-row items-center" style={{ marginBottom: 4, gap: 8 }}>
            <Feather name="settings" size={16} color="#D97706" />
            <Text className="text-[#0F172A] text-sm font-bold">Tài khoản</Text>
          </View>
          <InfoRow icon="calendar" label="Ngày tạo" value={formatDate(user.created_at)} />
          <InfoRow icon="alert-triangle" label="Điểm phạt" value={String(user.penalty_points ?? 0)} />
          <InfoRow icon="shield" label="Vai trò" value={info.label} />
          <InfoRow icon="toggle-right" label="Trạng thái" value={user.is_active ? 'Hoạt động' : 'Đã khóa'} />
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(260)} style={{ gap: 10 }}>
          <Pressable
            className="bg-[#FEE5E3] rounded-[14px] flex-row items-center justify-center"
            style={{ gap: 10, padding: 14 }}
            onPress={() => setShowRolePicker(!showRolePicker)}
          >
            <Feather name="refresh-cw" size={16} color="#CC0D00" />
            <Text className="text-[#CC0D00] text-sm font-bold">Đổi vai trò</Text>
          </Pressable>

          {showRolePicker && (
            <Animated.View entering={FadeInDown.duration(200)} className="bg-white rounded-[14px]" style={{ padding: 6 }}>
              {ROLE_OPTIONS.map((role) => {
                const ri = ROLE_INFO[role];
                const isActive = user.role === role;
                return (
                  <Pressable
                    key={role}
                    className="flex-row items-center rounded-xl"
                    style={{ padding: 12, gap: 10, backgroundColor: isActive ? ri.bg : 'transparent' }}
                    onPress={() => changeRole(role)}
                  >
                    <Feather name={ri.icon as any} size={16} color={ri.color} />
                    <Text className="flex-1 text-sm font-semibold" style={{ color: ri.color }}>{ri.label}</Text>
                    {isActive && <Feather name="check" size={16} color={ri.color} />}
                  </Pressable>
                );
              })}
            </Animated.View>
          )}

          <Pressable
            className={`rounded-[14px] flex-row items-center justify-center ${user.is_active ? 'bg-[#FEF2F2]' : 'bg-[#DCFCE7]'}`}
            style={{ gap: 10, padding: 14 }}
            onPress={() => {
              showAlert({
                type: 'warning',
                title: user.is_active ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?',
                message: user.is_active
                  ? `Bạn có chắc muốn khóa tài khoản "${user.full_name}"?`
                  : `Bạn có chắc muốn mở khóa tài khoản "${user.full_name}"?`,
                showCancel: true,
                onConfirm: toggleActive,
              });
            }}
          >
            <Feather name={user.is_active ? 'lock' : 'unlock'} size={16} color={user.is_active ? '#B91C1C' : '#15803D'} />
            <Text className="text-sm font-bold" style={{ color: user.is_active ? '#B91C1C' : '#15803D' }}>
              {user.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
