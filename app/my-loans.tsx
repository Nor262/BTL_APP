import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { IconOutline } from '@ant-design/icons-react-native';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Badge from '@/components/ui/Badge';
import { StatusBar } from 'expo-status-bar';

export default function MyLoansScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions/my');
      setTransactions(response.data.data || response.data);
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

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100)}
      className="bg-white p-5 rounded-[30px] mb-4 shadow-sm border border-gray-100"
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1">
          <Text className="font-bold text-secondary text-lg" numberOfLines={1}>{item.equipment.name}</Text>
          <Text className="text-xs text-gray-400 mt-1">SN: {item.equipment.serial_number}</Text>
        </View>
        <Badge status={item.status} />
      </View>
      
      <View className="flex-row justify-between pt-4 border-t border-gray-50">
        <View>
          <Text className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Ngày mượn</Text>
          <Text className="text-sm text-secondary font-medium mt-1">
            {new Date(item.request_date).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Hạn trả</Text>
          <Text className="text-sm text-primary font-bold mt-1">
            {new Date(item.due_date).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>
      
      {item.status === 'completed' && item.actual_check_in && (
        <View className="mt-4 p-3 bg-success/5 rounded-2xl flex-row items-center">
          <IconOutline name="check-circle" size={14} color="#34C759" />
          <Text className="text-success text-xs font-bold ml-2">
            ĐÃ TRẢ VÀO {new Date(item.actual_check_in).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      )}
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-surface-muted">
      <StatusBar style="dark" />
      <View className="bg-white pt-16 pb-6 px-6 flex-row items-center justify-between shadow-sm">
        <Pressable 
          onPress={() => router.back()} 
          className="w-10 h-10 bg-surface-muted rounded-xl items-center justify-center"
        >
          <IconOutline name="arrow-left" size={20} color="#1C1C1E" />
        </Pressable>
        <Text className="text-xl font-bold text-secondary">Lịch sử mượn trả</Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#CC0D00" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => { setRefreshing(true); fetchTransactions(); }} 
              tintColor="#CC0D00" 
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center mt-20 p-10 bg-white rounded-[40px] border border-dashed border-gray-200">
              <IconOutline name="inbox" size={64} color="#D1D1D6" />
              <Text className="text-gray-400 mt-4 text-base font-medium">Bạn chưa có đơn mượn nào</Text>
              <Pressable 
                onPress={() => router.replace('/(tabs)')}
                className="mt-6 px-6 py-3 bg-primary/10 rounded-2xl"
              >
                <Text className="text-primary font-bold">Khám phá thiết bị</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}
