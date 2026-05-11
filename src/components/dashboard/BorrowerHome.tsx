import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, FlatList, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import api from '@/api/client';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import Badge from '../ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import LoadingScreen from '../ui/LoadingScreen';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function BorrowerHome() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  
  const { user } = useAuthStore();
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [eqRes, catRes] = await Promise.all([
        api.get('/equipment'),
        api.get('/categories')
      ]);
      setEquipment(eqRes.data.data || eqRes.data);
      setCategories(catRes.data.data || catRes.data);
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

  const filteredEquipment = equipment.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                         item.serial_number.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === null || item.category_id === selectedCategory || item.category?.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderEquipmentItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).duration(500)}
      style={{ width: CARD_WIDTH }}
      className="mb-4"
    >
      <Pressable 
        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
        onPress={() => router.push(`/equipment/${item.id}`)}
      >
        <View className="w-full h-32 bg-gray-50 items-center justify-center">
          {item.image_url ? (
            <Image 
              source={{ uri: item.image_url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Feather name="camera" size={32} color="#D1D1D6" />
          )}
          <View className="absolute top-2 right-2">
            <Badge status={item.status} />
          </View>
        </View>
        <View className="p-3">
          <Text className="font-bold text-gray-900 text-sm" numberOfLines={1}>{item.name}</Text>
          <Text className="text-xs text-gray-500 mt-1">SN: {item.serial_number}</Text>
          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-primary font-bold text-[10px] uppercase">XEM CHI TIẾT</Text>
            <Feather name="chevron-right" size={12} color="#CC0D00" />
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
      <View className="bg-primary pt-16 pb-6 px-6 rounded-b-[30px] shadow-sm">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-white/80 text-sm">Xin chào,</Text>
            <Text className="text-white text-2xl font-bold">{user?.full_name || 'Thành viên'}</Text>
          </View>
          <View className="flex-row">
            <Pressable 
              className="w-11 h-11 bg-white/20 rounded-full items-center justify-center mr-2"
              onPress={() => router.push('/scan')}
            >
              <Feather name="maximize" size={22} color="white" />
            </Pressable>
            <Pressable 
              className="w-11 h-11 bg-white/20 rounded-full items-center justify-center mr-2"
              onPress={() => router.push('/notifications')}
            >
              <Feather name="bell" size={22} color="white" />
            </Pressable>
            <Pressable 
              className="w-11 h-11 bg-white/20 rounded-full items-center justify-center"
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Feather name="user" size={22} color="white" />
            </Pressable>
          </View>
        </View>
        
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm">
          <Feather name="search" size={20} color="#999" />
          <TextInput 
            className="flex-1 ml-3 text-gray-900 text-base py-1"
            placeholder="Tìm kiếm thiết bị..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC0D00" />
        }
      >
        <View className="px-6 py-6">
          <View className="flex-row justify-between items-end mb-4">
            <Text className="font-bold text-lg text-gray-900">Danh mục</Text>
            <Pressable onPress={() => setSelectedCategory(null)}>
              <Text className="text-primary font-bold text-sm">Tất cả</Text>
            </Pressable>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            <Pressable 
              onPress={() => setSelectedCategory(null)}
              className={`px-6 py-2.5 rounded-full mr-3 ${selectedCategory === null ? 'bg-primary' : 'bg-white border border-gray-200'}`}
            >
              <Text className={`font-bold text-xs ${selectedCategory === null ? 'text-white' : 'text-gray-600'}`}>TẤT CẢ</Text>
            </Pressable>
            {categories.map((cat: any, index: number) => (
              <Animated.View key={cat.id} entering={FadeInRight.delay(index * 100)}>
                <Pressable 
                  onPress={() => setSelectedCategory(cat.id)}
                  className={`px-6 py-2.5 rounded-full mr-3 ${selectedCategory === cat.id ? 'bg-primary' : 'bg-white border border-gray-200'}`}
                >
                  <Text className={`font-bold text-xs ${selectedCategory === cat.id ? 'text-white' : 'text-gray-600'}`}>
                    {cat.name.toUpperCase()}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>

          <Text className="font-bold text-lg text-gray-900 mb-4">Thiết bị hiện có</Text>
          <FlatList
            data={filteredEquipment}
            renderItem={renderEquipmentItem}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            ListEmptyComponent={
              <View className="items-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                <Feather name="inbox" size={48} color="#D1D1D6" />
                <Text className="text-gray-400 mt-4 text-sm font-medium">Không tìm thấy thiết bị nào</Text>
              </View>
            }
          />
        </View>
        <View className="h-24" />
      </ScrollView>
    </View>
  );
}
