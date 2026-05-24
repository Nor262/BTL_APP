import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '@/api/client';
import { handleApiError } from '@/utils/error-handler';

const ACTION_FILTERS = ['Tất cả', 'LOGIN', 'CREATE', 'UPDATE', 'DELETE'];

function actionColor(action: string): { color: string; bg: string } {
  const a = (action || '').toUpperCase();
  if (a.startsWith('CREATE')) return { color: '#15803D', bg: '#DCFCE7' };
  if (a.startsWith('UPDATE')) return { color: '#B45309', bg: '#FEF3C7' };
  if (a.startsWith('DELETE') || a.includes('FAIL') || a.includes('ERROR')) return { color: '#CC0D00', bg: '#FEE2E2' };
  if (a.startsWith('LOGIN')) return { color: '#1D4ED8', bg: '#DBEAFE' };
  return { color: '#64748B', bg: '#F1F5F9' };
}

function dayKey(d: Date) { return d.toISOString().slice(0, 10); }
function vnDay(s: string) {
  const d = new Date(s);
  const t = new Date();
  const y = new Date(t); y.setDate(y.getDate() - 1);
  if (dayKey(d) === dayKey(t)) return `Hôm nay, ${d.toLocaleDateString('vi-VN')}`;
  if (dayKey(d) === dayKey(y)) return `Hôm qua, ${d.toLocaleDateString('vi-VN')}`;
  return d.toLocaleDateString('vi-VN');
}

export default function AuditLogScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('Tất cả');
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/audit');
      setLogs(res.data.data || res.data || []);
    } catch (e) {
      handleApiError(e, 'Lỗi tải audit log');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = logs.filter(l => {
    if (filter !== 'Tất cả' && !(l.action || '').toUpperCase().startsWith(filter)) return false;
    if (search) {
      const q = search.toLowerCase();
      return [l.user_email, l.user_name, l.action, l.target, l.entity_type].some(x => (x || '').toLowerCase().includes(q));
    }
    return true;
  });

  const grouped: Record<string, any[]> = {};
  for (const l of filtered) {
    const k = dayKey(new Date(l.created_at || l.timestamp || Date.now()));
    (grouped[k] ||= []).push(l);
  }

  if (loading) return <View className="flex-1 items-center justify-center bg-[#F1F5F9]"><ActivityIndicator color="#CC0D00" /></View>;

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <View style={{ paddingTop: 58 }}>
        <View className="flex-row items-center justify-between px-5 pb-2">
          <Pressable className="w-10 h-10 bg-white rounded-full items-center justify-center" onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text className="text-[#0F172A] text-lg font-bold">Nhật ký hệ thống</Text>
            <Text className="text-[#64748B] text-[11px]">{logs.length} sự kiện</Text>
          </View>
        </View>

        <View className="mx-5 mb-2 bg-white rounded-2xl flex-row items-center" style={{ paddingHorizontal: 14, gap: 10 }}>
          <Feather name="search" size={16} color="#94A3B8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            className="flex-1 text-[#0F172A]"
            style={{ paddingVertical: 12, fontSize: 13 }}
            placeholder="Tìm user, action, target..."
            placeholderTextColor="#94A3B8"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5" contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>
          {ACTION_FILTERS.map(f => (
            <Pressable key={f} onPress={() => setFilter(f)}
              className="rounded-full" style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: filter === f ? '#0F172A' : '#FFFFFF' }}>
              <Text className="text-[11px] font-bold" style={{ color: filter === f ? '#FFFFFF' : '#0F172A' }}>{f}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="px-5 pt-2" contentContainerStyle={{ paddingBottom: 100, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}>
        {Object.keys(grouped).length === 0 ? (
          <View className="items-center justify-center bg-white rounded-2xl" style={{ padding: 40, gap: 10 }}>
            <Feather name="file-text" size={32} color="#CBD5E1" />
            <Text className="text-[#94A3B8] text-sm">Không có log nào</Text>
          </View>
        ) : Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([k, items]) => (
          <View key={k} style={{ gap: 8 }}>
            <Text className="text-[#94A3B8] text-[11px] font-bold text-center my-2">— {vnDay(items[0].created_at || items[0].timestamp)} —</Text>
            {items.map((l: any, idx: number) => {
              const { color, bg } = actionColor(l.action);
              const t = new Date(l.created_at || l.timestamp || Date.now());
              return (
                <Animated.View key={l.id || idx} entering={FadeInDown.delay(idx * 30)}>
                  <View className="bg-white rounded-2xl" style={{ padding: 12, gap: 6 }}>
                    <View className="flex-row items-center" style={{ gap: 8 }}>
                      <View className="rounded-full" style={{ width: 8, height: 8, backgroundColor: color }} />
                      <Text className="text-[#0F172A] text-xs font-bold">{t.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
                      <Text className="text-[#64748B] text-[11px] font-semibold" numberOfLines={1} style={{ flex: 1 }}>{l.user_email || l.user_name || 'system'}</Text>
                    </View>
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <View className="rounded-full" style={{ paddingHorizontal: 8, paddingVertical: 2, backgroundColor: bg }}>
                        <Text className="text-[10px] font-bold" style={{ color }}>{l.action}</Text>
                      </View>
                      <Text className="text-[#0F172A] text-xs font-semibold flex-1" numberOfLines={2}>
                        {l.target || l.entity_type ? `${l.entity_type || ''} ${l.target || ''}`.trim() : l.description || ''}
                      </Text>
                    </View>
                    {(l.ip_address || l.metadata) && (
                      <Text className="text-[#94A3B8] text-[10px]" numberOfLines={1}>
                        {l.ip_address ? `IP ${l.ip_address}` : ''} {l.metadata ? `· ${typeof l.metadata === 'string' ? l.metadata : JSON.stringify(l.metadata).slice(0, 60)}` : ''}
                      </Text>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
