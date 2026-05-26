import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['vi'] = LocaleConfig.locales['vi'] || {
  monthNames: ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'],
  monthNamesShort: ['Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12'],
  dayNames: ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'],
  dayNamesShort: ['CN','T2','T3','T4','T5','T6','T7'],
  today: 'Hôm nay'
};
LocaleConfig.defaultLocale = 'vi';

const MAINTENANCE_OPTIONS = [3, 6, 12, 24];
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '@/api/client';
import { useAlertStore } from '@/store/useAlertStore';
import * as ImagePicker from 'expo-image-picker';

export default function AddEquipment() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlertStore();

  const [step, setStep] = useState(1);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handlePickAndUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert({ type: 'warning', title: 'Thông báo', message: 'Cần quyền truy cập thư viện ảnh để tải ảnh lên' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingImage(true);
        const selected = result.assets[0];
        const formData = new FormData();
        const filename = selected.uri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('file', {
          uri: selected.uri,
          name: filename,
          type,
        } as any);

        const res = await api.post('/equipment/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const url = res.data?.data?.url || res.data?.url;
        if (url) {
          setImageUrl(url);
          showAlert({ type: 'success', title: 'Thành công', message: 'Tải ảnh lên thành công!' });
        } else {
          showAlert({ type: 'error', title: 'Lỗi', message: 'Không nhận được URL ảnh từ server' });
        }
      }
    } catch (e: any) {
      showAlert({ type: 'error', title: 'Lỗi', message: e.response?.data?.message || 'Không thể tải ảnh lên' });
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Dynamic Option lists
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  
  const [activePicker, setActivePicker] = useState<'category' | 'location' | 'supplier' | null>(null);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    serial_number: '',
    category_id: '',
    quantity: '1',
    location_id: '',
    supplier_id: '',
    specs: '',
    warranty_date: '',
    maintenance_period: '6',
    initial_status: 'available',
    auto_qr: true,
  } as any);
  
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [specTags, setSpecTags] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPeriod, setShowPeriod] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catsRes, locsRes, supsRes] = await Promise.all([
          api.get('/categories').catch(() => ({ data: [] })),
          api.get('/locations').catch(() => ({ data: [] })),
          api.get('/suppliers').catch(() => ({ data: [] }))
        ]);
        setCategories(catsRes.data.data || catsRes.data || []);
        setLocations(locsRes.data.data || locsRes.data || []);
        setSuppliers(supsRes.data.data || supsRes.data || []);
      } catch (e) {
        console.error('Error fetching form options:', e);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const update = (k: string, v: string | boolean) => setForm((s: any) => ({ ...s, [k]: v }));

  const resetForm = () => {
    setStep(1);
    setForm({
      name: '',
      sku: '',
      serial_number: '',
      category_id: '',
      quantity: '1',
      location_id: '',
      supplier_id: '',
      specs: '',
      warranty_date: '',
      maintenance_period: '6',
      initial_status: 'available',
      auto_qr: true,
    } as any);
    setImageUrl('');
    setTagInput('');
    setSpecTags([]);
  };

  const handleCancel = () => {
    const hasData =
      !!imageUrl ||
      Object.entries(form).some(([k, v]) => (k === 'quantity' ? v !== '1' : !!v));
    if (!hasData) {
      router.replace('/admin/equipment');
      return;
    }
    showAlert({
      type: 'warning',
      title: 'Hủy thêm thiết bị?',
      message: 'Toàn bộ dữ liệu đã nhập sẽ bị mất.',
      showCancel: true,
      onConfirm: () => {
        resetForm();
        router.replace('/admin/equipment');
      },
    });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.serial_number) {
      showAlert({ type: 'warning', title: 'Thông báo', message: 'Vui lòng nhập đủ tên và serial' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/equipment', {
        name: form.name,
        serial_number: form.serial_number,
        sku: form.sku,
        category_id: form.category_id ? Number(form.category_id) : undefined,
        location_id: form.location_id ? Number(form.location_id) : undefined,
        supplier_id: form.supplier_id ? Number(form.supplier_id) : undefined,
        status: form.initial_status === 'available' ? 'available' : 'maintenance',
        specifications: {
          summary: form.specs,
          tags: specTags,
          warranty: form.warranty_date,
          maintenance_period_months: Number(form.maintenance_period) || 6,
          auto_qr: form.auto_qr,
        },
        image_url: /^https?:\/\//i.test(imageUrl.trim()) ? imageUrl.trim() : undefined,
      });
      showAlert({
        type: 'success', title: 'Thành công', message: 'Đã thêm thiết bị',
        onConfirm: () => {
          resetForm();
          router.replace('/admin/equipment');
        },
      });
    } catch (e: any) {
      showAlert({ type: 'error', title: 'Lỗi', message: e.response?.data?.message || 'Không thể thêm thiết bị' });
    } finally { setSubmitting(false); }
  };

  const getSelectedLabel = (type: 'category' | 'location' | 'supplier') => {
    if (type === 'category') {
      const cat = categories.find((c) => String(c.id) === String(form.category_id));
      return cat ? cat.name : 'Chọn danh mục';
    }
    if (type === 'location') {
      const loc = locations.find((l) => String(l.id) === String(form.location_id));
      return loc ? loc.name : 'Chọn vị trí kho';
    }
    if (type === 'supplier') {
      const sup = suppliers.find((s) => String(s.id) === String(form.supplier_id));
      return sup ? sup.name : 'Chọn nhà cung cấp';
    }
    return '';
  };

  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        {/* Nav */}
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8 }}>
          <View className="flex-row items-center justify-between" style={{ height: 44 }}>
            <Pressable
              className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
              onPress={() => (step === 2 ? setStep(1) : handleCancel())}
            >
              <Feather name="arrow-left" size={18} color="#0F172A" />
            </Pressable>
            <View className="items-center">
              <Text className="text-[#0F172A] text-base font-bold">Thêm thiết bị mới</Text>
              <Text className="text-[#94A3B8] text-[10px] font-bold">AST-07 · Bước {step}/2</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Progress */}
          <View className="flex-row" style={{ gap: 6, marginTop: 12 }}>
            <View className="flex-1 h-1.5 rounded-full bg-[#CC0D00]" />
            <View className={`flex-1 h-1.5 rounded-full ${step === 2 ? 'bg-[#CC0D00]' : 'bg-[#E2E8F0]'}`} />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}>
          <View style={{ gap: 14 }}>
            {step === 1 ? (
              <>
                {/* Image */}
                <Animated.View entering={FadeInDown.delay(80)} className="bg-white rounded-[16px]" style={{ padding: 16, gap: 10, borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed' }}>
                  <Pressable onPress={handlePickAndUploadImage} disabled={uploadingImage} className="items-center" style={{ gap: 10, width: '100%' }}>
                    {uploadingImage ? (
                      <View className="h-[140px] justify-center items-center">
                        <ActivityIndicator size="large" color="#CC0D00" />
                        <Text className="text-[#64748B] text-xs font-semibold mt-2">Đang tải ảnh lên...</Text>
                      </View>
                    ) : /^https?:\/\//i.test(imageUrl.trim()) ? (
                      <View className="relative w-full h-[140px] rounded-xl overflow-hidden bg-gray-100">
                        <Image source={{ uri: imageUrl.trim() }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        <Pressable 
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 items-center justify-center z-10"
                          onPress={(e) => {
                            e.stopPropagation();
                            setImageUrl('');
                          }}
                        >
                          <Feather name="trash-2" size={14} color="#FFF" />
                        </Pressable>
                      </View>
                    ) : (
                      <View className="items-center py-4">
                        <View className="w-14 h-14 bg-red-50 rounded-2xl items-center justify-center mb-2">
                          <Feather name="image" size={22} color="#CC0D00" />
                        </View>
                        <Text className="text-[#0F172A] text-sm font-bold">Chạm để tải ảnh lên</Text>
                        <Text className="text-[#94A3B8] text-[11px] mt-1">Hoặc nhập link trực tiếp bên dưới</Text>
                      </View>
                    )}
                  </Pressable>
                  <View className="flex-row items-center bg-[#F8FAFC] rounded-[12px] h-[42px] px-3 mt-2" style={{ gap: 8 }}>
                    <Feather name="link" size={14} color="#94A3B8" />
                    <TextInput
                      placeholder="Nhập link ảnh thiết bị (URL)"
                      placeholderTextColor="#94A3B8"
                      value={imageUrl}
                      onChangeText={setImageUrl}
                      className="flex-1 text-[#0F172A] text-sm"
                      style={{ paddingVertical: 10, paddingLeft: 8 }}
                    />
                    {!!imageUrl && (
                      <Pressable onPress={() => setImageUrl('')}>
                        <Feather name="x" size={14} color="#94A3B8" />
                      </Pressable>
                    )}
                  </View>
                </Animated.View>

                {/* Basic info */}
                <Animated.View entering={FadeInDown.delay(120)} className="bg-white rounded-[16px]" style={{ padding: 16, gap: 12 }}>
                  <Text className="text-[#0F172A] text-[13px] font-bold">Thông tin cơ bản</Text>
                  
                  <Field label="Tên thiết bị *" value={form.name} onChange={(v) => update('name', v)} placeholder="VD: MacBook Pro 14 M3" />
                  
                  <View className="flex-row" style={{ gap: 10 }}>
                    <View className="flex-1">
                      <Field label="Mã SKU" value={form.sku} onChange={(v) => update('sku', v)} placeholder="MBP-2024" />
                    </View>
                    <View className="flex-1">
                      <Field label="Số serial *" value={form.serial_number} onChange={(v) => update('serial_number', v)} placeholder="00128" />
                    </View>
                  </View>

                  {/* Category Selector */}
                  <View style={{ gap: 4 }}>
                    <Text className="text-[#64748B] text-[11px] font-semibold">Danh mục</Text>
                    <Pressable
                      className="flex-row items-center bg-[#F8FAFC] rounded-[12px] h-[42px] px-3"
                      style={{ gap: 8 }}
                      onPress={() => setActivePicker('category')}
                    >
                      <Feather name="grid" size={14} color="#94A3B8" />
                      <Text className={`flex-1 text-sm ${form.category_id ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                        {getSelectedLabel('category')}
                      </Text>
                      <Feather name="chevron-down" size={14} color="#94A3B8" />
                    </Pressable>
                  </View>

                  {/* Location Selector */}
                  <View style={{ gap: 4 }}>
                    <Text className="text-[#64748B] text-[11px] font-semibold">Vị trí kho</Text>
                    <Pressable
                      className="flex-row items-center bg-[#F8FAFC] rounded-[12px] h-[42px] px-3"
                      style={{ gap: 8 }}
                      onPress={() => setActivePicker('location')}
                    >
                      <Feather name="map-pin" size={14} color="#94A3B8" />
                      <Text className={`flex-1 text-sm ${form.location_id ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                        {getSelectedLabel('location')}
                      </Text>
                      <Feather name="chevron-down" size={14} color="#94A3B8" />
                    </Pressable>
                  </View>

                  {/* Supplier Selector */}
                  <View style={{ gap: 4 }}>
                    <Text className="text-[#64748B] text-[11px] font-semibold">Nhà cung cấp</Text>
                    <Pressable
                      className="flex-row items-center bg-[#F8FAFC] rounded-[12px] h-[42px] px-3"
                      style={{ gap: 8 }}
                      onPress={() => setActivePicker('supplier')}
                    >
                      <Feather name="truck" size={14} color="#94A3B8" />
                      <Text className={`flex-1 text-sm ${form.supplier_id ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                        {getSelectedLabel('supplier')}
                      </Text>
                      <Feather name="chevron-down" size={14} color="#94A3B8" />
                    </Pressable>
                  </View>
                </Animated.View>
              </>
            ) : (
              <>
                {/* Specifications */}
                <Animated.View entering={FadeInDown.delay(80)} className="bg-white rounded-[16px]" style={{ padding: 16, gap: 10 }}>
                  <Text className="text-[#0F172A] text-[13px] font-bold">Thông số kỹ thuật</Text>
                  <View
                    className="bg-[#F8FAFC] rounded-[12px]"
                    style={{ paddingHorizontal: 12, paddingVertical: 10 }}
                  >
                    <TextInput
                      className="text-[#0F172A] text-sm"
                      style={{ minHeight: 60, textAlignVertical: 'top' }}
                      multiline
                      value={form.specs}
                      onChangeText={(v) => update('specs', v)}
                      placeholder="VD: Apple M3 chip · 16GB RAM · 512GB SSD · macOS..."
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  
                  {/* Tag chips */}
                  <View className="flex-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                    {specTags.map((t) => (
                      <Pressable
                        key={t}
                        onPress={() => setSpecTags((prev) => prev.filter((x) => x !== t))}
                        className="bg-[#FEE5E3] rounded-full flex-row items-center"
                        style={{ paddingVertical: 4, paddingHorizontal: 10, gap: 6, borderWidth: 1, borderColor: '#CC0D00' }}
                      >
                        <Feather name="check" size={10} color="#CC0D00" />
                        <Text className="text-[#CC0D00] text-[11px] font-bold">{t}</Text>
                      </Pressable>
                    ))}
                    <View
                      className="flex-row items-center bg-[#F1F5F9] rounded-full"
                      style={{ paddingHorizontal: 10, paddingVertical: 2 }}
                    >
                      <TextInput
                        className="text-[#0F172A] text-[11px]"
                        style={{ minWidth: 70, paddingVertical: 4 }}
                        value={tagInput}
                        onChangeText={setTagInput}
                        placeholder="+ thêm tag"
                        placeholderTextColor="#94A3B8"
                        onSubmitEditing={() => {
                          if (tagInput.trim()) {
                            setSpecTags((p) => [...p, tagInput.trim()]);
                            setTagInput('');
                          }
                        }}
                        returnKeyType="done"
                      />
                    </View>
                  </View>
                </Animated.View>

                {/* Warranty & Period */}
                <Animated.View entering={FadeInDown.delay(120)} className="bg-white rounded-[16px]" style={{ padding: 16, gap: 10 }}>
                  <Text className="text-[#0F172A] text-[13px] font-bold">Bảo hành & bảo trì</Text>
                  <View className="flex-row" style={{ gap: 10 }}>
                    {/* Date picker */}
                    <View className="flex-1" style={{ gap: 4 }}>
                      <Text className="text-[#64748B] text-[11px] font-semibold">Bảo hành tới</Text>
                      <Pressable
                        onPress={() => setShowCalendar(true)}
                        className="flex-row items-center bg-[#F8FAFC] rounded-[12px] h-[42px] px-3"
                        style={{ gap: 8 }}
                      >
                        <Feather name="calendar" size={14} color="#94A3B8" />
                        <Text className={`flex-1 text-sm ${form.warranty_date ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                          {form.warranty_date || 'Chọn ngày'}
                        </Text>
                      </Pressable>
                    </View>
                    
                    {/* Period select */}
                    <View className="flex-1" style={{ gap: 4 }}>
                      <Text className="text-[#64748B] text-[11px] font-semibold">Chu kỳ bảo trì</Text>
                      <Pressable
                        onPress={() => setShowPeriod(true)}
                        className="flex-row items-center bg-[#F8FAFC] rounded-[12px] h-[42px] px-3"
                        style={{ gap: 8 }}
                      >
                        <Text className="flex-1 text-[#0F172A] text-sm">{form.maintenance_period} tháng</Text>
                        <Feather name="chevron-down" size={14} color="#94A3B8" />
                      </Pressable>
                    </View>
                  </View>
                </Animated.View>

                {/* Status Selection */}
                <Animated.View entering={FadeInDown.delay(160)} className="bg-white rounded-[16px]" style={{ padding: 16, gap: 10 }}>
                  <Text className="text-[#0F172A] text-[13px] font-bold">Tình trạng ban đầu</Text>
                  <View className="flex-row" style={{ gap: 10 }}>
                    {[
                      { key: 'available', label: 'Sẵn sàng', icon: 'check-circle', color: '#CC0D00', bg: '#FEE5E3' },
                      { key: 'maintenance', label: 'Bảo trì', icon: 'tool', color: '#D97706', bg: '#FEF3C7' },
                    ].map((opt) => {
                      const active = form.initial_status === opt.key;
                      return (
                        <Pressable
                          key={opt.key}
                          onPress={() => update('initial_status', opt.key)}
                          className="flex-1 flex-row items-center justify-center rounded-[12px]"
                          style={{
                            paddingVertical: 12,
                            gap: 6,
                            backgroundColor: active ? opt.bg : '#F8FAFC',
                            borderWidth: 1.5,
                            borderColor: active ? opt.color : '#E2E8F0',
                          }}
                        >
                          <Feather name={opt.icon as any} size={14} color={active ? opt.color : '#94A3B8'} />
                          <Text
                            className="text-[12px] font-bold"
                            style={{ color: active ? opt.color : '#64748B' }}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>

                {/* Auto QR */}
                <Animated.View entering={FadeInDown.delay(200)} className="bg-white rounded-[16px] flex-row items-center" style={{ padding: 16, gap: 12 }}>
                  <View className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center">
                    <Feather name="maximize" size={18} color="#CC0D00" />
                  </View>
                  <View className="flex-1" style={{ gap: 2 }}>
                    <Text className="text-[#0F172A] text-sm font-bold">Tự sinh mã QR</Text>
                    <Text className="text-[#94A3B8] text-[11px]">In nhãn QR khi tạo xong</Text>
                  </View>
                  <Pressable
                    onPress={() => update('auto_qr', !form.auto_qr)}
                    className="rounded-full"
                    style={{
                      width: 46,
                      height: 26,
                      backgroundColor: form.auto_qr ? '#CC0D00' : '#CBD5E1',
                      justifyContent: 'center',
                      padding: 3,
                    }}
                  >
                    <View
                      className="bg-white rounded-full"
                      style={{
                        width: 20,
                        height: 20,
                        alignSelf: form.auto_qr ? 'flex-end' : 'flex-start',
                      }}
                    />
                  </Pressable>
                </Animated.View>
              </>
            )}
          </View>
        </ScrollView>

        {/* Footer actions */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-white flex-row"
          style={{ padding: 16, paddingBottom: 32, gap: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}
        >
          <Pressable
            className="flex-1 bg-[#F1F5F9] rounded-[14px] items-center justify-center"
            style={{ height: 52 }}
            onPress={() => (step === 2 ? setStep(1) : handleCancel())}
          >
            <Text className="text-[#0F172A] text-sm font-bold">
              {step === 2 ? 'Quay lại' : 'Hủy'}
            </Text>
          </Pressable>
          <Pressable
            className="flex-1 bg-[#CC0D00] rounded-[14px] flex-row items-center justify-center"
            style={{ height: 52, gap: 8 }}
            onPress={() => (step === 1 ? setStep(2) : handleSubmit())}
            disabled={submitting}
          >
            <Feather name={step === 1 ? 'arrow-right' : 'check'} size={14} color="#FFFFFF" />
            <Text className="text-white text-sm font-bold">
              {step === 1 ? 'Tiếp theo' : submitting ? 'Đang lưu...' : 'Hoàn tất & Lưu'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} transparent animationType="fade" statusBarTranslucent>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setShowCalendar(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              className="bg-white"
              style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 10 }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[#0F172A] text-base font-bold">Chọn ngày bảo hành</Text>
                <Pressable onPress={() => setShowCalendar(false)}>
                  <Feather name="x" size={20} color="#0F172A" />
                </Pressable>
              </View>
              <Calendar
                minDate={new Date().toISOString().split('T')[0]}
                onDayPress={(d: any) => {
                  const [y, m, day] = d.dateString.split('-');
                  update('warranty_date', `${day}/${m}/${y}`);
                  setShowCalendar(false);
                }}
                theme={{
                  todayTextColor: '#CC0D00',
                  arrowColor: '#CC0D00',
                  selectedDayBackgroundColor: '#CC0D00',
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Period Select Modal */}
      <Modal visible={showPeriod} transparent animationType="fade" statusBarTranslucent>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setShowPeriod(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              className="bg-white"
              style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 8 }}
            >
              <View className="flex-row items-center justify-between" style={{ marginBottom: 8 }}>
                <Text className="text-[#0F172A] text-base font-bold">Chu kỳ bảo trì</Text>
                <Pressable onPress={() => setShowPeriod(false)}>
                  <Feather name="x" size={20} color="#0F172A" />
                </Pressable>
              </View>
              {MAINTENANCE_OPTIONS.map((m) => {
                const active = String(m) === String(form.maintenance_period);
                return (
                  <Pressable
                    key={m}
                    onPress={() => {
                      update('maintenance_period', String(m));
                      setShowPeriod(false);
                    }}
                    className="flex-row items-center justify-between rounded-[12px]"
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 14,
                      backgroundColor: active ? '#FEE5E3' : '#F8FAFC',
                      borderWidth: 1.5,
                      borderColor: active ? '#CC0D00' : 'transparent',
                    }}
                  >
                    <Text className={`text-sm font-bold ${active ? 'text-[#CC0D00]' : 'text-[#0F172A]'}`}>
                      {m} tháng
                    </Text>
                    {active && <Feather name="check" size={16} color="#CC0D00" />}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Picker Modal for Category / Location / Supplier */}
      <Modal visible={activePicker !== null} transparent animationType="fade" statusBarTranslucent>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setActivePicker(null)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              className="bg-white"
              style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, maxHeight: 400 }}
            >
              <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
                <Text className="text-[#0F172A] text-base font-bold">
                  {activePicker === 'category' ? 'Chọn danh mục' : activePicker === 'location' ? 'Chọn vị trí kho' : 'Chọn nhà cung cấp'}
                </Text>
                <Pressable onPress={() => setActivePicker(null)}>
                  <Feather name="x" size={20} color="#0F172A" />
                </Pressable>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                {loadingOptions ? (
                  <ActivityIndicator size="small" color="#CC0D00" style={{ padding: 20 }} />
                ) : (
                  <View style={{ gap: 8 }}>
                    {activePicker === 'category' && categories.map((item) => {
                      const active = String(item.id) === String(form.category_id);
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            update('category_id', String(item.id));
                            setActivePicker(null);
                          }}
                          className="flex-row items-center justify-between rounded-[12px] p-4 bg-[#F8FAFC]"
                          style={{
                            borderWidth: 1.5,
                            borderColor: active ? '#CC0D00' : 'transparent',
                          }}
                        >
                          <Text className={`text-sm font-bold ${active ? 'text-[#CC0D00]' : 'text-[#0F172A]'}`}>{item.name}</Text>
                          {active && <Feather name="check" size={16} color="#CC0D00" />}
                        </Pressable>
                      );
                    })}

                    {activePicker === 'location' && locations.map((item) => {
                      const active = String(item.id) === String(form.location_id);
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            update('location_id', String(item.id));
                            setActivePicker(null);
                          }}
                          className="flex-row items-center justify-between rounded-[12px] p-4 bg-[#F8FAFC]"
                          style={{
                            borderWidth: 1.5,
                            borderColor: active ? '#CC0D00' : 'transparent',
                          }}
                        >
                          <Text className={`text-sm font-bold ${active ? 'text-[#CC0D00]' : 'text-[#0F172A]'}`}>{item.name}</Text>
                          {active && <Feather name="check" size={16} color="#CC0D00" />}
                        </Pressable>
                      );
                    })}

                    {activePicker === 'supplier' && suppliers.map((item) => {
                      const active = String(item.id) === String(form.supplier_id);
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            update('supplier_id', String(item.id));
                            setActivePicker(null);
                          }}
                          className="flex-row items-center justify-between rounded-[12px] p-4 bg-[#F8FAFC]"
                          style={{
                            borderWidth: 1.5,
                            borderColor: active ? '#CC0D00' : 'transparent',
                          }}
                        >
                          <Text className={`text-sm font-bold ${active ? 'text-[#CC0D00]' : 'text-[#0F172A]'}`}>{item.name}</Text>
                          {active && <Feather name="check" size={16} color="#CC0D00" />}
                        </Pressable>
                      );
                    })}

                    {activePicker === 'category' && categories.length === 0 && (
                      <Text className="text-gray-400 text-center py-4">Chưa có danh mục nào</Text>
                    )}
                    {activePicker === 'location' && locations.length === 0 && (
                      <Text className="text-gray-400 text-center py-4">Chưa có vị trí nào</Text>
                    )}
                    {activePicker === 'supplier' && suppliers.length === 0 && (
                      <Text className="text-gray-400 text-center py-4">Chưa có nhà cung cấp nào</Text>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, icon }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: any }) {
  return (
    <View style={{ gap: 4 }}>
      <Text className="text-[#64748B] text-[11px] font-semibold">{label}</Text>
      <View
        className="flex-row items-center bg-[#F8FAFC] rounded-[12px] h-[42px] px-3"
        style={{ gap: 8 }}
      >
        {icon && <Feather name={icon} size={14} color="#94A3B8" />}
        <TextInput
          className="flex-1 text-[#0F172A] text-sm"
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
        />
      </View>
    </View>
  );
}
