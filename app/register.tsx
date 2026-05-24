import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { StatusBar } from 'expo-status-bar';
import { handleApiError } from '@/utils/error-handler';
import { Feather } from '@expo/vector-icons';
import { useAlertStore } from '@/store/useAlertStore';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    full_name: '',
    phone: '',
  });
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlertStore();

  const handleRegister = async () => {
    const { username, password, confirmPassword, email, full_name, phone } = formData;
    if (!username.trim() || !password.trim() || !email.trim() || !full_name.trim() || !phone.trim()) {
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Vui lòng điền đầy đủ thông tin đăng ký' });
      return;
    }
    if (password !== confirmPassword) {
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    if (!agreeTerms) {
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Vui lòng đồng ý với điều khoản sử dụng' });
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword: _, ...submitData } = formData;
      await api.post('/auth/register', {
        ...submitData,
        email: submitData.email.trim().toLowerCase(),
        username: submitData.username.trim(),
        role: 'borrower',
      });
      showAlert({
        type: 'success',
        title: 'Thành công',
        message: 'Đăng ký tài khoản thành công. Vui lòng đăng nhập.',
        onConfirm: () => router.replace('/login')
      });
    } catch (error: any) {
      handleApiError(error, 'Lỗi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 items-center pt-20 pb-8 px-6" style={{ gap: 14 }}>
            {/* Brand */}
            <Animated.View
              entering={FadeInUp.delay(200).duration(800)}
              className="items-center"
              style={{ gap: 10, paddingTop: 12, paddingBottom: 4 }}
            >
              <View className="w-16 h-16 bg-[#CC0D00] rounded-[18px] items-center justify-center">
                <Feather name="box" size={32} color="#FFFFFF" />
              </View>
              <Text className="text-[#0F172A] text-[22px] font-extrabold">Tạo tài khoản</Text>
              <Text className="text-[#64748B] text-xs">Đăng ký để bắt đầu mượn thiết bị</Text>
            </Animated.View>

            {/* Segment Control */}
            <View
              className="w-[342px] h-[46px] bg-white rounded-[14px] flex-row items-center"
              style={{ borderWidth: 1.5, borderColor: '#E2E8F0', padding: 4 }}
            >
              <Pressable
                className="flex-1 rounded-[10px] h-[38px] items-center justify-center"
                onPress={() => router.push('/login')}
              >
                <Text className="text-[#94A3B8] text-[13px] font-semibold">Đăng nhập</Text>
              </Pressable>
              <View className="flex-1 bg-[#CC0D00] rounded-[10px] h-[38px] items-center justify-center">
                <Text className="text-white text-[13px] font-bold">Đăng ký</Text>
              </View>
            </View>

            {/* Form */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(800)}
              className="w-[342px]"
              style={{ gap: 10 }}
            >
              <Input
                label="Họ và tên"
                placeholder="Nguyễn Văn Minh"
                value={formData.full_name}
                onChangeText={(v) => updateForm('full_name', v)}
                icon="user"
                required
              />
              <Input
                label="Email"
                placeholder="minh.nv@student.edu.vn"
                value={formData.email}
                onChangeText={(v) => updateForm('email', v)}
                autoCapitalize="none"
                keyboardType="email-address"
                icon="mail"
                required
              />
              <Input
                label="Tên đăng nhập"
                placeholder="vd: minh.nv"
                value={formData.username}
                onChangeText={(v) => updateForm('username', v)}
                autoCapitalize="none"
                icon="user"
                required
              />
              <Input
                label="Số điện thoại"
                placeholder="0987654321"
                value={formData.phone}
                onChangeText={(v) => updateForm('phone', v)}
                keyboardType="phone-pad"
                icon="phone"
                required
              />

              <Input
                label="Mật khẩu"
                placeholder="••••••••"
                value={formData.password}
                onChangeText={(v) => updateForm('password', v)}
                secureTextEntry
                icon="lock"
                required
              />
              <Input
                label="Xác nhận mật khẩu"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChangeText={(v) => updateForm('confirmPassword', v)}
                secureTextEntry
                icon="lock"
                required
              />
            </Animated.View>

            {/* Agreement */}
            <Pressable
              className="w-[342px] flex-row items-center"
              style={{ gap: 10 }}
              onPress={() => setAgreeTerms(!agreeTerms)}
            >
              <View
                className={`w-5 h-5 rounded-md items-center justify-center ${agreeTerms ? 'bg-[#CC0D00]' : 'bg-white'}`}
                style={{ borderWidth: 1.5, borderColor: agreeTerms ? '#CC0D00' : '#CBD5E1', borderRadius: 6 }}
              >
                {agreeTerms && <Feather name="check" size={14} color="#FFFFFF" />}
              </View>
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <Text className="text-[#0F172A] text-[11px]">Tôi đồng ý với</Text>
                <Text className="text-[#CC0D00] text-[11px] font-bold">Điều khoản & Chính sách</Text>
              </View>
            </Pressable>

            {/* Register Button */}
            <Button
              title="Tạo tài khoản"
              onPress={handleRegister}
              loading={loading}
              icon="arrow-right"
              containerClassName="w-[342px]"
            />

            {/* Footer */}
            <View className="flex-row items-center justify-center" style={{ gap: 6 }}>
              <Text className="text-[#64748B] text-xs">Đã có tài khoản?</Text>
              <Pressable onPress={() => router.back()}>
                <Text className="text-[#CC0D00] text-xs font-bold">Đăng nhập</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
