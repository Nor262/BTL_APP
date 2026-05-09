import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/client';
import { Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin đăng nhập');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Đăng nhập thất bại', error.response?.data?.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-secondary-dark">
      <StatusBar style="light" />
      <LinearGradient
        colors={['#CC0D00', '#1C1C1E']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        opacity={0.3}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-8 pt-24 pb-12 justify-between">
            <Animated.View 
              entering={FadeInUp.delay(200).duration(1000)}
              className="items-center"
            >
              <View className="w-24 h-24 bg-white rounded-3xl items-center justify-center shadow-premium mb-6">
                <Text className="text-primary text-4xl font-bold">PT</Text>
              </View>
              <Text className="text-white text-3xl font-bold tracking-tight">Chào mừng trở lại</Text>
              <Text className="text-gray-400 text-lg mt-2 text-center">
                Hệ thống quản lý mượn trả thiết bị CLB
              </Text>
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.delay(400).duration(1000)}
              className="bg-white/10 p-6 rounded-3xl border border-white/20"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <Input
                label="Email"
                placeholder="example@gmail.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                className="text-white"
              />
              <Input
                label="Mật khẩu"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="text-white"
              />

              <Button 
                title="Đăng nhập" 
                onPress={handleLogin} 
                loading={loading}
                className="mt-6"
              />

              <View className="flex-row justify-center mt-6">
                <Text className="text-gray-400">Chưa có tài khoản? </Text>
                <Pressable onPress={() => router.push('/register')}>
                  <Text className="text-primary-light font-bold">Đăng ký ngay</Text>
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.delay(600).duration(1000)}
              className="items-center"
            >
              <Text className="text-gray-500 text-sm">
                Phiên bản 2.0.0 • © 2026 PTIT
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
