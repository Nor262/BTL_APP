import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import api from '@/api/client';
import { StatusBar } from 'expo-status-bar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Input from '@/components/ui/Input';
import { handleApiError } from '@/utils/error-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function AdminAuditScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchLogs = async () => {
    try {
      const response = await api.get('/audit');
      const data = response.data.data || response.data;
      setLogs(data);
      filterLogs(data, searchQuery);
    } catch (error) {
      console.error(error);
      handleApiError(error, 'Không thể tải nhật ký hệ thống');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterLogs = (allLogs: any[], query: string) => {
    if (!query.trim()) {
      setFilteredLogs(allLogs);
      return;
    }
    const cleanQuery = query.toLowerCase();
    const filtered = allLogs.filter(log => 
      log.action?.toLowerCase().includes(cleanQuery) ||
      log.details?.toLowerCase().includes(cleanQuery) ||
      log.user?.full_name?.toLowerCase().includes(cleanQuery) ||
      log.target_type?.toLowerCase().includes(cleanQuery)
    );
    setFilteredLogs(filtered);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs(logs, searchQuery);
  }, [searchQuery]);

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 30).duration(400)}
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="font-bold text-gray-900 text-sm">
            {item.action}
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            Đối tượng: {item.target_type} {item.target_id ? `#${item.target_id}` : ''}
          </Text>
        </View>
        <View className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
          <Text className="text-[10px] text-gray-600 font-bold uppercase">{item.user?.role}</Text>
        </View>
      </View>

      {item.details ? (
        <View className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 mb-2">
          <Text className="text-xs text-gray-600 leading-normal">{item.details}</Text>
        </View>
      ) : null}

      <View className="flex-row justify-between items-center mt-1 pt-1 border-t border-gray-50">
        <View className="flex-row items-center">
          <Feather name="user" size={12} color="#999" />
          <Text className="text-xs text-gray-500 ml-1.5">{item.user?.full_name}</Text>
        </View>
        <View className="flex-row items-center">
          <Feather name="clock" size={12} color="#999" />
          <Text className="text-xs text-gray-400 ml-1.5">
            {new Date(item.created_at).toLocaleString('vi-VN')}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

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
        <Text className="text-xl font-bold text-gray-900">Nhật ký Hệ thống</Text>
      </View>

      <View className="px-6 pt-4 pb-2">
        <Input
          label="Tìm kiếm nhật ký"
          placeholder="Tìm kiếm theo hành động, chi tiết, user..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon="search"
        />
      </View>

      <FlatList
        data={filteredLogs}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); fetchLogs(); }} 
            tintColor="#CC0D00" 
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <Feather name="file-text" size={48} color="#D1D1D6" />
            <Text className="text-gray-400 mt-4 font-bold text-base">Không có log nào phù hợp</Text>
          </View>
        }
      />
    </View>
  );
}
