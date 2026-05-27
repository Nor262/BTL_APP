import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, FlatList, ActivityIndicator, RefreshControl, Dimensions, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import api from '@/api/client';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import Badge from '../ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlertStore } from '@/store/useAlertStore';
import LoadingScreen from '../ui/LoadingScreen';
import Button from '../ui/Button';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// Updated Dashboard with Active Loans - Forcing re-bundle
export default function BorrowerHome() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [pendingLoans, setPendingLoans] = useState<any[]>([]);
  const [approvedLoans, setApprovedLoans] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  
  const { user } = useAuthStore();
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [eqRes, transRes, countRes] = await Promise.all([
        api.get('/equipment').catch(e => { console.error('Eq error:', e.message); return { data: { data: [] } }; }),
        api.get('/transactions/my').catch(e => { console.error('Trans error:', e.message); return { data: { data: [] } }; }),
        api.get('/notifications/unread-count').catch(e => { console.error('Noti error:', e.message); return { data: { data: { count: 0 } } }; })
      ]);
      
      setEquipment(eqRes.data?.data || eqRes.data || []);
      
      const transactions = transRes.data?.data || transRes.data || [];
      const active = transactions.filter((t: any) => t.status === 'active' || t.status === 'overdue');
      setActiveLoans(active);

      const pending = transactions.filter((t: any) => t.status === 'pending');
      setPendingLoans(pending);

      const approved = transactions.filter((t: any) => t.status === 'approved');
      setApprovedLoans(approved);
      
      setUnreadCount(countRes.data?.data?.count || countRes.data?.count || 0);
    } catch (error) {
      console.error('General Fetch Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExtend = (tx: any) => {
    useAlertStore.getState().showAlert({
      type: 'warning',
      title: 'Xác nhận gia hạn',
      message: 'Bạn muốn gia hạn thêm 1 ngày cho thiết bị này?',
      showCancel: true,
      onConfirm: async () => {
        try {
          const newDueDate = new Date(new Date(tx.due_date).getTime() + 1 * 24 * 60 * 60 * 1000);
          await api.patch(`/transactions/${tx.id}/extend`, { new_due_date: newDueDate.toISOString() });
          useAlertStore.getState().showAlert({ type: 'success', title: 'Thành công', message: 'Gia hạn thành công!' });
          fetchData();
        } catch (error) {
          console.error(error);
          useAlertStore.getState().showAlert({ type: 'error', title: 'Lỗi', message: 'Không thể gia hạn đơn mượn' });
        }
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredEquipment = equipment.filter((item: any) => {
    return item.name.toLowerCase().includes(search.toLowerCase()) ||
           item.serial_number.toLowerCase().includes(search.toLowerCase());
  });

  const renderEquipmentItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).duration(500)}
      style={{ width: CARD_WIDTH }}
      className="mb-4"
    >
      <Pressable 
        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
        onPress={() => router.push(`/equipment/${item.id}`)}
      >
        <View className="w-full h-32 bg-gray-50 items-center justify-center">
          {item.image_url ? (
            <Image 
              source={{ uri: item.image_url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <View className="items-center justify-center">
               <Feather name="box" size={32} color="#D1D1D6" />
            </View>
          )}
          <View className="absolute top-2 right-2">
            <Badge status={item.status} />
          </View>
        </View>
        <View className="p-3">
          <Text className="font-bold text-gray-900 text-sm" numberOfLines={1}>{item.name}</Text>
          <View className="flex-row items-center mt-1">
             <Feather name="tag" size={10} color="#999" />
             <Text className="text-[10px] text-gray-500 ml-1">{item.category?.name || 'Thiết bị'}</Text>
          </View>
          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-primary font-bold text-[10px] uppercase">Chi tiết</Text>
            <Feather name="arrow-right" size={12} color="#CC0D00" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header with Search */}
      <View className="bg-primary pt-16 pb-8 px-6 rounded-b-[40px] shadow-lg">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-white/80 text-sm font-medium">Chào ngày mới,</Text>
            <Text className="text-white text-2xl font-bold tracking-tight">{user?.full_name?.split(' ').pop() || 'Thành viên'}</Text>
          </View>
          <View className="flex-row">
            <Pressable 
              className="w-11 h-11 bg-white/20 rounded-full items-center justify-center mr-2 border border-white/10"
              onPress={() => router.push('/notifications')}
            >
              <Feather name="bell" size={20} color="white" />
              {unreadCount > 0 && (
                <View className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-primary" />
              )}
            </Pressable>
            <Pressable 
              className="w-11 h-11 bg-white/20 rounded-full items-center justify-center border border-white/10 overflow-hidden"
              onPress={() => router.push('/(tabs)/explore')}
            >
              {user?.avatar_url ? (
                <Image 
                  source={{ uri: user.avatar_url }} 
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <Feather name="user" size={20} color="white" />
              )}
            </Pressable>
          </View>
        </View>
        
        <View className="flex-row items-center bg-white rounded-2xl px-4 h-14 shadow-xl">
          <Feather name="search" size={20} color="#999" />
          <TextInput 
            className="flex-1 ml-3 text-gray-900 text-base font-medium h-12 pt-0 pb-1"
            style={{ 
              textAlignVertical: 'center',
              includeFontPadding: false,
            }}
            placeholder="Tìm kiếm thiết bị bạn cần..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC0D00" />
        }
      >
        <View className="px-6 py-6">
          {/* Active Loans Horizontal Section */}
          <View className="flex-row justify-between items-center mb-5">
            <Text className="font-bold text-xl text-gray-900 tracking-tight">Thiết bị đang mượn</Text>
            {activeLoans.length > 0 && (
              <Pressable onPress={() => router.push('/my-loans')}>
                <Text className="text-primary font-bold text-sm">Xem tất cả</Text>
              </Pressable>
            )}
          </View>

          {activeLoans.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10 -mx-6 px-6">
              {activeLoans.map((loan: any, index: number) => (
                <Animated.View 
                  key={loan.id} 
                  entering={FadeInRight.delay(index * 100)}
                  className="mr-4"
                >
                  <Pressable 
                    onPress={() => {
                      setSelectedTx(loan);
                      setDetailModalVisible(true);
                    }}
                    className="bg-white rounded-[28px] p-4 flex-row items-center shadow-md shadow-gray-200 border border-gray-100"
                    style={{ width: width - 48 }}
                  >
                    <View className="w-16 h-16 bg-gray-50 rounded-2xl items-center justify-center overflow-hidden">
                      {loan.equipment?.image_url ? (
                        <Image source={{ uri: loan.equipment.image_url }} style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <Feather name="box" size={24} color="#D1D1D6" />
                      )}
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="font-bold text-gray-900 text-sm" numberOfLines={1}>{loan.equipment?.name || 'Thiết bị'}</Text>
                      <View className="flex-row items-center mt-1">
                        <View className={`w-2 h-2 rounded-full ${loan.status === 'overdue' ? 'bg-red-500' : 'bg-green-500'} mr-2`} />
                        <Text className="text-gray-500 text-xs font-medium">{loan.status === 'overdue' ? 'Quá hạn trả' : 'Đang sử dụng'}</Text>
                      </View>
                    </View>
                    <View className="bg-gray-50 w-10 h-10 rounded-full items-center justify-center">
                      <Feather name="chevron-right" size={18} color="#999" />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          ) : (
            <View className="bg-gray-50 rounded-[30px] p-6 items-center mb-10 border border-dashed border-gray-200">
               <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mb-3 shadow-sm">
                  <Feather name="info" size={20} color="#D1D1D6" />
               </View>
               <Text className="text-gray-400 text-sm font-medium">Bạn hiện không mượn thiết bị nào</Text>
            </View>
          )}

          {/* Approved Loans Horizontal Section */}
          <View className="flex-row justify-between items-center mb-5">
            <Text className="font-bold text-xl text-gray-900 tracking-tight">Đơn mượn đã được duyệt</Text>
            {approvedLoans.length > 0 && (
              <Pressable onPress={() => router.push('/my-loans')}>
                <Text className="text-primary font-bold text-sm">Xem tất cả</Text>
              </Pressable>
            )}
          </View>

          {approvedLoans.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10 -mx-6 px-6">
              {approvedLoans.map((loan: any, index: number) => (
                <Animated.View 
                  key={loan.id} 
                  entering={FadeInRight.delay(index * 100)}
                  className="mr-4"
                >
                  <Pressable 
                    onPress={() => {
                      setSelectedTx(loan);
                      setDetailModalVisible(true);
                    }}
                    className="bg-white rounded-[28px] p-4 flex-row items-center shadow-md shadow-gray-200 border border-gray-100"
                    style={{ width: width - 48 }}
                  >
                    <View className="w-16 h-16 bg-green-50 rounded-2xl items-center justify-center overflow-hidden">
                      {loan.equipment?.image_url ? (
                        <Image source={{ uri: loan.equipment.image_url }} style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <Feather name="box" size={24} color="#D1D1D6" />
                      )}
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="font-bold text-gray-900 text-sm" numberOfLines={1}>{loan.equipment?.name || 'Thiết bị'}</Text>
                      <View className="flex-row items-center mt-1">
                        <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                        <Text className="text-green-600 text-xs font-semibold">Đã duyệt - Sẵn sàng nhận</Text>
                      </View>
                    </View>
                    <View className="bg-gray-50 w-10 h-10 rounded-full items-center justify-center">
                      <Feather name="chevron-right" size={18} color="#999" />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          ) : (
            <View className="bg-gray-50 rounded-[30px] p-6 items-center mb-10 border border-dashed border-gray-200">
               <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mb-3 shadow-sm">
                  <Feather name="check-square" size={20} color="#D1D1D6" />
               </View>
               <Text className="text-gray-400 text-sm font-medium">Không có đơn mượn nào đã duyệt</Text>
            </View>
          )}

          {/* Pending Loans Horizontal Section */}
          <View className="flex-row justify-between items-center mb-5">
            <Text className="font-bold text-xl text-gray-900 tracking-tight">Đơn mượn chưa được duyệt</Text>
            {pendingLoans.length > 0 && (
              <Pressable onPress={() => router.push('/my-loans')}>
                <Text className="text-primary font-bold text-sm">Xem tất cả</Text>
              </Pressable>
            )}
          </View>

          {pendingLoans.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10 -mx-6 px-6">
              {pendingLoans.map((loan: any, index: number) => (
                <Animated.View 
                  key={loan.id} 
                  entering={FadeInRight.delay(index * 100)}
                  className="mr-4"
                >
                  <Pressable 
                    onPress={() => {
                      setSelectedTx(loan);
                      setDetailModalVisible(true);
                    }}
                    className="bg-white rounded-[28px] p-4 flex-row items-center shadow-md shadow-gray-200 border border-gray-100"
                    style={{ width: width - 48 }}
                  >
                    <View className="w-16 h-16 bg-amber-50 rounded-2xl items-center justify-center overflow-hidden">
                      {loan.equipment?.image_url ? (
                        <Image source={{ uri: loan.equipment.image_url }} style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <Feather name="box" size={24} color="#D1D1D6" />
                      )}
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="font-bold text-gray-900 text-sm" numberOfLines={1}>{loan.equipment?.name || 'Thiết bị'}</Text>
                      <View className="flex-row items-center mt-1">
                        <View className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                        <Text className="text-amber-600 text-xs font-semibold">Chờ quản trị viên duyệt</Text>
                      </View>
                    </View>
                    <View className="bg-gray-50 w-10 h-10 rounded-full items-center justify-center">
                      <Feather name="chevron-right" size={18} color="#999" />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          ) : (
            <View className="bg-gray-50 rounded-[30px] p-6 items-center mb-10 border border-dashed border-gray-200">
               <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mb-3 shadow-sm">
                  <Feather name="clock" size={20} color="#D1D1D6" />
               </View>
               <Text className="text-gray-400 text-sm font-medium">Không có đơn mượn nào đang chờ duyệt</Text>
            </View>
          )}

          {/* Equipment Grid */}
          <View className="flex-row justify-between items-center mb-5">
            <Text className="font-bold text-xl text-gray-900 tracking-tight">Thiết bị hiện có</Text>
          </View>
          <FlatList
            data={filteredEquipment}
            renderItem={renderEquipmentItem}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            ListEmptyComponent={
              <View className="items-center py-16 bg-gray-50 rounded-[30px] border border-dashed border-gray-200">
                <Feather name="search" size={48} color="#D1D1D6" />
                <Text className="text-gray-400 mt-4 text-sm font-medium">Không tìm thấy thiết bị nào phù hợp</Text>
              </View>
            }
          />
        </View>
        <View className="h-32" />
      </ScrollView>

      {/* Modal Chi Tiết Giao Dịch */}
      <Modal visible={detailModalVisible} transparent animationType="slide" statusBarTranslucent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[30px] p-6 max-h-[85%] pb-8">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">Chi tiết đơn mượn</Text>
              <Pressable onPress={() => setDetailModalVisible(false)} className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center">
                <Feather name="x" size={18} color="#999" />
              </Pressable>
            </View>

            {selectedTx && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6 flex-row items-center">
                  <View className="w-12 h-12 bg-white rounded-xl items-center justify-center shadow-sm mr-4">
                    <Feather name="monitor" size={24} color="#CC0D00" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900 text-lg">{selectedTx.equipment?.name}</Text>
                    <Text className="text-gray-500 text-sm mt-1">SN: {selectedTx.equipment?.serial_number}</Text>
                  </View>
                </View>

                {/* Info Fields */}
                <DetailRow label="Trạng thái" value={<Badge status={selectedTx.status} />} />
                <DetailRow label="Người mượn" value={selectedTx.borrower?.full_name || user?.full_name} />
                <DetailRow label="Mục đích mượn" value={selectedTx.purpose || selectedTx.notes || 'Không có'} />
                
                <DetailRow 
                  label="Ngày yêu cầu" 
                  value={selectedTx.request_date ? new Date(selectedTx.request_date).toLocaleString('vi-VN') : '—'} 
                />
                <DetailRow 
                  label="Hạn trả dự kiến" 
                  value={selectedTx.due_date ? new Date(selectedTx.due_date).toLocaleDateString('vi-VN') : '—'} 
                />

                {selectedTx.actual_check_out && (
                  <DetailRow 
                    label="Ngày nhận thực tế" 
                    value={new Date(selectedTx.actual_check_out).toLocaleString('vi-VN')} 
                  />
                )}

                {selectedTx.actual_check_in && (
                  <DetailRow 
                    label="Ngày trả thực tế" 
                    value={new Date(selectedTx.actual_check_in).toLocaleString('vi-VN')} 
                  />
                )}

                {selectedTx.rejection_reason && (
                  <DetailRow 
                    label="Lý do từ chối" 
                    value={<Text className="text-red-500 font-semibold">{selectedTx.rejection_reason}</Text>} 
                  />
                )}

                {selectedTx.is_extended && (
                  <DetailRow 
                    label="Gia hạn" 
                    value={<Text className="text-orange-500 font-bold">Đã gia hạn thêm 1 ngày</Text>} 
                  />
                )}

                {selectedTx.rating && (
                  <DetailRow 
                    label="Đánh giá thiết bị" 
                    value={
                      <View className="flex-row items-center">
                        <Feather name="star" size={14} color="#F59E0B" />
                        <Text className="text-orange-500 ml-1 font-bold">{selectedTx.rating}/5 ({selectedTx.feedback || 'Không có nhận xét'})</Text>
                      </View>
                    } 
                  />
                )}

                {selectedTx.status === 'active' && !selectedTx.is_extended && (
                  <Button 
                    title="Gia hạn (+1 ngày)" 
                    onPress={() => {
                      setDetailModalVisible(false);
                      handleExtend(selectedTx);
                    }}
                    containerClassName="mt-4" 
                  />
                )}

                <Button 
                  title="Đóng" 
                  onPress={() => setDetailModalVisible(false)} 
                  containerClassName="mt-4" 
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View className="flex-row justify-between py-3 border-b border-gray-100 items-center">
      <Text className="text-gray-500 text-sm font-medium">{label}</Text>
      {typeof value === 'string' ? (
        <Text className="text-gray-900 text-sm font-bold">{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}
