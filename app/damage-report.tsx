import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useAlertStore } from '@/store/useAlertStore';

const LEVELS = [
  { key: 'minor', label: 'Nhẹ', sub: 'Trầy xước', color: '#15803D', bg: '#DCFCE7' },
  { key: 'medium', label: 'Trung bình', sub: 'Cần sửa chữa', color: '#D97706', bg: '#FEF3C7' },
  { key: 'severe', label: 'Nặng', sub: 'Không dùng được', color: '#B91C1C', bg: '#FEE2E2' },
];

export default function DamageReportScreen() {
  const router = useRouter();
  const { equipment_id, equipment_name, serial } = useLocalSearchParams<{ equipment_id?: string; equipment_name?: string; serial?: string }>();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlertStore();

  const [level, setLevel] = useState('medium');
  const [images, setImages] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    if (images.length >= 5) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled) {
        setImages((prev) => [...prev, result.assets[0].uri]);
      }
    } catch {}
  };

  const handleSubmit = async () => {
    if (!note.trim()) {
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Vui lòng mô tả sự cố' });
      return;
    }
    setSubmitting(true);
    // TODO: backend chưa có endpoint damage report; có thể gọi POST /maintenance hoặc /transactions/.../report
    setTimeout(() => {
      setSubmitting(false);
      showAlert({
        type: 'success',
        title: 'Đã gửi',
        message: 'Báo cáo sự cố đã được ghi nhận. Kho sẽ liên hệ trong 30 ngày.',
        onConfirm: () => router.back(),
      });
    }, 600);
  };

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="dark" />

      {/* Status / Nav */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8 }}>
        <View className="flex-row items-center justify-between" style={{ height: 44 }}>
          <Pressable
            className="w-10 h-10 bg-white rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={18} color="#0F172A" />
          </Pressable>
          <View className="items-center">
            <Text className="text-[#0F172A] text-base font-bold">Báo cáo sự cố</Text>
            <Text className="text-[#94A3B8] text-[10px] font-bold">BCR-06</Text>
          </View>
          <View className="w-10 h-10" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}
      >
        <View style={{ gap: 14 }}>
          {/* Equipment card */}
          <Animated.View
            entering={FadeInDown.delay(80)}
            className="bg-white rounded-[16px] flex-row items-center"
            style={{ padding: 14, gap: 12 }}
          >
            <View className="w-11 h-11 bg-[#FEF3C7] rounded-xl items-center justify-center">
              <Feather name="alert-triangle" size={18} color="#D97706" />
            </View>
            <View className="flex-1" style={{ gap: 2 }}>
              <Text className="text-[#0F172A] text-sm font-bold">
                {equipment_name || 'Canon EOS R6 Mark II'}
              </Text>
              <Text className="text-[#94A3B8] text-[11px]">
                SN: {serial || 'CAM-2024-0042'} · IRR-398
              </Text>
            </View>
          </Animated.View>

          {/* Damage level */}
          <Animated.View entering={FadeInDown.delay(120)} style={{ gap: 8 }}>
            <Text className="text-[#0F172A] text-xs font-bold">Mức độ hư hỏng</Text>
            <View className="flex-row" style={{ gap: 10 }}>
              {LEVELS.map((lv) => {
                const active = level === lv.key;
                return (
                  <Pressable
                    key={lv.key}
                    className="flex-1 rounded-[14px] items-center"
                    style={{
                      paddingVertical: 12,
                      backgroundColor: active ? lv.bg : '#FFFFFF',
                      borderWidth: 1.5,
                      borderColor: active ? lv.color : '#E2E8F0',
                      gap: 4,
                    }}
                    onPress={() => setLevel(lv.key)}
                  >
                    <Text className="text-sm font-bold" style={{ color: active ? lv.color : '#0F172A' }}>
                      {lv.label}
                    </Text>
                    <Text className="text-[10px]" style={{ color: active ? lv.color : '#94A3B8' }}>
                      {lv.sub}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Images */}
          <Animated.View entering={FadeInDown.delay(160)} style={{ gap: 8 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[#0F172A] text-xs font-bold">Ảnh tình trạng ({images.length}/5)</Text>
              <Text className="text-[#CC0D00] text-[11px] font-bold">Trước & Sau</Text>
            </View>
            <View className="flex-row flex-wrap" style={{ gap: 10 }}>
              {images.map((uri, i) => (
                <View key={i} style={{ width: 84, height: 84, position: 'relative' }}>
                  <Image source={{ uri }} style={{ width: 84, height: 84, borderRadius: 12 }} />
                  <Pressable
                    onPress={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-[#0F172A] rounded-full items-center justify-center"
                  >
                    <Feather name="x" size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
              {images.length < 5 && (
                <Pressable
                  className="items-center justify-center rounded-[12px]"
                  style={{
                    width: 84,
                    height: 84,
                    backgroundColor: '#FEE5E3',
                    borderWidth: 1.5,
                    borderColor: '#FCA5A5',
                    borderStyle: 'dashed',
                    gap: 4,
                  }}
                  onPress={pickImage}
                >
                  <Feather name="camera" size={20} color="#CC0D00" />
                  <Text className="text-[#CC0D00] text-[10px] font-bold">Thêm</Text>
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* Note */}
          <Animated.View entering={FadeInDown.delay(200)} style={{ gap: 8 }}>
            <Text className="text-[#0F172A] text-xs font-bold">Mô tả sự cố</Text>
            <View
              className="bg-white rounded-[14px]"
              style={{ borderWidth: 1.5, borderColor: '#E2E8F0', minHeight: 110 }}
            >
              <TextInput
                style={{ padding: 14, textAlignVertical: 'top', color: '#0F172A', fontSize: 14, minHeight: 110 }}
                placeholder="VD: Ống kính bị xước nhẹ ở mép, màn hình LCD có vết bám không lau được..."
                placeholderTextColor="#94A3B8"
                value={note}
                onChangeText={setNote}
                multiline
              />
            </View>
            <View
              className="flex-row items-center bg-[#FEF3C7] rounded-[12px]"
              style={{ padding: 10, gap: 8 }}
            >
              <Feather name="info" size={14} color="#D97706" />
              <Text className="text-[#92400E] text-[11px] flex-1">
                Báo cáo sai có thể bị khóa quyền mượn 30 ngày.
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white flex-row"
        style={{ padding: 16, paddingBottom: 32, gap: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}
      >
        <Pressable
          className="flex-1 bg-[#F1F5F9] rounded-[14px] items-center justify-center"
          style={{ height: 52 }}
          onPress={() => router.back()}
        >
          <Text className="text-[#0F172A] text-sm font-bold">Hủy</Text>
        </Pressable>
        <Pressable
          className="flex-1 bg-[#CC0D00] rounded-[14px] flex-row items-center justify-center"
          style={{ height: 52, gap: 8 }}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text className="text-white text-sm font-bold">
            {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
          </Text>
          <Feather name="send" size={14} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}
