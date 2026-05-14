import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import { Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { StatusBar } from 'expo-status-bar';
import { handleApiError } from '@/utils/error-handler';
import { useAlertStore } from '@/store/useAlertStore';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlertStore();

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      showAlert({
        type: 'warning',
        title: 'Thông báo',
        message: 'Vui lòng nhập email của bạn'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      showAlert({
        type: 'success',
        title: 'Thành công',
        message: 'Mã OTP đã được gửi đến email của bạn'
      });
      // Chuyển sang màn hình reset password kèm email
      router.push({
        pathname: '/reset-password',
        params: { email }
      });
    } catch (error: any) {
      handleApiError(error, 'Yêu cầu OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
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
              <View className="w-20 h-20 bg-primary/10 rounded-3xl items-center justify-center mb-6">
                 <Text className="text-primary text-3xl font-bold">?</Text>
              </View>
              <Text className="text-gray-900 text-3xl font-bold tracking-tight">Quên mật khẩu</Text>
              <Text className="text-gray-500 text-base mt-2 text-center px-4">
                Nhập email của bạn để nhận mã xác nhận đặt lại mật khẩu
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(400).duration(800)}
              className="w-full"
            >
              <Input
                label="Email"
                placeholder="example@mail.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                icon="mail"
              />

              <Button
                title="Gửi mã xác nhận"
                onPress={handleRequestOtp}
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
