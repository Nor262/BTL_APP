import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '@/api/client';

const CHIPS = [
  { key: 'all', label: 'Tất cả', color: '#CC0D00' },
  { key: 'available', label: 'Đang mượn', color: '#0F172A' },
  { key: 'maintenance', label: 'Hỏng', color: '#0F172A' },
];

export default function AdminEquipment() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<any[]>([]);
  const [chip, setChip] = useState('all');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get('/equipment');
      setItems(res.data?.data || res.data || []);
    } catch {}
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = items.filter((it: any) => {
    if (chip === 'available' && it.status === 'available') return false;
    if (chip === 'maintenance' && it.status !== 'maintenance' && it.status !== 'damaged') return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (it.name || '').toLowerCase().includes(q) || (it.serial_number || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="dark" />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8 }}>
        <View className="flex-row items-center justify-between" style={{ height: 44 }}>
          <View style={{ gap: 2 }}>
            <Text className="text-[#0F172A] text-lg font-bold">Quản lý kho</Text>
            <Text className="text-[#94A3B8] text-[10px] font-bold">AST-01.04 · {items.length.toLocaleString()}</Text>
          </View>
          <Pressable
            className="w-10 h-10 bg-[#CC0D00] rounded-full items-center justify-center"
            onPress={() => router.push('/admin/add-equipment')}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Segment KHO / DỮ LIỆU */}
        <View
          className="bg-white rounded-full flex-row"
          style={{ padding: 4, marginTop: 10, borderWidth: 1.5, borderColor: '#E2E8F0' }}
        >
          <View className="flex-1 bg-[#CC0D00] rounded-full items-center justify-center" style={{ paddingVertical: 8 }}>
            <Text className="text-white text-[12px] font-bold">Thiết bị</Text>
          </View>
          <Pressable
            className="flex-1 rounded-full items-center justify-center"
            style={{ paddingVertical: 8 }}
            onPress={() => router.replace('/admin/data')}
          >
            <Text className="text-[#64748B] text-[12px] font-bold">Danh mục & Dữ liệu</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View
          className="flex-row items-center bg-white rounded-[14px] h-[46px] px-4"
          style={{ gap: 10, marginTop: 12 }}
        >
          <Feather name="search" size={16} color="#94A3B8" />
          <TextInput
            className="flex-1 text-sm text-[#0F172A]"
            placeholder="Tìm theo SKU, serial, tên..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
          />
          <Pressable
            className="w-7 h-7 bg-[#0F172A] rounded-md items-center justify-center"
            onPress={() => router.push('/(tabs)/scan')}
          >
            <Feather name="maximize" size={14} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Chips */}
        <View className="flex-row" style={{ gap: 8, marginTop: 10 }}>
          {CHIPS.map((c) => {
            const active = chip === c.key;
            const count =
              c.key === 'all' ? items.length :
              c.key === 'available' ? items.filter((i) => i.status !== 'available').length :
              items.filter((i) => i.status === 'maintenance' || i.status === 'damaged').length;
            return (
              <Pressable
                key={c.key}
                onPress={() => setChip(c.key)}
                className={`flex-row items-center rounded-full ${active ? 'bg-[#CC0D00]' : 'bg-white'}`}
                style={{ paddingVertical: 5, paddingHorizontal: 12, gap: 6, borderWidth: 1.5, borderColor: active ? '#CC0D00' : '#E2E8F0' }}
              >
                <Text className={`text-[11px] font-bold ${active ? 'text-white' : 'text-[#64748B]'}`}>{c.label}</Text>
                <Text className={`text-[10px] font-bold ${active ? 'text-white' : 'text-[#94A3B8]'}`}>· {count}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#CC0D00" />}
      >
        <View style={{ gap: 10 }}>
          {filtered.map((it: any, idx: number) => {
            const available = it.status === 'available';
            return (
              <Animated.View key={it.id} entering={FadeInDown.delay(idx * 40)}>
                <Pressable
                  className="bg-white rounded-[14px] flex-row items-center"
                  style={{ padding: 12, gap: 10 }}
                  onPress={() => router.push(`/equipment/${it.id}`)}
                >
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center"
                    style={{ backgroundColor: available ? '#FEE5E3' : '#FEF3C7' }}
                  >
                    <Feather name="box" size={18} color={available ? '#CC0D00' : '#D97706'} />
                  </View>
                  <View className="flex-1" style={{ gap: 2 }}>
                    <Text className="text-[#0F172A] text-sm font-bold" numberOfLines={1}>{it.name}</Text>
                    <Text className="text-[#94A3B8] text-[10px]">
                      SN: {it.serial_number || '---'} · {it.location?.name || 'Kho A'}
                    </Text>
                    <View
                      className="rounded-full self-start"
                      style={{ paddingVertical: 1, paddingHorizontal: 8, backgroundColor: available ? '#DCFCE7' : '#FEF3C7', marginTop: 2 }}
                    >
                      <Text
                        className="text-[9px] font-bold"
                        style={{ color: available ? '#15803D' : '#D97706' }}
                      >
                        {available ? 'Sẵn sàng' : 'Đang mượn'}
                      </Text>
                    </View>
                  </View>
                  <Pressable className="w-8 h-8 items-center justify-center">
                    <Feather name="more-vertical" size={16} color="#94A3B8" />
                  </Pressable>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
