import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
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

export default function MyLoansScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [rating, setRating] = useState('5');
  const [feedback, setFeedback] = useState('');
  const { user } = useAuthStore();
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
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
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

      {/* Hành động: Gia hạn / Đánh giá */}
      <View className="flex-row justify-end mt-3 border-t border-gray-100 pt-3">
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
      Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá!');
      setRatingModalVisible(false);
      fetchData();
    } catch (error) {
      handleApiError(error, 'Lỗi đánh giá');
    }
  };

  const handleExtend = (tx: any) => {
    Alert.alert('Xác nhận gia hạn', 'Bạn muốn gia hạn thêm 1 ngày cho thiết bị này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Gia hạn', onPress: async () => {
        try {
          const newDueDate = new Date(new Date(tx.due_date).getTime() + 1 * 24 * 60 * 60 * 1000);
          await api.patch(`/transactions/${tx.id}/extend`, { new_due_date: newDueDate.toISOString() });
          Alert.alert('Thành công', 'Gia hạn thành công!');
          fetchData();
        } catch (error) {
          handleApiError(error, 'Lỗi gia hạn');
        }
      }}
    ]);
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
    </View>
  );
}
