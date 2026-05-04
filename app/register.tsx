import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from '@/tw';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import { ActivityIndicator, Alert } from 'react-native';

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
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { ...formData, role: 'borrower' });
      Alert.alert('Thành công', 'Đăng ký tài khoản thành công. Vui lòng đăng nhập.', [
        { text: 'OK', onPress: () => router.replace('/login') }
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
    <ScrollView className="flex-1 bg-white pt-12 px-8">
      <View className="items-center mb-8">
        <Text className="text-3xl font-bold text-primary">ĐĂNG KÝ</Text>
        <Text className="text-gray-500 mt-2">Tạo tài khoản PTIT Equipment</Text>
      </View>

      <View className="space-y-4 pb-12">
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Mã sinh viên / Username</Text>
          <TextInput
            className="border border-gray-300 rounded-ant px-4 py-3 bg-gray-50"
            placeholder="Nhập mã sinh viên"
            value={formData.username}
            onChangeText={(v: string) => updateForm('username', v)}
            autoCapitalize="none"
          />
        </View>

        <View className="mt-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Họ và tên</Text>
          <TextInput
            className="border border-gray-300 rounded-ant px-4 py-3 bg-gray-50"
            placeholder="Nhập đầy đủ họ và tên"
            value={formData.full_name}
            onChangeText={(v: string) => updateForm('full_name', v)}
          />
        </View>

        <View className="mt-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
          <TextInput
            className="border border-gray-300 rounded-ant px-4 py-3 bg-gray-50"
            placeholder="example@student.ptit.edu.vn"
            value={formData.email}
            onChangeText={(v: string) => updateForm('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View className="mt-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Mật khẩu</Text>
          <TextInput
            className="border border-gray-300 rounded-ant px-4 py-3 bg-gray-50"
            placeholder="Nhập mật khẩu"
            value={formData.password}
            onChangeText={(v: string) => updateForm('password', v)}
            secureTextEntry
          />
        </View>

        <Pressable 
          className={`bg-primary mt-8 py-4 rounded-ant items-center ${loading ? 'opacity-70' : ''}`}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">ĐĂNG KÝ NGAY</Text>
          )}
        </Pressable>

        <Pressable className="mt-4 items-center" onPress={() => router.back()}>
          <Text className="text-gray-500">Đã có tài khoản? <Text className="text-primary font-bold">Đăng nhập</Text></Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
