import React from 'react';
import { View, Text, ScrollView, Pressable } from '@/tw';
import { IconOutline } from '@ant-design/icons-react-native';
import { useRouter } from 'expo-router';

export default function StorekeeperHome() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-primary pt-16 pb-12 px-6 rounded-b-[30px]">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-bold">Thủ kho</Text>
            <Text className="text-white opacity-80">Quản lý vận hành hệ thống</Text>
          </View>
          <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
            <IconOutline name="user" size={24} color="white" />
          </View>
        </View>
      </View>

      <View className="px-6 -mt-8">
        {/* Quick Actions Bento Grid */}
        <View className="flex-row flex-wrap justify-between">
          <Pressable 
            className="w-[100%] bg-white p-6 rounded-[20px] shadow-sm mb-4 flex-row items-center justify-center border-2 border-primary"
            onPress={() => router.push('/scan')}
          >
            <IconOutline name="scan" size={32} color="#CC0D00" />
            <Text className="text-primary font-bold text-xl ml-3">QUÉT MÃ BATCH SCAN</Text>
          </Pressable>

          <Pressable className="w-[48%] bg-white p-5 rounded-[20px] shadow-sm mb-4">
            <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mb-3">
              <IconOutline name="file-protect" size={24} color="#1890ff" />
            </View>
            <Text className="font-bold text-gray-800">Chờ duyệt</Text>
            <Text className="text-2xl font-bold text-blue-600 mt-1">12</Text>
          </Pressable>

          <Pressable className="w-[48%] bg-white p-5 rounded-[20px] shadow-sm mb-4">
            <View className="w-10 h-10 bg-orange-50 rounded-full items-center justify-center mb-3">
              <IconOutline name="clock-circle" size={24} color="#fa8c16" />
            </View>
            <Text className="font-bold text-gray-800">Đang mượn</Text>
            <Text className="text-2xl font-bold text-orange-600 mt-1">45</Text>
          </Pressable>

          <Pressable className="w-[48%] bg-white p-5 rounded-[20px] shadow-sm mb-4">
            <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center mb-3">
              <IconOutline name="warning" size={24} color="#f5222d" />
            </View>
            <Text className="font-bold text-gray-800">Quá hạn</Text>
            <Text className="text-2xl font-bold text-red-600 mt-1">03</Text>
          </Pressable>

          <Pressable className="w-[48%] bg-white p-5 rounded-[20px] shadow-sm mb-4">
            <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center mb-3">
              <IconOutline name="check-circle" size={24} color="#52c41a" />
            </View>
            <Text className="font-bold text-gray-800">Sẵn sàng</Text>
            <Text className="text-2xl font-bold text-green-600 mt-1">158</Text>
          </Pressable>
        </View>

        <Text className="font-bold text-lg mt-4 mb-3">Yêu cầu mới nhất</Text>
        {[1, 2, 3].map((i) => (
          <View key={i} className="bg-white p-4 rounded-ant shadow-sm mb-3 flex-row items-center">
            <View className="w-10 h-10 bg-gray-100 rounded-ant items-center justify-center mr-3">
              <IconOutline name="laptop" size={20} color="#666" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-sm">Laptop Dell XPS 13</Text>
              <Text className="text-xs text-gray-500">Người mượn: Nguyễn Văn A</Text>
            </View>
            <Text className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full uppercase font-bold">
              Chờ duyệt
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
