import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import api from '@/api/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAlertStore } from '@/store/useAlertStore';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

const MENU_ITEMS = [
  { key: 'profile', icon: 'user' as const, iconColor: '#CC0D00', bg: '#FEE5E3', label: 'Thông tin cá nhân' },
  { key: 'loans', icon: 'clock' as const, iconColor: '#2563EB', bg: '#DBEAFE', label: 'Lịch sử mượn trả' },
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
  const [studentId, setStudentId] = useState(user?.student_id || '');
  const [userClass, setUserClass] = useState(user?.class || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, overdue: 0 });

  // Sync state values when modal opens or user updates
  useEffect(() => {
    if (showEditModal && user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setStudentId(user.student_id || '');
      setUserClass(user.class || '');
      setDepartment(user.department || '');
    }
  }, [showEditModal, user]);

  const fetchData = () => {
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
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleLogout = () => {
    showAlert({
      type: 'warning',
      title: 'Đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?',
      showCancel: true,
      onConfirm: () => logout()
    });
  };

  const updateProfile = async () => {
    if (!fullName.trim()) {
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Họ và tên không được để trống' });
      return;
    }
    setLoading(true);
    try {
      const res = await api.patch('/auth/profile', { 
        full_name: fullName.trim(), 
        phone: phone.trim(),
        student_id: studentId.trim() || null,
        class: userClass.trim() || null,
        department: department.trim() || null
      });
      setAuth(res.data.data || res.data, useAuthStore.getState().token!);
      showAlert({ type: 'success', title: 'Thành công', message: 'Cập nhật thông tin thành công' });
      setShowEditModal(false);
    } catch (error: any) {
      showAlert({ type: 'error', title: 'Lỗi', message: error.response?.data?.message || 'Không thể cập nhật thông tin' });
    } finally { setLoading(false); }
  };

  const selectAndUploadAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert({
        type: 'warning',
        title: 'Quyền truy cập',
        message: 'Ứng dụng cần quyền truy cập thư viện ảnh để thay đổi avatar.'
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    setUploading(true);
    try {
      const selectedImage = result.assets[0];
      const localUri = selectedImage.uri;
      const filename = localUri.split('/').pop() || 'avatar.jpg';
      
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('file', {
        uri: localUri,
        name: filename,
        type,
      } as any);

      const res = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedUser = res.data.user || res.data.data?.user;
      if (updatedUser) {
        setAuth(updatedUser, useAuthStore.getState().token!);
      } else if (res.data.avatar_url) {
        const newUser = { ...user, avatar_url: res.data.avatar_url } as any;
        setAuth(newUser, useAuthStore.getState().token!);
      }

      showAlert({
        type: 'success',
        title: 'Thành công',
        message: 'Cập nhật ảnh đại diện thành công'
      });
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: error.response?.data?.message || 'Không thể tải lên ảnh đại diện'
      });
    } finally {
      setUploading(false);
    }
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
      case 'loans': router.push('/my-loans'); break;
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
            <Pressable className="w-10 h-10 bg-white rounded-full items-center justify-center active:bg-[#F1F5F9]">
              <Feather name="settings" size={20} color="#0F172A" />
            </Pressable>
          </View>

          {/* Profile Card */}
          <Animated.View
            entering={FadeInDown.delay(100)}
            className="bg-[#0F172A] rounded-[20px] items-center"
            style={{ width: '100%', padding: 20, gap: 14 }}
          >
            <Pressable 
              onPress={selectAndUploadAvatar} 
              className="w-[76px] h-[76px] bg-[#CC0D00] rounded-full items-center justify-center relative overflow-hidden active:scale-95"
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : user?.avatar_url ? (
                <Image 
                  source={{ uri: user.avatar_url }} 
                  className="w-full h-full rounded-full"
                  contentFit="cover"
                />
              ) : (
                <Text className="text-white text-[32px] font-bold">
                  {initials}
                </Text>
              )}
              <View className="absolute bottom-0 right-0 left-0 bg-black/40 py-0.5 items-center">
                <Feather name="camera" size={8} color="#fff" />
              </View>
            </Pressable>

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

          {/* Detailed Info Card */}
          <Animated.View 
            entering={FadeInDown.delay(150)} 
            className="bg-white rounded-[18px] border border-[#F1F5F9] p-4"
            style={{ width: '100%', gap: 12 }}
          >
            <View className="flex-row items-center border-b border-[#F1F5F9] pb-3" style={{ gap: 8 }}>
              <View className="w-7 h-7 bg-[#EFF6FF] rounded-lg items-center justify-center">
                <Feather name="info" size={14} color="#3B82F6" />
              </View>
              <Text className="font-bold text-[#0F172A] text-sm">Thông tin chi tiết</Text>
            </View>
            
            <View style={{ gap: 2 }}>
              {user?.role === 'borrower' && (
                <DetailItem label="Mã sinh viên" value={user?.student_id || 'Chưa cập nhật'} icon="credit-card" />
              )}
              {user?.role === 'borrower' && (
                <DetailItem label="Lớp học" value={user?.class || 'Chưa cập nhật'} icon="layers" />
              )}
              {user?.role === 'borrower' && (
                <DetailItem label="Khoa" value={user?.department || 'Chưa cập nhật'} icon="grid" />
              )}
              <DetailItem label="Số điện thoại" value={user?.phone || 'Chưa cập nhật'} icon="phone" />
              
              <DetailItem 
                label="Ngày tham gia" 
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '...'} 
                icon="calendar" 
              />
            </View>
          </Animated.View>

          {/* Menu */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            className="bg-white rounded-[18px] border border-[#F1F5F9]"
            style={{ width: '100%', padding: 6, gap: 2 }}
          >
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.key}
                className="flex-row items-center rounded-xl p-3 active:bg-[#F8FAFC]"
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
          <Animated.View entering={FadeInDown.delay(250)} style={{ width: '100%' }}>
            <Pressable
              className="bg-[#FEF2F2] rounded-[14px] flex-row items-center justify-center border border-[#FEE2E2] active:scale-95"
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
            <Pressable className="bg-white rounded-[24px] p-6 shadow-2xl max-h-[85%]" onPress={(e) => e.stopPropagation()} style={{ gap: 16 }}>
              <Text className="text-[#0F172A] text-lg font-bold text-center">Cập nhật thông tin</Text>
              
              <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 12 }}>
                <Input label="Họ và tên" value={fullName} onChangeText={setFullName} placeholder="Nhập họ và tên" icon="user" />
                <Input label="Số điện thoại" value={phone} onChangeText={setPhone} placeholder="Nhập số điện thoại" keyboardType="phone-pad" icon="phone" />
                
                {user?.role === 'borrower' && (
                  <>
                    <Input label="Mã số sinh viên" value={studentId} onChangeText={setStudentId} placeholder="Nhập mã sinh viên" icon="credit-card" />
                    <Input label="Lớp học" value={userClass} onChangeText={setUserClass} placeholder="Nhập lớp học" icon="layers" />
                    <Input label="Khoa" value={department} onChangeText={setDepartment} placeholder="Nhập khoa" icon="grid" />
                  </>
                )}
              </ScrollView>
              
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
            <Pressable className="bg-white rounded-[24px] p-6 shadow-2xl" onPress={(e) => e.stopPropagation()} style={{ gap: 16 }}>
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

function DetailItem({ label, value, icon, valueColor = '#0F172A' }: any) {
  return (
    <View className="flex-row items-center justify-between py-2 border-b border-[#F1F5F9]" style={{ borderBottomWidth: 0.5 }}>
      <View className="flex-row items-center flex-1 pr-4" style={{ gap: 8 }}>
        <Feather name={icon} size={12} color="#94A3B8" />
        <Text className="text-[#64748B] text-xs">{label}</Text>
      </View>
      <Text className="font-semibold text-xs text-right flex-1" style={{ color: valueColor }} numberOfLines={1}>{value}</Text>
    </View>
  );
}
