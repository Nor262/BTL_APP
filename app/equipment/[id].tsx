import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable, TextInput } from '@/tw';
import { Image } from 'expo-image';
import { ActivityIndicator, Alert, Modal } from 'react-native';
import { IconOutline } from '@ant-design/icons-react-native';
import api from '@/api/client';
import { DatePickerView } from '@ant-design/react-native';

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
          api.get(`/transactions/equipment/${id}`)
        ]);
        setEquipment(eqRes.data);
        setOccupiedDates(transRes.data);
      } catch (error) {
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
      Alert.alert('Lỗi', 'Vui lòng nhập lý do mượn thiết bị');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/transactions/borrow', {
        equipment_id: parseInt(id as string),
        due_date: dueDate.toISOString(),
        notes: notes,
      });
      Alert.alert('Thành công', 'Yêu cầu mượn đã được gửi. Vui lòng chờ quản lý phê duyệt.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator color="#CC0D00" /></View>;
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="relative">
          <View className="w-full h-80 bg-gray-100">
            <Image 
              source={equipment.image_url ? { uri: equipment.image_url } : require('@/assets/images/favicon.png')}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          </View>
          <Pressable 
            className="absolute top-12 left-4 w-10 h-10 bg-white/80 rounded-full items-center justify-center shadow-sm"
            onPress={() => router.back()}
          >
            <IconOutline name="arrow-left" size={24} color="#333" />
          </Pressable>
        </View>

        <View className="p-6">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">{equipment.name}</Text>
              <Text className="text-gray-500 mt-1">Số Serial: {equipment.serial_number}</Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${equipment.status === 'available' ? 'bg-green-100' : 'bg-orange-100'}`}>
              <Text className={`text-xs font-bold ${equipment.status === 'available' ? 'text-green-600' : 'text-orange-600'}`}>
                {equipment.status === 'available' ? 'CÓ SẴN' : 'ĐANG BẬN'}
              </Text>
            </View>
          </View>

          <View className="h-[1px] bg-gray-100 my-6" />

          <Text className="font-bold text-lg mb-2">Thông số kỹ thuật</Text>
          <View className="bg-gray-50 p-4 rounded-ant">
            {Object.entries(equipment.specifications || {}).map(([key, value]: [string, any]) => (
              <View key={key} className="flex-row justify-between py-1">
                <Text className="text-gray-500 capitalize">{key}:</Text>
                <Text className="text-gray-800 font-medium">{value}</Text>
              </View>
            ))}
          </View>

          <Text className="font-bold text-lg mt-6 mb-2">Vị trí lưu kho</Text>
          <View className="flex-row items-center">
            <IconOutline name="environment" size={18} color="#666" />
            <Text className="text-gray-600 ml-2">{equipment.location?.name || 'Không xác định'}</Text>
          </View>

          <View className="h-[1px] bg-gray-100 my-6" />

          <Text className="font-bold text-lg mb-2">Lý do mượn</Text>
          <TextInput
            className="border border-gray-200 rounded-ant p-4 bg-gray-50 text-sm h-24"
            placeholder="VD: Mượn quay phim sự kiện chào tân sinh viên..."
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />

          {occupiedDates.length > 0 && (
            <View className="mt-6">
              <Text className="font-bold text-lg mb-2 text-red-500">Lịch bận (Đã có người đặt)</Text>
              <View className="bg-red-50 p-4 rounded-ant border border-red-100">
                {occupiedDates.map((trans, idx) => (
                  <View key={idx} className="flex-row items-center mb-1">
                    <IconOutline name="calendar" size={14} color="#f5222d" />
                    <Text className="text-red-600 text-xs ml-2">
                      {new Date(trans.request_date).toLocaleDateString('vi-VN')} - {new Date(trans.due_date).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>


      <View className="p-6 border-t border-gray-100 flex-row items-center">
        <View className="flex-1 mr-4">
          <Text className="text-xs text-gray-500">Dự kiến trả</Text>
          <Pressable onPress={() => setShowDatePicker(true)}>
            <Text className="text-primary font-bold text-lg">{dueDate.toLocaleDateString('vi-VN')}</Text>
          </Pressable>
        </View>
        <Pressable 
          className={`flex-[2] py-4 rounded-ant items-center ${equipment.status !== 'available' || submitting ? 'bg-gray-300' : 'bg-primary'}`}
          onPress={handleBorrow}
          disabled={equipment.status !== 'available' || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">ĐĂNG KÝ MƯỢN</Text>
          )}
        </Pressable>
      </View>

      <Modal visible={showDatePicker} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white p-4 rounded-t-3xl">
            <View className="flex-row justify-between mb-4">
              <Pressable onPress={() => setShowDatePicker(false)}><Text className="text-gray-500">Hủy</Text></Pressable>
              <Text className="font-bold">Chọn ngày trả</Text>
              <Pressable onPress={() => setShowDatePicker(false)}><Text className="text-primary font-bold">Xong</Text></Pressable>
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
