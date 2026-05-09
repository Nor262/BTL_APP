import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import { Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { StatusBar } from 'expo-status-bar';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    full_name: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    const { username, password, email, full_name } = formData;
    if (!username || !password || !email || !full_name) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { ...formData, role: 'borrower' });
      Alert.alert('Thành công', 'Đăng ký tài khoản thành công. Vui lòng đăng nhập.', [
        { text: 'Đăng nhập ngay', onPress: () => router.replace('/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi đăng ký', error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-8 pt-16 pb-12">
            <Animated.View 
              entering={FadeInUp.delay(200).duration(800)}
              className="items-center mt-10 mb-10"
            >
              <Text className="text-gray-900 text-3xl font-bold tracking-tight">Tạo tài khoản</Text>
              <Text className="text-gray-500 text-base mt-2 text-center">
                Bắt đầu mượn thiết bị CLB ngay hôm nay
              </Text>
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.delay(400).duration(800)}
              className="w-full"
            >
              <Input
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                value={formData.full_name}
                onChangeText={(v) => updateForm('full_name', v)}
                icon="user"
              />
              <Input
                label="Mã sinh viên"
                placeholder="B21DCCN001"
                value={formData.username}
                onChangeText={(v) => updateForm('username', v)}
                autoCapitalize="none"
                icon="credit-card"
              />
              <Input
                label="Email"
                placeholder="example@student.ptit.edu.vn"
                value={formData.email}
                onChangeText={(v) => updateForm('email', v)}
                autoCapitalize="none"
                keyboardType="email-address"
                icon="mail"
              />
              <Input
                label="Mật khẩu"
                placeholder="••••••••"
                value={formData.password}
                onChangeText={(v) => updateForm('password', v)}
                secureTextEntry
                icon="lock"
              />

              <Button 
                title="Đăng ký" 
                onPress={handleRegister} 
                loading={loading}
                className="mt-6"
              />

              <View className="flex-row justify-center mt-8">
                <Text className="text-gray-500 text-base">Đã có tài khoản? </Text>
                <Pressable onPress={() => router.back()}>
                  <Text className="text-primary font-bold text-base">Đăng nhập</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
