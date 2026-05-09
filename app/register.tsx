import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import { Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-8 pt-20 pb-12 justify-between">
            <Animated.View 
              entering={FadeInUp.delay(200).duration(800)}
              className="items-center"
            >
              <Text className="text-white text-3xl font-bold tracking-tight">Tạo tài khoản</Text>
              <Text className="text-gray-400 text-lg mt-2 text-center">
                Bắt đầu quản lý thiết bị của bạn
              </Text>
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.delay(400).duration(800)}
              className="bg-white/10 p-6 rounded-3xl border border-white/20 mt-8"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <Input
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                value={formData.full_name}
                onChangeText={(v) => updateForm('full_name', v)}
              />
              <Input
                label="Mã sinh viên / Username"
                placeholder="B21DCCN001"
                value={formData.username}
                onChangeText={(v) => updateForm('username', v)}
                autoCapitalize="none"
              />
              <Input
                label="Email"
                placeholder="a.b21cn001@student.ptit.edu.vn"
                value={formData.email}
                onChangeText={(v) => updateForm('email', v)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Input
                label="Mật khẩu"
                placeholder="••••••••"
                value={formData.password}
                onChangeText={(v) => updateForm('password', v)}
                secureTextEntry
              />

              <Button 
                title="Đăng ký" 
                onPress={handleRegister} 
                loading={loading}
                className="mt-6"
              />

              <View className="flex-row justify-center mt-6">
                <Text className="text-gray-400">Đã có tài khoản? </Text>
                <Pressable onPress={() => router.back()}>
                  <Text className="text-primary-light font-bold">Đăng nhập</Text>
                </Pressable>
              </View>
            </Animated.View>

            <View className="items-center mt-8">
              <Text className="text-gray-500 text-xs text-center">
                Bằng cách đăng ký, bạn đồng ý với các Điều khoản & Chính sách của chúng tôi
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
