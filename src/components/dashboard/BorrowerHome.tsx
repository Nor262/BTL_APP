import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from '@/tw';
import { Image } from 'expo-image';
import { FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { IconOutline } from '@ant-design/icons-react-native';
import api from '@/api/client';
import { useRouter } from 'expo-router';

export default function BorrowerHome() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [eqRes, catRes] = await Promise.all([
        api.get('/equipment'),
        api.get('/categories')
      ]);
      setEquipment(eqRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredEquipment = equipment.filter((item: any) => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.serial_number.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <Pressable 
      className="w-[47%] mb-4 bg-white rounded-ant overflow-hidden shadow-sm border border-gray-100"
      onPress={() => router.push(`/equipment/${item.id}`)}
    >
      <View className="w-full h-32 bg-gray-100">
        <Image 
          source={item.image_url ? { uri: item.image_url } : require('@/assets/images/favicon.png')}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      </View>
      <View className="p-2">
        <Text className="font-bold text-sm" numberOfLines={1}>{item.name}</Text>
        <Text className="text-xs text-gray-500 mt-1">SN: {item.serial_number}</Text>
        <View className="flex-row items-center mt-2">
          <View className={`w-2 h-2 rounded-full ${item.status === 'available' ? 'bg-green-500' : 'bg-orange-500'}`} />
          <Text className="text-[10px] text-gray-600 ml-1 uppercase">
            {item.status === 'available' ? 'Sẵn sàng' : 'Đang mượn'}
          </Text>
        </View>
      </View>
    </Pressable>
  );


  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#CC0D00" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-primary pt-12 pb-6 px-4">
        <Text className="text-white text-2xl font-bold">Xin chào!</Text>
        <Text className="text-white opacity-80 text-sm mt-1">Bạn muốn mượn thiết bị gì hôm nay?</Text>
        
        <View className="flex-row items-center bg-white rounded-ant mt-4 px-3 py-2">
          <IconOutline name="search" size={20} color="#999" />
          <TextInput 
            className="flex-1 ml-2 text-sm"
            placeholder="Tìm kiếm thiết bị..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View className="px-4 py-4">
        <Text className="font-bold text-lg mb-3">Danh mục</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <Pressable className="bg-primary px-4 py-2 rounded-full mr-2">
            <Text className="text-white text-xs font-bold">Tất cả</Text>
          </Pressable>
          {categories.map((cat: any) => (
            <Pressable key={cat.id} className="bg-white border border-gray-200 px-4 py-2 rounded-full mr-2">
              <Text className="text-gray-600 text-xs">{cat.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text className="font-bold text-lg mb-3">Danh sách thiết bị</Text>
        <FlatList
          data={filteredEquipment}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#CC0D00']} />
          }
          ListEmptyComponent={
            <View className="items-center mt-10">
              <Text className="text-gray-400">Không tìm thấy thiết bị nào</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
