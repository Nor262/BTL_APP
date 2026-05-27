import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/client';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { handleApiError } from '@/utils/error-handler';
import { useAlertStore } from '@/store/useAlertStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Google SSO states
  const [googleLoading, setGoogleLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const { showAlert } = useAlertStore();
  const router = useRouter();

  useEffect(() => {
    // Configure Google Sign-In with Web Client ID (needed for ID token verification)
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '612309700754-ib1shrs5nn00cgesh8coto8ba00856iv.apps.googleusercontent.com';
    GoogleSignin.configure({
      webClientId: webClientId,
      offlineAccess: true,
    });
  }, []);

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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {
        console.log('SignOut error ignored:', signOutError);
      }
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      
      if (!idToken) {
        throw new Error('Không lấy được ID Token từ Google. Vui lòng kiểm tra cấu hình.');
      }

      // Send the token to the backend for verification and login
      const response = await api.post('/auth/google', { token: idToken });
      const { user, access_token } = response.data.data;
      
      setAuth(user, access_token);
      showAlert({
        type: 'success',
        title: 'Thành công',
        message: 'Đăng nhập Google thành công!',
        onConfirm: () => {
          router.replace('/(tabs)');
        }
      });
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Google login cancelled by user');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Google login in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showAlert({ type: 'warning', title: 'Thông báo', message: 'Thiết bị không hỗ trợ Google Play Services.' });
      } else {
        console.log('Google Sign-In Native Error details:', error);
        showAlert({ type: 'error', title: 'Lỗi', message: error.message || 'Đăng nhập Google thất bại' });
      }
    } finally {
      setGoogleLoading(false);
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

              <View className="flex-row justify-end mb-4">
                <Pressable onPress={() => router.push('/forgot-password')}>
                  <Text className="text-primary font-medium text-sm">Quên mật khẩu?</Text>
                </Pressable>
              </View>

              <Button 
                title="Đăng nhập" 
                onPress={handleLogin} 
                loading={loading}
                className="mt-2"
              />

              <View className="flex-row items-center my-6">
                <View className="flex-1 h-[1px] bg-gray-200" />
                <Text className="text-gray-400 px-3 text-xs font-bold uppercase">Hoặc</Text>
                <View className="flex-1 h-[1px] bg-gray-200" />
              </View>

              <Pressable
                onPress={handleGoogleLogin}
                className="flex-row items-center justify-center bg-white border border-gray-200 rounded-2xl py-3.5 shadow-sm active:scale-[0.98]"
              >
                <Feather name="chrome" size={20} color="#EA4335" />
                <Text className="text-gray-700 font-bold text-base ml-3">Đăng nhập bằng Google</Text>
              </Pressable>

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
