import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/api/client';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { StatusBar } from 'expo-status-bar';
import { handleApiError } from '@/utils/error-handler';
import { useAlertStore } from '@/store/useAlertStore';

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlertStore();

  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showAlert({
        type: 'warning',
        title: 'Thông báo',
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert({
        type: 'warning',
        title: 'Thông báo',
        message: 'Mật khẩu xác nhận không khớp'
      });
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        otp,
        new_password: newPassword
      });
      
      showAlert({
        type: 'success',
        title: 'Thành công',
        message: 'Mật khẩu của bạn đã được thay đổi. Vui lòng đăng nhập lại.'
      });
      
      router.replace('/login');
    } catch (error: any) {
      handleApiError(error, 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-8 pt-16 pb-12">
            <Pressable 
              onPress={() => router.back()}
              className="mb-8"
            >
              <Text className="text-primary font-medium">← Quay lại</Text>
            </Pressable>

            <Animated.View
              entering={FadeInUp.delay(200).duration(800)}
              className="items-center mb-10"
            >
              <View className="w-20 h-20 bg-green-50 rounded-3xl items-center justify-center mb-6">
                 <Text className="text-green-600 text-3xl font-bold">✓</Text>
              </View>
              <Text className="text-gray-900 text-3xl font-bold tracking-tight">Đặt lại mật khẩu</Text>
              <Text className="text-gray-500 text-base mt-2 text-center px-4">
                Nhập mã OTP đã gửi tới {email} và mật khẩu mới của bạn
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(400).duration(800)}
              className="w-full"
            >
              <Input
                label="Mã xác nhận (OTP)"
                placeholder="123456"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                icon="shield"
              />

              <Input
                label="Mật khẩu mới"
                placeholder="••••••••"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                icon="lock"
              />

              <Input
                label="Xác nhận mật khẩu mới"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                icon="lock"
              />

              <Button
                title="Cập nhật mật khẩu"
                onPress={handleResetPassword}
                loading={loading}
                className="mt-6"
              />
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
