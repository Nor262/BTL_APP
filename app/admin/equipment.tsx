import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, RefreshControl, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '@/api/client';
import { useAlertStore } from '@/store/useAlertStore';

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
  const [menuItem, setMenuItem] = useState<any | null>(null);
  const { showAlert } = useAlertStore();

  const handleDelete = (item: any) => {
    setMenuItem(null);
    showAlert({
      type: 'warning',
      title: 'Xóa thiết bị',
      message: `Xóa "${item.name}"? Hành động này không thể hoàn tác.`,
      showCancel: true,
      onConfirm: async () => {
        try {
          await api.delete(`/equipment/${item.id}`);
          showAlert({ type: 'success', title: 'Đã xóa', message: 'Đã xóa thiết bị', showCancel: false });
          fetchData();
        } catch (e: any) {
          showAlert({ type: 'error', title: 'Lỗi', message: e.response?.data?.message || 'Không thể xóa thiết bị', showCancel: false });
        }
      },
    });
  };

  const fetchData = async () => {
    try {
      const res = await api.get('/equipment');
      setItems(res.data?.data || res.data || []);
    } catch {}
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

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
          <View className="flex-row" style={{ gap: 8 }}>
            <Pressable
              className="px-3 h-10 bg-[#0F172A] rounded-full flex-row items-center"
              style={{ gap: 6 }}
              onPress={() => router.push('/admin/import-equipment' as any)}
            >
              <Feather name="upload" size={14} color="#FFFFFF" />
              <Text className="text-white text-[11px] font-bold">Import</Text>
            </Pressable>
            <Pressable
              className="w-10 h-10 bg-[#CC0D00] rounded-full items-center justify-center"
              onPress={() => router.push('/admin/add-equipment')}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
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
                  <Pressable className="w-8 h-8 items-center justify-center" onPress={() => setMenuItem(it)}>
                    <Feather name="more-vertical" size={16} color="#94A3B8" />
                  </Pressable>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Action menu (Sửa / Xóa) */}
      <Modal visible={!!menuItem} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setMenuItem(null)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setMenuItem(null)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-white" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 8 }}>
              <View className="flex-row items-center justify-between" style={{ marginBottom: 4 }}>
                <Text className="text-[#0F172A] text-base font-bold" numberOfLines={1}>{menuItem?.name}</Text>
                <Pressable onPress={() => setMenuItem(null)}><Feather name="x" size={20} color="#0F172A" /></Pressable>
              </View>
              <Pressable
                className="flex-row items-center rounded-[12px]"
                style={{ paddingVertical: 14, paddingHorizontal: 14, backgroundColor: '#F8FAFC', gap: 12 }}
                onPress={() => { const id = menuItem.id; setMenuItem(null); router.push(`/admin/add-equipment?id=${id}` as any); }}
              >
                <Feather name="edit-2" size={18} color="#0F172A" />
                <Text className="text-[#0F172A] text-sm font-bold">Sửa thiết bị</Text>
              </Pressable>
              <Pressable
                className="flex-row items-center rounded-[12px]"
                style={{ paddingVertical: 14, paddingHorizontal: 14, backgroundColor: '#FEF2F2', gap: 12 }}
                onPress={() => handleDelete(menuItem)}
              >
                <Feather name="trash-2" size={18} color="#B91C1C" />
                <Text className="text-[#B91C1C] text-sm font-bold">Xóa thiết bị</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
