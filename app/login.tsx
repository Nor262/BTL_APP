import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/client';
import { Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { StatusBar } from 'expo-status-bar';

import { handleApiError } from '@/utils/error-handler';

import { useAlertStore } from '@/store/useAlertStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
            <Animated.View
              entering={FadeInUp.delay(200).duration(800)}
              className="items-center mt-12 mb-12"
            >
              <View className="w-24 h-24 bg-red-50 rounded-3xl items-center justify-center mb-6">
                <Text className="text-primary text-4xl font-bold">PT</Text>
              </View>
              <Text className="text-gray-900 text-3xl font-bold tracking-tight">Đăng nhập</Text>
              <Text className="text-gray-500 text-base mt-2 text-center">
                Hệ thống quản lý thiết bị CLB
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(400).duration(800)}
              className="w-full"
            >
              <Input
                label="Email hoặc Tên đăng nhập"
                placeholder="example@mail.com hoặc username"
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
              />

              <Button
                title="Đăng nhập"
                onPress={handleLogin}
                loading={loading}
                className="mt-6"
              />

              <View className="flex-row justify-center mt-8 pb-8">
                <Text className="text-gray-500 text-base">Chưa có tài khoản? </Text>
                <Pressable onPress={() => router.push('/register')}>
                  <Text className="text-primary font-bold text-base">Đăng ký</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
