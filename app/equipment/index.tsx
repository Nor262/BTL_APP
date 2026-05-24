import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, RefreshControl, ScrollView, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/api/client';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import LoadingScreen from '@/components/ui/LoadingScreen';



export default function EquipmentListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState('Tất cả');
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortKey, setSortKey] = useState<'availability' | 'name' | 'newest'>('availability');

  useEffect(() => {
    if (params?.category && categoriesList.length > 0) {
      const matchedChip = categoriesList.find(c => 
        c.name.toLowerCase() === params.category!.toLowerCase() || 
        params.category!.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(params.category!.toLowerCase())
      );
      if (matchedChip) {
        setChip(matchedChip.name);
      }
    }
  }, [params?.category, categoriesList]);

  const fetchData = async () => {
    try {
      const [eqRes, catRes] = await Promise.all([
        api.get('/equipment'),
        api.get('/categories').catch(() => ({ data: [] }))
      ]);
      setItems(eqRes.data?.data || eqRes.data || []);
      setCategoriesList(catRes.data?.data || catRes.data || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = items
    .filter((it: any) => {
      if (chip !== 'Tất cả') {
        const cat = (it.category?.name || '').toLowerCase();
        if (!cat.includes(chip.toLowerCase())) return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        if (
          !(it.name || '').toLowerCase().includes(q) &&
          !(it.serial_number || '').toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    })
    .sort((a: any, b: any) => {
      if (sortKey === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortKey === 'newest') return (b.id || 0) - (a.id || 0);
      if (a.status === b.status) return (a.name || '').localeCompare(b.name || '');
      return a.status === 'available' ? -1 : 1;
    });

  const sortActive = sortKey !== 'availability';
  const sortLabel = sortKey === 'availability' ? 'Sẵn sàng' : sortKey === 'name' ? 'Tên A-Z' : 'Mới nhất';

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const available = item.status === 'available';
    return (
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <Pressable
          className="bg-white rounded-[16px] flex-row items-center"
          style={{ padding: 12, gap: 12, marginBottom: 10 }}
          onPress={() => router.push(`/equipment/${item.id}`)}
        >
          <View
            className="w-14 h-14 rounded-xl items-center justify-center"
            style={{ backgroundColor: available ? '#FEE5E3' : '#FEF3C7' }}
          >
            <Feather name="box" size={22} color={available ? '#CC0D00' : '#D97706'} />
          </View>
          <View className="flex-1" style={{ gap: 4 }}>
            <Text className="text-[#0F172A] text-sm font-bold" numberOfLines={1}>{item.name}</Text>
            <Text className="text-[#94A3B8] text-[11px]">
              SN: {item.serial_number || '---'} · {item.category?.name || 'Khác'}
            </Text>
          </View>
          <View className="items-end" style={{ gap: 6 }}>
            <View
              className="flex-row items-center rounded-full"
              style={{ paddingVertical: 3, paddingHorizontal: 8, gap: 4, backgroundColor: available ? '#DCFCE7' : '#FEF3C7' }}
            >
              <View
                className="rounded-full"
                style={{ width: 6, height: 6, backgroundColor: available ? '#15803D' : '#D97706' }}
              />
              <Text
                className="text-[10px] font-bold"
                style={{ color: available ? '#15803D' : '#D97706' }}
              >
                {available ? 'Sẵn sàng' : 'Đang mượn'}
              </Text>
            </View>
            {available && (
              <Text className="text-[#CC0D00] text-[11px] font-bold">Mượn ›</Text>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="dark" />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, gap: 12, paddingBottom: 10 }}>
        <View className="flex-row items-center justify-between" style={{ height: 44 }}>
          <Pressable
            className="w-10 h-10 bg-white rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={18} color="#0F172A" />
          </Pressable>
          <Text className="text-[#0F172A] text-lg font-bold">Tìm thiết bị</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View
          className="flex-row items-center bg-white rounded-[14px] h-[46px] px-4"
          style={{ gap: 10 }}
        >
          <Feather name="search" size={16} color="#94A3B8" />
          <TextInput
            className="flex-1 text-sm text-[#0F172A]"
            placeholder="MacBook, Camera, Cable..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
          />
          <Pressable onPress={() => router.push('/(tabs)/scan')}>
            <Feather name="maximize" size={16} color="#CC0D00" />
          </Pressable>
        </View>

        {/* Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 20 }}
          style={{ maxHeight: 32 }}
        >
          {['Tất cả', ...categoriesList.map((c) => c.name)].map((c) => (
            <Pressable
              key={c}
              className={`rounded-full ${chip === c ? 'bg-[#CC0D00]' : 'bg-white'}`}
              style={{ paddingVertical: 5, paddingHorizontal: 12 }}
              onPress={() => setChip(c)}
            >
              <Text className={`text-[11px] font-semibold ${chip === c ? 'text-white' : 'text-[#64748B]'}`}>
                {c}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Result count */}
        <View className="flex-row items-center justify-between">
          <Text className="text-[#0F172A] text-[12px] font-bold">{filtered.length} thiết bị</Text>
          <Pressable className="flex-row items-center" style={{ gap: 4 }} onPress={() => setFilterVisible(true)}>
            <Text className="text-[#64748B] text-[11px]">{sortLabel}</Text>
            <Feather name="chevron-down" size={12} color="#64748B" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(it) => it.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#CC0D00" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20" style={{ gap: 12 }}>
            <Feather name="package" size={32} color="#CBD5E1" />
            <Text className="text-[#94A3B8] text-sm">Không tìm thấy thiết bị nào</Text>
          </View>
        }
      />

      {/* Sort Popup */}
      <Modal visible={filterVisible} transparent animationType="fade" onRequestClose={() => setFilterVisible(false)}>
        <Pressable className="flex-1 bg-black/50 items-center justify-center px-6" onPress={() => setFilterVisible(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} className="bg-white rounded-3xl w-full" style={{ padding: 18, gap: 12, maxWidth: 360 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[#0F172A] text-base font-bold">Sắp xếp danh sách</Text>
              <Pressable onPress={() => setFilterVisible(false)} className="w-7 h-7 items-center justify-center">
                <Feather name="x" size={18} color="#64748B" />
              </Pressable>
            </View>

            <View style={{ gap: 4 }}>
              {([
                ['availability', 'Sẵn sàng'],
                ['name', 'Tên (A → Z)'],
                ['newest', 'Mới nhất'],
              ] as const).map(([k, l]) => (
                <Pressable key={k} onPress={() => { setSortKey(k); setFilterVisible(false); }}
                  className="flex-row items-center justify-between rounded-xl"
                  style={{ paddingVertical: 12, paddingHorizontal: 14, backgroundColor: sortKey === k ? '#FEE2E2' : '#F8FAFC' }}>
                  <Text className="text-[13px] font-semibold" style={{ color: sortKey === k ? '#CC0D00' : '#0F172A' }}>{l}</Text>
                  {sortKey === k && <Feather name="check" size={18} color="#CC0D00" />}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
