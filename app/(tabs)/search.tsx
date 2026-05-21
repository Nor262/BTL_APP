import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/api/client';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState('Tất cả');
  const [items, setItems] = useState<any[]>([]);
  const [recent, setRecent] = useState<string[]>(['Sony A7 IV', 'HDMI Cable 2m']);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  useEffect(() => {
    if (params?.category !== undefined) {
      if (params.category === '' || params.category.toLowerCase() === 'tất cả') {
        setChip('Tất cả');
      } else if (categoriesList.length > 0) {
        const matchedChip = categoriesList.find(c => 
          c.name.toLowerCase() === params.category!.toLowerCase() || 
          params.category!.toLowerCase().includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(params.category!.toLowerCase())
        );
        if (matchedChip) {
          setChip(matchedChip.name);
        }
      }
    }
  }, [params?.category, categoriesList]);

  useEffect(() => {
    Promise.all([
      api.get('/equipment'),
      api.get('/categories').catch(() => ({ data: [] }))
    ]).then(([eqRes, catRes]) => {
      setItems(eqRes.data?.data || eqRes.data || []);
      setCategoriesList(catRes.data?.data || catRes.data || []);
    }).catch(() => {});
  }, []);

  const filtered = items.filter((it: any) => {
    if (chip !== 'Tất cả') {
      const cat = (it.category?.name || '').toLowerCase();
      if (cat !== chip.toLowerCase()) return false;
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        (it.name || '').toLowerCase().includes(q) ||
        (it.serial_number || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 140, paddingHorizontal: 20 }}
      >
        <View style={{ gap: 14 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between" style={{ width: '100%' }}>
            <Text className="text-[#0F172A] text-2xl font-bold">Tìm kiếm</Text>
            <Pressable
              className="w-10 h-10 bg-white rounded-full items-center justify-center"
              onPress={() => router.push('/(tabs)/scan')}
            >
              <Feather name="maximize" size={18} color="#0F172A" />
            </Pressable>
          </View>

          {/* Search bar */}
          <View
            className="flex-row items-center bg-white rounded-[14px] h-[52px] px-4"
            style={{ gap: 10, width: '100%' }}
          >
            <Feather name="search" size={16} color="#94A3B8" />
            <TextInput
              className="flex-1 text-sm text-[#0F172A]"
              placeholder="MBP-2024 hoặc tên thiết bị..."
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <Feather name="x" size={16} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          {/* Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 20 }}
            style={{ maxHeight: 36 }}
          >
            {['Tất cả', ...categoriesList.map((c) => c.name)].map((c) => (
              <Pressable
                key={c}
                className={`rounded-full ${chip === c ? 'bg-[#CC0D00]' : 'bg-white'}`}
                style={{ paddingVertical: 6, paddingHorizontal: 14 }}
                onPress={() => setChip(c)}
              >
                <Text className={`text-[12px] font-semibold ${chip === c ? 'text-white' : 'text-[#64748B]'}`}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Recent searches */}
          {query.trim() === '' && recent.length > 0 && (
            <Animated.View entering={FadeInDown.delay(100)} style={{ gap: 8 }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[#0F172A] text-xs font-bold">Tìm kiếm gần đây</Text>
                <Pressable onPress={() => setRecent([])}>
                  <Text className="text-[#CC0D00] text-xs font-bold">Xóa</Text>
                </Pressable>
              </View>
              {recent.map((r) => (
                <View
                  key={r}
                  className="bg-white rounded-[14px] flex-row items-center justify-between"
                  style={{ paddingVertical: 12, paddingHorizontal: 14 }}
                >
                  <Pressable
                    className="flex-1 flex-row items-center"
                    style={{ gap: 10 }}
                    onPress={() => setQuery(r)}
                  >
                    <Feather name="clock" size={14} color="#94A3B8" />
                    <Text className="text-[#0F172A] text-sm">{r}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setRecent((prev) => prev.filter((x) => x !== r))}
                    style={{ padding: 4 }}
                  >
                    <Feather name="x" size={14} color="#94A3B8" />
                  </Pressable>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Results / Suggestions */}
          <Animated.View entering={FadeInDown.delay(200)} style={{ gap: 8 }}>
            <Text className="text-[#0F172A] text-xs font-bold">
              {query.trim() ? `Kết quả (${filtered.length})` : 'Gợi ý cho bạn'}
            </Text>
            {(query.trim() ? filtered : filtered.slice(0, 6)).map((it: any) => (
              <Pressable
                key={it.id}
                className="bg-white rounded-[14px] flex-row items-center"
                style={{ padding: 12, gap: 12 }}
                onPress={() => router.push(`/equipment/${it.id}`)}
              >
                <View className="w-11 h-11 bg-[#FEE5E3] rounded-xl items-center justify-center">
                  <Feather name="box" size={20} color="#CC0D00" />
                </View>
                <View className="flex-1" style={{ gap: 2 }}>
                  <Text className="text-[#0F172A] text-sm font-bold" numberOfLines={1}>{it.name}</Text>
                  <Text className="text-[#94A3B8] text-[11px]">{it.category?.name || 'Thiết bị'} · {it.serial_number}</Text>
                </View>
                <View
                  className="rounded-full"
                  style={{
                    paddingVertical: 3,
                    paddingHorizontal: 10,
                    backgroundColor: it.status === 'available' ? '#DCFCE7' : '#FEE2E2',
                  }}
                >
                  <Text
                    className="text-[10px] font-bold"
                    style={{ color: it.status === 'available' ? '#15803D' : '#B91C1C' }}
                  >
                    {it.status === 'available' ? 'Sẵn' : 'Bận'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </Animated.View>

          {/* Quick QR */}
          <Pressable
            className="bg-[#0F172A] rounded-[16px] flex-row items-center"
            style={{ padding: 16, gap: 12 }}
            onPress={() => router.push('/(tabs)/scan')}
          >
            <View className="w-11 h-11 bg-[#1E293B] rounded-xl items-center justify-center">
              <Feather name="maximize" size={20} color="#FFFFFF" />
            </View>
            <View className="flex-1" style={{ gap: 2 }}>
              <Text className="text-white text-sm font-bold">Quét nhanh QR</Text>
              <Text className="text-[#94A3B8] text-[11px]">Xem thông tin thiết bị tức thì</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
