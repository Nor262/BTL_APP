import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import api from '@/api/client';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { handleApiError } from '@/utils/error-handler';

export default function StorekeeperRequestsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const fetchRequests = async () => {
    try {
      const response = await api.get('/transactions');
      const allTx = response.data.data || response.data;
      // Filter only pending requests
      const pendingTx = allTx.filter((tx: any) => tx.status === 'pending');
      setRequests(pendingTx);
      applySearch(pendingTx, searchQuery);
    } catch (error) {
      console.error(error);
      handleApiError(error, 'Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applySearch = (list: any[], query: string) => {
    if (!query.trim()) {
      setFilteredRequests(list);
      return;
    }
    const cleanQuery = query.toLowerCase();
    const filtered = list.filter((tx: any) => 
      tx.equipment?.name?.toLowerCase().includes(cleanQuery) ||
      tx.borrower?.full_name?.toLowerCase().includes(cleanQuery) ||
      tx.borrower?.student_id?.toLowerCase().includes(cleanQuery)
    );
    setFilteredRequests(filtered);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    applySearch(requests, searchQuery);
  }, [searchQuery, requests]);

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).duration(400)}
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 }}
    >
      <Pressable onPress={() => router.push(`/storekeeper/request-detail?id=${item.id}`)}>
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-4">
            <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>
              {item.equipment?.name}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">SN: {item.equipment?.serial_number}</Text>
          </View>
          <View className="bg-yellow-50 px-2.5 py-1 rounded-full border border-yellow-100">
            <Text className="text-yellow-600 font-bold text-[10px]">CHỜ DUYỆT</Text>
          </View>
        </View>

        <View className="border-t border-b border-gray-50 py-3 my-1">
          <View className="flex-row items-center mb-1.5">
            <Feather name="user" size={14} color="#666" />
            <Text className="text-xs text-gray-700 ml-2 font-medium">
              {item.borrower?.full_name || item.borrower?.username}
            </Text>
            {item.borrower?.student_id && (
              <Text className="text-[10px] text-gray-400 ml-1.5 font-bold">
                ({item.borrower.student_id})
              </Text>
            )}
          </View>
          {item.borrower?.phone && (
            <View className="flex-row items-center mb-1.5">
              <Feather name="phone" size={14} color="#666" />
              <Text className="text-xs text-gray-600 ml-2">{item.borrower.phone}</Text>
            </View>
          )}
          <View className="flex-row items-center">
            <Feather name="calendar" size={14} color="#666" />
            <Text className="text-xs text-gray-600 ml-2">
              Hạn mượn: {new Date(item.start_date).toLocaleDateString('vi-VN')} - {new Date(item.due_date).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>

        {item.notes && (
          <View className="mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            <Text className="text-[10px] font-bold text-gray-400 uppercase">Lý do mượn</Text>
            <Text className="text-xs text-gray-600 mt-0.5" numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}

        <View className="flex-row justify-end mt-3 pt-2">
          <View className="flex-row items-center">
            <Text className="text-primary font-bold text-xs mr-1">Xem chi tiết</Text>
            <Feather name="chevron-right" size={14} color="#CC0D00" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View className="bg-white pt-16 pb-4 px-6 border-b border-gray-100 flex-row items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 }}>
        <Pressable 
          className="w-10 h-10 items-center justify-center mr-2"
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#333" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Yêu cầu chờ duyệt</Text>
      </View>

      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 }}>
          <Feather name="search" size={18} color="#999" />
          <TextInput
            className="flex-1 ml-2 text-sm text-gray-800"
            placeholder="Tìm kiếm người mượn hoặc thiết bị..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <FlatList
        data={filteredRequests}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); fetchRequests(); }} 
            tintColor="#CC0D00" 
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20 bg-white rounded-2xl mx-6 border border-gray-100 p-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 }}>
            <Feather name="check-square" size={48} color="#D1D1D6" />
            <Text className="text-gray-400 mt-4 font-bold text-base">Không có yêu cầu chờ duyệt</Text>
            <Text className="text-gray-400 text-xs text-center mt-1">Tất cả các đơn mượn đã được xử lý hoàn tất.</Text>
          </View>
        }
      />
    </View>
  );
}
