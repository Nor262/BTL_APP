import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import api from '@/api/client';
import { StatusBar } from 'expo-status-bar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { handleApiError } from '@/utils/error-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function AdminMaintenanceScreen() {
  const [records, setRecords] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [eqModalVisible, setEqModalVisible] = useState(false);
  
  // Form fields
  const [selectedEq, setSelectedEq] = useState<any>(null);
  const [performedBy, setPerformedBy] = useState('');
  const [details, setDetails] = useState('');
  const [cost, setCost] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  const fetchData = async () => {
    try {
      const [mRes, eRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/equipment')
      ]);
      setRecords(mRes.data.data || mRes.data);
      setEquipmentList(eRes.data.data || eRes.data);
    } catch (error) {
      console.error(error);
      handleApiError(error, 'Khong the tai du lieu bao tri');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setSelectedEq(null);
    setPerformedBy('');
    setDetails('');
    setCost('');
    setNextDate('');
    setModalVisible(true);
  };

  const handleSelectEq = (eq: any) => {
    setSelectedEq(eq);
    setEqModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!selectedEq) {
      Alert.alert('Thong bao', 'Vui long chon thiet bi bao tri');
      return;
    }
    if (!performedBy.trim()) {
      Alert.alert('Thong bao', 'Vui long nhap nguoi thuc hien');
      return;
    }
    if (!details.trim()) {
      Alert.alert('Thong bao', 'Vui long nhap noi dung bao tri');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        equipment_id: selectedEq.id,
        performed_by: performedBy.trim(),
        details: details.trim(),
        maintenance_date: new Date().toISOString().split('T')[0]
      };

      if (cost.trim()) {
        payload.cost = parseFloat(cost.trim());
      }
      if (nextDate.trim()) {
        payload.next_maintenance_date = nextDate.trim(); // YYYY-MM-DD
      }

      await api.post('/maintenance', payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Thanh cong', 'Da ghi nhan bao tri thiet bi');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      handleApiError(error, 'Loi khi luu ghi nhan bao tri');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = (eqId: number, eqName: string) => {
    Alert.alert('Xac nhan hoan thanh', `Danh dau thiet bi "${eqName}" da hoan thanh bao tri va san sang su dung?`, [
      { text: 'Huy', style: 'cancel' },
      { text: 'Hoan thanh', onPress: async () => {
        try {
          await api.put(`/maintenance/complete/${eqId}`);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Thanh cong', 'Thiet bi da chuyen ve trang thai san sang');
          fetchData();
        } catch (error) {
          handleApiError(error, 'Loi khi hoan thanh bao tri');
        }
      }}
    ]);
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).duration(400)}
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 pr-4">
          <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>
            {item.equipment?.name}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">SN: {item.equipment?.serial_number}</Text>
        </View>
        <View className="bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
          <Text className="text-blue-600 font-bold text-[10px]">BAO TRI</Text>
        </View>
      </View>

      <View className="border-t border-b border-gray-50 py-3 my-1">
        <View className="flex-row items-center mb-1.5">
          <Feather name="user" size={14} color="#666" />
          <Text className="text-xs text-gray-700 ml-2 font-medium">Nguoi lam: {item.performed_by}</Text>
        </View>
        <View className="flex-row items-center mb-1.5">
          <Feather name="tool" size={14} color="#666" />
          <Text className="text-xs text-gray-700 ml-2">{item.details}</Text>
        </View>
        {item.cost ? (
          <View className="flex-row items-center mb-1.5">
            <Feather name="dollar-sign" size={14} color="#666" />
            <Text className="text-xs text-gray-700 ml-2 font-bold">
              Chi phi: {parseFloat(item.cost).toLocaleString('vi-VN')} VND
            </Text>
          </View>
        ) : null}
        <View className="flex-row items-center">
          <Feather name="calendar" size={14} color="#666" />
          <Text className="text-xs text-gray-500 ml-2">
            Ngay bao tri: {item.maintenance_date ? new Date(item.maintenance_date).toLocaleDateString('vi-VN') : 'N/A'}
          </Text>
        </View>
        {item.next_maintenance_date ? (
          <View className="flex-row items-center mt-1.5">
            <Feather name="alert-circle" size={14} color="#EAB308" />
            <Text className="text-xs text-yellow-600 ml-2 font-medium">
              Bao tri tiep theo: {new Date(item.next_maintenance_date).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        ) : null}
      </View>

      {item.equipment?.status === 'maintenance' && (
        <View className="flex-row justify-end mt-3 pt-2">
          <Pressable 
            className="flex-row items-center bg-green-50 px-3 py-1.5 rounded-lg border border-green-100"
            onPress={() => handleComplete(item.equipment.id, item.equipment.name)}
          >
            <Feather name="check" size={14} color="#34C759" />
            <Text className="text-green-600 font-bold text-xs ml-1.5">Hoan thanh bao tri</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View className="bg-white pt-16 pb-4 px-6 border-b border-gray-100 flex-row justify-between items-center shadow-sm">
        <View className="flex-row items-center">
          <Pressable 
            className="w-10 h-10 items-center justify-center mr-2"
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color="#333" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">Nhat ky Bao tri</Text>
        </View>
        <Pressable 
          className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center"
          onPress={handleOpenAdd}
        >
          <Feather name="plus" size={20} color="#CC0D00" />
        </Pressable>
      </View>

      <FlatList
        data={records}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); fetchData(); }} 
            tintColor="#CC0D00" 
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <Feather name="tool" size={48} color="#D1D1D6" />
            <Text className="text-gray-400 mt-4 font-bold text-base">Chua co lich su bao tri</Text>
            <Text className="text-gray-400 text-xs text-center mt-1">An nut dau cong o goc tren de tao ghi nhan bao tri.</Text>
          </View>
        }
      />

      {/* Modal Add Maintenance Record */}
      <Modal visible={modalVisible} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1">
          <Pressable className="absolute inset-0 bg-black/40" onPress={() => setModalVisible(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            className="flex-1 justify-center px-6"
            pointerEvents="box-none"
          >
            <Pressable className="bg-white rounded-[30px] p-6 shadow-2xl" onPress={(e) => e.stopPropagation()}>
              <Text className="text-xl font-bold text-gray-900 mb-6 text-center">Ghi nhan bao tri thiet bi</Text>

              <ScrollView className="max-h-[350px]" showsVerticalScrollIndicator={false}>
                <View className="mb-4">
                  <Text className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Thiet bi bao tri</Text>
                  {selectedEq ? (
                    <Pressable 
                      className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3.5"
                      onPress={() => setEqModalVisible(true)}
                    >
                      <View className="flex-row items-center">
                        <Feather name="monitor" size={16} color="#666" />
                        <Text className="text-sm font-bold text-gray-900 ml-3">{selectedEq.name}</Text>
                      </View>
                      <Feather name="chevron-down" size={16} color="#666" />
                    </Pressable>
                  ) : (
                    <Pressable 
                      className="flex-row items-center justify-between border border-dashed border-gray-300 rounded-xl p-3.5 bg-gray-50"
                      onPress={() => setEqModalVisible(true)}
                    >
                      <Text className="text-sm text-gray-400">Chon thiet bi...</Text>
                      <Feather name="chevron-down" size={16} color="#999" />
                    </Pressable>
                  )}
                </View>

                <Input
                  label="Nguoi thuc hien"
                  value={performedBy}
                  onChangeText={setPerformedBy}
                  placeholder="Nhap ten nguoi sua chua..."
                  icon="user"
                />

                <Input
                  label="Noi dung bao tri"
                  value={details}
                  onChangeText={setDetails}
                  placeholder="Thay linh kien, ve sinh thiet bi..."
                  icon="tool"
                />

                <Input
                  label="Chi phi (VND, tuy chon)"
                  value={cost}
                  onChangeText={setCost}
                  placeholder="VD: 500000"
                  keyboardType="numeric"
                  icon="dollar-sign"
                />

                <Input
                  label="Ngay bao tri tiep theo (YYYY-MM-DD, tuy chon)"
                  value={nextDate}
                  onChangeText={setNextDate}
                  placeholder="VD: 2026-08-15"
                  icon="calendar"
                />
              </ScrollView>

              <View className="flex-row mt-6">
                <Button 
                  title="Huy" 
                  onPress={() => setModalVisible(false)} 
                  containerClassName="flex-1 mr-2" 
                  variant="secondary" 
                  disabled={submitting}
                />
                <Button 
                  title="Ghi nhan" 
                  onPress={handleSubmit} 
                  containerClassName="flex-1 ml-2" 
                  loading={submitting}
                  disabled={submitting}
                />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Equipment Selection Modal */}
      <Modal visible={eqModalVisible} transparent animationType="slide">
        <View className="flex-1">
          <Pressable className="absolute inset-0 bg-black/40" onPress={() => setEqModalVisible(false)} />
          <View className="bg-white rounded-t-[30px] absolute bottom-0 left-0 right-0 h-[60%] p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Chon thiet bi bao tri</Text>
            <FlatList
              data={equipmentList}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable 
                  className="py-3.5 border-b border-gray-100 flex-row justify-between items-center"
                  onPress={() => handleSelectEq(item)}
                >
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900 text-sm">{item.name}</Text>
                    <Text className="text-xs text-gray-500 mt-1">SN: {item.serial_number} | Trạng thái: {item.status}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#CCC" />
                </Pressable>
              )}
              ListEmptyComponent={
                <View className="items-center justify-center py-20">
                  <Feather name="inbox" size={40} color="#D1D1D6" />
                  <Text className="text-gray-400 mt-2 text-sm">Khong co thiet bi nao</Text>
                </View>
              }
            />
            <Button 
              title="Dong" 
              variant="secondary" 
              onPress={() => setEqModalVisible(false)} 
              containerClassName="mt-4"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
