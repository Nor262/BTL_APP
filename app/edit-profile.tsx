import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlertStore } from '@/store/useAlertStore';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setAuth, token } = useAuthStore();
  const { showAlert } = useAlertStore();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [studentId, setStudentId] = useState(user?.student_id || '');
  const [className, setClassName] = useState((user as any)?.class || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [avatar, setAvatar] = useState(user?.avatar_url || '');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const initials = (fullName.split(' ').pop() || 'U').charAt(0).toUpperCase();

  const passStrength = (() => {
    if (!newPass) return { label: '', color: '#E2E8F0', pct: 0 };
    let score = 0;
    if (newPass.length >= 6) score++;
    if (newPass.length >= 10) score++;
    if (/[A-Z]/.test(newPass)) score++;
    if (/\d/.test(newPass)) score++;
    if (/[^A-Za-z0-9]/.test(newPass)) score++;
    const map = [
      { label: 'Quá yếu', color: '#EF4444', pct: 20 },
      { label: 'Yếu', color: '#F59E0B', pct: 40 },
      { label: 'Trung bình', color: '#EAB308', pct: 60 },
      { label: 'Khá', color: '#22C55E', pct: 80 },
      { label: 'Mạnh', color: '#15803D', pct: 100 },
    ];
    return map[Math.min(score, 4)];
  })();

  const pickAvatar = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!r.canceled) setAvatar(r.assets[0].uri);
    } catch {}
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Họ và tên không được trống' });
      return;
    }
    if (newPass && !currentPass) {
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Nhập mật khẩu hiện tại để đổi mật khẩu' });
      return;
    }
    setSubmitting(true);
    try {
      // Nếu người dùng chọn ảnh mới (đường dẫn local), upload lên server trước
      let updatedUser: any = null;
      if (avatar && avatar !== user?.avatar_url && !avatar.startsWith('http')) {
        const form = new FormData();
        const name = avatar.split('/').pop() || 'avatar.jpg';
        const ext = name.split('.').pop()?.toLowerCase();
        const type = ext === 'png' ? 'image/png' : 'image/jpeg';
        form.append('file', { uri: avatar, name, type } as any);
        const up = await api.post('/users/avatar', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updatedUser = up.data?.user || null;
      }

      const res = await api.patch('/auth/profile', {
        full_name: fullName.trim(),
        phone: phone.trim(),
        student_id: studentId.trim() || undefined,
        class: className.trim() || undefined,
        department: department.trim() || undefined,
      });
      if (newPass) {
        await api.patch('/auth/change-password', { old_password: currentPass, new_password: newPass });
      }
      const profile = res.data.data || res.data;
      // Giữ lại avatar_url mới upload nếu /auth/profile không trả về
      setAuth({ ...profile, avatar_url: updatedUser?.avatar_url ?? profile.avatar_url }, token!);
      showAlert({
        type: 'success',
        title: 'Thành công',
        message: 'Đã lưu thay đổi',
        onConfirm: () => router.back(),
      });
    } catch (e: any) {
      showAlert({ type: 'error', title: 'Lỗi', message: e.response?.data?.message || 'Không thể lưu' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        {/* Nav */}
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8 }}>
          <View className="flex-row items-center justify-between" style={{ height: 44 }}>
            <Pressable
              className="w-10 h-10 bg-white rounded-full items-center justify-center"
              onPress={() => router.back()}
            >
              <Feather name="arrow-left" size={18} color="#0F172A" />
            </Pressable>
            <Text className="text-[#0F172A] text-base font-bold">Chỉnh sửa hồ sơ</Text>
            <Text className="text-[#94A3B8] text-[10px] font-bold">SYS-03</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}
        >
          <View style={{ gap: 14 }}>
            {/* Avatar */}
            <Animated.View entering={FadeInDown.delay(80)} className="items-center" style={{ gap: 8, paddingVertical: 8 }}>
              <Pressable onPress={pickAvatar} style={{ position: 'relative' }}>
                <View className="w-[92px] h-[92px] bg-[#CC0D00] rounded-full items-center justify-center overflow-hidden">
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <Text className="text-white text-[36px] font-bold">{initials}</Text>
                  )}
                </View>
                <View
                  className="absolute bottom-0 right-0 w-8 h-8 bg-[#0F172A] rounded-full items-center justify-center"
                  style={{ borderWidth: 2, borderColor: '#F1F5F9' }}
                >
                  <Feather name="camera" size={14} color="#FFFFFF" />
                </View>
              </Pressable>
              <Text className="text-[#64748B] text-[11px] font-semibold">Thay đổi ảnh đại diện</Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(120)} className="bg-white rounded-[16px]" style={{ padding: 14, gap: 12 }}>
              <View style={{ gap: 5 }}>
                <Text className="text-[#64748B] text-[11px] font-semibold">Họ và tên</Text>
                <TextInput
                  className="text-[#0F172A] text-sm"
                  style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ gap: 5 }}>
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  <Feather name="lock" size={11} color="#94A3B8" />
                  <Text className="text-[#94A3B8] text-[11px] font-semibold">Email (không sửa)</Text>
                </View>
                <Text className="text-[#94A3B8] text-sm" style={{ paddingVertical: 8 }}>
                  {user?.email || '---'}
                </Text>
              </View>
              <View style={{ gap: 5 }}>
                <Text className="text-[#64748B] text-[11px] font-semibold">Số điện thoại</Text>
                <TextInput
                  className="text-[#0F172A] text-sm"
                  style={{ paddingVertical: 8 }}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ gap: 5 }}>
                <Text className="text-[#64748B] text-[11px] font-semibold">Mã sinh viên</Text>
                <TextInput
                  className="text-[#0F172A] text-sm"
                  style={{ paddingVertical: 8 }}
                  value={studentId}
                  onChangeText={setStudentId}
                  placeholder="vd: B23DCCC043"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                />
              </View>
              <View style={{ gap: 5 }}>
                <Text className="text-[#64748B] text-[11px] font-semibold">Lớp</Text>
                <TextInput
                  className="text-[#0F172A] text-sm"
                  style={{ paddingVertical: 8 }}
                  value={className}
                  onChangeText={setClassName}
                  placeholder="vd: D23CQCN01-B"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ gap: 5 }}>
                <Text className="text-[#64748B] text-[11px] font-semibold">Khoa</Text>
                <TextInput
                  className="text-[#0F172A] text-sm"
                  style={{ paddingVertical: 8 }}
                  value={department}
                  onChangeText={setDepartment}
                  placeholder="vd: Công nghệ thông tin"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </Animated.View>

            {/* Change password card */}
            <Animated.View entering={FadeInDown.delay(160)} className="bg-white rounded-[16px]" style={{ padding: 14, gap: 12 }}>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <View className="w-8 h-8 bg-[#DCFCE7] rounded-lg items-center justify-center">
                  <Feather name="key" size={14} color="#15803D" />
                </View>
                <View>
                  <Text className="text-[#0F172A] text-sm font-bold">Đổi mật khẩu</Text>
                  <Text className="text-[#94A3B8] text-[10px]">Lần đổi cuối: 28/03/2025</Text>
                </View>
              </View>

              <View style={{ gap: 5 }}>
                <Text className="text-[#64748B] text-[11px] font-semibold">Mật khẩu hiện tại</Text>
                <View className="flex-row items-center" style={{ borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 8 }}>
                  <TextInput
                    className="flex-1 text-[#0F172A] text-sm"
                    style={{ paddingVertical: 8 }}
                    value={currentPass}
                    onChangeText={setCurrentPass}
                    secureTextEntry={!showCurrent}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                  />
                  <Pressable onPress={() => setShowCurrent((v) => !v)}>
                    <Feather name={showCurrent ? 'eye' : 'eye-off'} size={14} color="#94A3B8" />
                  </Pressable>
                </View>
              </View>

              <View style={{ gap: 5 }}>
                <Text className="text-[#64748B] text-[11px] font-semibold">Mật khẩu mới</Text>
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <TextInput
                    className="flex-1 text-[#0F172A] text-sm"
                    style={{ paddingVertical: 8 }}
                    value={newPass}
                    onChangeText={setNewPass}
                    secureTextEntry={!showNew}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                  />
                  <Pressable onPress={() => setShowNew((v) => !v)}>
                    <Feather name={showNew ? 'eye' : 'eye-off'} size={14} color="#94A3B8" />
                  </Pressable>
                </View>
                {/* Strength */}
                <View className="flex-row items-center" style={{ gap: 8, marginTop: 4 }}>
                  <View className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <View
                      style={{
                        width: `${passStrength.pct}%`,
                        height: '100%',
                        backgroundColor: passStrength.color,
                      }}
                    />
                  </View>
                  {!!passStrength.label && (
                    <Text className="text-[11px] font-bold" style={{ color: passStrength.color }}>
                      {passStrength.label}
                    </Text>
                  )}
                </View>
              </View>
            </Animated.View>
          </View>
        </ScrollView>

        {/* CTA */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-white flex-row"
          style={{ padding: 16, paddingBottom: 32, gap: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}
        >
          <Pressable
            className="flex-1 bg-[#F1F5F9] rounded-[14px] items-center justify-center"
            style={{ height: 52 }}
            onPress={() => router.back()}
          >
            <Text className="text-[#0F172A] text-sm font-bold">Hủy</Text>
          </Pressable>
          <Pressable
            className="flex-1 bg-[#CC0D00] rounded-[14px] flex-row items-center justify-center"
            style={{ height: 52, gap: 8 }}
            onPress={handleSave}
            disabled={submitting}
          >
            <Text className="text-white text-sm font-bold">
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Text>
            <Feather name="check" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
