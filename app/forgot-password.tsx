import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { StatusBar } from 'expo-status-bar';
import { handleApiError } from '@/utils/error-handler';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let interval: any;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const startTimer = () => {
    setCountdown(60);
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      return Alert.alert('Thông báo', 'Vui lòng nhập Email');
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      Alert.alert('Thành công', 'Mã xác nhận đã được gửi vào Email của bạn.');
      setStep(2);
      startTimer();
    } catch (error: any) {
      handleApiError(error, 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      Alert.alert('Thành công', 'Mã xác nhận mới đã được gửi vào Email của bạn.');
      startTimer();
    } catch (error: any) {
      handleApiError(error, 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword.trim()) {
      return Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ OTP và mật khẩu mới');
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, new_password: newPassword });
      Alert.alert('Thành công', 'Lấy lại mật khẩu thành công. Vui lòng đăng nhập lại.', [
        { text: 'Đăng nhập', onPress: () => router.replace('/login') }
      ]);
    } catch (error: any) {
      handleApiError(error, 'Lỗi');
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-8 pt-16 pb-12">
            <Animated.View 
              entering={FadeInUp.delay(200).duration(800)}
              className="items-center mt-10 mb-10"
            >
              <Text className="text-gray-900 text-3xl font-bold tracking-tight">Quên mật khẩu</Text>
              <Text className="text-gray-500 text-base mt-2 text-center">
                {step === 1 ? 'Nhập email để nhận mã xác nhận' : 'Nhập mã xác nhận để đặt lại mật khẩu'}
              </Text>
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.delay(400).duration(800)}
              className="w-full"
            >
              {step === 1 ? (
                <>
                  <Input
                    label="Email"
                    placeholder="example@student.ptit.edu.vn"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    icon="mail"
                  />

                  <Button 
                    title="Gửi mã xác nhận" 
                    onPress={handleSendOtp} 
                    loading={loading}
                    className="mt-6"
                  />
                </>
              ) : (
                <>
                  <Input
                    label="Mã xác nhận (OTP)"
                    placeholder="Nhập mã 6 số"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    icon="key"
                  />
                  <Input
                    label="Mật khẩu mới"
                    placeholder="••••••••"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    icon="lock"
                  />

                  <Button 
                    title="Đặt lại mật khẩu" 
                    onPress={handleResetPassword} 
                    loading={loading}
                    className="mt-6"
                  />

                  <View className="flex-row justify-center mt-6">
                    <Text className="text-gray-500 text-base">Chưa nhận được mã? </Text>
                    <Pressable 
                      onPress={handleResendOtp}
                      disabled={countdown > 0}
                    >
                      <Text className={`font-bold text-base ${countdown > 0 ? 'text-gray-400' : 'text-primary'}`}>
                        {countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã'}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}

              <View className="flex-row justify-center mt-8">
                <Text className="text-gray-500 text-base">Nhớ mật khẩu? </Text>
                <Pressable onPress={() => router.back()}>
                  <Text className="text-primary font-bold text-base">Quay lại đăng nhập</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
