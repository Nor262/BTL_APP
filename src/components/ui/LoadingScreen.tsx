import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function LoadingScreen() {
  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      className="flex-1 bg-white items-center justify-center px-6"
    >
      <View className="w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-6">
        <ActivityIndicator size="large" color="#CC0D00" />
      </View>
      
      <Text className="text-xl font-bold text-gray-900 mb-2">
        Vui lòng đợi trong giây lát
      </Text>
      <Text className="text-gray-500 text-center text-sm mb-12">
        Đang chuyển hướng và tải dữ liệu...
      </Text>
      
      <View className="flex-row items-center bg-gray-50 px-4 py-3 rounded-xl">
        <Feather name="info" size={16} color="#666" />
        <Text className="text-xs text-gray-500 ml-2">
          Hệ thống đang đồng bộ với máy chủ
        </Text>
      </View>
    </Animated.View>
  );
}
