import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Alert, Image, Modal, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function AdminEquipmentScreen() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Categories & Locations for selection
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // Add/Edit Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form Fields States
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [status, setStatus] = useState('available');
  const [condition, setCondition] = useState('Mới');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Picker Sheet States
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const fetchEquipment = async () => {
    try {
      const [eqRes, catRes, locRes] = await Promise.all([
        api.get('/equipment'),
        api.get('/categories').catch(() => ({ data: [] })),
        api.get('/locations').catch(() => ({ data: [] })),
      ]);
      setEquipment(eqRes.data?.data || eqRes.data || []);
      setCategories(catRes.data?.data || catRes.data || []);
      setLocations(locRes.data?.data || locRes.data || []);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải danh sách thiết bị');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEquipment();
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedId(null);
    setName('');
    setSerialNumber('');
    setCategoryId(categories[0]?.id || null);
    setLocationId(locations[0]?.id || null);
    setStatus('available');
    setCondition('Mới');
    setImageUrl('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setIsEditing(true);
    setSelectedId(item.id);
    setName(item.name);
    setSerialNumber(item.serial_number);
    setCategoryId(item.category_id || item.category?.id || null);
    setLocationId(item.location_id || item.location?.id || null);
    setStatus(item.status || 'available');
    setCondition(item.current_condition || 'Mới');
    setImageUrl(item.image_url || '');
    setShowModal(true);
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Xóa thiết bị',
      `Bạn có chắc chắn muốn xóa "${name}"? Thao tác này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/equipment/${id}`);
              Alert.alert('Thành công', 'Đã xóa thiết bị');
              fetchEquipment();
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xóa thiết bị');
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên thiết bị không được để trống');
      return;
    }
    if (!serialNumber.trim()) {
      Alert.alert('Lỗi', 'Số serial không được để trống');
      return;
    }
    if (!categoryId) {
      Alert.alert('Lỗi', 'Vui lòng chọn danh mục');
      return;
    }

    setSaving(true);
    const body = {
      name: name.trim(),
      serial_number: serialNumber.trim(),
      category_id: categoryId,
      location_id: locationId || undefined,
      status,
      current_condition: condition.trim() || 'Mới',
      image_url: imageUrl.trim() || undefined,
    };

    try {
      if (isEditing && selectedId) {
        await api.put(`/equipment/${selectedId}`, body);
        Alert.alert('Thành công', 'Đã cập nhật thiết bị');
      } else {
        await api.post('/equipment', body);
        Alert.alert('Thành công', 'Đã thêm thiết bị mới');
      }
      setShowModal(false);
      fetchEquipment();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể lưu thiết bị');
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
          <Text className="font-bold text-gray-900 text-lg">Thiết bị ({equipment.length})</Text>
          <Pressable 
            onPress={handleOpenAdd}
            className="bg-primary px-4 py-2 rounded-full flex-row items-center active:scale-95"
          >
            <Feather name="plus" size={16} color="white" />
            <Text className="text-white font-bold text-sm ml-1">Thêm mới</Text>
          </Pressable>
        </View>
        
        {equipment.map((item, index) => (
          <Animated.View 
            key={item.id} 
            entering={FadeInDown.delay(index * 50).duration(400)}
            className="bg-white p-3 rounded-2xl shadow-sm mb-3 border border-gray-100 flex-row items-center"
          >
            <Pressable 
              className="flex-row items-center flex-1"
              onPress={() => router.push(`/equipment/${item.id}`)}
            >
              <View className="w-16 h-16 bg-gray-100 rounded-xl items-center justify-center mr-3 overflow-hidden">
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Feather name="monitor" size={24} color="#999" />
                )}
              </View>
              <View className="flex-1 mr-2">
                <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>{item.name}</Text>
                <View className="flex-row items-center mt-1">
                   <Feather name="layers" size={12} color="#666" />
                   <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>
                     {item.category?.name || 'Không có danh mục'}
                   </Text>
                </View>
                <View className="mt-2 self-start">
                  <Badge status={item.status} />
                </View>
              </View>
            </Pressable>

            <View className="flex-row items-center ml-2 border-l border-gray-100 pl-3">
              <Pressable 
                onPress={() => handleOpenEdit(item)}
                className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-2 active:scale-95"
              >
                <Feather name="edit-2" size={18} color="#007AFF" />
              </Pressable>

              <Pressable 
                onPress={() => handleDelete(item.id, item.name)}
                className="w-10 h-10 bg-red-50 rounded-full items-center justify-center active:scale-95"
              >
                <Feather name="trash-2" size={18} color="#FF3B30" />
              </Pressable>
            </View>
          </Animated.View>
        ))}

        {equipment.length === 0 && (
          <View className="items-center py-12 bg-white rounded-[30px] border border-dashed border-gray-200 mt-4">
            <Feather name="box" size={40} color="#eee" />
            <Text className="text-gray-400 font-medium mt-2">Chưa có thiết bị nào</Text>
          </View>
        )}
        <View className="h-20" />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal 
        visible={showModal} 
        transparent 
        animationType="fade"
        onRequestClose={() => {
          if (!saving) setShowModal(false);
        }}
      >
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
              className="bg-white rounded-[30px] p-6 shadow-2xl max-h-[85%]" 
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="text-xl font-bold text-gray-900 mb-6 text-center">
                {isEditing ? 'Sửa thông tin thiết bị' : 'Thêm thiết bị mới'}
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-4" style={{ flexGrow: 0 }}>
                <Input
                  label="Tên thiết bị"
                  value={name}
                  onChangeText={setName}
                  placeholder="VD: MacBook Pro 2023..."
                  icon="monitor"
                />

                <Input
                  label="Số Serial"
                  value={serialNumber}
                  onChangeText={setSerialNumber}
                  placeholder="VD: SN123456789..."
                  icon="hash"
                />

                {/* Category Selector */}
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowCategoryPicker(true);
                  }}
                  className="mb-4 w-full"
                >
                  <Text className="text-sm font-medium text-gray-700 mb-1">Danh mục</Text>
                  <View className="flex-row bg-gray-50 px-4 rounded-xl border border-gray-200 items-center h-14">
                    <Feather name="layers" size={20} color="#666" style={{ marginRight: 10 }} />
                    <Text className="flex-1 text-gray-900 text-base">
                      {categories.find(c => c.id === categoryId)?.name || 'Chọn danh mục'}
                    </Text>
                    <Feather name="chevron-down" size={20} color="#666" />
                  </View>
                </Pressable>

                {/* Location Selector */}
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowLocationPicker(true);
                  }}
                  className="mb-4 w-full"
                >
                  <Text className="text-sm font-medium text-gray-700 mb-1">Vị trí lưu trữ</Text>
                  <View className="flex-row bg-gray-50 px-4 rounded-xl border border-gray-200 items-center h-14">
                    <Feather name="map-pin" size={20} color="#666" style={{ marginRight: 10 }} />
                    <Text className="flex-1 text-gray-900 text-base">
                      {locations.find(l => l.id === locationId)?.name || 'Chọn vị trí'}
                    </Text>
                    <Feather name="chevron-down" size={20} color="#666" />
                  </View>
                </Pressable>

                {/* Status Selector */}
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowStatusPicker(true);
                  }}
                  className="mb-4 w-full"
                >
                  <Text className="text-sm font-medium text-gray-700 mb-1">Trạng thái</Text>
                  <View className="flex-row bg-gray-50 px-4 rounded-xl border border-gray-200 items-center h-14">
                    <Feather name="info" size={20} color="#666" style={{ marginRight: 10 }} />
                    <Text className="flex-1 text-gray-900 text-base">
                      {status === 'available' ? 'Sẵn sàng' : status === 'broken' ? 'Đang hỏng' : status === 'maintenance' ? 'Bảo trì' : status === 'active' || status === 'in_use' ? 'Đang mượn' : status}
                    </Text>
                    <Feather name="chevron-down" size={20} color="#666" />
                  </View>
                </Pressable>

                <Input
                  label="Tình trạng hiện tại"
                  value={condition}
                  onChangeText={setCondition}
                  placeholder="VD: Mới, Cũ, Hoạt động tốt..."
                  icon="activity"
                />

                <Input
                  label="URL Ảnh thiết bị"
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  placeholder="Nhập đường dẫn ảnh (URL)"
                  icon="image"
                />
              </ScrollView>

              <View className="flex-row">
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

          {/* Category Picker Sheet Overlay */}
          {showCategoryPicker && (
            <View className="absolute inset-0 bg-black/50 justify-end z-50">
              <Pressable className="absolute inset-0" onPress={() => setShowCategoryPicker(false)} />
              <View className="bg-white p-6 rounded-t-[30px] max-h-[60%] z-50">
                <View className="flex-row justify-between items-center mb-6">
                  <Pressable onPress={() => setShowCategoryPicker(false)}><Text className="text-gray-500 font-medium">Hủy</Text></Pressable>
                  <Text className="font-bold text-lg text-gray-900">Chọn danh mục</Text>
                  <View className="w-10" />
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {categories.map((cat) => (
                    <Pressable
                      key={cat.id}
                      onPress={() => {
                        setCategoryId(cat.id);
                        setShowCategoryPicker(false);
                      }}
                      className={`py-4 border-b border-gray-100 flex-row justify-between items-center ${
                        categoryId === cat.id ? 'bg-primary/5 px-2 rounded-xl' : ''
                      }`}
                    >
                      <Text className={`text-base ${categoryId === cat.id ? 'text-primary font-bold' : 'text-gray-900'}`}>
                        {cat.name}
                      </Text>
                      {categoryId === cat.id && <Feather name="check" size={20} color="#CC0D00" />}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Location Picker Sheet Overlay */}
          {showLocationPicker && (
            <View className="absolute inset-0 bg-black/50 justify-end z-50">
              <Pressable className="absolute inset-0" onPress={() => setShowLocationPicker(false)} />
              <View className="bg-white p-6 rounded-t-[30px] max-h-[60%] z-50">
                <View className="flex-row justify-between items-center mb-6">
                  <Pressable onPress={() => setShowLocationPicker(false)}><Text className="text-gray-500 font-medium">Hủy</Text></Pressable>
                  <Text className="font-bold text-lg text-gray-900">Chọn vị trí lưu trữ</Text>
                  <View className="w-10" />
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {locations.map((loc) => (
                    <Pressable
                      key={loc.id}
                      onPress={() => {
                        setLocationId(loc.id);
                        setShowLocationPicker(false);
                      }}
                      className={`py-4 border-b border-gray-100 flex-row justify-between items-center ${
                        locationId === loc.id ? 'bg-primary/5 px-2 rounded-xl' : ''
                      }`}
                    >
                      <Text className={`text-base ${locationId === loc.id ? 'text-primary font-bold' : 'text-gray-900'}`}>
                        {loc.name}
                      </Text>
                      {locationId === loc.id && <Feather name="check" size={20} color="#CC0D00" />}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Status Picker Sheet Overlay */}
          {showStatusPicker && (
            <View className="absolute inset-0 bg-black/50 justify-end z-50">
              <Pressable className="absolute inset-0" onPress={() => setShowStatusPicker(false)} />
              <View className="bg-white p-6 rounded-t-[30px] z-50">
                <View className="flex-row justify-between items-center mb-6">
                  <Pressable onPress={() => setShowStatusPicker(false)}><Text className="text-gray-500 font-medium">Hủy</Text></Pressable>
                  <Text className="font-bold text-lg text-gray-900">Chọn trạng thái</Text>
                  <View className="w-10" />
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {[
                    { value: 'available', label: 'Sẵn sàng' },
                    { value: 'maintenance', label: 'Bảo trì' },
                    { value: 'broken', label: 'Đang hỏng' },
                    { value: 'active', label: 'Đang mượn' }
                  ].map((item) => (
                    <Pressable
                      key={item.value}
                      onPress={() => {
                        setStatus(item.value);
                        setShowStatusPicker(false);
                      }}
                      className={`py-4 border-b border-gray-100 flex-row justify-between items-center ${
                        status === item.value ? 'bg-primary/5 px-2 rounded-xl' : ''
                      }`}
                    >
                      <Text className={`text-base ${status === item.value ? 'text-primary font-bold' : 'text-gray-900'}`}>
                        {item.label}
                      </Text>
                      {status === item.value && <Feather name="check" size={20} color="#CC0D00" />}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
