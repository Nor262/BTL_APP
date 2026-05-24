import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import api from '@/api/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAlertStore } from '@/store/useAlertStore';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

export default function ProfileScreen() {
  const { user, logout, setAuth } = useAuthStore();
  const { showAlert } = useAlertStore();
  const router = useRouter();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [studentId, setStudentId] = useState(user?.student_id || '');
  const [className, setClassName] = useState(user?.class || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePickAvatar = async () => {
    try {
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        await handleUploadAvatar(selectedImage.uri);
      }
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể mở thư viện ảnh'
      });
    }
  };

  const handleUploadAvatar = async (uri: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      const res = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedUser = res.data.user || res.data.data?.user || res.data.data;
      if (updatedUser) {
        setAuth(updatedUser, useAuthStore.getState().token!);
        showAlert({
          type: 'success',
          title: 'Thành công',
          message: 'Cập nhật ảnh đại diện thành công'
        });
      }
    } catch (error: any) {
      console.error('Upload Avatar Error:', error);
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: error.response?.data?.message || 'Không thể tải ảnh lên hệ thống'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    showAlert({
      type: 'warning',
      title: 'Đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?',
      showCancel: true,
      onConfirm: () => {
        logout();
      }
    });
  };

  const updateProfile = async () => {
    if (!fullName.trim()) {
      showAlert({
        type: 'warning',
        title: 'Thông báo',
        message: 'Họ và tên không được để trống'
      });
      return;
    }
    setLoading(true);
    try {
      const res = await api.patch('/auth/profile', { 
        full_name: fullName.trim(), 
        phone: phone.trim(),
        student_id: studentId.trim(),
        class: className.trim(),
        department: department.trim(),
      });
      setAuth(res.data.data || res.data, useAuthStore.getState().token!);
      showAlert({
        type: 'success',
        title: 'Thành công',
        message: 'Cập nhật thông tin cá nhân thành công'
      });
      setShowEditModal(false);
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: error.response?.data?.message || 'Không thể cập nhật thông tin'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const { current, new: newPass, confirm } = passwords;
    if (!current || !newPass || !confirm) {
      showAlert({
        type: 'warning',
        title: 'Thông báo',
        message: 'Vui lòng điền đầy đủ thông tin mật khẩu'
      });
      return;
    }
    if (newPass !== confirm) {
      showAlert({
        type: 'warning',
        title: 'Thông báo',
        message: 'Mật khẩu mới không khớp'
      });
      return;
    }

    setLoading(true);
    try {
      await api.patch('/auth/change-password', {
        old_password: current,
        new_password: newPass
      });
      showAlert({
        type: 'success',
        title: 'Thành công',
        message: 'Đổi mật khẩu thành công'
      });
      setShowPasswordModal(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: error.response?.data?.message || 'Không thể đổi mật khẩu'
      });
    } finally {
      setLoading(false);
    }
  };

  const showHelp = () => {
    showAlert({
      type: 'info',
      title: 'Hỗ trợ',
      message: 'Vui lòng liên hệ quản trị viên CLB tại văn phòng hoặc qua email để được hỗ trợ kỹ thuật.'
    });
  };

  const showAbout = () => {
    showAlert({
      type: 'info',
      title: 'Về ứng dụng',
      message: 'Hệ thống Quản lý Thiết bị CLB v1.0.0\nPhát triển bởi Team BTL.\n© 2026 PTIT'
    });
  };

  return (
    <Animated.View entering={FadeIn} className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-primary pt-20 pb-8 px-6 items-center rounded-b-[40px] shadow-sm">
          <Pressable 
            onPress={handlePickAvatar}
            disabled={uploading}
            className="relative mb-4"
          >
            <View className="w-24 h-24 bg-white rounded-full items-center justify-center shadow-lg border-4 border-white/20 overflow-hidden">
              {uploading ? (
                <ActivityIndicator size="small" color="#CC0D00" />
              ) : user?.avatar_url ? (
                <Image 
                  source={{ uri: user.avatar_url }} 
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <Text className="text-primary text-4xl font-bold">
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              )}
            </View>
            <View className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full items-center justify-center shadow-md border border-gray-100">
              <Feather name="camera" size={14} color="#666" />
            </View>
          </Pressable>
          <Text className="text-white text-2xl font-bold">{user?.full_name}</Text>
          <Text className="text-white/80 mt-1">{user?.email}</Text>
          {user?.phone && <Text className="text-white/80 mt-1">{user.phone}</Text>}
          <View className="bg-white/20 px-4 py-1.5 rounded-full mt-3">
            <Text className="text-white text-xs font-bold uppercase tracking-wider">
              {user?.role === 'storekeeper' ? 'THỦ KHO' : 'SINH VIÊN'}
            </Text>
          </View>
        </View>

        <View className="px-6 py-6">
          {user?.role === 'borrower' && (
            <>
              <Text className="font-bold text-gray-900 text-lg mb-4">Thông tin cá nhân</Text>
              <Animated.View entering={FadeInDown.delay(100)} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
                <View className="flex-row justify-between mb-3.5 pb-3 border-b border-gray-50">
                  <Text className="text-xs text-gray-500 font-medium">Mã sinh viên</Text>
                  <Text className="text-xs text-gray-900 font-bold">{user?.student_id || 'Chưa cập nhật'}</Text>
                </View>
                <View className="flex-row justify-between mb-3.5 pb-3 border-b border-gray-50">
                  <Text className="text-xs text-gray-500 font-medium">Lớp học</Text>
                  <Text className="text-xs text-gray-900 font-bold">{user?.class || 'Chưa cập nhật'}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-500 font-medium">Khoa / Phòng ban</Text>
                  <Text className="text-xs text-gray-900 font-bold">{user?.department || 'Chưa cập nhật'}</Text>
                </View>
              </Animated.View>
            </>
          )}

          <Text className="font-bold text-gray-900 text-lg mb-4">Cài đặt tài khoản</Text>

          <Animated.View entering={FadeInDown.delay(200)} className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
            <ProfileOption
              icon="user"
              title="Sửa thông tin"
              onPress={() => {
                setFullName(user?.full_name || '');
                setPhone(user?.phone || '');
                setStudentId(user?.student_id || '');
                setClassName(user?.class || '');
                setDepartment(user?.department || '');
                setShowEditModal(true);
              }}
              isFirst
            />
            <ProfileOption
              icon="lock"
              title="Đổi mật khẩu"
              onPress={() => setShowPasswordModal(true)}
            />
            <ProfileOption
              icon="bell"
              title="Thông báo"
              onPress={() => router.push('/notifications')}
            />
            <ProfileOption
              icon="clock"
              title="Lịch sử mượn trả"
              onPress={() => router.push('/my-loans')}
            />
          </Animated.View>

          <Text className="font-bold text-gray-900 text-lg mb-4">Khác</Text>
          <Animated.View entering={FadeInDown.delay(400)} className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
            <ProfileOption
              icon="help-circle"
              title="Hỗ trợ & Trợ giúp"
              onPress={showHelp}
              isFirst
            />
            <ProfileOption
              icon="info"
              title="Về ứng dụng"
              onPress={showAbout}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600)}>
            <Pressable
              className="bg-red-50 flex-row items-center p-4 rounded-2xl border border-red-100"
              onPress={handleLogout}
            >
              <View className="w-10 h-10 bg-white rounded-xl items-center justify-center mr-4">
                <Feather name="log-out" size={20} color="#FF3B30" />
              </View>
              <Text className="flex-1 font-bold text-red-500 text-base">Đăng xuất</Text>
            </Pressable>
          </Animated.View>
        </View>
        <View className="h-24" />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="fade" statusBarTranslucent={true}>
        <View className="flex-1">
          <Pressable 
            className="absolute inset-0 bg-black/40" 
            onPress={() => setShowEditModal(false)} 
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            className="flex-1 justify-center px-6"
            pointerEvents="box-none"
          >
            <Pressable 
              className="bg-white rounded-[30px] p-6 shadow-2xl max-h-[85%]" 
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="text-xl font-bold text-gray-900 mb-6 text-center">Cập nhật thông tin</Text>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
                <Input
                  label="Họ và tên"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nhập họ và tên"
                  icon="user"
                />

                <Input
                  label="Số điện thoại"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Nhập số điện thoại"
                  keyboardType="phone-pad"
                  icon="phone"
                />

                {user?.role === 'borrower' && (
                  <>
                    <Input
                      label="Mã sinh viên"
                      value={studentId}
                      onChangeText={setStudentId}
                      placeholder="Nhập mã sinh viên"
                      autoCapitalize="characters"
                      icon="credit-card"
                    />

                    <Input
                      label="Lớp học"
                      value={className}
                      onChangeText={setClassName}
                      placeholder="Nhập lớp học (ví dụ: D21CQCN01-B)"
                      autoCapitalize="characters"
                      icon="grid"
                    />

                    <Input
                      label="Khoa / Phòng ban"
                      value={department}
                      onChangeText={setDepartment}
                      placeholder="Nhập khoa hoặc phòng ban"
                      icon="briefcase"
                    />
                  </>
                )}
              </ScrollView>

              <View className="flex-row">
                <Button
                  title="Hủy"
                  onPress={() => setShowEditModal(false)}
                  containerClassName="flex-1 mr-2"
                  variant="secondary"
                />
                <Button
                  title="Lưu"
                  onPress={updateProfile}
                  loading={loading}
                  containerClassName="flex-1 ml-2"
                />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1">
          <Pressable 
            className="absolute inset-0 bg-black/40" 
            onPress={() => setShowPasswordModal(false)} 
          />
          <KeyboardAvoidingView
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            className="flex-1 justify-center px-6"
            pointerEvents="box-none"
          >
            <Pressable 
              className="bg-white rounded-[30px] p-6 shadow-2xl" 
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="text-xl font-bold text-gray-900 mb-6 text-center">Đổi mật khẩu</Text>

              <Input
                label="Mật khẩu hiện tại"
                value={passwords.current}
                onChangeText={(v) => setPasswords(prev => ({ ...prev, current: v }))}
                secureTextEntry
                placeholder="••••••••"
                icon="lock"
              />

              <Input
                label="Mật khẩu mới"
                value={passwords.new}
                onChangeText={(v) => setPasswords(prev => ({ ...prev, new: v }))}
                secureTextEntry
                placeholder="••••••••"
                icon="lock"
              />

              <Input
                label="Xác nhận mật khẩu mới"
                value={passwords.confirm}
                onChangeText={(v) => setPasswords(prev => ({ ...prev, confirm: v }))}
                secureTextEntry
                placeholder="••••••••"
                icon="lock"
              />

              <View className="flex-row">
                <Button
                  title="Hủy"
                  onPress={() => {
                    setShowPasswordModal(false);
                    setPasswords({ current: '', new: '', confirm: '' });
                  }}
                  containerClassName="flex-1 mr-2"
                  variant="secondary"
                />
                <Button
                  title="Đổi mật khẩu"
                  onPress={handleChangePassword}
                  loading={loading}
                  containerClassName="flex-1 ml-2"
                />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </Animated.View>
  );
}

function ProfileOption({ icon, title, onPress, isFirst = false }: any) {
  return (
    <Pressable
      className={`flex-row items-center p-4 ${!isFirst ? 'border-t border-gray-100' : ''}`}
      onPress={onPress}
    >
      <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-4">
        <Feather name={icon} size={20} color="#666" />
      </View>
      <Text className="flex-1 font-medium text-gray-900 text-base">{title}</Text>
      <Feather name="chevron-right" size={16} color="#ccc" />
    </Pressable>
  );
}
