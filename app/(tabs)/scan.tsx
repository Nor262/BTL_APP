import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, Alert, View as RNView, Pressable, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { handleApiError } from '@/utils/error-handler';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function BorrowerScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [serialNumber, setSerialNumber] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Reset scanner state when screen gets focus
    setScanning(true);
  }, []);

  if (!permission) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#CC0D00" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center px-8 bg-white">
        <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-6">
          <Feather name="camera" size={32} color="#666" />
        </View>
        <Text className="text-gray-900 text-xl font-bold text-center mb-2">Truy cập Camera</Text>
        <Text className="text-gray-500 text-center mb-8">Cần cấp quyền camera để quét mã QR tra cứu thiết bị.</Text>
        <Button title="CẤP QUYỀN CAMERA" onPress={requestPermission} />
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!scanning) return;

    setScanning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);

    try {
      const response = await api.get(`/equipment/verify?qr_data=${data}`);
      const eqData = response.data.data || response.data;
      const eqId = eqData.equipment_id || eqData.id;
      
      if (eqId) {
        router.push(`/equipment/${eqId}`);
      } else {
        throw new Error('Không tìm thấy thiết bị');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      handleApiError(error, 'Mã QR không hợp lệ');
      setTimeout(() => setScanning(true), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!serialNumber.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập số Serial');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/transactions/verify-item', { serial_number: serialNumber.trim() });
      const eqData = response.data.data || response.data;
      const eqId = eqData.id;
      if (eqId) {
        setShowManualInput(false);
        setSerialNumber('');
        router.push(`/equipment/${eqId}`);
      } else {
        throw new Error('Không tìm thấy thiết bị');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      handleApiError(error, 'Không tìm thấy thiết bị với số Serial đã nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-black"
    >
      <View className="flex-1 relative">
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        {/* Semi-transparent dark overlay */}
        <View className="absolute inset-0 bg-black/40" />

        {/* Scan Frame */}
        <View className="absolute inset-0 items-center justify-center">
          <Animated.View entering={FadeIn.duration(600)} className="items-center">
            <View className="w-64 h-64 border-4 border-white rounded-3xl items-center justify-center">
              <View className="w-56 h-56 border border-white/20 rounded-2xl" />
            </View>
            <Text className="text-white font-medium text-center mt-6 px-8 leading-6 bg-black/60 py-2.5 rounded-full overflow-hidden">
              Đặt mã QR vào khung hình để tra cứu
            </Text>
          </Animated.View>
        </View>

        {/* Header Options */}
        <View className="absolute top-12 left-4 right-4 flex-row justify-between items-center">
          <Pressable 
            className="w-11 h-11 bg-black/50 rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color="white" />
          </Pressable>
          
          <Text className="text-white text-lg font-bold">Tra cứu thiết bị</Text>

          <Pressable 
            className="w-11 h-11 bg-black/50 rounded-full items-center justify-center"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowManualInput(!showManualInput);
            }}
          >
            <Feather name={showManualInput ? 'camera' : 'edit'} size={20} color="white" />
          </Pressable>
        </View>

        {/* Loading overlay */}
        {loading && (
          <View className="absolute inset-0 bg-black/60 items-center justify-center">
            <ActivityIndicator size="large" color="#CC0D00" />
            <Text className="text-white font-bold mt-4">Đang xử lý...</Text>
          </View>
        )}

        {/* Manual Input Dialog */}
        {showManualInput && (
          <Animated.View 
            entering={FadeInDown} 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[30px] p-6 shadow-2xl"
          >
            <Text className="text-lg font-bold text-gray-900 mb-4">Nhập số Serial thiết bị</Text>
            <Input
              label="Số Serial"
              placeholder="VD: SN-123456"
              value={serialNumber}
              onChangeText={setSerialNumber}
              autoCapitalize="characters"
              icon="tag"
            />
            <View className="flex-row mt-4">
              <Button 
                title="Hủy" 
                variant="secondary" 
                onPress={() => setShowManualInput(false)} 
                containerClassName="flex-1 mr-2"
              />
              <Button 
                title="Tra cứu" 
                onPress={handleManualSubmit} 
                containerClassName="flex-1 ml-2"
              />
            </View>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
