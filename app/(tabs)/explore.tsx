import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from '@/tw';
import { IconOutline } from '@ant-design/icons-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import { Alert, Modal } from 'react-native';
import api from '@/api/client';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm: '' });
  const [loadingPass, setLoadingPass] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const router = useRouter();

  const handleUpdateProfile = async () => {
    setLoadingProfile(true);
    try {
      await api.patch('/auth/profile', { full_name: fullName });
      Alert.alert('Thành công', 'Cập nhật thông tin thành công');
      setShowProfileModal(false);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout }
    ]);
  };

  const handleChangePassword = async () => {
    if (passwords.new_password !== passwords.confirm) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }
    setLoadingPass(true);
    try {
      await api.patch('/auth/change-password', {
        old_password: passwords.old_password,
        new_password: passwords.new_password
      });
      Alert.alert('Thành công', 'Đổi mật khẩu thành công');
      setShowPasswordModal(false);
      setPasswords({ old_password: '', new_password: '', confirm: '' });
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setLoadingPass(false);
    }
  };

  if (!user) return null;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white p-8 items-center border-b border-gray-100">
        <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center mb-4">
          <IconOutline name="user" size={48} color="#CC0D00" />
        </View>
        <Text className="text-2xl font-bold text-gray-900">{user.full_name}</Text>
        <Text className="text-gray-500 uppercase text-xs font-bold mt-1 tracking-widest">{user.role}</Text>
      </View>

      <View className="mt-4 px-4">
        <Text className="text-gray-400 text-xs font-bold mb-2 ml-2 uppercase">Cá nhân</Text>
        <View className="bg-white rounded-ant overflow-hidden border border-gray-100">
          <Pressable className="flex-row items-center p-4 border-b border-gray-50" onPress={() => router.push('/my-loans')}>
            <IconOutline name="book" size={20} color="#666" />
            <Text className="flex-1 ml-3 text-gray-700">Đơn mượn của tôi</Text>
            <IconOutline name="right" size={16} color="#ccc" />
          </Pressable>
          <Pressable className="flex-row items-center p-4 border-b border-gray-50" onPress={() => setShowProfileModal(true)}>
            <IconOutline name="edit" size={20} color="#666" />
            <Text className="flex-1 ml-3 text-gray-700">Cập nhật thông tin</Text>
            <IconOutline name="right" size={16} color="#ccc" />
          </Pressable>
          <Pressable className="flex-row items-center p-4 border-b border-gray-50" onPress={() => setShowPasswordModal(true)}>
            <IconOutline name="lock" size={20} color="#666" />
            <Text className="flex-1 ml-3 text-gray-700">Đổi mật khẩu</Text>
            <IconOutline name="right" size={16} color="#ccc" />
          </Pressable>
          <Pressable className="flex-row items-center p-4 border-b border-gray-50">
            <IconOutline name="bell" size={20} color="#666" />
            <Text className="flex-1 ml-3 text-gray-700">Thông báo</Text>
            <IconOutline name="right" size={16} color="#ccc" />
          </Pressable>
          <Pressable className="flex-row items-center p-4">
            <IconOutline name="setting" size={20} color="#666" />
            <Text className="flex-1 ml-3 text-gray-700">Cài đặt</Text>
            <IconOutline name="right" size={16} color="#ccc" />
          </Pressable>
        </View>

        <Text className="text-gray-400 text-xs font-bold mt-6 mb-2 ml-2 uppercase">Hỗ trợ</Text>
        <View className="bg-white rounded-ant overflow-hidden border border-gray-100">
          <Pressable className="flex-row items-center p-4 border-b border-gray-50">
            <IconOutline name="question-circle" size={20} color="#666" />
            <Text className="flex-1 ml-3 text-gray-700">Hướng dẫn sử dụng</Text>
            <IconOutline name="right" size={16} color="#ccc" />
          </Pressable>
          <Pressable className="flex-row items-center p-4">
            <IconOutline name="info-circle" size={20} color="#666" />
            <Text className="flex-1 ml-3 text-gray-700">Về ứng dụng</Text>
            <IconOutline name="right" size={16} color="#ccc" />
          </Pressable>
        </View>

        <Pressable 
          className="mt-8 mb-12 bg-white p-4 rounded-ant border border-red-100 items-center"
          onPress={handleLogout}
        >
          <Text className="text-red-500 font-bold">ĐĂNG XUẤT</Text>
        </Pressable>
      </View>

      {/* Profile Modal */}
      <Modal visible={showProfileModal} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/50 px-6">
          <View className="bg-white p-6 rounded-3xl">
            <Text className="text-xl font-bold mb-4">Cập nhật thông tin</Text>
            <View>
              <Text className="text-xs text-gray-500 mb-1">Họ và tên</Text>
              <TextInput
                className="border border-gray-200 p-3 rounded-ant bg-gray-50"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
            <View className="flex-row justify-end mt-6">
              <Pressable className="px-4 py-2" onPress={() => setShowProfileModal(false)}>
                <Text className="text-gray-500">Hủy</Text>
              </Pressable>
              <Pressable className="bg-primary px-6 py-2 rounded-ant ml-2" onPress={handleUpdateProfile} disabled={loadingProfile}>
                <Text className="text-white font-bold">LƯU THAY ĐỔI</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/50 px-6">
          <View className="bg-white p-6 rounded-3xl">
            <Text className="text-xl font-bold mb-4">Đổi mật khẩu</Text>
            <View className="space-y-4">
              <View>
                <Text className="text-xs text-gray-500 mb-1">Mật khẩu cũ</Text>
                <TextInput
                  className="border border-gray-200 p-3 rounded-ant bg-gray-50"
                  secureTextEntry
                  value={passwords.old_password}
                  onChangeText={(v: string) => setPasswords(p => ({ ...p, old_password: v }))}
                />
              </View>
              <View className="mt-3">
                <Text className="text-xs text-gray-500 mb-1">Mật khẩu mới</Text>
                <TextInput
                  className="border border-gray-200 p-3 rounded-ant bg-gray-50"
                  secureTextEntry
                  value={passwords.new_password}
                  onChangeText={(v: string) => setPasswords(p => ({ ...p, new_password: v }))}
                />
              </View>
              <View className="mt-3">
                <Text className="text-xs text-gray-500 mb-1">Xác nhận mật khẩu mới</Text>
                <TextInput
                  className="border border-gray-200 p-3 rounded-ant bg-gray-50"
                  secureTextEntry
                  value={passwords.confirm}
                  onChangeText={(v: string) => setPasswords(p => ({ ...p, confirm: v }))}
                />
              </View>
            </View>
            <View className="flex-row justify-end mt-6">
              <Pressable className="px-4 py-2" onPress={() => setShowPasswordModal(false)}>
                <Text className="text-gray-500">Hủy</Text>
              </Pressable>
              <Pressable className="bg-primary px-6 py-2 rounded-ant ml-2" onPress={handleChangePassword} disabled={loadingPass}>
                <Text className="text-white font-bold">XÁC NHẬN</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

