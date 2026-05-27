import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import api from '@/api/client';
import { StatusBar } from 'expo-status-bar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Badge from '@/components/ui/Badge';
import { handleApiError } from '@/utils/error-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminEquipmentScreen() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fetchEquipment = async () => {
    try {
      const response = await api.get('/equipment');
      setEquipment(response.data.data || response.data || []);
    } catch (error) {
      console.error(error);
      handleApiError(error, 'Không thể tải danh sách thiết bị');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const filteredEquipment = equipment.filter((item: any) => {
    const nameMatch = item.name?.toLowerCase().includes(search.toLowerCase());
    const serialMatch = item.serial_number?.toLowerCase().includes(search.toLowerCase());
    const skuMatch = item.sku?.toLowerCase().includes(search.toLowerCase());
    return nameMatch || serialMatch || skuMatch;
  });

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).duration(400)}
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm flex-row items-center"
    >
      <Pressable 
        className="flex-1 flex-row items-center"
        onPress={() => router.push(`/equipment/${item.id}`)}
      >
        <View className="w-14 h-14 bg-gray-50 rounded-xl items-center justify-center mr-4 overflow-hidden border border-gray-100">
          {item.image_url ? (
            <Image 
              source={{ uri: item.image_url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Feather name="box" size={24} color="#D1D1D6" />
          )}
        </View>
        <View className="flex-1 pr-2">
          <Text className="font-bold text-gray-900 text-sm" numberOfLines={1}>{item.name}</Text>
          <Text className="text-gray-500 text-xs mt-0.5">SN: {item.serial_number}</Text>
          <View className="flex-row items-center mt-1">
            <Feather name="tag" size={10} color="#999" />
            <Text className="text-[10px] text-gray-500 ml-1 mr-3" numberOfLines={1}>
              {item.category?.name || 'Chưa phân loại'}
            </Text>
            {item.location && (
              <>
                <Feather name="map-pin" size={10} color="#999" />
                <Text className="text-[10px] text-gray-500 ml-1" numberOfLines={1}>
                  {item.location.name}
                </Text>
              </>
            )}
          </View>
        </View>
      </Pressable>
      <View className="items-end justify-center">
        <Badge status={item.status} />
      </View>
    </Animated.View>
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View 
        className="bg-white pb-4 px-6 border-b border-gray-100 flex-row justify-between items-center shadow-sm"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center">
          <Pressable 
            className="w-10 h-10 items-center justify-center mr-2"
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color="#333" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">Quản lý Thiết bị</Text>
        </View>
        <Pressable 
          className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center"
          onPress={() => router.push('/admin/equipment/add' as any)}
        >
          <Feather name="plus" size={20} color="#CC0D00" />
        </Pressable>
      </View>

      {/* Search Input */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center bg-white rounded-2xl px-4 h-12 shadow-sm border border-gray-100">
          <Feather name="search" size={18} color="#999" />
          <TextInput 
            className="flex-1 ml-3 text-gray-900 text-sm h-10"
            style={{ 
              textAlignVertical: 'center',
              includeFontPadding: false,
            }}
            placeholder="Tìm theo tên, serial, SKU..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Feather name="x" size={16} color="#999" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredEquipment}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); fetchEquipment(); }} 
            tintColor="#CC0D00" 
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <Feather name="box" size={48} color="#D1D1D6" />
            <Text className="text-gray-400 mt-4 font-bold text-base">Không tìm thấy thiết bị nào</Text>
            <Text className="text-gray-400 text-xs text-center mt-1">Ấn nút dấu cộng ở góc trên để thêm mới.</Text>
          </View>
        }
      />
    </View>
  );
}
