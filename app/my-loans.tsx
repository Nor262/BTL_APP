import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from '@/tw';
import { FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { IconOutline } from '@ant-design/icons-react-native';
import { useRouter } from 'expo-router';
import api from '@/api/client';

export default function MyLoansScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions/my');
      setTransactions(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-blue-500 bg-blue-50';
      case 'approved': return 'text-green-500 bg-green-50';
      case 'active': return 'text-orange-500 bg-orange-50';
      case 'completed': return 'text-gray-500 bg-gray-50';
      case 'overdue': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'active': return 'Đang mượn';
      case 'completed': return 'Đã trả';
      case 'overdue': return 'Quá hạn';
      default: return status;
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className="bg-white p-4 rounded-ant mb-3 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="font-bold text-gray-900">{item.equipment.name}</Text>
          <Text className="text-xs text-gray-500">SN: {item.equipment.serial_number}</Text>
        </View>
        <View className={`px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
          <Text className="text-[10px] font-bold uppercase">{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-50">
        <View>
          <Text className="text-[10px] text-gray-400 uppercase">Ngày mượn</Text>
          <Text className="text-xs text-gray-700">{new Date(item.request_date).toLocaleDateString('vi-VN')}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[10px] text-gray-400 uppercase">Hạn trả</Text>
          <Text className="text-xs text-gray-700 font-bold">{new Date(item.due_date).toLocaleDateString('vi-VN')}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white pt-12 pb-4 px-4 flex-row items-center border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-2">
          <IconOutline name="arrow-left" size={24} color="#333" />
        </Pressable>
        <Text className="text-xl font-bold ml-2">Đơn mượn của tôi</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#CC0D00" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTransactions(); }} colors={['#CC0D00']} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <IconOutline name="inbox" size={64} color="#ddd" />
              <Text className="text-gray-400 mt-2">Bạn chưa có đơn mượn nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
