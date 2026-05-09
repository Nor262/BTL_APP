import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, Modal, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { IconOutline } from '@ant-design/icons-react-native';
import api from '@/api/client';
import { DatePickerView } from '@ant-design/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function EquipmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [notes, setNotes] = useState('');
  const [occupiedDates, setOccupiedDates] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eqRes, transRes] = await Promise.all([
          api.get(`/equipment/${id}`),
          api.get(`/transactions/equipment/${id}`).catch(() => ({ data: { data: [] } }))
        ]);
        setEquipment(eqRes.data.data || eqRes.data);
        setOccupiedDates(transRes.data.data || transRes.data || []);
      } catch (error) {
        console.error(error);
        Alert.alert('Lỗi', 'Không thể tải thông tin thiết bị');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleBorrow = async () => {
    if (!notes.trim()) {
      Alert.alert('Yêu cầu', 'Vui lòng nhập mục đích mượn thiết bị');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/transactions/borrow', {
        equipment_id: parseInt(id as string),
        due_date: dueDate.toISOString(),
        notes: notes,
      });
      Alert.alert('Thành công', 'Yêu cầu mượn đã được gửi. Hệ thống sẽ thông báo khi quản trị viên phê duyệt.', [
        { text: 'Về trang chủ', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#CC0D00" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-muted">
      <StatusBar style="light" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="relative">
          <View className="w-full h-[400px]">
            <Image 
              source={equipment.image_url ? { uri: equipment.image_url } : { uri: 'https://picsum.photos/seed/' + id + '/800/600' }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent', 'rgba(242,242,247,1)']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
          </View>
          
          <View className="absolute top-12 left-6 right-6 flex-row justify-between items-center">
            <Pressable 
              className="w-12 h-12 bg-white/30 rounded-2xl items-center justify-center border border-white/20 blur-md"
              onPress={() => router.back()}
            >
              <IconOutline name="arrow-left" size={24} color="white" />
            </Pressable>
            <View className="bg-white/30 px-4 py-2 rounded-2xl border border-white/20">
              <Text className="text-white font-bold text-xs uppercase">{equipment.category?.name || 'THIẾT BỊ'}</Text>
            </View>
          </View>
        </View>

        <Animated.View 
          entering={FadeInDown.duration(600)}
          className="px-6 -mt-16"
        >
          <View className="bg-white p-6 rounded-[40px] shadow-premium">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-3xl font-bold text-secondary">{equipment.name}</Text>
                <View className="flex-row items-center mt-2">
                  <IconOutline name="barcode" size={14} color="#8E8E93" />
                  <Text className="text-gray-400 text-sm ml-2">SN: {equipment.serial_number}</Text>
                </View>
              </View>
              <Badge status={equipment.status} />
            </View>

            <View className="flex-row mt-8 justify-between">
              <View className="items-center bg-surface-muted p-4 rounded-3xl flex-1 mr-2">
                <IconOutline name="environment" size={24} color="#CC0D00" />
                <Text className="text-gray-400 text-[10px] mt-2 uppercase font-bold">Vị trí kho</Text>
                <Text className="text-secondary font-bold text-xs mt-1" numberOfLines={1}>
                  {equipment.location?.name || 'KHO A'}
                </Text>
              </View>
              <View className="items-center bg-surface-muted p-4 rounded-3xl flex-1 mx-1">
                <IconOutline name="calendar" size={24} color="#007AFF" />
                <Text className="text-gray-400 text-[10px] mt-2 uppercase font-bold">Ngày mua</Text>
                <Text className="text-secondary font-bold text-xs mt-1">
                  {equipment.purchase_date ? new Date(equipment.purchase_date).getFullYear() : '2024'}
                </Text>
              </View>
              <View className="items-center bg-surface-muted p-4 rounded-3xl flex-1 ml-2">
                <IconOutline name="safety" size={24} color="#34C759" />
                <Text className="text-gray-400 text-[10px] mt-2 uppercase font-bold">Tình trạng</Text>
                <Text className="text-secondary font-bold text-xs mt-1">100%</Text>
              </View>
            </View>

            <Text className="font-bold text-xl text-secondary mt-10 mb-4">Thông số kỹ thuật</Text>
            <View className="space-y-3">
              {Object.entries(equipment.specifications || { 'Thương hiệu': 'Sony', 'Độ phân giải': '4K', 'Kết nối': 'Wi-Fi/Bluetooth' }).map(([key, value]: [string, any], index) => (
                <View key={key} className="flex-row justify-between items-center py-2 border-b border-gray-50">
                  <Text className="text-gray-500 font-medium capitalize">{key}</Text>
                  <Text className="text-secondary font-bold">{value}</Text>
                </View>
              ))}
            </View>

            <Text className="font-bold text-xl text-secondary mt-10 mb-4">Mục đích sử dụng</Text>
            <TextInput
              className="bg-surface-muted rounded-3xl p-6 text-secondary text-base min-h-[120px]"
              placeholder="Nhập lý do bạn muốn mượn thiết bị này..."
              placeholderTextColor="#999"
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />

            {occupiedDates.length > 0 && (
              <View className="mt-10">
                <View className="flex-row items-center mb-4">
                  <IconOutline name="clock-circle" size={20} color="#FF3B30" />
                  <Text className="font-bold text-xl text-secondary ml-2">Lịch bận hiện tại</Text>
                </View>
                <View className="bg-error/5 p-4 rounded-3xl border border-error/10">
                  {occupiedDates.map((trans, idx) => (
                    <View key={idx} className="flex-row items-center mb-2">
                      <View className="w-2 h-2 rounded-full bg-error mr-3" />
                      <Text className="text-secondary font-medium text-sm">
                        {new Date(trans.request_date).toLocaleDateString('vi-VN')} → {new Date(trans.due_date).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </Animated.View>
        <View className="h-32" />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white p-6 pb-10 shadow-premium flex-row items-center rounded-t-[40px] border-t border-gray-100">
        <View className="flex-1 mr-6">
          <Text className="text-gray-400 font-bold text-[10px] uppercase">Hạn trả dự kiến</Text>
          <Pressable 
            onPress={() => setShowDatePicker(true)}
            className="flex-row items-center mt-1"
          >
            <Text className="text-secondary font-bold text-xl mr-2">{dueDate.toLocaleDateString('vi-VN')}</Text>
            <IconOutline name="edit" size={16} color="#CC0D00" />
          </Pressable>
        </View>
        <View className="flex-1">
          <Button 
            title="Đăng ký mượn" 
            onPress={handleBorrow}
            loading={submitting}
            disabled={equipment.status !== 'available' || submitting}
          />
        </View>
      </View>

      <Modal visible={showDatePicker} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white p-8 rounded-t-[40px]">
            <View className="flex-row justify-between items-center mb-8">
              <Pressable onPress={() => setShowDatePicker(false)}><Text className="text-gray-400 font-bold">HỦY</Text></Pressable>
              <Text className="font-bold text-xl text-secondary">Chọn ngày trả</Text>
              <Pressable onPress={() => setShowDatePicker(false)}><Text className="text-primary font-bold">XONG</Text></Pressable>
            </View>
            <DatePickerView
              mode="date"
              value={dueDate}
              onChange={setDueDate}
              minDate={new Date()}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
