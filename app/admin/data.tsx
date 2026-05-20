import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '@/api/client';

const TABS = [
  { key: 'category', label: 'Danh mục' },
  { key: 'supplier', label: 'Nhà CC' },
  { key: 'location', label: 'Vị trí kho' },
  { key: 'maintenance', label: 'Bảo trì' },
];

const ICON_MAP: any = {
  Laptop: { icon: 'monitor', bg: '#FEE5E3', color: '#CC0D00' },
  Camera: { icon: 'camera', bg: '#FEF3C7', color: '#D97706' },
  Tripod: { icon: 'triangle', bg: '#DCFCE7', color: '#15803D' },
  Audio: { icon: 'mic', bg: '#FCE7F3', color: '#DB2777' },
};

export default function AdminData() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('category');
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState({ category: 0, supplier: 0, location: 0, maintenance: 0 });

  const ENDPOINT: any = {
    category: '/categories',
    supplier: '/suppliers',
    location: '/locations',
    maintenance: '/maintenance',
  };

  const fetchData = async () => {
    try {
      const res = await api.get(ENDPOINT[tab]);
      setItems(res.data?.data || res.data || []);
    } catch { setItems([]); }
  };

  const fetchCounts = async () => {
    const keys = Object.keys(ENDPOINT);
    const result: any = {};
    await Promise.all(keys.map(async (k) => {
      try {
        const r = await api.get(ENDPOINT[k]);
        result[k] = (r.data?.data || r.data || []).length;
      } catch { result[k] = 0; }
    }));
    setCounts(result);
  };

  useEffect(() => { fetchData(); }, [tab]);
  useEffect(() => { fetchCounts(); }, []);

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="dark" />

      {/* Nav */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8 }}>
        <View className="flex-row items-center justify-between" style={{ height: 44 }}>
          <View style={{ gap: 2 }}>
            <Text className="text-[#0F172A] text-lg font-bold">Quản lý dữ liệu</Text>
            <Text className="text-[#94A3B8] text-[10px]">Danh mục · Nhà CC · Kho · Bảo trì</Text>
          </View>
          <Pressable className="w-10 h-10 bg-[#CC0D00] rounded-full items-center justify-center">
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Segment KHO / DỮ LIỆU */}
        <View
          className="bg-white rounded-full flex-row"
          style={{ padding: 4, marginTop: 10, borderWidth: 1.5, borderColor: '#E2E8F0' }}
        >
          <Pressable
            className="flex-1 rounded-full items-center justify-center"
            style={{ paddingVertical: 8 }}
            onPress={() => router.replace('/admin/equipment')}
          >
            <Text className="text-[#64748B] text-[12px] font-bold">Thiết bị</Text>
          </Pressable>
          <View className="flex-1 bg-[#CC0D00] rounded-full items-center justify-center" style={{ paddingVertical: 8 }}>
            <Text className="text-white text-[12px] font-bold">Danh mục & Dữ liệu</Text>
          </View>
        </View>

        {/* Count strip */}
        <View className="bg-white rounded-[14px] flex-row" style={{ padding: 12, marginTop: 12 }}>
          <CountCell value={counts.category} label="Danh mục" color="#CC0D00" />
          <Divider />
          <CountCell value={counts.supplier} label="Nhà cung cấp" color="#D97706" />
          <Divider />
          <CountCell value={counts.location} label="Vị trí kho" color="#15803D" />
          <Divider />
          <CountCell value={counts.maintenance} label="Bảo trì" color="#1D4ED8" />
        </View>

        {/* Tabs */}
        <View className="flex-row" style={{ gap: 8, marginTop: 10 }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                className={`rounded-full ${active ? 'bg-[#CC0D00]' : 'bg-white'}`}
                style={{ paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1.5, borderColor: active ? '#CC0D00' : '#E2E8F0' }}
              >
                <Text className={`text-[11px] font-bold ${active ? 'text-white' : 'text-[#64748B]'}`}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 140 }}
      >
        <View style={{ gap: 10 }}>
          {items.map((it: any, idx: number) => {
            const info = ICON_MAP[it.name] || { icon: 'folder', bg: '#F1F5F9', color: '#64748B' };
            return (
              <Animated.View key={it.id || idx} entering={FadeInDown.delay(idx * 50)} className="bg-white rounded-[14px] flex-row items-center" style={{ padding: 12, gap: 10 }}>
                <View className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: info.bg }}>
                  <Feather name={info.icon} size={18} color={info.color} />
                </View>
                <View className="flex-1" style={{ gap: 2 }}>
                  <Text className="text-[#0F172A] text-sm font-bold">{it.name}</Text>
                  <Text className="text-[#94A3B8] text-[11px]" numberOfLines={1}>
                    {it.description || it.address || it.email || '---'}
                  </Text>
                  <View className="flex-row" style={{ gap: 8, marginTop: 4 }}>
                    <View className="flex-row items-center" style={{ gap: 4 }}>
                      <Feather name="edit-2" size={10} color="#94A3B8" />
                      <Text className="text-[#94A3B8] text-[10px]">Sửa</Text>
                    </View>
                    <View className="flex-row items-center" style={{ gap: 4 }}>
                      <Feather name="trash-2" size={10} color="#EF4444" />
                      <Text className="text-[#EF4444] text-[10px]">Xóa</Text>
                    </View>
                  </View>
                </View>
                {it.equipment_count !== undefined && (
                  <View className="rounded-full bg-[#F1F5F9]" style={{ paddingVertical: 2, paddingHorizontal: 8 }}>
                    <Text className="text-[#64748B] text-[10px] font-bold">{it.equipment_count} TB</Text>
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function CountCell({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View className="flex-1 items-center" style={{ gap: 2 }}>
      <Text className="text-base font-bold" style={{ color }}>{value}</Text>
      <Text className="text-[#94A3B8] text-[9px] text-center">{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={{ width: 1, backgroundColor: '#F1F5F9' }} />;
}
