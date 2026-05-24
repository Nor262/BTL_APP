import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import api from '@/api/client';
import { handleApiError } from '@/utils/error-handler';

type Booking = { from: string; to: string; borrower_name?: string; count?: number };

export default function AvailabilityScreen() {
  const router = useRouter();
  const { equipmentId, equipmentName } = useLocalSearchParams<{ equipmentId: string; equipmentName?: string }>();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalQty, setTotalQty] = useState(1);
  const [month, setMonth] = useState(new Date());
  const [selFrom, setSelFrom] = useState<Date | null>(null);
  const [selTo, setSelTo] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/equipment/${equipmentId}/availability`);
        const d = res.data.data || res.data || {};
        setBookings(d.bookings || d.reservations || []);
        setTotalQty(d.total_quantity || d.quantity || 1);
      } catch (e) {
        handleApiError(e, 'Lỗi tải lịch khả dụng');
      } finally { setLoading(false); }
    })();
  }, [equipmentId]);

  const monthData = useMemo(() => {
    const y = month.getFullYear();
    const m = month.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const startDow = firstDay.getDay(); // 0=CN
    const daysInMonth = lastDay.getDate();
    const cells: { day: number | null; date: Date | null }[] = [];
    for (let i = 0; i < startDow; i++) cells.push({ day: null, date: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, date: new Date(y, m, d) });
    while (cells.length % 7 !== 0) cells.push({ day: null, date: null });
    const rows: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [month]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const bookingsOnDay = (d: Date) =>
    bookings.filter(b => {
      const f = new Date(b.from); const t = new Date(b.to);
      f.setHours(0, 0, 0, 0); t.setHours(0, 0, 0, 0);
      return d >= f && d <= t;
    });

  const dayStatus = (d: Date): 'today' | 'selected' | 'booked' | 'partial' | 'avail' => {
    if (selFrom && selTo && d >= selFrom && d <= selTo) return 'selected';
    if (selFrom && !selTo && d.getTime() === selFrom.getTime()) return 'selected';
    if (d.getTime() === today.getTime()) return 'today';
    const used = bookingsOnDay(d).reduce((a, b) => a + (b.count || 1), 0);
    if (used >= totalQty) return 'booked';
    if (used > 0) return 'partial';
    return 'avail';
  };

  const handleDayPress = (d: Date) => {
    if (dayStatus(d) === 'booked') return;
    if (!selFrom || (selFrom && selTo)) { setSelFrom(d); setSelTo(null); return; }
    if (d < selFrom) { setSelFrom(d); return; }
    setSelTo(d);
  };

  const conflicts = (selFrom && selTo)
    ? bookings.filter(b => {
        const f = new Date(b.from); const t = new Date(b.to);
        return !(t < selFrom || f > selTo);
      })
    : [];
  const daysSelected = selFrom && selTo ? Math.floor((selTo.getTime() - selFrom.getTime()) / 86400000) + 1 : 0;
  const availableInRange = (() => {
    if (!selFrom || !selTo) return totalQty;
    let maxUsed = 0;
    for (let d = new Date(selFrom); d <= selTo; d = new Date(d.getTime() + 86400000)) {
      maxUsed = Math.max(maxUsed, bookingsOnDay(d).reduce((a, b) => a + (b.count || 1), 0));
    }
    return Math.max(0, totalQty - maxUsed);
  })();

  if (loading) return <View className="flex-1 items-center justify-center bg-[#F8FAFC]"><ActivityIndicator color="#CC0D00" /></View>;

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <View className="flex-row items-center justify-between px-5" style={{ paddingTop: 58, paddingBottom: 8 }}>
        <Pressable className="w-10 h-10 bg-white rounded-full items-center justify-center" onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#0F172A" />
        </Pressable>
        <Text className="text-[#0F172A] text-lg font-bold">Lịch khả dụng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 140, gap: 14 }}>
        <View className="bg-white rounded-2xl flex-row items-center" style={{ padding: 12, gap: 12 }}>
          <View className="w-12 h-12 bg-[#F1F5F9] rounded-xl items-center justify-center">
            <Feather name="package" size={22} color="#64748B" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text className="text-[#0F172A] text-sm font-bold">{equipmentName || 'Thiết bị'}</Text>
            <Text className="text-[#64748B] text-[11px]">EQ-{equipmentId} · {totalQty} cái</Text>
          </View>
        </View>

        <View className="bg-white rounded-2xl flex-row items-center justify-between" style={{ padding: 12 }}>
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
              <Feather name="chevron-left" size={20} color="#0F172A" />
            </Pressable>
            <Text className="text-[#0F172A] text-base font-bold">Tháng {month.getMonth() + 1}, {month.getFullYear()}</Text>
            <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
              <Feather name="chevron-right" size={20} color="#0F172A" />
            </Pressable>
          </View>
          <Pressable onPress={() => setMonth(new Date())} className="bg-[#0F172A] rounded-full" style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text className="text-white text-[11px] font-bold">Hôm nay</Text>
          </Pressable>
        </View>

        <View className="bg-white rounded-2xl" style={{ padding: 10, gap: 6 }}>
          <View className="flex-row justify-between">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(w => (
              <View key={w} style={{ width: 44, alignItems: 'center', paddingVertical: 6 }}>
                <Text className="text-[#94A3B8] text-[11px] font-bold">{w}</Text>
              </View>
            ))}
          </View>
          {monthData.map((row, ri) => (
            <View key={ri} className="flex-row justify-between">
              {row.map((c, ci) => {
                if (!c.date) return <View key={ci} style={{ width: 44, height: 44 }} />;
                const s = dayStatus(c.date);
                const bg = s === 'selected' ? '#FEE2E2' : s === 'booked' ? '#F1F5F9' : '#FFFFFF';
                const txtCol = s === 'selected' ? '#CC0D00' : s === 'booked' ? '#94A3B8' : '#0F172A';
                return (
                  <Pressable key={ci} onPress={() => handleDayPress(c.date!)}
                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: s === 'today' ? 1.5 : 0, borderColor: '#CC0D00' }}>
                    <Text style={{ color: txtCol, fontWeight: s === 'selected' || s === 'today' ? '800' : '600', fontSize: 13 }}>{c.day}</Text>
                    {s === 'partial' && <View className="absolute bottom-1 bg-[#B45309] rounded-full" style={{ width: 4, height: 4 }} />}
                  </Pressable>
                );
              })}
            </View>
          ))}
          <View className="flex-row justify-center items-center" style={{ gap: 14, paddingTop: 8 }}>
            {[['#FEE2E2', 'Đã chọn'], ['#F1F5F9', 'Hết slot'], ['#B45309', 'Còn ít']].map(([c, l]) => (
              <View key={l} className="flex-row items-center" style={{ gap: 4 }}>
                <View className="rounded-full" style={{ width: 8, height: 8, backgroundColor: c }} />
                <Text className="text-[#64748B] text-[10px] font-semibold">{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {selFrom && (
          <>
            <Text className="text-[#64748B] text-[11px] font-bold tracking-wider">ĐÃ CHỌN</Text>
            <View className="bg-white rounded-2xl" style={{ padding: 12, gap: 4 }}>
              <Text className="text-[#0F172A] text-sm font-bold">
                Từ {selFrom.toLocaleDateString('vi-VN')} {selTo ? `→ Đến ${selTo.toLocaleDateString('vi-VN')}` : ''}
              </Text>
              {selTo && (
                <Text className="text-[#64748B] text-[11px]">{daysSelected} ngày · còn {availableInRange}/{totalQty} cái khả dụng</Text>
              )}
            </View>
            {conflicts.length > 0 && (
              <>
                <Text className="text-[#64748B] text-[11px] font-bold tracking-wider">ĐÃ ĐẶT TRONG KHOẢNG</Text>
                <View className="bg-white rounded-2xl" style={{ padding: 12, gap: 6 }}>
                  {conflicts.slice(0, 5).map((b, i) => (
                    <Text key={i} className="text-[#64748B] text-xs">
                      • {new Date(b.from).toLocaleDateString('vi-VN')} → {new Date(b.to).toLocaleDateString('vi-VN')} — {b.borrower_name || 'Người dùng'} ({b.count || 1} cái)
                    </Text>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <View className="absolute left-0 right-0 bottom-0 bg-white" style={{ paddingTop: 14, paddingBottom: 28, paddingHorizontal: 20 }}>
        <Pressable
          disabled={!selFrom || !selTo || availableInRange === 0}
          onPress={() => router.replace({
            pathname: '/borrow-request',
            params: { equipmentId, from: selFrom?.toISOString(), to: selTo?.toISOString() },
          } as any)}
          className="rounded-2xl items-center justify-center flex-row"
          style={{ paddingVertical: 16, gap: 6, backgroundColor: selFrom && selTo && availableInRange > 0 ? '#CC0D00' : '#E2E8F0' }}>
          <Feather name="arrow-right" size={16} color={selFrom && selTo && availableInRange > 0 ? '#FFFFFF' : '#94A3B8'} />
          <Text className="font-bold text-sm" style={{ color: selFrom && selTo && availableInRange > 0 ? '#FFFFFF' : '#94A3B8' }}>
            {!selFrom ? 'Chọn ngày mượn' : !selTo ? 'Chọn ngày trả' : availableInRange === 0 ? 'Hết slot trong khoảng' : `Tiếp tục mượn ${daysSelected} ngày`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
