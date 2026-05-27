import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OtpInput from '@/components/ui/OtpInput';
import { StatusBar } from 'expo-status-bar';
import { handleApiError } from '@/utils/error-handler';
import { Feather } from '@expo/vector-icons';
import { useAlertStore } from '@/store/useAlertStore';

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: '1', label: 'Email' },
    { num: '2', label: 'Xác nhận' },
    { num: '3', label: 'Mật khẩu' },
  ];

  return (
    <View className="w-[342px] flex-row items-center justify-center">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <View className="flex-1 items-center" style={{ gap: 4 }}>
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${
                i < currentStep ? 'bg-[#CC0D00]' : 'bg-[#E2E8F0]'
              }`}
            >
              <Text
                className={`text-[13px] font-bold ${
                  i < currentStep ? 'text-white' : 'text-[#94A3B8]'
                }`}
              >
                {s.num}
              </Text>
            </View>
            <Text
              className={`text-[10px] ${
                i < currentStep ? 'text-[#CC0D00] font-semibold' : 'text-[#94A3B8]'
              }`}
            >
              {s.label}
            </Text>
          </View>
          {i < steps.length - 1 && (
            <View
              className={`h-0.5 w-[30px] ${i < currentStep - 1 ? 'bg-[#CC0D00]' : 'bg-[#E2E8F0]'}`}
              style={{ marginBottom: 16 }}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const { showAlert } = useAlertStore();

  useEffect(() => {
    let interval: NodeJS.Timeout;
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
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Vui lòng nhập Email' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      showAlert({ type: 'success', title: 'Thành công', message: 'Mã xác nhận đã được gửi vào Email của bạn.' });
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
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Vui lòng nhập đầy đủ OTP và mật khẩu mới' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, new_password: newPassword });
      showAlert({
        type: 'success',
        title: 'Thành công',
        message: 'Lấy lại mật khẩu thành công. Vui lòng đăng nhập lại.',
        onConfirm: () => router.replace('/login')
      });
    } catch (error: any) {
      handleApiError(error, 'Lỗi');
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
                <Feather name="lock" size={32} color="#FFFFFF" />
              </View>
              <Text className="text-[#0F172A] text-[22px] font-extrabold">Quên mật khẩu</Text>
              <Text className="text-[#64748B] text-xs text-center">
                {step === 1
                  ? 'Nhập email đã đăng ký để nhận mã xác nhận'
                  : 'Nhập mã xác nhận đã gửi đến email'}
              </Text>
            </Animated.View>

            {/* Step Indicator */}
            <StepIndicator currentStep={step} />

            {/* Form */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(800)}
              className="w-[342px]"
              style={{ gap: 10 }}
            >
              {step === 1 ? (
                <Input
                  label="Email"
                  placeholder="minh.nv@student.edu.vn"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  icon="mail"
                />
              ) : (
                <>
                  <Text className="text-gray-700 text-sm font-semibold mb-2">Mã xác nhận (OTP)</Text>
                  <OtpInput
                    length={6}
                    value={otp}
                    onChangeText={setOtp}
                  />
                  <Input
                    label="Mật khẩu mới"
                    placeholder="••••••••"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    icon="lock"
                  />
                  <View className="flex-row justify-center mt-4">
                    <Text className="text-gray-500 text-xs">Chưa nhận được mã? </Text>
                    <Pressable 
                      onPress={handleResendOtp}
                      disabled={countdown > 0}
                    >
                      <Text className={`font-bold text-xs ${countdown > 0 ? 'text-gray-400' : 'text-[#CC0D00]'}`}>
                        {countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã'}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </Animated.View>

            {/* Action Button */}
            <Button
              title={step === 1 ? 'GỬI MÃ XÁC NHẬN' : 'ĐẶT LẠI MẬT KHẨU'}
              onPress={step === 1 ? handleSendOtp : handleResetPassword}
              loading={loading}
              icon={step === 1 ? 'send' : 'check'}
              containerClassName="w-[342px]"
            />

            {/* Footer */}
            <View className="flex-row items-center justify-center" style={{ gap: 6 }}>
              <Text className="text-[#64748B] text-xs">Quay lại</Text>
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
