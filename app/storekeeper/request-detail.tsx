import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Modal, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import api from '@/api/client';
import { StatusBar } from 'expo-status-bar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { handleApiError } from '@/utils/error-handler';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function StorekeeperRequestDetailScreen() {
  const { id } = useLocalSearchParams();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const fetchDetail = async () => {
    try {
      const response = await api.get('/transactions');
      const allTx = response.data.data || response.data;
      const tx = allTx.find((t: any) => t.id === parseInt(id as string, 10));
      if (!tx) {
        Alert.alert('Loi', 'Khong tim thay don muon nay');
        router.back();
        return;
      }
      setRequest(tx);
    } catch (error) {
      console.error(error);
      handleApiError(error, 'Khong the tai chi tiet don muon');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const handleApprove = () => {
    Alert.alert('Xac nhan duyet', 'Ban dong y cho phep muon thiet bi nay?', [
      { text: 'Huy', style: 'cancel' },
      { text: 'Duyet', onPress: async () => {
        setSubmitting(true);
        try {
          await api.put(`/transactions/${id}/review`, { status: 'approved' });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Thanh cong', 'Da duyet don muon thiet bi!');
          router.replace('/storekeeper/requests');
        } catch (error) {
          handleApiError(error, 'Loi khi duyet don');
        } finally {
          setSubmitting(false);
        }
      }}
    ]);
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Thong bao', 'Vui long nhap ly do tu choi');
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/transactions/${id}/review`, { 
        status: 'rejected', 
        notes: rejectReason.trim() 
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRejectModalVisible(false);
      Alert.alert('Thanh cong', 'Da tu choi don muon thiet bi');
      router.replace('/storekeeper/requests');
    } catch (error) {
      handleApiError(error, 'Loi khi tu choi don');
    } finally {
      setSubmitting(false);
    }
  };

  const makeCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (loading || !request) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View className="bg-white pt-16 pb-4 px-6 border-b border-gray-100 flex-row items-center shadow-sm">
        <Pressable 
          className="w-10 h-10 items-center justify-center mr-2"
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#333" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Chi tiet yeu cau</Text>
      </View>

      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        {/* Nguoi muon */}
        <Animated.View entering={FadeInUp.delay(100)} className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Thong tin nguoi muon</Text>
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 bg-red-50 rounded-full items-center justify-center mr-4">
              <Feather name="user" size={24} color="#CC0D00" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">
                {request.borrower?.full_name || request.borrower?.username}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">MSV: {request.borrower?.student_id || 'Chua cap nhat'}</Text>
            </View>
          </View>
          
          <View className="border-t border-gray-50 pt-3">
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-gray-500">Lop học</Text>
              <Text className="text-xs text-gray-900 font-medium">{request.borrower?.class || 'Chua cap nhat'}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-gray-500">Khoa / Phong ban</Text>
              <Text className="text-xs text-gray-900 font-medium">{request.borrower?.department || 'Chua cap nhat'}</Text>
            </View>
            {request.borrower?.phone && (
              <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-50">
                <Text className="text-xs text-gray-500">So dien thoai</Text>
                <Pressable 
                  className="flex-row items-center bg-green-50 px-2.5 py-1 rounded-lg border border-green-100"
                  onPress={() => makeCall(request.borrower.phone)}
                >
                  <Feather name="phone" size={12} color="#34C759" />
                  <Text className="text-xs font-bold text-green-600 ml-1.5">{request.borrower.phone}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Thiet bi */}
        <Animated.View entering={FadeInUp.delay(200)} className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Thong tin thiet bi</Text>
          <View className="flex-row items-center mb-3">
            <View className="w-12 h-12 bg-red-50 rounded-full items-center justify-center mr-4">
              <Feather name="monitor" size={24} color="#CC0D00" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900" numberOfLines={1}>{request.equipment?.name}</Text>
              <Text className="text-xs text-gray-500 mt-1">SN: {request.equipment?.serial_number}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Thoi gian va ly do */}
        <Animated.View entering={FadeInUp.delay(300)} className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Thoi gian va muc dich</Text>
          
          <View className="flex-row justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
            <View>
              <Text className="text-[10px] text-gray-500 uppercase font-bold mb-1">Ngay bat dau</Text>
              <Text className="text-sm font-medium text-gray-900">
                {new Date(request.start_date).toLocaleDateString('vi-VN')}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-[10px] text-gray-500 uppercase font-bold mb-1">Ngay tra du kien</Text>
              <Text className="text-sm font-medium text-gray-900">
                {new Date(request.due_date).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          </View>

          {request.notes && (
            <View className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">Muc dich muon</Text>
              <Text className="text-xs text-gray-700 leading-5">
                {request.notes}
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Button Actions */}
      <View className="p-6 bg-white border-t border-gray-100 flex-row">
        <Button 
          title="Tu choi" 
          variant="secondary" 
          onPress={() => setRejectModalVisible(true)} 
          containerClassName="flex-1 mr-2 bg-gray-50"
          disabled={submitting}
        />
        <Button 
          title="Phe duyet" 
          onPress={handleApprove} 
          containerClassName="flex-1 ml-2"
          disabled={submitting}
          loading={submitting}
        />
      </View>

      {/* Modal Tu Choi */}
      <Modal visible={rejectModalVisible} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1">
          <Pressable className="absolute inset-0 bg-black/40" onPress={() => setRejectModalVisible(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            className="flex-1 justify-center px-6"
            pointerEvents="box-none"
          >
            <Pressable className="bg-white rounded-[30px] p-6 shadow-2xl" onPress={(e) => e.stopPropagation()}>
              <Text className="text-xl font-bold text-gray-900 mb-2 text-center">Tu choi yeu cau</Text>
              <Text className="text-gray-500 text-center mb-6">Vui long nhap ly do tu choi don muon</Text>

              <Input
                label="Ly do tu choi"
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Khong du thiet bi, thiet bi dang bao tri..."
                icon="message-circle"
              />

              <View className="flex-row mt-4">
                <Button 
                  title="Huy" 
                  onPress={() => setRejectModalVisible(false)} 
                  containerClassName="flex-1 mr-2" 
                  variant="secondary" 
                  disabled={submitting}
                />
                <Button 
                  title="Gui tu choi" 
                  onPress={handleRejectSubmit} 
                  containerClassName="flex-1 ml-2" 
                  loading={submitting}
                  disabled={submitting}
                />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
