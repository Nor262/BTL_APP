import React from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import Badge from '@/components/ui/Badge';
import { Image } from 'expo-image';
import Button from '@/components/ui/Button';

export default function TransactionDetailModal({
  visible,
  onClose,
  selectedTxDetail
}: {
  visible: boolean;
  onClose: () => void;
  selectedTxDetail: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1">
        <Pressable className="absolute inset-0 bg-black/50" onPress={onClose} />
        <Animated.View 
          entering={FadeIn.duration(300)}
          className="flex-1 justify-center px-6"
          pointerEvents="box-none"
        >
          <View className="bg-white rounded-[24px] overflow-hidden shadow-2xl max-h-[80%]">
            
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
                onPress={onClose}
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
                onPress={onClose} 
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
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
