import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Alert, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
import { useAuthStore } from '@/store/useAuthStore';
import { useAlertStore } from '@/store/useAlertStore';

export default function MyLoansScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [rating, setRating] = useState('5');
  const [feedback, setFeedback] = useState('');
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();
  const router = useRouter();

  const fetchData = async () => {
    try {
      const endpoint = (user?.role === 'admin' || user?.role === 'storekeeper') ? '/transactions' : '/transactions/my';
      const response = await api.get(endpoint);
      setTransactions(response.data.data || response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).duration(500)}
      className="bg-white rounded-2xl mb-3 border border-gray-100 shadow-sm overflow-hidden"
    >
      <Pressable 
        onPress={() => {
          setSelectedTx(item);
          setDetailModalVisible(true);
        }}
        android_ripple={{ color: '#f5f5f5' }}
        className="p-4"
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-4">
            <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>
              {item.equipment?.name}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">SN: {item.equipment?.serial_number}</Text>
          </View>
          <Badge status={item.status} />
        </View>
        
        <View className="flex-row justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
          <View>
            <Text className="text-[10px] text-gray-500 uppercase font-bold mb-1">Ngày mượn</Text>
            <Text className="text-sm font-medium text-gray-900">
              {new Date(item.request_date).toLocaleDateString('vi-VN')}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-[10px] text-gray-500 uppercase font-bold mb-1">Hạn trả</Text>
            <Text className={`text-sm font-medium ${new Date(item.due_date) < new Date() && item.status === 'in_use' ? 'text-red-500' : 'text-gray-900'}`}>
              {new Date(item.due_date).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>

        {item.condition_on_return && (
          <View className="mt-3 flex-row items-center">
            <Feather name="info" size={14} color="#666" />
            <Text className="text-xs text-gray-500 ml-1">Tình trạng trả: {item.condition_on_return}</Text>
          </View>
        )}
      </Pressable>
      
      {/* Hành động: Gia hạn / Đánh giá */}
      <View className="flex-row justify-end px-4 pb-4 border-t border-gray-50 pt-3">
        {item.status === 'active' && !item.is_extended && (
          <Pressable 
            className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 mr-2"
            onPress={() => handleExtend(item)}
          >
            <Text className="text-blue-600 font-medium text-xs">Gia hạn (+1 ngày)</Text>
          </Pressable>
        )}
        {item.status === 'completed' && !item.rating && (
          <Pressable 
            className="bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100"
            onPress={() => {
              setSelectedTx(item);
              setRating('5');
              setFeedback('');
              setRatingModalVisible(true);
            }}
          >
            <Text className="text-orange-600 font-medium text-xs">Đánh giá</Text>
          </Pressable>
        )}
        {item.rating && (
          <View className="flex-row items-center">
            <Feather name="star" size={14} color="#F59E0B" />
            <Text className="text-orange-500 text-xs ml-1 font-bold">{item.rating}/5</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const submitRating = async () => {
    if (!selectedTx) return;
    try {
      await api.patch(`/transactions/${selectedTx.id}/rate`, {
        rating: parseInt(rating, 10),
        feedback
      });
      showAlert({ type: 'success', title: 'Thành công', message: 'Cảm ơn bạn đã đánh giá!' });
      setRatingModalVisible(false);
      fetchData();
    } catch (error) {
      handleApiError(error, 'Lỗi đánh giá');
    }
  };

  const handleExtend = (tx: any) => {
    showAlert({
      type: 'warning',
      title: 'Xác nhận gia hạn',
      message: 'Bạn muốn gia hạn thêm 1 ngày cho thiết bị này?',
      showCancel: true,
      onConfirm: async () => {
        try {
          const newDueDate = new Date(new Date(tx.due_date).getTime() + 1 * 24 * 60 * 60 * 1000);
          await api.patch(`/transactions/${tx.id}/extend`, { new_due_date: newDueDate.toISOString() });
          showAlert({ type: 'success', title: 'Thành công', message: 'Gia hạn thành công!' });
          fetchData();
        } catch (error) {
          handleApiError(error, 'Lỗi gia hạn');
        }
      }
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View className="bg-white pt-16 pb-4 px-6 border-b border-gray-100 flex-row items-center shadow-sm">
        <Pressable 
          className="w-10 h-10 items-center justify-center mr-2"
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#333" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Lịch sử giao dịch</Text>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#CC0D00" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Feather name="inbox" size={60} color="#D1D1D6" />
            <Text className="text-gray-400 mt-4 font-medium">Chưa có giao dịch nào</Text>
          </View>
        }
      />

      {/* Modal Đánh Giá */}
      <Modal visible={ratingModalVisible} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1">
          <Pressable className="absolute inset-0 bg-black/40" onPress={() => setRatingModalVisible(false)} />
          <KeyboardAvoidingView
            behavior="padding"
            className="flex-1 justify-center px-6"
            pointerEvents="box-none"
          >
            <Pressable className="bg-white rounded-[30px] p-6 shadow-2xl" onPress={(e) => e.stopPropagation()}>
              <Text className="text-xl font-bold text-gray-900 mb-2 text-center">Đánh giá thiết bị</Text>
              <Text className="text-gray-500 text-center mb-6">{selectedTx?.equipment?.name}</Text>

              <Input
                label="Điểm đánh giá (1-5)"
                value={rating}
                onChangeText={setRating}
                keyboardType="numeric"
                icon="star"
              />

              <Input
                label="Phản hồi (tùy chọn)"
                value={feedback}
                onChangeText={setFeedback}
                placeholder="Máy dùng tốt..."
                icon="message-circle"
              />

              <View className="flex-row mt-4">
                <Button title="Hủy" onPress={() => setRatingModalVisible(false)} containerClassName="flex-1 mr-2" variant="secondary" />
                <Button title="Gửi đánh giá" onPress={submitRating} containerClassName="flex-1 ml-2" />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal Chi Tiết Giao Dịch */}
      <Modal visible={detailModalVisible} transparent animationType="slide" statusBarTranslucent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[30px] p-6 max-h-[85%] pb-8">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">Chi tiết đơn mượn</Text>
              <Pressable onPress={() => setDetailModalVisible(false)} className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center">
                <Feather name="x" size={18} color="#999" />
              </Pressable>
            </View>

            {selectedTx && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6 flex-row items-center">
                  <View className="w-12 h-12 bg-white rounded-xl items-center justify-center shadow-sm mr-4">
                    <Feather name="monitor" size={24} color="#CC0D00" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900 text-lg">{selectedTx.equipment?.name}</Text>
                    <Text className="text-gray-500 text-sm mt-1">SN: {selectedTx.equipment?.serial_number}</Text>
                  </View>
                </View>

                {/* Info Fields */}
                <DetailRow label="Trạng thái" value={<Badge status={selectedTx.status} />} />
                <DetailRow label="Người mượn" value={selectedTx.borrower?.full_name || user?.full_name} />
                <DetailRow label="Mục đích mượn" value={selectedTx.purpose || selectedTx.notes || 'Không có'} />
                
                <DetailRow 
                  label="Ngày yêu cầu" 
                  value={selectedTx.request_date ? new Date(selectedTx.request_date).toLocaleString('vi-VN') : '—'} 
                />
                <DetailRow 
                  label="Hạn trả dự kiến" 
                  value={selectedTx.due_date ? new Date(selectedTx.due_date).toLocaleDateString('vi-VN') : '—'} 
                />

                {selectedTx.actual_check_out && (
                  <DetailRow 
                    label="Ngày nhận thực tế" 
                    value={new Date(selectedTx.actual_check_out).toLocaleString('vi-VN')} 
                  />
                )}

                {selectedTx.actual_check_in && (
                  <DetailRow 
                    label="Ngày trả thực tế" 
                    value={new Date(selectedTx.actual_check_in).toLocaleString('vi-VN')} 
                  />
                )}

                {selectedTx.rejection_reason && (
                  <DetailRow 
                    label="Lý do từ chối" 
                    value={<Text className="text-red-500 font-semibold">{selectedTx.rejection_reason}</Text>} 
                  />
                )}

                {selectedTx.is_extended && (
                  <DetailRow 
                    label="Gia hạn" 
                    value={<Text className="text-orange-500 font-bold">Đã gia hạn thêm 1 ngày</Text>} 
                  />
                )}

                {selectedTx.rating && (
                  <DetailRow 
                    label="Đánh giá thiết bị" 
                    value={
                      <View className="flex-row items-center">
                        <Feather name="star" size={14} color="#F59E0B" />
                        <Text className="text-orange-500 ml-1 font-bold">{selectedTx.rating}/5 ({selectedTx.feedback || 'Không có nhận xét'})</Text>
                      </View>
                    } 
                  />
                )}

                <Button 
                  title="Đóng" 
                  onPress={() => setDetailModalVisible(false)} 
                  containerClassName="mt-6" 
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View className="flex-row justify-between py-3 border-b border-gray-100 items-center">
      <Text className="text-gray-500 text-sm font-medium">{label}</Text>
      {typeof value === 'string' ? (
        <Text className="text-gray-900 text-sm font-bold">{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}
