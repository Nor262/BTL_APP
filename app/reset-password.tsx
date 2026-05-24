import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/api/client';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
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
            <View className={`w-8 h-8 rounded-full items-center justify-center ${i < currentStep ? 'bg-[#CC0D00]' : 'bg-[#E2E8F0]'}`}>
              <Text className={`text-[13px] font-bold ${i < currentStep ? 'text-white' : 'text-[#94A3B8]'}`}>{s.num}</Text>
            </View>
            <Text className={`text-[10px] ${i < currentStep ? 'text-[#CC0D00] font-semibold' : 'text-[#94A3B8]'}`}>{s.label}</Text>
          </View>
          {i < steps.length - 1 && (
            <View className={`h-0.5 w-[30px] ${i < currentStep - 1 ? 'bg-[#CC0D00]' : 'bg-[#E2E8F0]'}`} style={{ marginBottom: 16 }} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

export default function ResetPasswordScreen() {
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlertStore();

  const handleSubmit = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Vui lòng nhập đầy đủ mật khẩu' });
      return;
    }
    if (newPassword.length < 6) {
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Mật khẩu phải tối thiểu 6 ký tự' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: (email || '').trim().toLowerCase(),
        otp: (otp || '').trim(),
        new_password: newPassword,
      });
      showAlert({
        type: 'success',
        title: 'Thành công',
        message: 'Mật khẩu đã được đổi. Vui lòng đăng nhập lại.',
        onConfirm: () => router.replace('/login'),
      });
    } catch (error: any) {
      const status = error?.response?.status;
      const beMsg = error?.response?.data?.message;
      const fullMsg = Array.isArray(beMsg) ? beMsg.join('\n') : (beMsg || error?.message || 'Lỗi không xác định');
      console.log('[reset-password] FAILED', { status, body: error?.response?.data });

      if (status === 400 && /otp/i.test(fullMsg)) {
        showAlert({
          type: 'error',
          title: 'OTP không hợp lệ',
          message: `${fullMsg}\n\nMã OTP có thể sai hoặc đã hết hạn (5 phút). Vui lòng quay lại bước trước để nhập lại hoặc yêu cầu mã mới.`,
          showCancel: true,
          confirmText: 'Quay lại nhập OTP',
          onConfirm: () => router.back(),
        });
      } else if (status === 404) {
        showAlert({ type: 'error', title: 'Email không tồn tại', message: fullMsg });
      } else {
        showAlert({
          type: 'error',
          title: `Đặt lại mật khẩu thất bại${status ? ` (${status})` : ''}`,
          message: fullMsg,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="flex-1 items-center pt-20 pb-8 px-6" style={{ gap: 14 }}>
            <Animated.View entering={FadeInUp.delay(200).duration(800)} className="items-center" style={{ gap: 10, paddingTop: 12 }}>
              <View className="w-16 h-16 bg-[#CC0D00] rounded-[18px] items-center justify-center">
                <Feather name="lock" size={32} color="#FFFFFF" />
              </View>
              <Text className="text-[#0F172A] text-[22px] font-extrabold">Đặt mật khẩu mới</Text>
              <Text className="text-[#64748B] text-xs text-center">Tạo mật khẩu mới cho tài khoản của bạn</Text>
            </Animated.View>

            <StepIndicator currentStep={3} />

            <Animated.View entering={FadeInDown.delay(400).duration(800)} className="w-[342px]" style={{ gap: 10 }}>
              <Input
                label="Mật khẩu mới"
                placeholder="••••••••"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                icon="lock"
                required
              />
              <Input
                label="Xác nhận mật khẩu"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                icon="lock"
                required
              />
            </Animated.View>

            <Button
              title="ĐẶT LẠI MẬT KHẨU"
              onPress={handleSubmit}
              loading={loading}
              icon="check"
              containerClassName="w-[342px]"
            />

            <Pressable onPress={() => router.back()}>
              <Text className="text-[#94A3B8] text-xs">← Quay lại</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
