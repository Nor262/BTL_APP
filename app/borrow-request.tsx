import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '@/api/client';
import { useAlertStore } from '@/store/useAlertStore';

LocaleConfig.locales['vi'] = LocaleConfig.locales['vi'] || {
  monthNames: ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'],
  monthNamesShort: ['Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12'],
  dayNames: ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'],
  dayNamesShort: ['CN','T2','T3','T4','T5','T6','T7'],
  today: 'Hôm nay'
};
LocaleConfig.defaultLocale = 'vi';

const PURPOSES = [
  { key: 'project', label: 'Đồ án' },
  { key: 'event', label: 'Sự kiện' },
  { key: 'study', label: 'Học tập' },
  { key: 'other', label: 'Khác' },
];

export default function BorrowRequestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlertStore();
  const { equipment_id } = useLocalSearchParams<{ equipment_id?: string }>();

  const [equipment, setEquipment] = useState<any>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 86400000));
  const [showCalendar, setShowCalendar] = useState<'start' | 'due' | null>(null);
  const [purpose, setPurpose] = useState('project');
  const [note, setNote] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!equipment_id) return;
    api.get(`/equipment/${equipment_id}`).then((r) => setEquipment(r.data?.data || r.data)).catch(() => {});
  }, [equipment_id]);

  const days = Math.max(1, Math.ceil((dueDate.getTime() - startDate.getTime()) / 86400000));
  const fmt = (d: Date) => d.toLocaleDateString('vi-VN');

  const submit = async (asDraft = false) => {
    if (!note.trim()) {
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Vui lòng mô tả mục đích sử dụng' });
      return;
    }
    if (!agreed) {
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Vui lòng đồng ý quy định mượn' });
      return;
    }
    if (startDate >= dueDate) {
      showAlert({ type: 'error', title: 'Lỗi', message: 'Ngày bắt đầu phải trước ngày trả' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/transactions/borrow', {
        equipment_id: Number(equipment_id),
        start_date: startDate.toISOString(),
        due_date: dueDate.toISOString(),
        notes: `[${PURPOSES.find((p) => p.key === purpose)?.label}] ${note.trim()}${asDraft ? ' (nháp)' : ''}`,
      });
      showAlert({
        type: 'success',
        title: asDraft ? 'Đã lưu nháp' : 'Đã gửi yêu cầu',
        message: asDraft ? 'Bạn có thể tiếp tục chỉnh sửa sau.' : 'Quản trị viên sẽ phê duyệt sớm.',
        onConfirm: () => router.replace('/(tabs)/my-loans'),
      });
    } catch (e: any) {
      showAlert({ type: 'error', title: 'Lỗi', message: e.response?.data?.message || 'Không thể gửi yêu cầu' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        {/* Nav */}
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8 }}>
          <View className="flex-row items-center justify-between" style={{ height: 44 }}>
            <Pressable className="w-10 h-10 bg-white rounded-full items-center justify-center" onPress={() => router.back()}>
              <Feather name="arrow-left" size={18} color="#0F172A" />
            </Pressable>
            <Text className="text-[#0F172A] text-base font-bold">Yêu cầu mượn</Text>
            <Text className="text-[#94A3B8] text-[11px] font-bold">1/2</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}>
          <View style={{ gap: 14 }}>
            {/* Equipment summary */}
            <Animated.View entering={FadeInDown.delay(80)} className="bg-white rounded-[16px] flex-row items-center" style={{ padding: 12, gap: 12 }}>
              <View className="w-11 h-11 bg-[#FEE5E3] rounded-xl items-center justify-center">
                <Feather name="box" size={18} color="#CC0D00" />
              </View>
              <View className="flex-1" style={{ gap: 2 }}>
                <Text className="text-[#0F172A] text-sm font-bold" numberOfLines={1}>
                  {equipment?.name || 'MacBook Pro 14" M3'}
                </Text>
                <Text className="text-[#94A3B8] text-[11px]">
                  SN: {equipment?.serial_number || 'MBP-2024-00128'}
                </Text>
              </View>
              <Pressable onPress={() => router.back()}>
                <Text className="text-[#CC0D00] text-[12px] font-bold">Đổi</Text>
              </Pressable>
            </Animated.View>

            {/* Time */}
            <Animated.View entering={FadeInDown.delay(120)} className="bg-white rounded-[16px]" style={{ padding: 14, gap: 10 }}>
              <Text className="text-[#0F172A] text-[13px] font-bold">Thời gian mượn</Text>
              <View className="flex-row" style={{ gap: 10 }}>
                <View className="flex-1" style={{ gap: 4 }}>
                  <Text className="text-[#64748B] text-[11px] font-semibold">Ngày mượn</Text>
                  <Pressable
                    onPress={() => setShowCalendar('start')}
                    className="flex-row items-center bg-[#F8FAFC] rounded-[12px] h-[42px] px-3"
                    style={{ gap: 8 }}
                  >
                    <Feather name="calendar" size={14} color="#94A3B8" />
                    <Text className="flex-1 text-[#0F172A] text-sm">{fmt(startDate)}</Text>
                  </Pressable>
                </View>
                <View className="flex-1" style={{ gap: 4 }}>
                  <Text className="text-[#64748B] text-[11px] font-semibold">Hạn dự kiến</Text>
                  <Pressable
                    onPress={() => setShowCalendar('due')}
                    className="flex-row items-center bg-[#F8FAFC] rounded-[12px] h-[42px] px-3"
                    style={{ gap: 8 }}
                  >
                    <Feather name="calendar" size={14} color="#94A3B8" />
                    <Text className="flex-1 text-[#0F172A] text-sm">{fmt(dueDate)}</Text>
                  </Pressable>
                </View>
              </View>
              <View className="bg-[#FEE5E3] rounded-[10px] flex-row items-center justify-center" style={{ paddingVertical: 8, gap: 6 }}>
                <Feather name="clock" size={12} color="#CC0D00" />
                <Text className="text-[#CC0D00] text-[12px] font-bold">Thời gian mượn: {days} ngày</Text>
              </View>
            </Animated.View>

            {/* Purpose */}
            <Animated.View entering={FadeInDown.delay(160)} className="bg-white rounded-[16px]" style={{ padding: 14, gap: 10 }}>
              <Text className="text-[#0F172A] text-[13px] font-bold">Mục đích sử dụng</Text>
              <View className="flex-row" style={{ gap: 8 }}>
                {PURPOSES.map((p) => {
                  const active = purpose === p.key;
                  return (
                    <Pressable
                      key={p.key}
                      onPress={() => setPurpose(p.key)}
                      className={`flex-1 rounded-full items-center ${active ? 'bg-[#CC0D00]' : 'bg-[#F8FAFC]'}`}
                      style={{ paddingVertical: 8, borderWidth: 1.5, borderColor: active ? '#CC0D00' : '#E2E8F0' }}
                    >
                      <Text className={`text-[12px] font-bold ${active ? 'text-white' : 'text-[#64748B]'}`}>{p.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View className="bg-[#F8FAFC] rounded-[12px]" style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
                <TextInput
                  className="text-[#0F172A] text-sm"
                  style={{ minHeight: 70, textAlignVertical: 'top' }}
                  multiline
                  value={note}
                  onChangeText={setNote}
                  placeholder="VD: Sử dụng cho đồ án CNTT cuối kỳ, môn Kiến trúc Phần mềm..."
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </Animated.View>

            {/* Self-check */}
            <Animated.View entering={FadeInDown.delay(200)} className="bg-white rounded-[16px]" style={{ padding: 14, gap: 10 }}>
              <Text className="text-[#0F172A] text-[13px] font-bold">Tự kiểm tra</Text>
              <Pressable onPress={() => setAgreed((v) => !v)} className="flex-row items-start" style={{ gap: 10 }}>
                <View
                  className="w-5 h-5 rounded items-center justify-center mt-0.5"
                  style={{
                    borderWidth: 1.5,
                    borderColor: agreed ? '#CC0D00' : '#CBD5E1',
                    backgroundColor: agreed ? '#CC0D00' : 'transparent',
                  }}
                >
                  {agreed && <Feather name="check" size={12} color="#FFFFFF" />}
                </View>
                <View className="flex-1" style={{ gap: 2 }}>
                  <Text className="text-[#0F172A] text-xs font-semibold">Tôi đồng ý với quy định mượn thiết bị</Text>
                  <Text className="text-[#94A3B8] text-[11px]">
                    Hoàn trả đúng hạn, không tự thảo dỡ, báo cáo sự cố nếu xảy ra.
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>

        {/* CTA */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-white flex-row"
          style={{ padding: 16, paddingBottom: 32, gap: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}
        >
          <Pressable
            className="flex-1 bg-[#F1F5F9] rounded-[14px] items-center justify-center"
            style={{ height: 52 }}
            onPress={() => submit(true)}
            disabled={submitting}
          >
            <Text className="text-[#0F172A] text-sm font-bold">Lưu nháp</Text>
          </Pressable>
          <Pressable
            className="flex-1 bg-[#CC0D00] rounded-[14px] flex-row items-center justify-center"
            style={{ height: 52, gap: 8 }}
            onPress={() => submit(false)}
            disabled={submitting}
          >
            <Text className="text-white text-sm font-bold">{submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}</Text>
            <Feather name="arrow-right" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Calendar Modal */}
      <Modal visible={!!showCalendar} transparent animationType="fade" statusBarTranslucent>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setShowCalendar(null)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-white" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 10 }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[#0F172A] text-base font-bold">
                  {showCalendar === 'start' ? 'Chọn ngày mượn' : 'Chọn ngày trả'}
                </Text>
                <Pressable onPress={() => setShowCalendar(null)}>
                  <Feather name="x" size={20} color="#0F172A" />
                </Pressable>
              </View>
              <Calendar
                minDate={(showCalendar === 'start' ? new Date() : startDate).toISOString().split('T')[0]}
                onDayPress={(d: any) => {
                  const [y, m, day] = d.dateString.split('-').map(Number);
                  const picked = new Date(y, m - 1, day);
                  if (showCalendar === 'start') setStartDate(picked);
                  else setDueDate(picked);
                  setShowCalendar(null);
                }}
                theme={{ todayTextColor: '#CC0D00', arrowColor: '#CC0D00', selectedDayBackgroundColor: '#CC0D00' }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
