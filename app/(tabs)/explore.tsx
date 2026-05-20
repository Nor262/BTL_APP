import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import api from '@/api/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAlertStore } from '@/store/useAlertStore';

const MENU_ITEMS = [
  { key: 'profile', icon: 'user' as const, iconColor: '#CC0D00', bg: '#FEE5E3', label: 'Thông tin cá nhân' },
  { key: 'notifications', icon: 'bell' as const, iconColor: '#D97706', bg: '#FEF3C7', label: 'Thông báo' },
  { key: 'password', icon: 'lock' as const, iconColor: '#16A34A', bg: '#DCFCE7', label: 'Đổi mật khẩu' },
  { key: 'help', icon: 'help-circle' as const, iconColor: '#DB2777', bg: '#FCE7F3', label: 'Trợ giúp & Hỗ trợ' },
];

export default function ProfileScreen() {
  const { user, logout, setAuth } = useAuthStore();
  const { showAlert } = useAlertStore();
  const router = useRouter();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, overdue: 0 });

  useEffect(() => {
    api.get('/notifications/unread-count').then(res => {
      setUnreadCount(res.data?.data?.count || 0);
    }).catch(() => {});
    api.get('/transactions/my').then(res => {
      const txs = res.data?.data || [];
      setStats({
        total: txs.length,
        active: txs.filter((t: any) => t.status === 'active').length,
        overdue: txs.filter((t: any) => t.status === 'overdue').length,
      });
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    showAlert({
      type: 'warning', title: 'Đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?',
      showCancel: true, onConfirm: () => logout()
    });
  };

  const updateProfile = async () => {
    if (!fullName.trim()) {
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Họ và tên không được để trống' });
      return;
    }
    setLoading(true);
    try {
      const res = await api.patch('/auth/profile', { full_name: fullName.trim(), phone: phone.trim() });
      setAuth(res.data.data || res.data, useAuthStore.getState().token!);
      showAlert({ type: 'success', title: 'Thành công', message: 'Cập nhật thông tin thành công' });
      setShowEditModal(false);
    } catch (error: any) {
      showAlert({ type: 'error', title: 'Lỗi', message: error.response?.data?.message || 'Không thể cập nhật' });
    } finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    const { current, new: newPass, confirm } = passwords;
    if (!current || !newPass || !confirm) {
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }
    if (newPass !== confirm) {
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Mật khẩu mới không khớp' });
      return;
    }
    setLoading(true);
    try {
      await api.patch('/auth/change-password', { old_password: current, new_password: newPass });
      showAlert({ type: 'success', title: 'Thành công', message: 'Đổi mật khẩu thành công' });
      setShowPasswordModal(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      showAlert({ type: 'error', title: 'Lỗi', message: error.response?.data?.message || 'Không thể đổi mật khẩu' });
    } finally { setLoading(false); }
  };

  const handleMenuPress = (key: string) => {
    switch (key) {
      case 'profile': setShowEditModal(true); break;
      case 'notifications': router.push('/notifications'); break;
      case 'password': setShowPasswordModal(true); break;
      case 'help':
        showAlert({ type: 'info', title: 'Hỗ trợ', message: 'Liên hệ quản trị viên CLB tại văn phòng hoặc qua email.' });
        break;
    }
  };

  const initials = (user?.full_name?.split(' ').pop() || 'U').charAt(0).toUpperCase();
  const insets = useSafeAreaInsets();

  return (
    <Animated.View entering={FadeIn} className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 140, paddingHorizontal: 20 }}
      >
        <View className="items-center" style={{ gap: 18 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between" style={{ width: '100%' }}>
            <Text className="text-[#0F172A] text-2xl font-bold">Hồ sơ</Text>
            <Pressable className="w-10 h-10 bg-white rounded-full items-center justify-center">
              <Feather name="settings" size={20} color="#0F172A" />
            </Pressable>
          </View>

          {/* Profile Card */}
          <Animated.View
            entering={FadeInDown.delay(100)}
            className="bg-[#0F172A] rounded-[20px] items-center"
            style={{ width: '100%', padding: 20, gap: 14 }}
          >
            <View className="w-[76px] h-[76px] bg-[#CC0D00] rounded-full items-center justify-center">
              <Text className="text-white text-[32px] font-bold">{initials}</Text>
            </View>
            <Text className="text-white text-lg font-bold">{user?.full_name || 'Người dùng'}</Text>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <View className="bg-[#1E293B] rounded-full" style={{ paddingVertical: 3, paddingHorizontal: 10 }}>
                <Text className="text-[#22D3EE] text-[10px] font-semibold">
                  {user?.role === 'storekeeper' ? 'Thủ kho' : user?.role === 'admin' ? 'Admin' : 'Member'}
                </Text>
              </View>
              <Text className="text-[#94A3B8] text-[11px]">{user?.email || ''}</Text>
            </View>
            {/* Stats */}
            <View
              className="bg-[#1E293B] rounded-[14px] flex-row items-center justify-between"
              style={{ width: '100%', padding: 12 }}
            >
              <View className="items-center" style={{ gap: 2 }}>
                <Text className="text-white text-[17px] font-bold">{stats.total}</Text>
                <Text className="text-[#94A3B8] text-[10px]">Lần mượn</Text>
              </View>
              <View className="bg-[#334155]" style={{ width: 1, height: 28 }} />
              <View className="items-center" style={{ gap: 2 }}>
                <Text className="text-[#22D3EE] text-[17px] font-bold">{stats.active}</Text>
                <Text className="text-[#94A3B8] text-[10px]">Đang mượn</Text>
              </View>
              <View className="bg-[#334155]" style={{ width: 1, height: 28 }} />
              <View className="items-center" style={{ gap: 2 }}>
                <Text className="text-white text-[17px] font-bold">{stats.overdue}</Text>
                <Text className="text-[#94A3B8] text-[10px]">Quá hạn</Text>
              </View>
            </View>
          </Animated.View>

          {/* Menu */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            className="bg-white rounded-[18px]"
            style={{ width: 350, padding: 6, gap: 2 }}
          >
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.key}
                className="flex-row items-center rounded-xl p-3"
                style={{ gap: 12 }}
                onPress={() => handleMenuPress(item.key)}
              >
                <View
                  className="w-9 h-9 rounded-[10px] items-center justify-center"
                  style={{ backgroundColor: item.bg }}
                >
                  <Feather name={item.icon} size={18} color={item.iconColor} />
                </View>
                <Text className="flex-1 text-[#0F172A] text-sm font-medium">{item.label}</Text>
                {item.key === 'notifications' && unreadCount > 0 && (
                  <View className="bg-[#EF4444] rounded-full" style={{ paddingVertical: 1, paddingHorizontal: 7 }}>
                    <Text className="text-white text-[10px] font-bold">{unreadCount}</Text>
                  </View>
                )}
                <Feather name="chevron-right" size={18} color="#94A3B8" />
              </Pressable>
            ))}
          </Animated.View>

          {/* Logout */}
          <Animated.View entering={FadeInDown.delay(300)} style={{ width: '100%' }}>
            <Pressable
              className="bg-[#FEF2F2] rounded-[14px] flex-row items-center justify-center"
              style={{ gap: 10, padding: 14 }}
              onPress={handleLogout}
            >
              <Feather name="log-out" size={18} color="#B91C1C" />
              <Text className="text-[#B91C1C] text-sm font-semibold">Đăng xuất</Text>
            </Pressable>
          </Animated.View>

          {/* Version */}
          <View style={{ paddingTop: 8 }}>
            <Text className="text-[#94A3B8] text-[10px]">EquipHub v1.0.0 · Made with ♥ for sinh viên</Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1">
          <Pressable className="absolute inset-0 bg-black/40" onPress={() => setShowEditModal(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 justify-center px-6"
            pointerEvents="box-none"
          >
            <Pressable className="bg-white rounded-[24px] p-6" onPress={(e) => e.stopPropagation()} style={{ gap: 16 }}>
              <Text className="text-[#0F172A] text-lg font-bold text-center">Cập nhật thông tin</Text>
              <Input label="Họ và tên" value={fullName} onChangeText={setFullName} placeholder="Nhập họ và tên" icon="user" />
              <Input label="Số điện thoại" value={phone} onChangeText={setPhone} placeholder="Nhập số điện thoại" keyboardType="phone-pad" icon="phone" />
              <View className="flex-row" style={{ gap: 10 }}>
                <Button title="Hủy" onPress={() => setShowEditModal(false)} containerClassName="flex-1" variant="secondary" />
                <Button title="Lưu" onPress={updateProfile} loading={loading} containerClassName="flex-1" />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1">
          <Pressable className="absolute inset-0 bg-black/40" onPress={() => setShowPasswordModal(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 justify-center px-6"
            pointerEvents="box-none"
          >
            <Pressable className="bg-white rounded-[24px] p-6" onPress={(e) => e.stopPropagation()} style={{ gap: 16 }}>
              <Text className="text-[#0F172A] text-lg font-bold text-center">Đổi mật khẩu</Text>
              <Input label="Mật khẩu hiện tại" value={passwords.current} onChangeText={(v) => setPasswords(p => ({ ...p, current: v }))} secureTextEntry placeholder="••••••••" icon="lock" />
              <Input label="Mật khẩu mới" value={passwords.new} onChangeText={(v) => setPasswords(p => ({ ...p, new: v }))} secureTextEntry placeholder="••••••••" icon="lock" />
              <Input label="Xác nhận mật khẩu" value={passwords.confirm} onChangeText={(v) => setPasswords(p => ({ ...p, confirm: v }))} secureTextEntry placeholder="••••••••" icon="lock" />
              <View className="flex-row" style={{ gap: 10 }}>
                <Button title="Hủy" onPress={() => { setShowPasswordModal(false); setPasswords({ current: '', new: '', confirm: '' }); }} containerClassName="flex-1" variant="secondary" />
                <Button title="Đổi mật khẩu" onPress={handleChangePassword} loading={loading} containerClassName="flex-1" />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </Animated.View>
  );
}
