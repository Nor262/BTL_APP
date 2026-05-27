import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Modal, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import api from '@/api/client';
import { DatePickerView } from '@ant-design/react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { StatusBar } from 'expo-status-bar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/store/useAuthStore';
import * as ImagePicker from 'expo-image-picker';
import { useAlertStore } from '@/store/useAlertStore';
import { SafeAreaView } from 'react-native-safe-area-context';

LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'],
  monthNamesShort: ['Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12'],
  dayNames: ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'],
  dayNamesShort: ['CN','T2','T3','T4','T5','T6','T7'],
  today: 'Hôm nay'
};
LocaleConfig.defaultLocale = 'vi';

import { handleApiError } from '@/utils/error-handler';

export default function EquipmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();
  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'due' | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [notes, setNotes] = useState('');
  const [occupiedDates, setOccupiedDates] = useState<any[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [history, setHistory] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Edit fields and drop downs
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [activePicker, setActivePicker] = useState<'category' | 'location' | 'supplier' | 'status' | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    serial_number: '',
    sku: '',
    image_url: '',
    status: '',
    category_id: '',
    location_id: '',
    supplier_id: '',
    specs: '',
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const handlePickAndUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert({ type: 'warning', title: 'Thông báo', message: 'Cần quyền truy cập thư viện ảnh để tải ảnh lên' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingImage(true);
        const selected = result.assets[0];
        const formData = new FormData();
        const filename = selected.uri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('file', {
          uri: selected.uri,
          name: filename,
          type,
        } as any);

        const res = await api.post('/equipment/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const url = res.data?.data?.url || res.data?.url;
        if (url) {
          setEditForm(prev => ({ ...prev, image_url: url }));
          showAlert({ type: 'success', title: 'Thành công', message: 'Tải ảnh lên thành công!' });
        } else {
          showAlert({ type: 'error', title: 'Lỗi', message: 'Không nhận được URL ảnh từ server' });
        }
      }
    } catch (e: any) {
      showAlert({ type: 'error', title: 'Lỗi', message: e.response?.data?.message || 'Không thể tải ảnh lên' });
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchData = async () => {
    try {
      const promises: Promise<any>[] = [
        api.get(`/equipment/${id}`),
        api.get(`/equipment/${id}/availability`).catch(() => ({ data: { data: [] } })),
        api.get(`/transactions/equipment/${id}`).catch(() => ({ data: { data: [] } }))
      ];
      
      if (user?.role === 'admin' || user?.role === 'storekeeper') {
        promises.push(api.get('/categories').catch(() => ({ data: [] })));
        promises.push(api.get('/locations').catch(() => ({ data: [] })));
        promises.push(api.get('/suppliers').catch(() => ({ data: [] })));
      }

      const [eqRes, availRes, histRes, catsRes, locsRes, supsRes] = await Promise.all(promises);
      setEquipment(eqRes.data.data || eqRes.data);
      setHistory(histRes.data.data || histRes.data || []);
      
      const occupied = availRes.data.data || availRes.data || [];
      setOccupiedDates(occupied);

      if (catsRes) setCategories(catsRes.data.data || catsRes.data || []);
      if (locsRes) setLocations(locsRes.data.data || locsRes.data || []);
      if (supsRes) setSuppliers(supsRes.data.data || supsRes.data || []);

      // Generate marked dates for calendar
      const marks: any = {};
      occupied.forEach((period: any) => {
        let curr = new Date(period.start);
        const end = new Date(period.end);
        while (curr <= end) {
          const dateString = curr.toISOString().split('T')[0];
          marks[dateString] = { disabled: true, disableTouchEvent: true, color: '#fee2e2', textColor: '#ef4444', startingDay: curr.getTime() === new Date(period.start).getTime(), endingDay: curr.getTime() === end.getTime() };
          curr.setDate(curr.getDate() + 1);
        }
      });
      setMarkedDates(marks);
    } catch (error) {
      handleApiError(error, 'Không thể tải thông tin thiết bị');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, user?.role]);

  useEffect(() => {
    if (equipment && editModalVisible) {
      setEditForm({
        name: equipment.name || '',
        serial_number: equipment.serial_number || '',
        sku: equipment.sku || '',
        image_url: equipment.image_url || '',
        status: equipment.status || '',
        category_id: String(equipment.category_id || ''),
        location_id: String(equipment.location_id || ''),
        supplier_id: String(equipment.supplier_id || ''),
        specs: typeof equipment.specifications === 'string' ? equipment.specifications : (equipment.specifications?.summary || ''),
      });
    }
  }, [editModalVisible, equipment]);

  const handleUpdate = async () => {
    if (!editForm.name || !editForm.serial_number || !editForm.category_id) {
      showAlert({ type: 'error', title: 'Lỗi', message: 'Vui lòng nhập tên, số serial và chọn danh mục' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: editForm.name,
        serial_number: editForm.serial_number,
        sku: editForm.sku,
        status: editForm.status,
        category_id: editForm.category_id ? Number(editForm.category_id) : null,
        location_id: editForm.location_id ? Number(editForm.location_id) : null,
        supplier_id: editForm.supplier_id ? Number(editForm.supplier_id) : null,
        specifications: {
          summary: editForm.specs,
        },
        image_url: editForm.image_url.trim() || null,
      };

      const res = await api.put(`/equipment/${id}`, payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert({ type: 'success', title: 'Thành công', message: 'Thông tin thiết bị đã được cập nhật!' });
      setEquipment(res.data.data || res.data);
      setEditModalVisible(false);
    } catch (error) {
      handleApiError(error, 'Không thể cập nhật thiết bị');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBorrow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!notes.trim()) {
      showAlert({ type: 'warning', title: 'Yêu cầu', message: 'Vui lòng nhập mục đích mượn thiết bị' });
      return;
    }

    if (startDate >= dueDate) {
      showAlert({ type: 'error', title: 'Lỗi', message: 'Ngày bắt đầu phải trước ngày trả' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/transactions/borrow', {
        equipment_id: parseInt(id as string),
        start_date: startDate.toISOString(),
        due_date: dueDate.toISOString(),
        notes: notes.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert({
        type: 'success',
        title: 'Thành công',
        message: 'Yêu cầu mượn đã được gửi. Hệ thống sẽ thông báo khi quản trị viên phê duyệt.',
        onConfirm: () => {
          router.replace('/(tabs)');
        }
      });
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      handleApiError(error, 'Không thể gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-white">
        <StatusBar style="dark" />
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="relative">
            <View className="w-full h-72 bg-gray-50 items-center justify-center">
              {equipment.image_url ? (
                <Image 
                  source={{ uri: equipment.image_url }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <Feather name="camera" size={48} color="#D1D1D6" />
              )}
            </View>
            
            <Pressable 
              className="absolute top-12 left-6 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
              onPress={() => router.back()}
            >
              <Feather name="arrow-left" size={20} color="#333" />
            </Pressable>

            {(user?.role === 'admin' || user?.role === 'storekeeper') && (
              <Pressable 
                className="absolute top-12 right-6 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
                onPress={() => setEditModalVisible(true)}
              >
                <Feather name="edit-2" size={18} color="#CC0D00" />
              </Pressable>
            )}
          </View>

          <View className="px-6 pt-6 pb-32">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1 pr-4">
                <Text className="text-2xl font-bold text-gray-900">{equipment.name}</Text>
                <Text className="text-gray-500 text-sm mt-1">SN: {equipment.serial_number}</Text>
              </View>
              <Badge status={equipment.status} />
            </View>

            <View className="flex-row my-6 justify-between">
              <View className="items-center bg-gray-50 p-3 rounded-xl flex-1 mr-2 border border-gray-100">
                <Feather name="map-pin" size={20} color="#CC0D00" />
                <Text className="text-gray-500 text-[10px] mt-2 uppercase font-bold">Vị trí kho</Text>
                <Text className="text-gray-900 font-bold text-xs mt-1" numberOfLines={1}>
                  {equipment.location?.name || 'Không xác định'}
                </Text>
              </View>
              <View className="items-center bg-gray-50 p-3 rounded-xl flex-1 ml-2 border border-gray-100">
                <Feather name="tag" size={20} color="#007AFF" />
                <Text className="text-gray-500 text-[10px] mt-2 uppercase font-bold">Danh mục</Text>
                <Text className="text-gray-900 font-bold text-xs mt-1" numberOfLines={1}>
                  {equipment.category?.name || 'Thiết bị'}
                </Text>
              </View>
            </View>

            <Text className="font-bold text-lg text-gray-900 mb-3">Thông số kỹ thuật</Text>
            <View className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
              {Object.entries(equipment.specifications || { 'Thương hiệu': 'Chưa cập nhật' }).map(([key, value]: [string, any], index) => (
                <View key={key} className="flex-row justify-between items-center py-2">
                  <Text className="text-gray-500 capitalize">{key}</Text>
                  <Text className="text-gray-900 font-medium">{value}</Text>
                </View>
              ))}
            </View>

            {user?.role === 'borrower' && (
              <>
                <Text className="font-bold text-lg text-gray-900 mb-3">Mục đích sử dụng</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 text-gray-900 text-base min-h-[120px] pt-3 pb-4"
                  style={{ 
                    textAlignVertical: 'top',
                    includeFontPadding: false,
                  }}
                  placeholder="VD: Mượn quay phim sự kiện CLB..."
                  placeholderTextColor="#999"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </>
            )}

            {occupiedDates.length > 0 && (
              <View className="mt-8">
                <View className="flex-row items-center mb-3">
                  <Feather name="calendar" size={18} color="#FF3B30" />
                  <Text className="font-bold text-lg text-gray-900 ml-2">Lịch bận thiết bị</Text>
                </View>
                <View className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  <Calendar
                    markingType={'period'}
                    markedDates={markedDates}
                    theme={{
                      todayTextColor: '#007AFF',
                      arrowColor: '#007AFF',
                      textDayFontWeight: '500',
                      textMonthFontWeight: 'bold',
                      textDayHeaderFontWeight: 'bold',
                    }}
                  />
                </View>
              </View>
            )}
            {history.length > 0 && (
              <View className="mt-8">
                <View className="flex-row items-center mb-3">
                  <Feather name="list" size={18} color="#CC0D00" />
                  <Text className="font-bold text-lg text-gray-900 ml-2">Lịch sử mượn trả</Text>
                </View>
                <View className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  {history.map((item, index) => (
                    <View key={item.id} className={`p-4 ${index !== history.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="font-bold text-gray-900 text-sm">{item.borrower?.full_name}</Text>
                        <Text className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          item.status === 'completed' ? 'bg-green-100 text-green-600' : 
                          item.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.status}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Feather name="clock" size={10} color="#999" />
                        <Text className="text-gray-500 text-[10px] ml-1">
                          {new Date(item.request_date).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {(user?.role === 'admin' || user?.role === 'storekeeper') ? (
          <View className="absolute bottom-0 left-0 right-0 bg-white p-5 border-t border-gray-100 flex-row items-center">
            <View className="flex-1">
              <Button 
                title="CHỈNH SỬA THÔNG TIN" 
                onPress={() => setEditModalVisible(true)}
              />
            </View>
          </View>
        ) : (
          <View className="absolute bottom-0 left-0 right-0 bg-white p-5 border-t border-gray-100 flex-row items-center">
            <View className="flex-1 mr-2">
              <Text className="text-gray-500 font-bold text-[10px] uppercase">Từ ngày</Text>
              <Pressable 
                onPress={() => setShowDatePicker('start')}
                className="flex-row items-center mt-1"
              >
                <Text className="text-primary font-bold text-sm mr-1">{startDate.toLocaleDateString('vi-VN')}</Text>
                <Feather name="edit" size={12} color="#CC0D00" />
              </Pressable>
            </View>
            <View className="flex-1 mr-2 border-l border-gray-200 pl-2">
              <Text className="text-gray-500 font-bold text-[10px] uppercase">Đến ngày</Text>
              <Pressable 
                onPress={() => setShowDatePicker('due')}
                className="flex-row items-center mt-1"
              >
                <Text className="text-primary font-bold text-sm mr-1">{dueDate.toLocaleDateString('vi-VN')}</Text>
                <Feather name="edit" size={12} color="#CC0D00" />
              </Pressable>
            </View>
            <View className="flex-1">
              <Button 
                title="ĐĂNG KÝ MƯỢN" 
                onPress={handleBorrow}
                loading={submitting}
                disabled={equipment.status !== 'available' || submitting}
              />
            </View>
          </View>
        )}

        <Modal visible={!!showDatePicker} transparent animationType="slide" statusBarTranslucent>
          <View className="flex-1 justify-end bg-black/40">
            <View className="bg-white p-6 rounded-t-[30px]">
              <View className="flex-row justify-between items-center mb-6">
                <Pressable onPress={() => setShowDatePicker(null)}><Text className="text-gray-500 font-medium">Hủy</Text></Pressable>
                <Text className="font-bold text-lg text-gray-900">{showDatePicker === 'start' ? 'Chọn ngày nhận' : 'Chọn ngày trả'}</Text>
                <Pressable onPress={() => setShowDatePicker(null)}><Text className="text-primary font-bold">Xong</Text></Pressable>
              </View>
              <DatePickerView
                mode="date"
                value={showDatePicker === 'start' ? startDate : dueDate}
                onChange={(date) => showDatePicker === 'start' ? setStartDate(date) : setDueDate(date)}
                minDate={showDatePicker === 'start' ? new Date() : startDate}
              />
            </View>
          </View>
        </Modal>

        {/* Edit Equipment Modal */}
        <Modal visible={editModalVisible} animationType="slide" transparent={false}>
          <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="flex-1 bg-[#F1F5F9]">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 bg-white border-b border-gray-100" style={{ height: 56 }}>
              <Pressable className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100" onPress={() => setEditModalVisible(false)}>
                <Feather name="x" size={20} color="#0F172A" />
              </Pressable>
              <Text className="text-[#0F172A] text-lg font-bold">Sửa thiết bị</Text>
              <Pressable disabled={submitting} className="px-4 py-2 bg-[#CC0D00] rounded-xl" onPress={handleUpdate}>
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-bold text-sm">Lưu</Text>}
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 60, gap: 14 }}>
              {/* Name */}
              <View style={{ gap: 6 }}>
                <Text className="text-gray-600 text-xs font-bold">Tên thiết bị *</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm"
                  placeholder="Nhập tên thiết bị"
                  value={editForm.name}
                  onChangeText={(val) => setEditForm(prev => ({ ...prev, name: val }))}
                />
              </View>

              {/* Serial Number & SKU */}
              <View className="flex-row" style={{ gap: 12 }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text className="text-gray-600 text-xs font-bold">Số Serial *</Text>
                  <TextInput
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm"
                    placeholder="VD: SN12345"
                    value={editForm.serial_number}
                    onChangeText={(val) => setEditForm(prev => ({ ...prev, serial_number: val }))}
                  />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text className="text-gray-600 text-xs font-bold">Mã SKU</Text>
                  <TextInput
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm"
                    placeholder="VD: SKU-CAM"
                    value={editForm.sku}
                    onChangeText={(val) => setEditForm(prev => ({ ...prev, sku: val }))}
                  />
                </View>
              </View>

              {/* Image URL & Upload */}
              <View style={{ gap: 6 }}>
                <Text className="text-gray-600 text-xs font-bold">Ảnh thiết bị</Text>
                {editForm.image_url ? (
                  <View className="relative mb-2 w-full h-[140px] rounded-xl overflow-hidden bg-gray-100">
                    <Image source={{ uri: editForm.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    <Pressable 
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 items-center justify-center"
                      onPress={() => setEditForm(prev => ({ ...prev, image_url: '' }))}
                    >
                      <Feather name="trash-2" size={14} color="#FFF" />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable 
                    onPress={handlePickAndUploadImage}
                    disabled={uploadingImage}
                    className="border border-dashed border-gray-300 rounded-xl py-6 items-center justify-center mb-2 bg-gray-50"
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="#CC0D00" />
                    ) : (
                      <>
                        <Feather name="image" size={20} color="#94A3B8" />
                        <Text className="text-gray-600 text-xs font-semibold mt-1">Chạm để chọn & tải ảnh lên</Text>
                      </>
                    )}
                  </Pressable>
                )}
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl h-[44px] px-3" style={{ gap: 8 }}>
                  <Feather name="link" size={14} color="#94A3B8" />
                  <TextInput
                    placeholder="Nhập link ảnh thiết bị trực tiếp (URL)"
                    placeholderTextColor="#94A3B8"
                    value={editForm.image_url}
                    onChangeText={(val) => setEditForm(prev => ({ ...prev, image_url: val }))}
                    className="flex-1 text-gray-900 text-sm"
                    style={{ paddingVertical: 8 }}
                  />
                </View>
              </View>

              {/* Status Picker */}
              <View style={{ gap: 6 }}>
                <Text className="text-gray-600 text-xs font-bold">Trạng thái *</Text>
                <Pressable 
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row justify-between items-center"
                  onPress={() => setActivePicker('status')}
                >
                  <Text className="text-gray-900 text-sm">
                    {editForm.status === 'available' ? 'Có sẵn (Available)' : 
                     editForm.status === 'borrowed' ? 'Đang cho mượn (Borrowed)' :
                     editForm.status === 'maintenance' ? 'Bảo trì (Maintenance)' : 'Chọn trạng thái'}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#64748B" />
                </Pressable>
              </View>

              {/* Category Picker */}
              <View style={{ gap: 6 }}>
                <Text className="text-gray-600 text-xs font-bold">Danh mục</Text>
                <Pressable 
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row justify-between items-center"
                  onPress={() => setActivePicker('category')}
                >
                  <Text className="text-gray-900 text-sm">
                    {categories.find(c => String(c.id) === editForm.category_id)?.name || 'Chọn danh mục'}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#64748B" />
                </Pressable>
              </View>

              {/* Location Picker */}
              <View style={{ gap: 6 }}>
                <Text className="text-gray-600 text-xs font-bold">Vị trí kho</Text>
                <Pressable 
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row justify-between items-center"
                  onPress={() => setActivePicker('location')}
                >
                  <Text className="text-gray-900 text-sm">
                    {locations.find(l => String(l.id) === editForm.location_id)?.name || 'Chọn vị trí'}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#64748B" />
                </Pressable>
              </View>

              {/* Supplier Picker */}
              <View style={{ gap: 6 }}>
                <Text className="text-gray-600 text-xs font-bold">Nhà cung cấp</Text>
                <Pressable 
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row justify-between items-center"
                  onPress={() => setActivePicker('supplier')}
                >
                  <Text className="text-gray-900 text-sm">
                    {suppliers.find(s => String(s.id) === editForm.supplier_id)?.name || 'Chọn nhà cung cấp'}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#64748B" />
                </Pressable>
              </View>

              {/* Technical specs summary */}
              <View style={{ gap: 6 }}>
                <Text className="text-gray-600 text-xs font-bold">Thông số kỹ thuật (Tóm tắt)</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm min-h-[80px]"
                  style={{ textAlignVertical: 'top' }}
                  multiline
                  placeholder="VD: Độ phân giải 4K, Ống kính 24-70mm..."
                  value={editForm.specs}
                  onChangeText={(val) => setEditForm(prev => ({ ...prev, specs: val }))}
                />
              </View>
            </ScrollView>

            {/* Bottom Picker Sheet */}
            <Modal visible={!!activePicker} transparent animationType="slide">
              <View className="flex-1 justify-end bg-black/40">
                <View className="bg-white rounded-t-[30px] p-6 max-h-[70%]">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="font-bold text-base text-gray-900">
                      {activePicker === 'category' ? 'Chọn danh mục' :
                       activePicker === 'location' ? 'Chọn vị trí kho' :
                       activePicker === 'supplier' ? 'Chọn nhà cung cấp' : 'Chọn trạng thái'}
                    </Text>
                    <Pressable onPress={() => setActivePicker(null)}>
                      <Feather name="x" size={20} color="#0F172A" />
                    </Pressable>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {activePicker === 'status' && (
                      <View style={{ gap: 6 }}>
                        {[
                          { id: 'available', name: 'Có sẵn (Available)' },
                          { id: 'borrowed', name: 'Đang cho mượn (Borrowed)' },
                          { id: 'maintenance', name: 'Bảo trì (Maintenance)' }
                        ].map(item => (
                          <Pressable 
                            key={item.id} 
                            className="py-3 border-b border-gray-100 flex-row justify-between items-center"
                            onPress={() => {
                              setEditForm(prev => ({ ...prev, status: item.id }));
                              setActivePicker(null);
                            }}
                          >
                            <Text className="text-gray-900 text-sm">{item.name}</Text>
                            {editForm.status === item.id && <Feather name="check" size={16} color="#CC0D00" />}
                          </Pressable>
                        ))}
                      </View>
                    )}
                    {activePicker === 'category' && (
                      <View style={{ gap: 6 }}>
                        {categories.map(c => (
                          <Pressable 
                            key={c.id} 
                            className="py-3 border-b border-gray-100 flex-row justify-between items-center"
                            onPress={() => {
                              setEditForm(prev => ({ ...prev, category_id: String(c.id) }));
                              setActivePicker(null);
                            }}
                          >
                            <Text className="text-gray-900 text-sm">{c.name}</Text>
                            {editForm.category_id === String(c.id) && <Feather name="check" size={16} color="#CC0D00" />}
                          </Pressable>
                        ))}
                      </View>
                    )}
                    {activePicker === 'location' && (
                      <View style={{ gap: 6 }}>
                        <Pressable 
                          className="py-3 border-b border-gray-100 flex-row justify-between items-center"
                          onPress={() => {
                            setEditForm(prev => ({ ...prev, location_id: '' }));
                            setActivePicker(null);
                          }}
                        >
                          <Text className="text-gray-400 text-sm">Bỏ chọn</Text>
                        </Pressable>
                        {locations.map(l => (
                          <Pressable 
                            key={l.id} 
                            className="py-3 border-b border-gray-100 flex-row justify-between items-center"
                            onPress={() => {
                              setEditForm(prev => ({ ...prev, location_id: String(l.id) }));
                              setActivePicker(null);
                            }}
                          >
                            <Text className="text-gray-900 text-sm">{l.name}</Text>
                            {editForm.location_id === String(l.id) && <Feather name="check" size={16} color="#CC0D00" />}
                          </Pressable>
                        ))}
                      </View>
                    )}
                    {activePicker === 'supplier' && (
                      <View style={{ gap: 6 }}>
                        <Pressable 
                          className="py-3 border-b border-gray-100 flex-row justify-between items-center"
                          onPress={() => {
                            setEditForm(prev => ({ ...prev, supplier_id: '' }));
                            setActivePicker(null);
                          }}
                        >
                          <Text className="text-gray-400 text-sm">Bỏ chọn</Text>
                        </Pressable>
                        {suppliers.map(s => (
                          <Pressable 
                            key={s.id} 
                            className="py-3 border-b border-gray-100 flex-row justify-between items-center"
                            onPress={() => {
                              setEditForm(prev => ({ ...prev, supplier_id: String(s.id) }));
                              setActivePicker(null);
                            }}
                          >
                            <Text className="text-[#0F172A] text-sm">{s.name}</Text>
                            {editForm.supplier_id === String(s.id) && <Feather name="check" size={16} color="#CC0D00" />}
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </ScrollView>
                </View>
              </View>
            </Modal>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}
