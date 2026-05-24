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

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlertStore();

  const handleNext = () => {
    const code = otp.trim();
    if (!code) {
      showAlert({ type: 'warning', title: 'Thiếu mã OTP', message: 'Vui lòng nhập mã OTP đã gửi vào email.' });
      return;
    }
    if (!/^\d+$/.test(code)) {
      showAlert({ type: 'warning', title: 'Mã không hợp lệ', message: 'OTP chỉ gồm các chữ số (0-9). Vui lòng nhập lại.' });
      return;
    }
    if (code.length !== 6) {
      showAlert({ type: 'warning', title: 'Sai độ dài', message: `OTP phải đủ 6 số. Hiện tại bạn nhập ${code.length} số.` });
      return;
    }
    router.push({ pathname: '/reset-password', params: { email, otp: code } } as any);
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await api.post('/auth/forgot-password', { email });
      showAlert({ type: 'success', title: 'Đã gửi lại', message: 'Mã OTP mới đã được gửi đến email.' });
    } catch (e) {
      handleApiError(e, 'Lỗi gửi lại mã');
    } finally {
      setResending(false);
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
                <Feather name="key" size={32} color="#FFFFFF" />
              </View>
              <Text className="text-[#0F172A] text-[22px] font-extrabold">Nhập mã xác nhận</Text>
              <Text className="text-[#64748B] text-xs text-center">
                Nhập mã 6 số đã gửi tới{'\n'}
                <Text className="text-[#0F172A] font-bold">{email}</Text>
              </Text>
            </Animated.View>

            <StepIndicator currentStep={2} />

            <Animated.View entering={FadeInDown.delay(400).duration(800)} className="w-[342px]">
              <Input
                label="Mã xác nhận (OTP)"
                placeholder="Nhập mã 6 số"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                icon="key"
                required
                maxLength={6}
              />
            </Animated.View>

            <Button
              title="TIẾP TỤC"
              onPress={handleNext}
              loading={loading}
              icon="arrow-right"
              containerClassName="w-[342px]"
            />

            <View className="flex-row items-center justify-center" style={{ gap: 6 }}>
              <Text className="text-[#64748B] text-xs">Chưa nhận được mã?</Text>
              <Pressable onPress={handleResend} disabled={resending}>
                <Text className="text-[#CC0D00] text-xs font-bold">{resending ? 'Đang gửi...' : 'Gửi lại'}</Text>
              </Pressable>
            </View>

            <Pressable onPress={() => router.back()}>
              <Text className="text-[#94A3B8] text-xs">← Quay lại</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
