import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import api from '@/api/client';
import { handleApiError } from '@/utils/error-handler';
import { useAlertStore } from '@/store/useAlertStore';
import { Config } from '@/constants/Config';

const RANGES = [
  { k: '7', label: '7 ngày' },
  { k: '30', label: '30 ngày' },
  { k: 'month', label: 'Tháng này' },
];

export default function ReportsScreen() {
  const router = useRouter();
  const { showAlert } = useAlertStore();
  const [range, setRange] = useState('30');
  const [data, setData] = useState<any>(null);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [dash, ov] = await Promise.all([
          api.get('/analytics/dashboard').catch(() => api.get('/reports/dashboard')),
          api.get('/analytics/overdue').catch(() => ({ data: { data: [] } })),
        ]);
        setData(dash.data.data || dash.data || {});
        setOverdue(ov.data.data || ov.data || []);
      } catch (e) {
        handleApiError(e, 'Lỗi tải báo cáo');
      } finally { setLoading(false); }
    })();
  }, [range]);

  const exportFile = async (kind: 'excel' | 'csv') => {
    try {
      const url = kind === 'excel' ? '/reports/excel' : '/analytics/export-csv';
      const fullUrl = `${Config.API_URL}${url}`;
      showAlert({ type: 'info', title: 'Đang tải', message: `Mở ${kind.toUpperCase()} trong trình duyệt...` });
      Linking.openURL(fullUrl);
    } catch (e) {
      handleApiError(e, 'Lỗi xuất file');
    }
  };

  if (loading) return <View className="flex-1 items-center justify-center bg-[#F1F5F9]"><ActivityIndicator color="#CC0D00" /></View>;

  const totalEq = data?.total_equipment ?? data?.totalEquipment ?? 0;
  const activeLoans = data?.active_loans ?? data?.activeLoans ?? 0;
  const overdueCount = data?.overdue_count ?? overdue.length ?? 0;
  const inMaintenance = data?.in_maintenance ?? 0;
  const weekly: number[] = data?.weekly_borrow_count || data?.chart || [38, 62, 48, 80, 55, 92, 70];
  const topEq: any[] = data?.top_equipment || [];

  const kpis: [string, number | string, string, boolean][] = [
    ['Tổng thiết bị', totalEq, '+12%', true],
    ['Đang mượn', activeLoans, '−8%', false],
    ['Quá hạn', overdueCount, '+3', false],
    ['Bảo trì', inMaintenance, '−2', true],
  ];

  const maxBar = Math.max(...weekly, 1);

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <View className="bg-[#0F172A]" style={{ paddingTop: 58, paddingBottom: 16, paddingHorizontal: 20, gap: 12 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <Pressable className="w-10 h-10 bg-[#1E293B] rounded-full items-center justify-center" onPress={() => router.back()}>
              <Feather name="arrow-left" size={18} color="#FFFFFF" />
            </Pressable>
            <Text className="text-white text-lg font-bold">Báo cáo & Thống kê</Text>
          </View>
        </View>
        <View className="flex-row" style={{ gap: 6 }}>
          {RANGES.map(r => (
            <Pressable key={r.k} onPress={() => setRange(r.k)}
              className="rounded-full" style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: range === r.k ? '#CC0D00' : '#1E293B' }}>
              <Text className="text-[11px] font-bold text-white">{r.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView className="px-5 pt-4" contentContainerStyle={{ paddingBottom: 100, gap: 14 }}>
        <View style={{ gap: 10 }}>
          {[0, 2].map(start => (
            <View key={start} className="flex-row" style={{ gap: 10 }}>
              {[0, 1].map(off => {
                const [label, num, delta, pos] = kpis[start + off];
                return (
                  <View key={off} className="flex-1 bg-white rounded-2xl" style={{ padding: 14, gap: 4 }}>
                    <Text className="text-[#64748B] text-[11px] font-semibold">{label}</Text>
                    <Text className="text-[#0F172A] text-2xl font-extrabold">{num}</Text>
                    <View className="flex-row items-center" style={{ gap: 4 }}>
                      <Feather name={pos ? 'trending-up' : 'trending-down'} size={12} color={pos ? '#15803D' : '#CC0D00'} />
                      <Text className="text-[10px] font-bold" style={{ color: pos ? '#15803D' : '#CC0D00' }}>{delta}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <Text className="text-[#0F172A] text-sm font-bold">Tần suất mượn — 7 ngày</Text>
        <View className="bg-white rounded-2xl" style={{ padding: 14, gap: 8, height: 180 }}>
          <View className="flex-row items-end justify-center" style={{ gap: 8, flex: 1 }}>
            {weekly.slice(0, 7).map((h, i) => (
              <View key={i} className="bg-[#CC0D00] rounded-md" style={{ width: 24, height: (h / maxBar) * 100 }} />
            ))}
          </View>
          <View className="flex-row justify-center" style={{ gap: 8 }}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
              <View key={i} className="items-center" style={{ width: 24 }}>
                <Text className="text-[#94A3B8] text-[10px] font-semibold">{d}</Text>
              </View>
            ))}
          </View>
        </View>

        {topEq.length > 0 && (
          <>
            <Text className="text-[#0F172A] text-sm font-bold">Top thiết bị mượn nhiều</Text>
            <View className="bg-white rounded-2xl" style={{ paddingHorizontal: 14, paddingVertical: 6 }}>
              {topEq.slice(0, 5).map((e: any, i: number) => {
                const pct = topEq[0]?.count ? Math.floor((e.count / topEq[0].count) * 60) : 30;
                return (
                  <View key={i} className="flex-row items-center justify-between" style={{ paddingVertical: 10 }}>
                    <View className="flex-row items-center flex-1" style={{ gap: 8 }}>
                      <Text className="text-[#94A3B8] text-xs font-bold">{i + 1}.</Text>
                      <Text className="text-[#0F172A] text-[13px] font-semibold flex-1" numberOfLines={1}>{e.name}</Text>
                    </View>
                    <View className="flex-row items-center" style={{ gap: 8 }}>
                      <View className="bg-[#FEE2E2] rounded-full" style={{ height: 6, width: 60 }}>
                        <View className="bg-[#CC0D00] rounded-full" style={{ height: 6, width: pct }} />
                      </View>
                      <Text className="text-[#0F172A] text-[11px] font-bold">{e.count}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View className="bg-white rounded-2xl" style={{ padding: 14, gap: 10 }}>
          <Text className="text-[#0F172A] text-sm font-bold">Xuất báo cáo</Text>
          <View className="flex-row" style={{ gap: 8 }}>
            <Pressable onPress={() => exportFile('excel')} className="flex-1 bg-[#15803D] rounded-xl flex-row items-center justify-center" style={{ paddingVertical: 12, gap: 6 }}>
              <Feather name="file-text" size={14} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold">Excel</Text>
            </Pressable>
            <Pressable onPress={() => exportFile('csv')} className="flex-1 bg-[#0F172A] rounded-xl flex-row items-center justify-center" style={{ paddingVertical: 12, gap: 6 }}>
              <Feather name="file" size={14} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold">CSV</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
