import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Alert, Modal, Dimensions } from 'react-native';
import { IconOutline } from '@ant-design/icons-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import api from '@/api/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

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
    if (!fullName.trim()) return;
    setLoadingProfile(true);
    try {
      await api.patch('/auth/profile', { full_name: fullName });
      Alert.alert('Thành công', 'Thông tin cá nhân đã được cập nhật');
      setShowProfileModal(false);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn thoát khỏi phiên làm việc này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout }
    ]);
  };

  const handleChangePassword = async () => {
    if (passwords.new_password !== passwords.confirm) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không trùng khớp');
      return;
    }
    setLoadingPass(true);
    try {
      await api.patch('/auth/change-password', {
        old_password: passwords.old_password,
        new_password: passwords.new_password
      });
      Alert.alert('Thành công', 'Mật khẩu đã được thay đổi thành công');
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
    <View className="flex-1 bg-surface-muted">
      <StatusBar style="light" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-secondary-dark pt-20 pb-24 px-6 rounded-b-[50px] items-center relative overflow-hidden">
          <LinearGradient
            colors={['#CC0D00', '#8B0000']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.8 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Animated.View entering={FadeInUp.duration(800)} className="items-center">
            <View className="w-28 h-28 bg-white/20 rounded-[40px] items-center justify-center border-2 border-white/30 shadow-2xl">
              <IconOutline name="user" size={56} color="white" />
            </View>
            <Text className="text-3xl font-bold text-white mt-6">{user.full_name}</Text>
            <View className="bg-white/20 px-4 py-1.5 rounded-full mt-2 border border-white/30">
              <Text className="text-white text-xs font-bold uppercase tracking-[2px]">
                {user.role === 'admin' ? 'QUẢN TRỊ VIÊN' : user.role === 'storekeeper' ? 'THỦ KHO' : 'SINH VIÊN'}
              </Text>
            </View>
          </Animated.View>
        </View>

        <View className="px-6 -mt-12">
          <Animated.View entering={FadeInDown.delay(200)} className="bg-white rounded-[40px] shadow-premium p-4">
            <SettingItem 
              icon="book" 
              label="Đơn mượn của tôi" 
              onPress={() => router.push('/my-loans')} 
              color="#CC0D00"
            />
            <SettingItem 
              icon="edit" 
              label="Cập nhật thông tin" 
              onPress={() => setShowProfileModal(true)} 
              color="#007AFF"
            />
            <SettingItem 
              icon="lock" 
              label="Đổi mật khẩu" 
              onPress={() => setShowPasswordModal(true)} 
              color="#FF9500"
            />
            <SettingItem 
              icon="bell" 
              label="Thông báo" 
              onPress={() => {}} 
              color="#5856D6"
            />
            <SettingItem 
              icon="setting" 
              label="Cài đặt hệ thống" 
              onPress={() => {}} 
              color="#8E8E93"
              isLast
            />
          </Animated.View>

          <Text className="text-gray-400 text-[10px] font-bold mt-8 mb-4 ml-6 uppercase tracking-widest">Hỗ trợ & Pháp lý</Text>
          <Animated.View entering={FadeInDown.delay(400)} className="bg-white rounded-[40px] shadow-premium p-4 mb-10">
            <SettingItem 
              icon="question-circle" 
              label="Hướng dẫn sử dụng" 
              onPress={() => {}} 
              color="#34C759"
            />
            <SettingItem 
              icon="info-circle" 
              label="Về ứng dụng v1.0.0" 
              onPress={() => {}} 
              color="#5AC8FA"
              isLast
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600)}>
            <Pressable 
              className="bg-error/10 p-6 rounded-[30px] border border-error/20 items-center mb-10"
              onPress={handleLogout}
            >
              <Text className="text-error font-bold text-lg">ĐĂNG XUẤT</Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Profile Modal */}
      <Modal visible={showProfileModal} transparent animationType="fade">
        <View className="flex-1 justify-center bg-black/60 px-6">
          <Animated.View entering={FadeInDown} className="bg-white p-8 rounded-[40px] shadow-2xl">
            <Text className="text-2xl font-bold text-secondary mb-8">Thông tin cá nhân</Text>
            <Input 
              label="Họ và tên"
              value={fullName}
              onChangeText={setFullName}
              icon="user"
            />
            <View className="mt-8">
              <Button title="LƯU THAY ĐỔI" onPress={handleUpdateProfile} loading={loadingProfile} />
              <Pressable className="mt-4 items-center" onPress={() => setShowProfileModal(false)}>
                <Text className="text-gray-400 font-bold">HỦY</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View className="flex-1 justify-center bg-black/60 px-6">
          <Animated.View entering={FadeInDown} className="bg-white p-8 rounded-[40px] shadow-2xl">
            <Text className="text-2xl font-bold text-secondary mb-8">Đổi mật khẩu</Text>
            <View className="space-y-4">
              <Input 
                label="Mật khẩu hiện tại"
                secureTextEntry
                value={passwords.old_password}
                onChangeText={(v) => setPasswords(p => ({ ...p, old_password: v }))}
                icon="lock"
              />
              <View className="h-4" />
              <Input 
                label="Mật khẩu mới"
                secureTextEntry
                value={passwords.new_password}
                onChangeText={(v) => setPasswords(p => ({ ...p, new_password: v }))}
                icon="key"
              />
              <View className="h-4" />
              <Input 
                label="Xác nhận mật khẩu"
                secureTextEntry
                value={passwords.confirm}
                onChangeText={(v) => setPasswords(p => ({ ...p, confirm: v }))}
                icon="check"
              />
            </View>
            <View className="mt-10">
              <Button title="CẬP NHẬT MẬT KHẨU" onPress={handleChangePassword} loading={loadingPass} />
              <Pressable className="mt-4 items-center" onPress={() => setShowPasswordModal(false)}>
                <Text className="text-gray-400 font-bold">HỦY</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function SettingItem({ icon, label, onPress, color, isLast }: any) {
  return (
    <Pressable 
      className={`flex-row items-center p-5 ${isLast ? '' : 'border-b border-gray-50'}`} 
      onPress={onPress}
    >
      <View 
        className="w-10 h-10 rounded-2xl items-center justify-center mr-4"
        style={{ backgroundColor: `${color}15` }}
      >
        <IconOutline name={icon} size={20} color={color} />
      </View>
      <Text className="flex-1 text-secondary font-medium text-base">{label}</Text>
      <IconOutline name="right" size={16} color="#C7C7CC" />
    </Pressable>
  );
}
