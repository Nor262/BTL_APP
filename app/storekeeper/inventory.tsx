import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '@/api/client';

export default function StorekeeperInventory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<any[]>([]);
  const [scanned, setScanned] = useState<number[]>([1, 2]); // mock as if scanned

  useEffect(() => {
    api.get('/equipment').then((res) => {
      setItems((res.data?.data || res.data || []).slice(0, 10));
    }).catch(() => {});
  }, []);

  const total = items.length || 320;
  const ok = scanned.length;
  const skip = 11;
  const mismatch = 3;
  const progress = ok + skip + mismatch;

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="dark" />

      {/* Nav */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8 }}>
        <View className="flex-row items-center justify-between" style={{ height: 44 }}>
          <Pressable
            className="w-10 h-10 bg-white rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={18} color="#0F172A" />
          </Pressable>
          <View className="items-center">
            <Text className="text-[#0F172A] text-base font-bold">Kiểm kê kho</Text>
            <Text className="text-[#94A3B8] text-[10px]">Phiên lúc 09:05</Text>
          </View>
          <Pressable className="w-10 h-10 bg-white rounded-full items-center justify-center">
            <Feather name="clock" size={18} color="#0F172A" />
          </Pressable>
        </View>
      </View>

      {/* Progress card */}
      <View style={{ paddingHorizontal: 20 }}>
        <Animated.View entering={FadeInDown.delay(80)} className="bg-white rounded-[16px]" style={{ padding: 14, gap: 10 }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-[#0F172A] text-[13px] font-bold">Tiến độ kiểm kê</Text>
            <Text className="text-[#0F172A] text-[12px] font-bold">{progress} / {total} thiết bị</Text>
          </View>
          {/* Bar */}
          <View className="bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
            <View
              className="h-full bg-[#15803D]"
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </View>
          <View className="flex-row justify-between" style={{ gap: 8 }}>
            <ProgressCell value={ok} label="Khớp" color="#15803D" bg="#DCFCE7" />
            <ProgressCell value={skip} label="Lệch ×" color="#D97706" bg="#FEF3C7" />
            <ProgressCell value={mismatch} label="Mất" color="#B91C1C" bg="#FEE2E2" />
          </View>
        </Animated.View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 200 }}>
        <View style={{ gap: 12 }}>
          {/* Quick scan banner */}
          <Pressable
            className="bg-[#0F172A] rounded-[14px] flex-row items-center"
            style={{ padding: 14, gap: 12 }}
            onPress={() => router.push('/(tabs)/scan')}
          >
            <View className="w-10 h-10 bg-[#1E293B] rounded-xl items-center justify-center">
              <Feather name="maximize" size={18} color="#FFFFFF" />
            </View>
            <View className="flex-1" style={{ gap: 2 }}>
              <Text className="text-white text-sm font-bold">Quét nhanh để kiểm kê</Text>
              <Text className="text-[#94A3B8] text-[10px]">Mở camera tự động quay vùng kho</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#FFFFFF" />
          </Pressable>

          {/* Section title */}
          <View className="flex-row items-center justify-between">
            <Text className="text-[#0F172A] text-[13px] font-bold">Vừa kiểm tra</Text>
            <Pressable className="flex-row items-center" style={{ gap: 4 }}>
              <Text className="text-[#94A3B8] text-[11px]">Lọc lệch kê</Text>
              <Feather name="filter" size={12} color="#94A3B8" />
            </Pressable>
          </View>

          {items.map((it: any, idx: number) => {
            const ok = idx % 3 === 0;
            const partial = idx % 3 === 1;
            const status = ok ? 'ok' : partial ? 'partial' : 'miss';
            return (
              <Animated.View key={it.id || idx} entering={FadeInDown.delay(idx * 40)} className="bg-white rounded-[14px] flex-row items-center" style={{ padding: 12, gap: 10 }}>
                <View
                  className="w-9 h-9 rounded-lg items-center justify-center"
                  style={{
                    backgroundColor: status === 'ok' ? '#DCFCE7' : status === 'partial' ? '#FEF3C7' : '#FEE2E2',
                  }}
                >
                  <Feather
                    name={status === 'ok' ? 'check' : status === 'partial' ? 'alert-triangle' : 'x'}
                    size={16}
                    color={status === 'ok' ? '#15803D' : status === 'partial' ? '#D97706' : '#B91C1C'}
                  />
                </View>
                <View className="flex-1" style={{ gap: 2 }}>
                  <Text className="text-[#0F172A] text-sm font-bold" numberOfLines={1}>{it.name}</Text>
                  <Text className="text-[#94A3B8] text-[10px]">
                    {it.location?.name || 'Kệ A-12'} · SN: {it.serial_number || '---'}
                  </Text>
                </View>
                <Text
                  className="text-[11px] font-bold"
                  style={{ color: status === 'ok' ? '#15803D' : status === 'partial' ? '#D97706' : '#B91C1C' }}
                >
                  {status === 'ok' ? '4/4' : status === 'partial' ? '6/8' : '0/1'}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white flex-row"
        style={{ padding: 16, paddingBottom: 110, gap: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}
      >
        <Pressable className="flex-1 bg-[#F1F5F9] rounded-[14px] items-center justify-center" style={{ height: 52 }}>
          <Text className="text-[#0F172A] text-sm font-bold">Tạm dừng</Text>
        </Pressable>
        <Pressable className="flex-[2] bg-[#CC0D00] rounded-[14px] flex-row items-center justify-center" style={{ height: 52, gap: 8 }}>
          <Feather name="check-circle" size={16} color="#FFFFFF" />
          <Text className="text-white text-sm font-bold">Hoàn tất phiên kiểm kê</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProgressCell({ value, label, color, bg }: { value: number; label: string; color: string; bg: string }) {
  return (
    <View className="flex-1 rounded-[10px] items-center" style={{ paddingVertical: 8, backgroundColor: bg, gap: 2 }}>
      <Text className="text-base font-bold" style={{ color }}>{value}</Text>
      <Text className="text-[10px] font-bold" style={{ color }}>{label}</Text>
    </View>
  );
}
