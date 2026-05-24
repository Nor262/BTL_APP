import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
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
  const [googleTokenModal, setGoogleTokenModal] = useState(false);
  const [googleTokenInput, setGoogleTokenInput] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogleLogin = () => {
    setGoogleTokenModal(true);
  };

  const submitGoogleToken = async () => {
    if (!googleTokenInput.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập ID Token Google');
      return;
    }
    setGoogleLoading(true);
    try {
      const response = await api.post('/auth/google', { token: googleTokenInput });
      const { user, access_token } = response.data.data;
      setAuth(user, access_token);
      setGoogleTokenModal(false);
      Alert.alert('Thành công', 'Đăng nhập Google thành công!');
      router.replace('/(tabs)');
    } catch (error: any) {
      handleApiError(error, 'Đăng nhập Google thất bại');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSimulateGoogleSSO = async () => {
    setGoogleLoading(true);
    try {
      // Direct mock/demo login simulation for review to easily access UI
      const response = await api.post('/auth/login', {
        identifier: 'borrower',
        password: 'password123'
      });
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      setGoogleTokenModal(false);
      Alert.alert('Mô phỏng', 'Mô phỏng Đăng nhập Google thành công!');
      router.replace('/(tabs)');
    } catch (error: any) {
      handleApiError(error, 'Mô phỏng thất bại');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

      {/* Google Sign-in dialog / helper modal */}
      <Modal
        visible={googleTokenModal}
        transparent
        animationType="slide"
        onRequestClose={() => setGoogleTokenModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <View className="items-center mb-4">
              <View className="w-12 h-12 bg-red-50 rounded-full items-center justify-center mb-3">
                <Feather name="chrome" size={24} color="#EA4335" />
              </View>
              <Text className="text-gray-900 text-lg font-bold text-center">Xác thực Google SSO</Text>
              <Text className="text-gray-500 text-xs text-center mt-1">
                Nhập Google ID Token để gửi lên máy chủ NestJS hoặc sử dụng chức năng mô phỏng để thử nghiệm nhanh.
              </Text>
            </View>

            <Input
              label="Google ID Token"
              placeholder="Nhập chuỗi token JWT của Google"
              value={googleTokenInput}
              onChangeText={setGoogleTokenInput}
              autoCapitalize="none"
              icon="key"
            />

            <View className="space-y-2 mt-4">
              <Button
                title="Gửi Token lên Server"
                onPress={submitGoogleToken}
                loading={googleLoading}
              />
              
              <Pressable
                onPress={handleSimulateGoogleSSO}
                disabled={googleLoading}
                className="w-full bg-gray-100 py-3.5 rounded-2xl items-center active:bg-gray-200 mt-2"
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#666" />
                ) : (
                  <Text className="text-gray-700 font-bold text-sm">Mô phỏng Đăng nhập (Sandbox)</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => setGoogleTokenModal(false)}
                disabled={googleLoading}
                className="w-full py-3.5 items-center mt-1"
              >
                <Text className="text-gray-400 font-bold text-sm">Quay lại</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
