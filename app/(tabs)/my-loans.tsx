import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import api from '@/api/client';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Badge from '@/components/ui/Badge';
import { StatusBar } from 'expo-status-bar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { handleApiError } from '@/utils/error-handler';
import { useAlertStore } from '@/store/useAlertStore';

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'active', label: 'Đang mượn' },
  { key: 'completed', label: 'Đã trả' },
];

export default function MyLoansScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [rating, setRating] = useState('5');
  const [feedback, setFeedback] = useState('');
  const router = useRouter();
  const { showAlert } = useAlertStore();

  const fetchData = async () => {
    try {
      const response = await api.get('/transactions/my');
      setTransactions(response.data.data || response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = transactions.filter(t => {
    if (activeTab === 'active') return t.status === 'active' || t.status === 'overdue';
    if (activeTab === 'pending') return t.status === 'pending' || t.status === 'approved';
    if (activeTab === 'completed') return t.status === 'completed' || t.status === 'rejected';
    return true;
  });

  const submitRating = async () => {
    if (!selectedTx) return;
    try {
      await api.patch(`/transactions/${selectedTx.id}/rate`, { rating: parseInt(rating, 10), feedback });
      showAlert({ type: 'success', title: 'Thành công', message: 'Cảm ơn bạn đã đánh giá!' });
      setRatingModalVisible(false);
      fetchData();
    } catch (error) {
      handleApiError(error, 'Lỗi đánh giá');
    }
  };

  const handleExtend = (tx: any) => {
    showAlert({
      type: 'info', title: 'Xác nhận gia hạn',
      message: 'Bạn muốn gia hạn thêm 7 ngày?',
      showCancel: true,
      onConfirm: async () => {
        try {
          const newDue = new Date(new Date(tx.due_date).getTime() + 7 * 86400000);
          await api.patch(`/transactions/${tx.id}/extend`, { new_due_date: newDue.toISOString() });
          showAlert({ type: 'success', title: 'Thành công', message: 'Gia hạn thành công!' });
          fetchData();
        } catch (error) { handleApiError(error, 'Lỗi gia hạn'); }
      }
    });
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isOverdue = item.status === 'overdue' || (item.status === 'active' && new Date(item.due_date) < new Date());
    return (
      <Animated.View entering={FadeInDown.delay(index * 80)}>
        <Pressable
          className="bg-white rounded-[18px]"
          style={{ padding: 14, gap: 12, marginBottom: 12 }}
          onPress={() => router.push(`/equipment/${item.equipment_id}`)}
        >
          {/* Top */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3" style={{ gap: 2 }}>
              <Text className="text-[#0F172A] text-sm font-bold" numberOfLines={1}>
                {item.equipment?.name || 'Thiết bị'}
              </Text>
              <Text className="text-[#94A3B8] text-[11px]">SN: {item.equipment?.serial_number || '---'}</Text>
            </View>
            <Badge status={item.status} />
          </View>

          {/* Body */}
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <View className="w-11 h-11 bg-[#FEE5E3] rounded-xl items-center justify-center">
              <Feather name="box" size={20} color="#CC0D00" />
            </View>
            <View className="flex-1 flex-row justify-between">
              <View style={{ gap: 2 }}>
                <Text className="text-[#94A3B8] text-[10px] font-bold">NGÀY MƯỢN</Text>
                <Text className="text-[#0F172A] text-xs font-medium">
                  {new Date(item.request_date || item.start_date).toLocaleDateString('vi-VN')}
                </Text>
              </View>
              <View className="items-end" style={{ gap: 2 }}>
                <Text className="text-[#94A3B8] text-[10px] font-bold">HẠN TRẢ</Text>
                <Text className={`text-xs font-medium ${isOverdue ? 'text-[#EF4444]' : 'text-[#0F172A]'}`}>
                  {new Date(item.due_date).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-end" style={{ paddingTop: 6, gap: 8 }}>
            {(item.status === 'active' || item.status === 'overdue') && !item.is_extended && (
              <Pressable
                className="bg-[#EFF6FF] rounded-lg flex-row items-center"
                style={{ gap: 4, paddingVertical: 6, paddingHorizontal: 10 }}
                onPress={() => handleExtend(item)}
              >
                <Feather name="plus" size={12} color="#3B82F6" />
                <Text className="text-[#3B82F6] text-[11px] font-semibold">Gia hạn</Text>
              </Pressable>
            )}
            {item.status === 'completed' && !item.rating && (
              <Pressable
                className="bg-[#FFF7ED] rounded-lg flex-row items-center"
                style={{ gap: 4, paddingVertical: 6, paddingHorizontal: 10 }}
                onPress={() => { setSelectedTx(item); setRating('5'); setFeedback(''); setRatingModalVisible(true); }}
              >
                <Feather name="star" size={12} color="#F59E0B" />
                <Text className="text-[#F59E0B] text-[11px] font-semibold">Đánh giá</Text>
              </Pressable>
            )}
            {item.rating && (
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <Feather name="star" size={12} color="#F59E0B" />
                <Text className="text-[#F59E0B] text-[11px] font-bold">{item.rating}/5</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="px-5" style={{ paddingTop: 62 }}>
        <View className="flex-row items-center justify-between" style={{ height: 56 }}>
          <Text className="text-[#0F172A] text-2xl font-bold">Yêu cầu của tôi</Text>
          <Pressable
            className="w-10 h-10 bg-white rounded-full items-center justify-center"
          >
            <Feather name="download" size={18} color="#0F172A" />
          </Pressable>
        </View>

        {/* Tabs */}
        <View
          className="bg-white rounded-xl flex-row mt-4"
          style={{ height: 42, padding: 3 }}
        >
          {TABS.map(tab => (
            <Pressable
              key={tab.key}
              className={`flex-1 rounded-[9px] items-center justify-center ${activeTab === tab.key ? 'bg-[#0F172A]' : ''}`}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text className={`text-[11px] font-semibold ${activeTab === tab.key ? 'text-white' : 'text-[#64748B]'}`}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#CC0D00" />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20" style={{ gap: 12 }}>
            <View className="w-16 h-16 bg-white rounded-full items-center justify-center">
              <Feather name="inbox" size={32} color="#E2E8F0" />
            </View>
            <Text className="text-[#94A3B8] text-sm">Chưa có yêu cầu nào</Text>
          </View>
        }
      />

      {/* Rating Modal */}
      <Modal visible={ratingModalVisible} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1">
          <Pressable className="absolute inset-0 bg-black/40" onPress={() => setRatingModalVisible(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 justify-center px-6"
            pointerEvents="box-none"
          >
            <Pressable className="bg-white rounded-[24px] p-6" onPress={e => e.stopPropagation()} style={{ gap: 16 }}>
              <Text className="text-[#0F172A] text-lg font-bold text-center">Đánh giá thiết bị</Text>
              <Text className="text-[#64748B] text-center text-sm">{selectedTx?.equipment?.name}</Text>
              <Input label="Điểm đánh giá (1-5)" value={rating} onChangeText={setRating} keyboardType="numeric" icon="star" />
              <Input label="Phản hồi (tùy chọn)" value={feedback} onChangeText={setFeedback} placeholder="Nhận xét..." icon="message-circle" />
              <View className="flex-row" style={{ gap: 10 }}>
                <Button title="Hủy" onPress={() => setRatingModalVisible(false)} containerClassName="flex-1" variant="secondary" />
                <Button title="Gửi đánh giá" onPress={submitRating} containerClassName="flex-1" />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
