import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import api from '@/api/client';
import { DatePickerView } from '@ant-design/react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { StatusBar } from 'expo-status-bar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as Haptics from 'expo-haptics';
import { handleApiError } from '@/utils/error-handler';
import { useAlertStore } from '@/store/useAlertStore';

LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'],
  monthNamesShort: ['Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12'],
  dayNames: ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'],
  dayNamesShort: ['CN','T2','T3','T4','T5','T6','T7'],
  today: 'Hôm nay'
};
LocaleConfig.defaultLocale = 'vi';

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
  const [isFavorite, setIsFavorite] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlertStore();

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

        const marks: any = {};
        occupied.forEach((period: any) => {
          let curr = new Date(period.start);
          const end = new Date(period.end);
          while (curr <= end) {
            const dateString = curr.toISOString().split('T')[0];
            marks[dateString] = {
              disabled: true, disableTouchEvent: true,
              color: '#FEE2E2', textColor: '#EF4444',
              startingDay: curr.getTime() === new Date(period.start).getTime(),
              endingDay: curr.getTime() === end.getTime()
            };
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
        onConfirm: () => router.replace('/(tabs)')
      });
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      handleApiError(error, 'Không thể gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  const specs = equipment?.specifications || {};
  const specEntries = Object.keys(specs).length > 0
    ? Object.entries(specs)
    : [['Thương hiệu', 'Chưa cập nhật']];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-[#F8FAFC]">
        <StatusBar style="dark" />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Nav Bar */}
          <View
            className="flex-row items-center justify-between px-5"
            style={{ paddingTop: 58, height: 110 }}
          >
            <Pressable
              className="w-10 h-10 bg-white rounded-full items-center justify-center"
              onPress={() => router.back()}
            >
              <Feather name="arrow-left" size={20} color="#0F172A" />
            </Pressable>
            <Text className="text-[#0F172A] text-base font-bold">Chi tiết thiết bị</Text>
            <Pressable
              className="w-10 h-10 bg-white rounded-full items-center justify-center"
              onPress={() => setIsFavorite(!isFavorite)}
            >
              <Feather name="heart" size={18} color={isFavorite ? '#CC0D00' : '#94A3B8'} />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 20, paddingBottom: 160, gap: 16 }}>
            {/* Hero Card */}
            <Animated.View
              entering={FadeInDown.delay(100)}
              className="bg-white rounded-[20px] items-center"
              style={{ padding: 24, gap: 16 }}
            >
              <View
                className="w-[140px] h-[140px] bg-[#FEE5E3] rounded-2xl items-center justify-center overflow-hidden"
              >
                {equipment?.image_url ? (
                  <Image
                    source={{ uri: equipment.image_url }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <Feather name="box" size={56} color="#CC0D00" />
                )}
              </View>
              <Badge status={equipment?.status} />
            </Animated.View>

            {/* Info Block */}
            <Animated.View entering={FadeInDown.delay(200)} style={{ gap: 6, paddingHorizontal: 4 }}>
              <Text className="text-[#0F172A] text-xl font-bold">{equipment?.name}</Text>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Feather name="hash" size={12} color="#94A3B8" />
                <Text className="text-[#94A3B8] text-xs">SN: {equipment?.serial_number || '---'}</Text>
              </View>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Feather name="map-pin" size={12} color="#94A3B8" />
                <Text className="text-[#94A3B8] text-xs">{equipment?.location?.name || 'Không xác định'}</Text>
              </View>
            </Animated.View>

            {/* Specs Card */}
            <Animated.View
              entering={FadeInDown.delay(300)}
              className="bg-white rounded-[18px]"
              style={{ padding: 16, gap: 2 }}
            >
              <Text className="text-[#0F172A] text-[13px] font-bold" style={{ paddingBottom: 8 }}>
                Thông số kỹ thuật
              </Text>
              {specEntries.map(([key, value]: [string, any], index: number) => (
                <View
                  key={key}
                  className="flex-row items-center justify-between"
                  style={{
                    paddingVertical: 10,
                    borderTopWidth: index > 0 ? 1 : 0,
                    borderTopColor: '#F1F5F9',
                  }}
                >
                  <Text className="text-[#64748B] text-xs capitalize">{key}</Text>
                  <Text className="text-[#0F172A] text-xs font-semibold">{value}</Text>
                </View>
              ))}
            </Animated.View>

            {/* Purpose Input */}
            <Animated.View entering={FadeInDown.delay(350)} style={{ gap: 8 }}>
              <Text className="text-[#64748B] text-xs font-semibold" style={{ paddingHorizontal: 4 }}>
                Mục đích sử dụng
              </Text>
              <View className="bg-white rounded-[14px]" style={{ borderWidth: 1.5, borderColor: '#E2E8F0' }}>
                <TextInput
                  className="text-[#0F172A] text-sm"
                  style={{ padding: 14, minHeight: 90, textAlignVertical: 'top' }}
                  placeholder="VD: Mượn quay phim sự kiện CLB..."
                  placeholderTextColor="#94A3B8"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </View>
            </Animated.View>

            {/* Calendar Card */}
            {occupiedDates.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(400)}
                className="bg-white rounded-[18px] overflow-hidden"
                style={{ padding: 16 }}
              >
                <View className="flex-row items-center" style={{ gap: 8, paddingBottom: 12 }}>
                  <Feather name="calendar" size={16} color="#CC0D00" />
                  <Text className="text-[#0F172A] text-[13px] font-bold">Lịch bận thiết bị</Text>
                </View>
                <Calendar
                  markingType={'period'}
                  markedDates={markedDates}
                  theme={{
                    todayTextColor: '#CC0D00',
                    arrowColor: '#CC0D00',
                    textDayFontWeight: '500',
                    textDayFontSize: 13,
                    textMonthFontWeight: 'bold' as any,
                    textDayHeaderFontWeight: 'bold' as any,
                    textDayHeaderFontSize: 11,
                    calendarBackground: 'transparent',
                  }}
                />
              </Animated.View>
            )}

            {/* Loan History */}
            {history.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(450)}
                className="bg-white rounded-[18px]"
                style={{ padding: 16, gap: 4 }}
              >
                <View className="flex-row items-center" style={{ gap: 8, paddingBottom: 8 }}>
                  <Feather name="clock" size={16} color="#CC0D00" />
                  <Text className="text-[#0F172A] text-[13px] font-bold">Lịch sử mượn trả</Text>
                </View>
                {history.map((item: any, index: number) => (
                  <View
                    key={item.id}
                    className="flex-row items-center"
                    style={{
                      paddingVertical: 10, gap: 10,
                      borderTopWidth: index > 0 ? 1 : 0,
                      borderTopColor: '#F1F5F9',
                    }}
                  >
                    <View className="w-9 h-9 bg-[#F1F5F9] rounded-lg items-center justify-center">
                      <Feather name="user" size={16} color="#64748B" />
                    </View>
                    <View className="flex-1" style={{ gap: 2 }}>
                      <Text className="text-[#0F172A] text-xs font-semibold">{item.borrower?.full_name}</Text>
                      <Text className="text-[#94A3B8] text-[10px]">
                        {new Date(item.request_date).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                    <Badge status={item.status} />
                  </View>
                ))}
              </Animated.View>
            )}
          </View>
        </ScrollView>

        {/* Bottom CTA Bar */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-white"
          style={{
            paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
            borderTopWidth: 1, borderTopColor: '#F1F5F9',
            gap: 10,
          }}
        >
          {/* Date Row */}
          <View className="flex-row" style={{ gap: 10 }}>
            <Pressable
              className="flex-1 bg-[#F8FAFC] rounded-xl flex-row items-center justify-between"
              style={{ padding: 10 }}
              onPress={() => setShowDatePicker('start')}
            >
              <View style={{ gap: 2 }}>
                <Text className="text-[#94A3B8] text-[10px] font-bold">TỪ NGÀY</Text>
                <Text className="text-[#0F172A] text-xs font-semibold">
                  {startDate.toLocaleDateString('vi-VN')}
                </Text>
              </View>
              <Feather name="calendar" size={14} color="#94A3B8" />
            </Pressable>
            <Pressable
              className="flex-1 bg-[#F8FAFC] rounded-xl flex-row items-center justify-between"
              style={{ padding: 10 }}
              onPress={() => setShowDatePicker('due')}
            >
              <View style={{ gap: 2 }}>
                <Text className="text-[#94A3B8] text-[10px] font-bold">ĐẾN NGÀY</Text>
                <Text className="text-[#0F172A] text-xs font-semibold">
                  {dueDate.toLocaleDateString('vi-VN')}
                </Text>
              </View>
              <Feather name="calendar" size={14} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Action Row */}
          <View className="flex-row" style={{ gap: 10 }}>
            <Pressable
              className="w-[52px] h-[52px] bg-[#F1F5F9] rounded-[14px] items-center justify-center"
            >
              <Feather name="message-circle" size={20} color="#64748B" />
            </Pressable>
            <View className="flex-1">
              <Pressable
                className={`h-[52px] rounded-[14px] flex-row items-center justify-center ${
                  equipment?.status === 'available' ? 'bg-[#CC0D00]' : 'bg-[#E2E8F0]'
                }`}
                style={{ gap: 8 }}
                onPress={() => router.push({ pathname: '/borrow-request', params: { equipment_id: id as string } })}
                disabled={equipment?.status !== 'available'}
              >
                <Feather
                  name="arrow-right"
                  size={16}
                  color={equipment?.status === 'available' ? '#FFFFFF' : '#94A3B8'}
                />
                <Text
                  className={`text-[15px] font-bold ${
                    equipment?.status === 'available' ? 'text-white' : 'text-[#94A3B8]'
                  }`}
                >
                  Tạo yêu cầu mượn
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Date Picker Modal */}
        <Modal visible={!!showDatePicker} transparent animationType="fade" statusBarTranslucent>
          <View className="flex-1">
            <Pressable className="absolute inset-0 bg-black/40" onPress={() => setShowDatePicker(null)} />
            <View className="flex-1 justify-end">
              <View
                className="bg-white"
                style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 }}
              >
                <View className="flex-row justify-between items-center">
                  <Pressable onPress={() => setShowDatePicker(null)}>
                    <Text className="text-[#64748B] text-sm font-medium">Hủy</Text>
                  </Pressable>
                  <Text className="text-[#0F172A] text-base font-bold">
                    {showDatePicker === 'start' ? 'Chọn ngày nhận' : 'Chọn ngày trả'}
                  </Text>
                  <Pressable onPress={() => setShowDatePicker(null)}>
                    <Text className="text-[#CC0D00] text-sm font-bold">Xong</Text>
                  </Pressable>
                </View>
                <DatePickerView
                  mode="date"
                  value={showDatePicker === 'start' ? startDate : dueDate}
                  onChange={(date) => showDatePicker === 'start' ? setStartDate(date) : setDueDate(date)}
                  minDate={showDatePicker === 'start' ? new Date() : startDate}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}
