import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
import { useAlertStore } from '@/store/useAlertStore';
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
  const { showAlert } = useAlertStore();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'active' | 'overdue' | 'completed'>('all');

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<any>(null);

  const fetchData = async () => {
    try {
      const endpoint = (user?.role === 'storekeeper' || user?.role === 'admin') ? '/transactions' : '/transactions/my';
      const response = await api.get(endpoint);
      setTransactions(response.data.data || response.data || []);
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

  const submitRating = async () => {
    if (!selectedTx) return;
    try {
      await api.patch(`/transactions/${selectedTx.id}/rate`, {
        rating: parseInt(rating, 10),
        feedback
      });
      showAlert({ type: 'success', title: 'Thành công', message: 'Cảm ơn bạn đã đánh giá!' });
      setRatingModalVisible(false);
      fetchData();
    } catch (error) {
      handleApiError(error, 'Lỗi đánh giá');
    }
  };

  const handleReview = (txId: number, status: 'approved' | 'rejected') => {
    const actionText = status === 'approved' ? 'duyệt' : 'từ chối';
    showAlert({
      type: 'warning',
      title: 'Xác nhận',
      message: `Bạn có chắc chắn muốn ${actionText} yêu cầu mượn này?`,
      showCancel: true,
      onConfirm: async () => {
        try {
          setLoading(true);
          await api.put(`/transactions/${txId}/review`, { status, notes: `Được ${actionText} bởi thủ kho` });
          showAlert({ type: 'success', title: 'Thành công', message: `Đã ${actionText} yêu cầu mượn.` });
          fetchData();
        } catch (error) {
          handleApiError(error, `Lỗi ${actionText} yêu cầu`);
          setLoading(false);
        }
      }
    });
  };

  const handleExtend = (tx: any) => {
    showAlert({
      type: 'info',
      title: 'Xác nhận gia hạn',
      message: 'Bạn muốn gia hạn thêm 7 ngày cho thiết bị này?',
      showCancel: true,
      onConfirm: async () => {
        try {
          const newDueDate = new Date(new Date(tx.due_date).getTime() + 7 * 24 * 60 * 60 * 1000);
          await api.patch(`/transactions/${tx.id}/extend`, { new_due_date: newDueDate.toISOString() });
          showAlert({ type: 'success', title: 'Thành công', message: 'Gia hạn thành công!' });
          fetchData();
        } catch (error) {
          handleApiError(error, 'Lỗi gia hạn');
        }
      }
    });
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'all') return true;
    return tx.status === activeTab;
  });

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isOverdue = item.status === 'overdue' || (item.status === 'active' && new Date(item.due_date) < new Date());
    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 80).duration(500)}
        className="mb-3"
      >
        <Pressable 
          className="bg-white rounded-[18px] p-4 border border-[#F1F5F9] shadow-sm"
          onPress={() => { setSelectedTxDetail(item); setDetailModalVisible(true); }}
          style={{ gap: 12 }}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-3" style={{ gap: 2 }}>
              <Text className="text-[#0F172A] text-sm font-bold" numberOfLines={1}>
                {item.equipment?.name || 'Thiết bị'}
              </Text>
              <Text className="text-xs text-[#94A3B8]">SN: {item.equipment?.serial_number || '---'}</Text>
            </View>
            <Badge status={item.status} />
          </View>
          
          <View className="flex-row justify-between bg-[#F8FAFC] p-3 rounded-xl border border-[#F1F5F9]" style={{ gap: 10 }}>
            <View style={{ gap: 2 }}>
              <Text className="text-[10px] text-[#94A3B8] uppercase font-bold">Ngày mượn</Text>
              <Text className="text-xs font-medium text-[#0F172A]">
                {new Date(item.request_date || item.start_date).toLocaleDateString('vi-VN')}
              </Text>
            </View>
            <View className="items-end" style={{ gap: 2 }}>
              <Text className="text-[10px] text-[#94A3B8] uppercase font-bold">Hạn trả</Text>
              <Text className={`text-xs font-medium ${isOverdue ? 'text-[#EF4444]' : 'text-[#0F172A]'}`}>
                {new Date(item.due_date).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          </View>

          {item.condition_on_return && (
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Feather name="info" size={12} color="#94A3B8" />
              <Text className="text-xs text-[#94A3B8]">Tình trạng trả: {item.condition_on_return}</Text>
            </View>
          )}

          {/* Action Footer */}
          <View className="flex-row justify-end border-t border-[#F1F5F9] pt-3" style={{ gap: 8 }}>
            {(user?.role === 'storekeeper' || user?.role === 'admin') && item.status === 'pending' && (
              <>
                <Pressable 
                  className="bg-[#FEF2F2] px-4 py-2 rounded-xl border border-[#FCA5A5] active:scale-95"
                  onPress={() => handleReview(item.id, 'rejected')}
                >
                  <Text className="text-[#991B1B] font-bold text-xs">Từ chối</Text>
                </Pressable>
                <Pressable 
                  className="bg-[#DCFCE7] px-4 py-2 rounded-xl border border-[#BBF7D0] active:scale-95"
                  onPress={() => handleReview(item.id, 'approved')}
                >
                  <Text className="text-[#15803D] font-bold text-xs">Phê duyệt</Text>
                </Pressable>
              </>
            )}
            {item.status === 'active' && !item.is_extended && (
              <Pressable 
                className="bg-[#EFF6FF] px-3 py-1.5 rounded-lg border border-[#DBEAFE] flex-row items-center"
                style={{ gap: 4 }}
                onPress={() => handleExtend(item)}
              >
                <Feather name="plus" size={12} color="#1D4ED8" />
                <Text className="text-[#1D4ED8] font-semibold text-[11px]">Gia hạn (+7 ngày)</Text>
              </Pressable>
            )}
            {item.status === 'completed' && !item.rating && (
              <Pressable 
                className="bg-[#FFF7ED] px-3 py-1.5 rounded-lg border border-[#FFEDD5] flex-row items-center"
                style={{ gap: 4 }}
                onPress={() => {
                  setSelectedTx(item);
                  setRating('5');
                  setFeedback('');
                  setRatingModalVisible(true);
                }}
              >
                <Feather name="star" size={12} color="#C2410C" />
                <Text className="text-[#C2410C] font-semibold text-[11px]">Đánh giá</Text>
              </Pressable>
            )}
            {item.rating && (
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <Feather name="star" size={12} color="#F59E0B" />
                <Text className="text-[#F59E0B] text-[11px] font-bold">{item.rating}/5</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-white pt-16 pb-4 px-6 border-b border-[#F1F5F9] flex-row items-center shadow-sm">
        <Pressable 
          className="w-10 h-10 items-center justify-center mr-2 rounded-full active:bg-[#F1F5F9]"
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#0F172A" />
        </Pressable>
        <Text className="text-xl font-bold text-[#0F172A]">Lịch sử giao dịch</Text>
      </View>

      {/* Tabs */}
      <View className="bg-white py-3 border-b border-[#F1F5F9]">
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
              className={`px-4 py-2 rounded-xl mr-2 ${
                activeTab === tab.id ? 'bg-[#0F172A]' : 'bg-[#F1F5F9]'
              }`}
            >
              <Text 
                className={`text-xs font-semibold ${
                  activeTab === tab.id ? 'text-white' : 'text-[#64748B]'
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
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#CC0D00" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20" style={{ gap: 12 }}>
            <View className="w-16 h-16 bg-white rounded-full items-center justify-center">
              <Feather name="inbox" size={32} color="#E2E8F0" />
            </View>
            <Text className="text-[#94A3B8] text-sm">Chưa có giao dịch nào</Text>
          </View>
        }
      />

      {/* Rating Modal */}
      <Modal visible={ratingModalVisible} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1">
          <Pressable className="absolute inset-0 bg-black/40" onPress={() => setRatingModalVisible(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 justify-center px-6"
            pointerEvents="box-none"
          >
            <Pressable className="bg-white rounded-[24px] p-6 shadow-2xl" onPress={(e) => e.stopPropagation()} style={{ gap: 16 }}>
              <Text className="text-[#0F172A] text-lg font-bold text-center">Đánh giá thiết bị</Text>
              <Text className="text-[#64748B] text-center text-sm">{selectedTx?.equipment?.name}</Text>

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

              <View className="flex-row" style={{ gap: 10 }}>
                <Button title="Hủy" onPress={() => setRatingModalVisible(false)} containerClassName="flex-1" variant="secondary" />
                <Button title="Gửi đánh giá" onPress={submitRating} containerClassName="flex-1" />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={detailModalVisible} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1">
          <Pressable className="absolute inset-0 bg-black/50" onPress={() => setDetailModalVisible(false)} />
          <Animated.View 
            entering={FadeIn.duration(300)}
            className="flex-1 justify-center px-6"
            pointerEvents="box-none"
          >
            <Pressable className="bg-white rounded-[24px] overflow-hidden shadow-2xl max-h-[80%]" onPress={(e) => e.stopPropagation()}>
              
              {/* Header */}
              <View className="bg-[#0F172A] pt-8 pb-5 px-6 items-center rounded-b-[24px] relative">
                <Text className="text-white text-base font-bold uppercase tracking-wider">Phiếu Mượn Thiết Bị</Text>
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
              <ScrollView showsVerticalScrollIndicator={false} className="p-6" contentContainerStyle={{ gap: 16, paddingBottom: 30 }}>
                {/* 1. Equipment */}
                <View style={{ gap: 8 }}>
                  <Text className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Thông tin thiết bị</Text>
                  <View className="flex-row items-center bg-[#F8FAFC] p-4 rounded-xl border border-[#F1F5F9]">
                    {selectedTxDetail?.equipment?.image_url ? (
                      <Image 
                        source={{ uri: selectedTxDetail.equipment.image_url }} 
                        className="w-14 h-14 rounded-xl mr-4 bg-gray-200"
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-14 h-14 bg-white rounded-xl mr-4 items-center justify-center border border-[#E2E8F0]">
                        <Feather name="monitor" size={20} color="#CC0D00" />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="font-bold text-[#0F172A] text-sm" numberOfLines={1}>
                        {selectedTxDetail?.equipment?.name}
                      </Text>
                      <Text className="text-xs text-[#94A3B8] mt-1">SN: {selectedTxDetail?.equipment?.serial_number}</Text>
                    </View>
                  </View>
                </View>

                {/* 2. Borrower */}
                {selectedTxDetail?.borrower && (
                  <View style={{ gap: 8 }}>
                    <Text className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Thông tin người mượn</Text>
                    <View className="bg-[#F8FAFC] p-4 rounded-xl border border-[#F1F5F9]" style={{ gap: 8 }}>
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

                {/* 3. Schedule */}
                <View style={{ gap: 8 }}>
                  <Text className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Thời gian & Lịch trình</Text>
                  <View className="bg-[#F8FAFC] p-4 rounded-xl border border-[#F1F5F9]" style={{ gap: 8 }}>
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
                      valueColor={new Date(selectedTxDetail?.due_date) < new Date() && selectedTxDetail?.status === 'in_use' ? '#EF4444' : '#0F172A'}
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

                {/* 4. Purpose & Condition */}
                <View style={{ gap: 8 }}>
                  <Text className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Mục đích & Tình trạng</Text>
                  <View className="bg-[#F8FAFC] p-4 rounded-xl border border-[#F1F5F9]" style={{ gap: 12 }}>
                    <View>
                      <Text className="text-[10px] text-[#94A3B8] uppercase font-bold">Mục đích sử dụng:</Text>
                      <Text className="text-xs font-semibold text-[#0F172A] mt-1">{selectedTxDetail?.notes || 'Không có ghi chú'}</Text>
                    </View>
                    
                    {selectedTxDetail?.condition_at_check_out && (
                      <View className="border-t border-[#F1F5F9] pt-2">
                        <Text className="text-[10px] text-[#94A3B8] uppercase font-bold">Tình trạng khi bàn giao:</Text>
                        <Text className="text-xs font-semibold text-[#0F172A] mt-1">{selectedTxDetail.condition_at_check_out}</Text>
                      </View>
                    )}

                    {selectedTxDetail?.condition_at_check_in && (
                      <View className="border-t border-[#F1F5F9] pt-2">
                        <Text className="text-[10px] text-[#94A3B8] uppercase font-bold">Tình trạng khi trả:</Text>
                        <Text className="text-xs font-semibold text-[#0F172A] mt-1">{selectedTxDetail.condition_at_check_in}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* 5. Staff */}
                {(selectedTxDetail?.approver || selectedTxDetail?.storekeeper) && (
                  <View style={{ gap: 8 }}>
                    <Text className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Cán bộ xử lý</Text>
                    <View className="bg-[#F8FAFC] p-4 rounded-xl border border-[#F1F5F9]" style={{ gap: 8 }}>
                      {selectedTxDetail.approver && (
                        <DetailRow label="Người duyệt đơn" value={selectedTxDetail.approver.full_name} icon="check-square" />
                      )}
                      {selectedTxDetail.storekeeper && (
                        <DetailRow label="Thủ kho giao nhận" value={selectedTxDetail.storekeeper.full_name} icon="pocket" />
                      )}
                    </View>
                  </View>
                )}

                {/* 6. Evidence Images */}
                {(selectedTxDetail?.image_url_before || selectedTxDetail?.image_url_after) && (
                  <View style={{ gap: 8 }}>
                    <Text className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Hình ảnh minh chứng</Text>
                    <View className="flex-row justify-between bg-[#F8FAFC] p-4 rounded-xl border border-[#F1F5F9]" style={{ gap: 10 }}>
                      {selectedTxDetail.image_url_before && (
                        <View className="flex-1">
                          <Text className="text-[10px] text-[#94A3B8] mb-1">Khi bàn giao:</Text>
                          <Image 
                            source={{ uri: selectedTxDetail.image_url_before }} 
                            className="w-full h-24 rounded-lg bg-gray-200" 
                            contentFit="cover"
                          />
                        </View>
                      )}
                      {selectedTxDetail.image_url_after && (
                        <View className="flex-1">
                          <Text className="text-[10px] text-[#94A3B8] mb-1">Khi nhận lại:</Text>
                          <Image 
                            source={{ uri: selectedTxDetail.image_url_after }} 
                            className="w-full h-24 rounded-lg bg-gray-200" 
                            contentFit="cover"
                          />
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* 7. Rating feedback */}
                {selectedTxDetail?.rating && (
                  <View style={{ gap: 8 }}>
                    <Text className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Đánh giá & Phản hồi</Text>
                    <View className="bg-[#FFF7ED] p-4 rounded-xl border border-[#FFEDD5]">
                      <View className="flex-row items-center mb-2" style={{ gap: 4 }}>
                        <Feather name="star" size={14} color="#F59E0B" />
                        <Text className="font-bold text-[#C2410C] text-xs">{selectedTxDetail.rating} / 5 điểm</Text>
                      </View>
                      <Text className="text-[10px] text-[#94A3B8]">Phản hồi của người mượn:</Text>
                      <Text className="text-xs font-semibold text-[#0F172A] mt-1 italic">"{selectedTxDetail.feedback || 'Không có ý kiến thêm'}"</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              <View className="p-4 border-t border-[#F1F5F9] bg-[#F8FAFC]">
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

function DetailRow({ label, value, icon, valueColor = '#0F172A' }: any) {
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-[#F1F5F9]" style={{ borderBottomWidth: 0.5 }}>
      <View className="flex-row items-center flex-1 pr-4" style={{ gap: 6 }}>
        <Feather name={icon} size={12} color="#94A3B8" />
        <Text className="text-[#64748B] text-xs">{label}</Text>
      </View>
      <Text className="font-semibold text-xs text-right flex-1" style={{ color: valueColor }} numberOfLines={1}>{value}</Text>
    </View>
  );
}
