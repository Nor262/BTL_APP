import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, Modal, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eqRes, availRes, histRes] = await Promise.all([
          api.get(`/equipment/${id}`),
          api.get(`/equipment/${id}/availability`).catch(() => ({ data: { data: [] } })),
          api.get(`/transactions/equipment/${id}`).catch(() => ({ data: { data: [] } }))
        ]);
        setEquipment(eqRes.data.data || eqRes.data);
        setHistory(histRes.data.data || histRes.data || []);
        
        const occupied = availRes.data.data || availRes.data || [];
        setOccupiedDates(occupied);

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
    fetchData();
  }, [id]);

  const handleBorrow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!notes.trim()) {
      Alert.alert('Yêu cầu', 'Vui lòng nhập mục đích mượn thiết bị');
      return;
    }

    if (startDate >= dueDate) {
      Alert.alert('Lỗi', 'Ngày bắt đầu phải trước ngày trả');
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
      Alert.alert('Thành công', 'Yêu cầu mượn đã được gửi. Hệ thống sẽ thông báo khi quản trị viên phê duyệt.', [
        { text: 'Về trang chủ', onPress: () => router.replace('/(tabs)') }
      ]);
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
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

            <Text className="font-bold text-lg text-gray-900 mb-3">Mục đích sử dụng</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 text-base min-h-[100px]"
              placeholder="VD: Mượn quay phim sự kiện CLB..."
              placeholderTextColor="#999"
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />

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
      </View>
    </KeyboardAvoidingView>
  );
}
