import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import TransactionDetailModal from '@/components/common/TransactionDetailModal';

export default function StorekeeperHandover() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  
  const [approvedList, setApprovedList] = useState<any[]>([]);
  const [activeList, setActiveList] = useState<any[]>([]);
  
  const [selectedTxDetail, setSelectedTxDetail] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api.get(`/transactions`).then((res) => {
        const all = res.data?.data || res.data || [];
        setApprovedList(all.filter((t: any) => t.status === 'approved'));
        setActiveList(all.filter((t: any) => t.status === 'active'));
      }).catch(() => {});
    }, [])
  );

  const initials = (user?.full_name?.split(' ').pop() || 'K').charAt(0).toUpperCase();

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="light" />

      {/* Dark header */}
      <View className="bg-[#0F172A]" style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 18, gap: 14 }}>
        <View className="flex-row items-center justify-between">
          <View style={{ gap: 2 }}>
            <Text className="text-[#94A3B8] text-xs">Storekeeper</Text>
            <Text className="text-white text-xl font-bold">Quản lý giao/trả</Text>
          </View>
          <View className="w-11 h-11 bg-[#15803D] rounded-full items-center justify-center">
            <Text className="text-white text-base font-bold">{initials}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 200 }}>
        <View style={{ gap: 14 }}>
          {/* Scan/Manual actions */}
          <Animated.View entering={FadeInDown.delay(80)} className="flex-row" style={{ gap: 10 }}>
            <Pressable
              className="flex-1 bg-[#0F172A] rounded-[14px] items-center"
              style={{ padding: 14, gap: 6 }}
              onPress={() => router.push(`/scan`)}
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
              onPress={() => router.push(`/scan`)}
            >
              <View className="w-9 h-9 bg-[#F1F5F9] rounded-lg items-center justify-center">
                <Feather name="edit-3" size={16} color="#0F172A" />
              </View>
              <Text className="text-[#0F172A] text-sm font-bold">Nhập mã</Text>
              <Text className="text-[#94A3B8] text-[10px]">Khi không có camera</Text>
            </Pressable>
          </Animated.View>

          {/* Approved List (Cần bàn giao) */}
          <Animated.View entering={FadeInDown.delay(120)} className="bg-white rounded-[16px]" style={{ padding: 14, gap: 10 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[#0F172A] text-[13px] font-bold">Cần bàn giao (Chờ giao)</Text>
              <View className="bg-[#FEF3C7] rounded-full" style={{ paddingVertical: 2, paddingHorizontal: 8 }}>
                <Text className="text-[#D97706] text-[10px] font-bold">{approvedList.length} đơn</Text>
              </View>
            </View>
            {approvedList.length === 0 && (
              <Text className="text-[#94A3B8] text-xs text-center py-4">Không có thiết bị nào cần giao</Text>
            )}
            {approvedList.map((p: any) => (
              <Pressable
                key={p.id}
                className="flex-row items-center active:scale-[0.98]"
                style={{ gap: 10, paddingTop: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                onPress={() => {
                  setSelectedTxDetail(p);
                  setDetailModalVisible(true);
                }}
              >
                <View className="w-9 h-9 bg-[#FEF3C7] rounded-lg items-center justify-center">
                  <Feather name="package" size={16} color="#D97706" />
                </View>
                <View className="flex-1" style={{ gap: 2 }}>
                  <Text className="text-[#0F172A] text-[13px] font-bold">{p.borrower?.full_name || 'Người dùng'}</Text>
                  <Text className="text-[#94A3B8] text-[10px]" numberOfLines={1}>
                    {p.equipment?.name || 'Thiết bị'} · #BOR-{p.id}
                  </Text>
                </View>
              </Pressable>
            ))}
          </Animated.View>

          {/* Active List (Đã bàn giao / Đang mượn) */}
          <Animated.View entering={FadeInDown.delay(160)} className="bg-white rounded-[16px]" style={{ padding: 14, gap: 10 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[#0F172A] text-[13px] font-bold">Đã bàn giao (Chờ nhận lại)</Text>
              <View className="bg-[#DCFCE7] rounded-full" style={{ paddingVertical: 2, paddingHorizontal: 8 }}>
                <Text className="text-[#15803D] text-[10px] font-bold">{activeList.length} đơn</Text>
              </View>
            </View>
            {activeList.length === 0 && (
              <Text className="text-[#94A3B8] text-xs text-center py-4">Chưa có thiết bị nào đang mượn</Text>
            )}
            {activeList.map((p: any) => (
              <Pressable
                key={p.id}
                className="flex-row items-center active:scale-[0.98]"
                style={{ gap: 10, paddingTop: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                onPress={() => {
                  setSelectedTxDetail(p);
                  setDetailModalVisible(true);
                }}
              >
                <View className="w-9 h-9 bg-[#DCFCE7] rounded-lg items-center justify-center">
                  <Feather name="user-check" size={16} color="#15803D" />
                </View>
                <View className="flex-1" style={{ gap: 2 }}>
                  <Text className="text-[#0F172A] text-[13px] font-bold">{p.borrower?.full_name || 'Người dùng'}</Text>
                  <Text className="text-[#94A3B8] text-[10px]" numberOfLines={1}>
                    {p.equipment?.name || 'Thiết bị'} · #BOR-{p.id}
                  </Text>
                </View>
              </Pressable>
            ))}
          </Animated.View>

        </View>
      </ScrollView>

      {/* CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white flex-row"
        style={{ padding: 16, paddingBottom: 110, gap: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}
      >
        <Pressable
          className="flex-1 bg-[#15803D] rounded-[14px] flex-row items-center justify-center"
          style={{ height: 52, gap: 8 }}
          onPress={() => router.push(`/scan`)}
        >
          <Feather name="maximize" size={16} color="#FFFFFF" />
          <Text className="text-white text-sm font-bold">Mở máy quét (Check-in/out)</Text>
        </Pressable>
      </View>

      <TransactionDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        selectedTxDetail={selectedTxDetail}
      />
    </View>
  );
}
