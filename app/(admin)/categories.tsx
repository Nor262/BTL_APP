import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '@/api/client';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data?.data || res.data || []);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedId(null);
    setName('');
    setDescription('');
    setShowModal(true);
  };

  const handleOpenEdit = (category: any) => {
    setIsEditing(true);
    setSelectedId(category.id);
    setName(category.name);
    setDescription(category.description || '');
    setShowModal(true);
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Xóa danh mục',
      `Bạn có chắc chắn muốn xóa danh mục "${name}"? Các thiết bị thuộc danh mục này có thể bị ảnh hưởng.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/categories/${id}`);
              Alert.alert('Thành công', 'Đã xóa danh mục');
              fetchCategories();
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xóa danh mục');
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên danh mục không được để trống');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && selectedId) {
        await api.put(`/categories/${selectedId}`, { name, description });
        Alert.alert('Thành công', 'Đã cập nhật danh mục');
      } else {
        await api.post('/categories', { name, description });
        Alert.alert('Thành công', 'Đã thêm danh mục mới');
      }
      setShowModal(false);
      fetchCategories();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể lưu danh mục');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1 px-4 py-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC0D00" />}
      >
        <View className="flex-row justify-between items-center mb-4">
          <Text className="font-bold text-gray-900 text-lg">Danh sách ({categories.length})</Text>
          <Pressable 
            onPress={handleOpenAdd}
            className="bg-primary px-4 py-2 rounded-full flex-row items-center active:scale-95"
          >
            <Feather name="plus" size={16} color="white" />
            <Text className="text-white font-bold text-sm ml-1">Thêm mới</Text>
          </Pressable>
        </View>
        
        {categories.map((category, index) => (
          <Animated.View 
            key={category.id} 
            entering={FadeInDown.delay(index * 50).duration(400)}
            className="bg-white p-4 rounded-2xl shadow-sm mb-3 border border-gray-100 flex-row items-center justify-between"
          >
            <View className="w-12 h-12 bg-green-50 rounded-xl items-center justify-center mr-3">
              <Feather name="layers" size={24} color="#34C759" />
            </View>
            <View className="flex-1 mr-2">
              <Text className="font-bold text-gray-900 text-base flex-shrink" numberOfLines={1}>{category.name}</Text>
              <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>
                {category.description || 'Không có mô tả'}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Pressable 
                onPress={() => handleOpenEdit(category)}
                className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-2 active:scale-95"
              >
                <Feather name="edit-2" size={18} color="#007AFF" />
              </Pressable>
              
              <Pressable 
                onPress={() => handleDelete(category.id, category.name)}
                className="w-10 h-10 bg-red-50 rounded-full items-center justify-center active:scale-95"
              >
                <Feather name="trash-2" size={18} color="#FF3B30" />
              </Pressable>
            </View>
          </Animated.View>
        ))}

        {categories.length === 0 && (
          <View className="items-center py-12 bg-white rounded-[30px] border border-dashed border-gray-200 mt-4">
            <Feather name="inbox" size={40} color="#eee" />
            <Text className="text-gray-400 font-medium mt-2">Chưa có danh mục nào</Text>
          </View>
        )}
        <View className="h-20" />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View className="flex-1">
          <Pressable 
            className="absolute inset-0 bg-black/40" 
            onPress={() => !saving && setShowModal(false)} 
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 justify-center px-6"
            pointerEvents="box-none"
          >
            <Pressable 
              className="bg-white rounded-[30px] p-6 shadow-2xl" 
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="text-xl font-bold text-gray-900 mb-6 text-center">
                {isEditing ? 'Sửa danh mục' : 'Thêm danh mục mới'}
              </Text>

              <Input
                label="Tên danh mục"
                value={name}
                onChangeText={setName}
                placeholder="VD: Màn hình, Máy chiếu..."
                icon="layers"
              />

              <Input
                label="Mô tả"
                value={description}
                onChangeText={setDescription}
                placeholder="Mô tả danh mục"
                icon="file-text"
                multiline={true}
                numberOfLines={3}
              />

              <View className="flex-row mt-4">
                <Button
                  title="Hủy"
                  onPress={() => setShowModal(false)}
                  containerClassName="flex-1 mr-2"
                  variant="secondary"
                  disabled={saving}
                />
                <Button
                  title="Lưu"
                  onPress={handleSave}
                  loading={saving}
                  containerClassName="flex-1 ml-2"
                />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
