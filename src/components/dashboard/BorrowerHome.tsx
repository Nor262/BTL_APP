import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, FlatList, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { IconOutline } from '@ant-design/icons-react-native';
import api from '@/api/client';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import Badge from '../ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';

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
        className="bg-white rounded-3xl overflow-hidden shadow-premium border border-gray-100"
        onPress={() => router.push(`/equipment/${item.id}`)}
      >
        <View className="w-full h-40 bg-surface-muted">
          <Image 
            source={item.image_url ? { uri: item.image_url } : { uri: 'https://picsum.photos/seed/' + item.id + '/400/300' }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          <View className="absolute top-2 right-2">
            <Badge status={item.status} />
          </View>
        </View>
        <View className="p-3">
          <Text className="font-bold text-secondary text-base" numberOfLines={1}>{item.name}</Text>
          <Text className="text-xs text-gray-400 mt-1">SN: {item.serial_number}</Text>
          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-primary font-bold text-xs">XEM CHI TIẾT</Text>
            <IconOutline name="right" size={12} color="#CC0D00" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#CC0D00" />
        <Text className="text-gray-400 mt-4 font-medium">Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-muted">
      <View className="bg-secondary-dark pt-16 pb-8 px-6 rounded-b-[40px] shadow-premium overflow-hidden">
        <LinearGradient
          colors={['#CC0D00', '#8B0000']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.8 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-white/70 text-base">Xin chào,</Text>
            <Text className="text-white text-2xl font-bold">{user?.full_name || 'Thành viên'}</Text>
          </View>
          <Pressable 
            className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center border border-white/30"
            onPress={() => router.push('/(tabs)/profile')}
          >
            <IconOutline name="user" size={24} color="white" />
          </Pressable>
        </View>
        
        <View className="flex-row items-center bg-white/10 rounded-2xl px-4 py-3 border border-white/20">
          <IconOutline name="search" size={20} color="white" />
          <TextInput 
            className="flex-1 ml-3 text-white text-base"
            placeholder="Tìm kiếm thiết bị..."
            placeholderTextColor="rgba(255,255,255,0.5)"
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
            <Text className="font-bold text-xl text-secondary">Danh mục</Text>
            <Pressable onPress={() => setSelectedCategory(null)}>
              <Text className="text-primary font-bold text-sm">Xem tất cả</Text>
            </Pressable>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
            <Pressable 
              onPress={() => setSelectedCategory(null)}
              className={`px-6 py-3 rounded-2xl mr-3 ${selectedCategory === null ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-white border border-gray-100'}`}
            >
              <Text className={`font-bold text-sm ${selectedCategory === null ? 'text-white' : 'text-gray-500'}`}>TẤT CẢ</Text>
            </Pressable>
            {categories.map((cat: any, index: number) => (
              <Animated.View key={cat.id} entering={FadeInRight.delay(index * 100)}>
                <Pressable 
                  onPress={() => setSelectedCategory(cat.id)}
                  className={`px-6 py-3 rounded-2xl mr-3 ${selectedCategory === cat.id ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-white border border-gray-100'}`}
                >
                  <Text className={`font-bold text-sm ${selectedCategory === cat.id ? 'text-white' : 'text-gray-500'}`}>
                    {cat.name.toUpperCase()}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>

          <Text className="font-bold text-xl text-secondary mb-4">Thiết bị hiện có</Text>
          <FlatList
            data={filteredEquipment}
            renderItem={renderEquipmentItem}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            ListEmptyComponent={
              <View className="items-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <IconOutline name="info-circle" size={48} color="#D1D1D6" />
                <Text className="text-gray-400 mt-4 text-base font-medium">Không tìm thấy thiết bị nào</Text>
              </View>
            }
          />
        </View>
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
