import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/client';
import { Alert } from 'react-native';

export const downloadAndShareReport = async (endpoint: string, fileName: string) => {
  const { token } = useAuthStore.getState();
    if (!token) {
    Alert.alert('Thông báo', 'Bạn cần đăng nhập để thực hiện chức năng này');
    return;
  }

  const url = `${api.defaults.baseURL}${endpoint}`;
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;

  try {
    const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (downloadResult.status === 200) {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: fileName.endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: `Tải file báo cáo: ${fileName}`,
        });
      } else {
        Alert.alert('Thông báo', `File đã được tải về tại: ${downloadResult.uri}`);
      }
    } else {
      Alert.alert('Lỗi', `Tải báo cáo thất bại: mã lỗi ${downloadResult.status}`);
    }
  } catch (error) {
    console.error(error);
    Alert.alert('Lỗi', 'Không thể tải báo cáo do lỗi mạng hoặc máy chủ');
  }
};
