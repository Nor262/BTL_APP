import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';

export default function StorekeeperHandover() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [mode, setMode] = useState<'checkout' | 'checkin'>('checkout');
  const [pending, setPending] = useState<any[]>([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api.get('/transactions?status=approved').then((res) => {
      setPending((res.data?.data || res.data || []).slice(0, 5));
    }).catch(() => {});
  }, []);

  const initials = (user?.full_name?.split(' ').pop() || 'K').charAt(0).toUpperCase();

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="light" />

      {/* Dark header */}
      <View className="bg-[#0F172A]" style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 18, gap: 14 }}>
        <View className="flex-row items-center justify-between">
          <View style={{ gap: 2 }}>
            <Text className="text-[#94A3B8] text-xs">Storekeeper</Text>
            <Text className="text-white text-xl font-bold">Bàn giao thiết bị</Text>
          </View>
          <View className="w-11 h-11 bg-[#15803D] rounded-full items-center justify-center">
            <Text className="text-white text-base font-bold">{initials}</Text>
          </View>
        </View>

        {/* Mode segment */}
        <View className="bg-[#1E293B] rounded-full flex-row" style={{ padding: 4 }}>
          <Pressable
            onPress={() => setMode('checkout')}
            className={`flex-1 rounded-full items-center justify-center ${mode === 'checkout' ? 'bg-white' : ''}`}
            style={{ paddingVertical: 8 }}
          >
            <Text className={`text-[12px] font-bold ${mode === 'checkout' ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
              ← Check-out
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('checkin')}
            className={`flex-1 rounded-full items-center justify-center ${mode === 'checkin' ? 'bg-white' : ''}`}
            style={{ paddingVertical: 8 }}
          >
            <Text className={`text-[12px] font-bold ${mode === 'checkin' ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
              Check-in →
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 200 }}>
        <View style={{ gap: 14 }}>
          {/* Scan/Manual actions */}
          <Animated.View entering={FadeInDown.delay(80)} className="flex-row" style={{ gap: 10 }}>
            <Pressable
              className="flex-1 bg-[#0F172A] rounded-[14px] items-center"
              style={{ padding: 14, gap: 6 }}
              onPress={() => router.push('/(tabs)/scan')}
            >
              <View className="w-9 h-9 bg-[#1E293B] rounded-lg items-center justify-center">
                <Feather name="maximize" size={16} color="#FFFFFF" />
              </View>
              <Text className="text-white text-sm font-bold">Quét QR</Text>
              <Text className="text-[#94A3B8] text-[10px]">Mở camera, đa mã</Text>
            </Pressable>
            <Pressable
              className="flex-1 bg-white rounded-[14px] items-center"
              style={{ padding: 14, gap: 6 }}
            >
              <View className="w-9 h-9 bg-[#F1F5F9] rounded-lg items-center justify-center">
                <Feather name="edit-3" size={16} color="#0F172A" />
              </View>
              <Text className="text-[#0F172A] text-sm font-bold">Nhập mã</Text>
              <Text className="text-[#94A3B8] text-[10px]">Khi không có camera</Text>
            </Pressable>
          </Animated.View>

          {/* Pending */}
          <Animated.View entering={FadeInDown.delay(120)} className="bg-white rounded-[16px]" style={{ padding: 14, gap: 10 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[#0F172A] text-[13px] font-bold">Đơn cần bàn giao</Text>
              <View className="bg-[#DCFCE7] rounded-full" style={{ paddingVertical: 2, paddingHorizontal: 8 }}>
                <Text className="text-[#15803D] text-[10px] font-bold">Đã duyệt</Text>
              </View>
            </View>
            {(pending.length > 0 ? pending : [
              { id: 'BOR-3201', borrower: { full_name: 'Nguyễn Văn Minh' }, equipment: { name: 'MacBook Pro 14" M3' }, code: 'CNTT K23 · Đã duyệt' },
            ]).slice(0, 3).map((p: any) => (
              <View key={p.id} className="flex-row items-center" style={{ gap: 10, paddingTop: 6 }}>
                <View className="w-9 h-9 bg-[#FEE5E3] rounded-lg items-center justify-center">
                  <Text className="text-[#CC0D00] text-sm font-bold">
                    {(p.borrower?.full_name || 'M').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1" style={{ gap: 2 }}>
                  <Text className="text-[#0F172A] text-[13px] font-bold">{p.borrower?.full_name || 'Nguyễn Văn Minh'}</Text>
                  <Text className="text-[#94A3B8] text-[10px]" numberOfLines={1}>
                    {p.equipment?.name || 'Thiết bị'} · #BOR-{p.id}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* Pre-handover checklist */}
          <Animated.View entering={FadeInDown.delay(160)} className="bg-white rounded-[16px]" style={{ padding: 14, gap: 10 }}>
            <Text className="text-[#0F172A] text-[13px] font-bold">Kiểm tra trước khi giao</Text>
            <Pressable
              className="flex-row items-center"
              style={{ gap: 10 }}
              onPress={() => setChecked((v) => !v)}
            >
              <View
                className="w-5 h-5 rounded items-center justify-center"
                style={{
                  borderWidth: 1.5,
                  borderColor: checked ? '#15803D' : '#CBD5E1',
                  backgroundColor: checked ? '#15803D' : 'transparent',
                }}
              >
                {checked && <Feather name="check" size={12} color="#FFFFFF" />}
              </View>
              <Text className="text-[#0F172A] text-xs flex-1">Đầy đủ phụ kiện đi kèm</Text>
            </Pressable>
            <Pressable className="flex-row items-center" style={{ gap: 10 }}>
              <View className="w-5 h-5 rounded items-center justify-center" style={{ borderWidth: 1.5, borderColor: '#CBD5E1' }} />
              <Text className="text-[#0F172A] text-xs flex-1">Chụp ảnh tình trạng trước khi giao</Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white flex-row"
        style={{ padding: 16, paddingBottom: 110, gap: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}
      >
        <Pressable className="flex-1 bg-[#F1F5F9] rounded-[14px] items-center justify-center" style={{ height: 52 }}>
          <Text className="text-[#0F172A] text-sm font-bold">Hoãn</Text>
        </Pressable>
        <Pressable
          className="flex-[2] bg-[#15803D] rounded-[14px] flex-row items-center justify-center"
          style={{ height: 52, gap: 8 }}
          onPress={() => router.push('/(tabs)/scan')}
        >
          <Feather name="maximize" size={16} color="#FFFFFF" />
          <Text className="text-white text-sm font-bold">Quét QR & Bàn giao</Text>
        </Pressable>
      </View>
    </View>
  );
}
