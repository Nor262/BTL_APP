import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from '@/tw';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/client';
import { ActivityIndicator, Alert } from 'react-native';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tài khoản và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email: username, password });
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Lỗi đăng nhập', error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center px-8">
      <View className="items-center mb-12">
        <Text className="text-3xl font-bold text-primary">PTIT</Text>
        <Text className="text-gray-500 mt-2">Equipment Management System</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
          <TextInput
            className="border border-gray-300 rounded-ant px-4 py-3 bg-gray-50"
            placeholder="Nhập email đăng nhập"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View className="mt-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Mật khẩu</Text>
          <TextInput
            className="border border-gray-300 rounded-ant px-4 py-3 bg-gray-50"
            placeholder="Nhập mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <Pressable 
          className={`bg-primary mt-8 py-4 rounded-ant items-center ${loading ? 'opacity-70' : ''}`}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">ĐĂNG NHẬP</Text>
          )}
        </Pressable>

        <Pressable className="mt-4 items-center" onPress={() => router.push('/register')}>
          <Text className="text-gray-500">Chưa có tài khoản? <Text className="text-primary font-bold">Đăng ký ngay</Text></Text>
        </Pressable>

      </View>
    </View>
  );
}
