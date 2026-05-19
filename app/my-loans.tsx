import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Alert, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import api from '@/api/client';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Badge from '@/components/ui/Badge';
import { StatusBar } from 'expo-status-bar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { handleApiError } from '@/utils/error-handler';
import { useAuthStore } from '@/store/useAuthStore';
import { Image } from 'expo-image';

export default function MyLoansScreen() {
  const { filter } = useLocalSearchParams();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [rating, setRating] = useState('5');
  const [feedback, setFeedback] = useState('');
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'active' | 'overdue' | 'completed'>('all');

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<any>(null);

  const fetchData = async () => {
    try {
      const endpoint = (user?.role === 'storekeeper' || user?.role === 'admin') ? '/transactions' : '/transactions/my';
      const response = await api.get(endpoint);
      setTransactions(response.data.data || response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (filter) {
      setActiveTab(filter as any);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).duration(500)}
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
    >
      <Pressable onPress={() => { setSelectedTxDetail(item); setDetailModalVisible(true); }}>
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-4">
            <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>
              {item.equipment?.name}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">SN: {item.equipment?.serial_number}</Text>
          </View>
          <Badge status={item.status} />
        </View>
        
        <View className="flex-row justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
          <View>
            <Text className="text-[10px] text-gray-500 uppercase font-bold mb-1">Ngày mượn</Text>
            <Text className="text-sm font-medium text-gray-900">
              {new Date(item.request_date).toLocaleDateString('vi-VN')}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-[10px] text-gray-500 uppercase font-bold mb-1">Hạn trả</Text>
            <Text className={`text-sm font-medium ${new Date(item.due_date) < new Date() && item.status === 'in_use' ? 'text-red-500' : 'text-gray-900'}`}>
              {new Date(item.due_date).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>

        {item.condition_on_return && (
          <View className="mt-3 flex-row items-center">
            <Feather name="info" size={14} color="#666" />
            <Text className="text-xs text-gray-500 ml-1">Tình trạng trả: {item.condition_on_return}</Text>
          </View>
        )}
      </Pressable>

      {/* Hành động: Gia hạn / Đánh giá / Duyệt */}
      <View className="flex-row justify-end mt-3 border-t border-gray-100 pt-3">
        {(user?.role === 'storekeeper' || user?.role === 'admin') && item.status === 'pending' && (
          <>
            <Pressable 
              className="bg-red-50 px-4 py-2 rounded-xl border border-red-100 mr-2 active:scale-95"
              onPress={() => handleReview(item.id, 'rejected')}
            >
              <Text className="text-red-600 font-bold text-xs">Từ chối</Text>
            </Pressable>
            <Pressable 
              className="bg-green-50 px-4 py-2 rounded-xl border border-green-100 active:scale-95"
              onPress={() => handleReview(item.id, 'approved')}
            >
              <Text className="text-green-600 font-bold text-xs">Phê duyệt</Text>
            </Pressable>
          </>
        )}
        {item.status === 'active' && !item.is_extended && (
          <Pressable 
            className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 mr-2"
            onPress={() => handleExtend(item)}
          >
            <Text className="text-blue-600 font-medium text-xs">Gia hạn (+7 ngày)</Text>
          </Pressable>
        )}
        {item.status === 'completed' && !item.rating && (
          <Pressable 
            className="bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100"
            onPress={() => {
              setSelectedTx(item);
              setRating('5');
              setFeedback('');
              setRatingModalVisible(true);
            }}
          >
            <Text className="text-orange-600 font-medium text-xs">Đánh giá</Text>
          </Pressable>
        )}
        {item.rating && (
          <View className="flex-row items-center">
            <Feather name="star" size={14} color="#F59E0B" />
            <Text className="text-orange-500 text-xs ml-1 font-bold">{item.rating}/5</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const submitRating = async () => {
    if (!selectedTx) return;
    try {
      await api.patch(`/transactions/${selectedTx.id}/rate`, {
        rating: parseInt(rating, 10),
        feedback
      });
      Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá!');
      setRatingModalVisible(false);
      fetchData();
    } catch (error) {
      handleApiError(error, 'Lỗi đánh giá');
    }
  };

  const handleReview = (txId: number, status: 'approved' | 'rejected') => {
    const actionText = status === 'approved' ? 'duyệt' : 'từ chối';
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc chắn muốn ${actionText} yêu cầu mượn này?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              setLoading(true);
              await api.put(`/transactions/${txId}/review`, { status, notes: `Được ${actionText} bởi thủ kho` });
              Alert.alert('Thành công', `Đã ${actionText} yêu cầu mượn.`);
              fetchData();
            } catch (error) {
              handleApiError(error, `Lỗi ${actionText} yêu cầu`);
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleExtend = (tx: any) => {
    Alert.alert('Xác nhận gia hạn', 'Bạn muốn gia hạn thêm 7 ngày cho thiết bị này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Gia hạn', onPress: async () => {
        try {
          const newDueDate = new Date(new Date(tx.due_date).getTime() + 7 * 24 * 60 * 60 * 1000);
          await api.patch(`/transactions/${tx.id}/extend`, { new_due_date: newDueDate.toISOString() });
          Alert.alert('Thành công', 'Gia hạn thành công!');
          fetchData();
        } catch (error) {
          handleApiError(error, 'Lỗi gia hạn');
        }
      }}
    ]);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'all') return true;
    return tx.status === activeTab;
  });

  if (loading) {
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
        <Text className="text-xl font-bold text-gray-900">Lịch sử giao dịch</Text>
      </View>

      <View className="bg-white py-3 border-b border-gray-100">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'pending', label: 'Chờ duyệt' },
            { id: 'approved', label: 'Đã duyệt' },
            { id: 'active', label: 'Đang mượn' },
            { id: 'overdue', label: 'Quá hạn' },
            { id: 'completed', label: 'Đã trả' },
          ].map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-full mr-2 ${
                activeTab === tab.id ? 'bg-primary' : 'bg-gray-100'
              }`}
            >
              <Text 
                className={`text-xs font-bold ${
                  activeTab === tab.id ? 'text-white' : 'text-gray-600'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#CC0D00" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Feather name="inbox" size={60} color="#D1D1D6" />
            <Text className="text-gray-400 mt-4 font-medium">Chưa có giao dịch nào</Text>
          </View>
        }
      />

      {/* Modal Đánh Giá */}
      <Modal visible={ratingModalVisible} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1">
          <Pressable className="absolute inset-0 bg-black/40" onPress={() => setRatingModalVisible(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            className="flex-1 justify-center px-6"
            pointerEvents="box-none"
          >
            <Pressable className="bg-white rounded-[30px] p-6 shadow-2xl" onPress={(e) => e.stopPropagation()}>
              <Text className="text-xl font-bold text-gray-900 mb-2 text-center">Đánh giá thiết bị</Text>
              <Text className="text-gray-500 text-center mb-6">{selectedTx?.equipment?.name}</Text>

              <Input
                label="Điểm đánh giá (1-5)"
                value={rating}
                onChangeText={setRating}
                keyboardType="numeric"
                icon="star"
              />

              <Input
                label="Phản hồi (tùy chọn)"
                value={feedback}
                onChangeText={setFeedback}
                placeholder="Máy dùng tốt..."
                icon="message-circle"
              />

              <View className="flex-row mt-4">
                <Button title="Hủy" onPress={() => setRatingModalVisible(false)} containerClassName="flex-1 mr-2" variant="secondary" />
                <Button title="Gửi đánh giá" onPress={submitRating} containerClassName="flex-1 ml-2" />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal Chi tiết Phiếu mượn */}
      <Modal visible={detailModalVisible} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1">
          <Pressable className="absolute inset-0 bg-black/50" onPress={() => setDetailModalVisible(false)} />
          <Animated.View 
            entering={FadeIn.duration(300)}
            className="flex-1 justify-center px-6"
            pointerEvents="box-none"
          >
            <Pressable className="bg-white rounded-[32px] overflow-hidden shadow-2xl max-h-[80%]" onPress={(e) => e.stopPropagation()}>
              
              {/* Header */}
              <View className="bg-primary pt-8 pb-5 px-6 items-center rounded-b-[30px] relative">
                <Text className="text-white text-lg font-bold uppercase tracking-wider">Phiếu Mượn Thiết Bị</Text>
                {selectedTxDetail?.id && (
                  <Text className="text-white/80 text-xs mt-1 font-mono">Mã số phiếu: #{selectedTxDetail.id}</Text>
                )}
                <View className="mt-3">
                  <Badge status={selectedTxDetail?.status} />
                </View>
                <Pressable 
                  onPress={() => setDetailModalVisible(false)}
                  className="absolute top-8 right-6 w-8 h-8 bg-white/20 rounded-full items-center justify-center active:scale-95"
                >
                  <Feather name="x" size={16} color="white" />
                </Pressable>
              </View>

              {/* Content */}
              <ScrollView showsVerticalScrollIndicator={false} className="p-6" contentContainerStyle={{ paddingBottom: 30 }}>
                {/* 1. Thiết bị */}
                <View className="mb-6">
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Thông tin thiết bị</Text>
                  <View className="flex-row items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    {selectedTxDetail?.equipment?.image_url ? (
                      <Image 
                        source={{ uri: selectedTxDetail.equipment.image_url }} 
                        className="w-16 h-16 rounded-xl mr-4 bg-gray-200"
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-16 h-16 bg-gray-100 rounded-xl mr-4 items-center justify-center">
                        <Feather name="monitor" size={24} color="#999" />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>
                        {selectedTxDetail?.equipment?.name}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">Serial Number: {selectedTxDetail?.equipment?.serial_number}</Text>
                    </View>
                  </View>
                </View>

                {/* 2. Người mượn */}
                {selectedTxDetail?.borrower && (
                  <View className="mb-6">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Thông tin người mượn</Text>
                    <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <DetailRow label="Người mượn" value={selectedTxDetail.borrower.full_name} icon="user" />
                      {selectedTxDetail.borrower.student_id && (
                        <DetailRow label="Mã sinh viên" value={selectedTxDetail.borrower.student_id} icon="credit-card" />
                      )}
                      {selectedTxDetail.borrower.class && (
                        <DetailRow label="Lớp / Khoa" value={`${selectedTxDetail.borrower.class} - ${selectedTxDetail.borrower.department || 'CLB'}`} icon="layers" />
                      )}
                      <DetailRow label="Số điện thoại" value={selectedTxDetail.borrower.phone || 'Chưa cập nhật'} icon="phone" />
                      <DetailRow label="Email" value={selectedTxDetail.borrower.email} icon="mail" />
                    </View>
                  </View>
                )}

                {/* 3. Lịch trình */}
                <View className="mb-6">
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Thời gian & Lịch trình</Text>
                  <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <DetailRow 
                      label="Ngày yêu cầu" 
                      value={selectedTxDetail?.request_date ? new Date(selectedTxDetail.request_date).toLocaleString('vi-VN') : '---'} 
                      icon="calendar" 
                    />
                    <DetailRow 
                      label="Thời gian mượn" 
                      value={selectedTxDetail?.start_date ? new Date(selectedTxDetail.start_date).toLocaleDateString('vi-VN') : '---'} 
                      icon="play-circle" 
                    />
                    <DetailRow 
                      label="Hạn trả dự kiến" 
                      value={selectedTxDetail?.due_date ? new Date(selectedTxDetail.due_date).toLocaleDateString('vi-VN') : '---'} 
                      icon="alert-circle" 
                      valueColor={new Date(selectedTxDetail?.due_date) < new Date() && selectedTxDetail?.status === 'in_use' ? '#ef4444' : '#1F2937'}
                    />
                    {selectedTxDetail?.actual_check_out && (
                      <DetailRow 
                        label="Bàn giao thực tế" 
                        value={new Date(selectedTxDetail.actual_check_out).toLocaleString('vi-VN')} 
                        icon="key" 
                      />
                    )}
                    {selectedTxDetail?.actual_check_in && (
                      <DetailRow 
                        label="Nhận lại thực tế" 
                        value={new Date(selectedTxDetail.actual_check_in).toLocaleString('vi-VN')} 
                        icon="check-circle" 
                      />
                    )}
                  </View>
                </View>

                {/* 4. Chi tiết bàn giao */}
                <View className="mb-6">
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Mục đích & Tình trạng</Text>
                  <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <View className="mb-3">
                      <Text className="text-[10px] text-gray-400 uppercase font-bold">Mục đích sử dụng:</Text>
                      <Text className="text-sm font-medium text-gray-900 mt-1">{selectedTxDetail?.notes || 'Không có ghi chú'}</Text>
                    </View>
                    
                    {selectedTxDetail?.condition_at_check_out && (
                      <View className="mt-3 border-t border-gray-200 pt-3">
                        <Text className="text-[10px] text-gray-400 uppercase font-bold">Tình trạng khi bàn giao:</Text>
                        <Text className="text-sm font-medium text-gray-900 mt-1">{selectedTxDetail.condition_at_check_out}</Text>
                      </View>
                    )}

                    {selectedTxDetail?.condition_at_check_in && (
                      <View className="mt-3 border-t border-gray-200 pt-3">
                        <Text className="text-[10px] text-gray-400 uppercase font-bold">Tình trạng khi trả:</Text>
                        <Text className="text-sm font-medium text-gray-900 mt-1">{selectedTxDetail.condition_at_check_in}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* 5. Cán bộ */}
                {(selectedTxDetail?.approver || selectedTxDetail?.storekeeper) && (
                  <View className="mb-6">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Cán bộ xử lý</Text>
                    <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      {selectedTxDetail.approver && (
                        <DetailRow label="Người duyệt đơn" value={selectedTxDetail.approver.full_name} icon="check-square" />
                      )}
                      {selectedTxDetail.storekeeper && (
                        <DetailRow label="Thủ kho giao nhận" value={selectedTxDetail.storekeeper.full_name} icon="pocket" />
                      )}
                    </View>
                  </View>
                )}

                {/* 6. Minh chứng hình ảnh */}
                {(selectedTxDetail?.image_url_before || selectedTxDetail?.image_url_after) && (
                  <View className="mb-6">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Hình ảnh minh chứng</Text>
                    <View className="flex-row justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      {selectedTxDetail.image_url_before && (
                        <View className="flex-1 mr-2">
                          <Text className="text-[10px] text-gray-500 mb-1">Khi bàn giao:</Text>
                          <Image 
                            source={{ uri: selectedTxDetail.image_url_before }} 
                            className="w-full h-28 rounded-xl bg-gray-200" 
                            contentFit="cover"
                          />
                        </View>
                      )}
                      {selectedTxDetail.image_url_after && (
                        <View className="flex-1 ml-2">
                          <Text className="text-[10px] text-gray-500 mb-1">Khi nhận lại:</Text>
                          <Image 
                            source={{ uri: selectedTxDetail.image_url_after }} 
                            className="w-full h-28 rounded-xl bg-gray-200" 
                            contentFit="cover"
                          />
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* 7. Đánh giá */}
                {selectedTxDetail?.rating && (
                  <View className="mb-6">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Đánh giá & Phản hồi</Text>
                    <View className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                      <View className="flex-row items-center mb-2">
                        <Feather name="star" size={16} color="#F59E0B" />
                        <Text className="font-bold text-orange-600 text-sm ml-1">{selectedTxDetail.rating} / 5 điểm</Text>
                      </View>
                      <Text className="text-[10px] text-gray-500">Phản hồi của người mượn:</Text>
                      <Text className="text-sm font-medium text-gray-900 mt-1 italic">"{selectedTxDetail.feedback || 'Không có ý kiến thêm'}"</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              <View className="p-5 border-t border-gray-100 bg-gray-50">
                <Button 
                  title="ĐÓNG" 
                  onPress={() => setDetailModalVisible(false)} 
                />
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value, icon, valueColor = '#1F2937' }: any) {
  return (
    <View className="flex-row justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
      <View className="flex-row items-center flex-1 pr-4">
        <Feather name={icon} size={14} color="#8E8E93" />
        <Text className="text-gray-500 text-xs ml-2">{label}</Text>
      </View>
      <Text className="font-semibold text-xs text-right flex-1 text-gray-900" style={{ color: valueColor }} numberOfLines={1}>{value}</Text>
    </View>
  );
}
