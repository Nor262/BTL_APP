import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '@/api/client';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data?.data || res.data || []);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải danh sách nhà cung cấp');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSuppliers();
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedId(null);
    setName('');
    setContactInfo('');
    setAddress('');
    setShowModal(true);
  };

  const handleOpenEdit = async (supplier: any) => {
    setIsEditing(true);
    setSelectedId(supplier.id);
    setName(supplier.name);
    setContactInfo(supplier.contact_info || '');
    setAddress(supplier.address || '');
    setShowModal(true);
    try {
      const res = await api.get(`/suppliers/${supplier.id}`);
      const d = res.data?.data || res.data;
      if (d) {
        setName(d.name || supplier.name);
        setContactInfo(d.contact_info || '');
        setAddress(d.address || '');
      }
    } catch {}
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Xóa nhà cung cấp',
      `Bạn có chắc chắn muốn xóa "${name}"? Các thiết bị từ nhà cung cấp này có thể bị ảnh hưởng.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/suppliers/${id}`);
              Alert.alert('Thành công', 'Đã xóa nhà cung cấp');
              fetchSuppliers();
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xóa nhà cung cấp');
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên nhà cung cấp không được để trống');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && selectedId) {
        await api.put(`/suppliers/${selectedId}`, { name, contact_info: contactInfo, address });
        Alert.alert('Thành công', 'Đã cập nhật nhà cung cấp');
      } else {
        await api.post('/suppliers', { name, contact_info: contactInfo, address });
        Alert.alert('Thành công', 'Đã thêm nhà cung cấp mới');
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể lưu nhà cung cấp');
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
          <Text className="font-bold text-gray-900 text-lg">Danh sách ({suppliers.length})</Text>
          <Pressable 
            onPress={handleOpenAdd}
            className="bg-primary px-4 py-2 rounded-full flex-row items-center active:scale-95"
          >
            <Feather name="plus" size={16} color="white" />
            <Text className="text-white font-bold text-sm ml-1">Thêm mới</Text>
          </Pressable>
        </View>
        
        {suppliers.map((supplier, index) => (
          <Animated.View 
            key={supplier.id} 
            entering={FadeInDown.delay(index * 50).duration(400)}
            className="bg-white p-4 rounded-2xl shadow-sm mb-3 border border-gray-100"
          >
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-10 h-10 bg-purple-50 rounded-xl items-center justify-center mr-3">
                  <Feather name="truck" size={20} color="#AF52DE" />
                </View>
                <Text className="font-bold text-gray-900 text-base flex-1" numberOfLines={1}>{supplier.name}</Text>
              </View>
              
              <View className="flex-row items-center">
                <Pressable 
                  onPress={() => handleOpenEdit(supplier)}
                  className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-2 active:scale-95"
                >
                  <Feather name="edit-2" size={14} color="#007AFF" />
                </Pressable>
                
                <Pressable 
                  onPress={() => handleDelete(supplier.id, supplier.name)}
                  className="w-8 h-8 bg-red-50 rounded-full items-center justify-center active:scale-95"
                >
                  <Feather name="trash-2" size={14} color="#FF3B30" />
                </Pressable>
              </View>
            </View>

            <View className="pl-13 mt-1">
              {supplier.contact_info ? (
                <View className="flex-row items-center mb-1">
                  <Feather name="phone" size={12} color="#666" />
                  <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>{supplier.contact_info}</Text>
                </View>
              ) : null}
              {supplier.address ? (
                <View className="flex-row items-center mt-1">
                  <Feather name="map-pin" size={12} color="#666" />
                  <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>{supplier.address}</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>
        ))}

        {suppliers.length === 0 && (
          <View className="items-center py-12 bg-white rounded-[30px] border border-dashed border-gray-200 mt-4">
            <Feather name="truck" size={40} color="#eee" />
            <Text className="text-gray-400 font-medium mt-2">Chưa có nhà cung cấp nào</Text>
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
                {isEditing ? 'Sửa thông tin' : 'Thêm nhà cung cấp'}
              </Text>

              <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
                <Input
                  label="Tên nhà cung cấp"
                  value={name}
                  onChangeText={setName}
                  placeholder="VD: FPT Shop, Phong Vũ..."
                  icon="briefcase"
                />

                <Input
                  label="Thông tin liên hệ"
                  value={contactInfo}
                  onChangeText={setContactInfo}
                  placeholder="SĐT, Email..."
                  icon="phone"
                />

                <Input
                  label="Địa chỉ"
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Địa chỉ công ty"
                  icon="map-pin"
                  multiline={true}
                  numberOfLines={3}
                />
              </ScrollView>

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
