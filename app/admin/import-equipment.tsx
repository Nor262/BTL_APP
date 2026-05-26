import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import api from '@/api/client';
import { handleApiError } from '@/utils/error-handler';
import { useAlertStore } from '@/store/useAlertStore';

export default function ImportEquipmentScreen() {
  const router = useRouter();
  const { showAlert } = useAlertStore();
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed?: number; errors?: any[] } | null>(null);

  const pickFile = async () => {
    const r = await DocumentPicker.getDocumentAsync({
      type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'],
    });
    if (!r.canceled) setFile(r.assets[0]);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' } as any);
      const res = await api.post('/equipment/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const d = res.data.data || res.data;
      const success = d.success ?? d.imported ?? 0;
      // Backend hiện chỉ trả số dòng import thành công; chỉ hiện "lỗi" khi backend thực sự trả về
      const failed = d.failed;
      setResult({ success, failed, errors: d.errors });
      showAlert({
        type: 'success',
        title: 'Import xong',
        message: failed != null
          ? `Thành công ${success}, lỗi ${failed}`
          : `Đã import thành công ${success} thiết bị. Kiểm tra lại danh sách nếu thiếu (dòng sai category_id/serial trùng sẽ bị bỏ qua).`,
      });
    } catch (e) {
      handleApiError(e, 'Lỗi import file');
    } finally { setUploading(false); }
  };

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <View className="flex-row items-center justify-between px-5" style={{ paddingTop: 58, paddingBottom: 8 }}>
        <Pressable className="w-10 h-10 bg-white rounded-full items-center justify-center" onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#0F172A" />
        </Pressable>
        <Text className="text-[#0F172A] text-lg font-bold">Import thiết bị</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 140, gap: 14 }}>
        <View className="bg-[#DBEAFE] rounded-2xl" style={{ padding: 14, gap: 6 }}>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Feather name="info" size={16} color="#1D4ED8" />
            <Text className="text-[#1D4ED8] font-bold text-sm">Hướng dẫn</Text>
          </View>
          <Text className="text-[#1E40AF] text-xs">Dòng 1 là tiêu đề. Các cột theo đúng thứ tự: name, serial_number, category_id, location_id, status, condition, price.</Text>
          <Text className="text-[#1E40AF] text-xs">Lưu ý: category_id và location_id phải là số ID (lấy ở mục Danh mục / Vị trí), không phải tên.</Text>
        </View>

        <Pressable onPress={pickFile}
          className="items-center justify-center rounded-2xl bg-white"
          style={{ padding: 24, gap: 8, borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed' }}>
          <Feather name="upload-cloud" size={36} color="#CC0D00" />
          <Text className="text-[#0F172A] font-bold text-sm">{file ? 'Đổi file khác' : 'Chọn file Excel/CSV'}</Text>
          <Text className="text-[#94A3B8] text-xs">Tối đa 10MB</Text>
        </Pressable>

        {file && (
          <View className="bg-white rounded-2xl flex-row items-center" style={{ padding: 12, gap: 10 }}>
            <View className="w-10 h-10 bg-[#DCFCE7] rounded-xl items-center justify-center">
              <Feather name="file-text" size={18} color="#15803D" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text className="text-[#0F172A] text-sm font-bold" numberOfLines={1}>{file.name}</Text>
              <Text className="text-[#94A3B8] text-[11px]">{file.size ? `${Math.round(file.size / 1024)} KB` : ''}</Text>
            </View>
            <Pressable onPress={() => setFile(null)}>
              <Feather name="x" size={18} color="#94A3B8" />
            </Pressable>
          </View>
        )}

        {result && (
          <View className="bg-white rounded-2xl" style={{ padding: 14, gap: 6 }}>
            <Text className="text-[#0F172A] text-sm font-bold">Kết quả</Text>
            <View className="flex-row" style={{ gap: 10 }}>
              <View className="flex-1 bg-[#DCFCE7] rounded-xl" style={{ padding: 10 }}>
                <Text className="text-[#15803D] text-xs font-semibold">Thành công</Text>
                <Text className="text-[#15803D] text-2xl font-extrabold">{result.success}</Text>
              </View>
              {result.failed != null && (
                <View className="flex-1 bg-[#FEE2E2] rounded-xl" style={{ padding: 10 }}>
                  <Text className="text-[#CC0D00] text-xs font-semibold">Lỗi</Text>
                  <Text className="text-[#CC0D00] text-2xl font-extrabold">{result.failed}</Text>
                </View>
              )}
            </View>
            {result.errors?.length && (
              <View style={{ gap: 4 }}>
                {result.errors.slice(0, 5).map((er: any, i: number) => (
                  <Text key={i} className="text-[#CC0D00] text-[11px]">• Dòng {er.row || i + 1}: {er.message || er}</Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View className="absolute left-0 right-0 bottom-0 bg-white" style={{ paddingTop: 14, paddingBottom: 28, paddingHorizontal: 20 }}>
        <Pressable disabled={!file || uploading} onPress={upload}
          className="rounded-2xl flex-row items-center justify-center"
          style={{ paddingVertical: 16, gap: 6, backgroundColor: file && !uploading ? '#CC0D00' : '#E2E8F0' }}>
          {uploading ? <ActivityIndicator color="#FFFFFF" /> : <Feather name="upload" size={16} color={file ? '#FFFFFF' : '#94A3B8'} />}
          <Text className="font-bold text-sm" style={{ color: file && !uploading ? '#FFFFFF' : '#94A3B8' }}>
            {uploading ? 'Đang xử lý...' : 'Tải lên & Import'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
