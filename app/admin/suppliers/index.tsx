import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
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

export default function AdminSuppliersScreen() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.data || response.data);
    } catch (error) {
      console.error(error);
      handleApiError(error, 'Khong the tai danh sach nha cung cap');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setName('');
    setContactInfo('');
    setAddress('');
    setModalVisible(true);
  };

  const handleOpenEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setContactInfo(supplier.contact_info || '');
    setAddress(supplier.address || '');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Thong bao', 'Vui long nhap ten nha cung cap');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        contact_info: contactInfo.trim(),
        address: address.trim()
      };

      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, payload);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Thanh cong', 'Da cap nhat nha cung cap');
      } else {
        await api.post('/suppliers', payload);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Thanh cong', 'Da tao nha cung cap moi');
      }
      setModalVisible(false);
      fetchSuppliers();
    } catch (error) {
      handleApiError(error, 'Loi khi luu nha cung cap');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Xac nhan xoa', 'Ban co chac chan muon xoa nha cung cap nay? Hanh dong nay khong the hoan tac.', [
      { text: 'Huy', style: 'cancel' },
      { text: 'Xoa', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/suppliers/${id}`);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Thanh cong', 'Da xoa nha cung cap');
          fetchSuppliers();
        } catch (error) {
          handleApiError(error, 'Loi khi xoa nha cung cap');
        }
      }}
    ]);
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).duration(400)}
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-4">
          <Text className="font-bold text-gray-900 text-base">{item.name}</Text>
          {item.contact_info ? (
            <Text className="text-xs text-gray-600 mt-1">{item.contact_info}</Text>
          ) : null}
          {item.address ? (
            <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>{item.address}</Text>
          ) : null}
        </View>
        <View className="flex-row">
          <Pressable 
            className="w-9 h-9 bg-gray-50 rounded-lg items-center justify-center border border-gray-100 mr-2"
            onPress={() => handleOpenEdit(item)}
          >
            <Feather name="edit-2" size={14} color="#666" />
          </Pressable>
          <Pressable 
            className="w-9 h-9 bg-red-50 rounded-lg items-center justify-center border border-red-100"
            onPress={() => handleDelete(item.id)}
          >
            <Feather name="trash-2" size={14} color="#CC0D00" />
          </Pressable>
        </View>
      </View>
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
          <Text className="text-xl font-bold text-gray-900">Quan ly Nha cung cap</Text>
        </View>
        <Pressable 
          className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center"
          onPress={handleOpenAdd}
        >
          <Feather name="plus" size={20} color="#CC0D00" />
        </Pressable>
      </View>

      <FlatList
        data={suppliers}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); fetchSuppliers(); }} 
            tintColor="#CC0D00" 
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <Feather name="truck" size={48} color="#D1D1D6" />
            <Text className="text-gray-400 mt-4 font-bold text-base">Chua co nha cung cap nao</Text>
            <Text className="text-gray-400 text-xs text-center mt-1">An nut dau cong o goc tren de tao moi.</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1">
          <Pressable className="absolute inset-0 bg-black/40" onPress={() => setModalVisible(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            className="flex-1 justify-center px-6"
            pointerEvents="box-none"
          >
            <Pressable className="bg-white rounded-[30px] p-6 shadow-2xl" onPress={(e) => e.stopPropagation()}>
              <Text className="text-xl font-bold text-gray-900 mb-6 text-center">
                {editingSupplier ? 'Cap nhat nha cung cap' : 'Them nha cung cap moi'}
              </Text>

              <Input
                label="Ten nha cung cap"
                value={name}
                onChangeText={setName}
                placeholder="VD: Cong ty Sony Viet Nam, GearVN..."
                icon="truck"
              />

              <Input
                label="Thong tin lien he"
                value={contactInfo}
                onChangeText={setContactInfo}
                placeholder="VD: 0987654321 hoac mail@supplier.com..."
                icon="phone"
              />

              <Input
                label="Dia chi (tuy chon)"
                value={address}
                onChangeText={setAddress}
                placeholder="VD: 123 Nguyen Trai, Ha Noi..."
                icon="map-pin"
              />

              <View className="flex-row mt-6">
                <Button 
                  title="Huy" 
                  onPress={() => setModalVisible(false)} 
                  containerClassName="flex-1 mr-2" 
                  variant="secondary" 
                  disabled={submitting}
                />
                <Button 
                  title={editingSupplier ? 'Luu' : 'Tao'} 
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
    </View>
  );
}
