import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/client';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { StatusBar } from 'expo-status-bar';
import { handleApiError } from '@/utils/error-handler';
import { useAlertStore } from '@/store/useAlertStore';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { setAuth } = useAuthStore();
  const { showAlert } = useAlertStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert({
        type: 'warning',
        title: 'Thông báo',
        message: 'Vui lòng nhập đầy đủ email và mật khẩu'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { identifier: email, password });
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      router.replace('/(tabs)');
    } catch (error: any) {
      handleApiError(error, 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 items-center pt-20 pb-8 px-6" style={{ gap: 18 }}>
            {/* Brand */}
            <Animated.View
              entering={FadeInUp.delay(200).duration(800)}
              className="items-center"
              style={{ gap: 14, paddingTop: 20, paddingBottom: 8 }}
            >
              <View className="w-[72px] h-[72px] bg-[#CC0D00] rounded-[20px] items-center justify-center">
                <Feather name="box" size={36} color="#FFFFFF" />
              </View>
              <Text className="text-[#0F172A] text-2xl font-extrabold" style={{ letterSpacing: 1 }}>
                EquipHub
              </Text>
              <Text className="text-[#64748B] text-[13px] font-medium">
                Quản lý mượn / trả thiết bị
              </Text>
            </Animated.View>

            {/* Segment Control */}
            <View
              className="w-[342px] h-[46px] bg-white rounded-[14px] flex-row items-center"
              style={{ borderWidth: 1.5, borderColor: '#E2E8F0', padding: 4 }}
            >
              <View className="flex-1 bg-[#CC0D00] rounded-[10px] h-[38px] items-center justify-center">
                <Text className="text-white text-[13px] font-bold">Đăng nhập</Text>
              </View>
              <Pressable
                className="flex-1 rounded-[10px] h-[38px] items-center justify-center"
                onPress={() => router.push('/register')}
              >
                <Text className="text-[#94A3B8] text-[13px] font-semibold">Đăng ký</Text>
              </Pressable>
            </View>

            {/* Form */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(800)}
              className="w-[342px]"
              style={{ gap: 12 }}
            >
              <Input
                label="Email / MSSV"
                placeholder="minh.nv@student.edu.vn"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                icon="mail"
              />
              <Input
                label="Mật khẩu"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon="lock"
                rightLabel={
                  <Pressable onPress={() => router.push('/forgot-password')}>
                    <Text className="text-[#CC0D00] text-xs font-bold">Quên mật khẩu?</Text>
                  </Pressable>
                }
              />

              {/* Remember */}
              <Pressable
                className="flex-row items-center"
                style={{ gap: 10 }}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  className={`w-5 h-5 rounded-md items-center justify-center ${rememberMe ? 'bg-[#CC0D00]' : 'bg-white'}`}
                  style={{ borderWidth: 1.5, borderColor: rememberMe ? '#CC0D00' : '#CBD5E1' }}
                >
                  {rememberMe && <Feather name="check" size={12} color="#FFFFFF" />}
                </View>
                <Text className="text-[#64748B] text-xs">Ghi nhớ đăng nhập trên thiết bị này</Text>
              </Pressable>
            </Animated.View>

            {/* Login Button */}
            <Button
              title="Đăng nhập"
              onPress={handleLogin}
              loading={loading}
              icon="arrow-right"
              containerClassName="w-[342px]"
              className="h-[54px]"
            />

            {/* Divider */}
            <View className="w-[342px] flex-row items-center" style={{ gap: 12 }}>
              <View className="flex-1 h-px bg-[#E2E8F0]" />
              <Text className="text-[#94A3B8] text-[11px]">Hoặc tiếp tục với</Text>
              <View className="flex-1 h-px bg-[#E2E8F0]" />
            </View>

            {/* SSO Buttons */}
            <View className="w-[342px] flex-row" style={{ gap: 10 }}>
              <Pressable
                className="flex-1 h-12 bg-white rounded-[14px] flex-row items-center justify-center"
                style={{ gap: 8, borderWidth: 1.5, borderColor: '#E2E8F0' }}
              >
                <Text className="text-lg font-bold text-[#0F172A]">G</Text>
                <Text className="text-[#0F172A] text-[13px] font-semibold">Google</Text>
              </Pressable>
              <Pressable
                className="flex-1 h-12 bg-white rounded-[14px] flex-row items-center justify-center"
                style={{ gap: 8, borderWidth: 1.5, borderColor: '#E2E8F0' }}
              >
                <Feather name="smartphone" size={18} color="#0F172A" />
                <Text className="text-[#0F172A] text-[13px] font-semibold">Apple</Text>
              </Pressable>
            </View>

            {/* Footer */}
            <View className="flex-row items-center justify-center" style={{ gap: 6, paddingTop: 8 }}>
              <Text className="text-[#64748B] text-xs">Chưa có tài khoản?</Text>
              <Pressable onPress={() => router.push('/register')}>
                <Text className="text-[#CC0D00] text-xs font-bold">Đăng ký ngay</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
