import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/client';
import { Alert } from 'react-native';

export const downloadAndShareReport = async (endpoint: string, fileName: string) => {
  const { token } = useAuthStore.getState();
  if (!token) {
    Alert.alert('Thong bao', 'Ban can dang nhap de thuc hien chuc nang nay');
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
          dialogTitle: `Tai file bao cao: ${fileName}`,
        });
      } else {
        Alert.alert('Thong bao', `File da duoc tai ve tai: ${downloadResult.uri}`);
      }
    } else {
      Alert.alert('Loi', `Tai bao cao that bai: ma loi ${downloadResult.status}`);
    }
  } catch (error) {
    console.error(error);
    Alert.alert('Loi', 'Khong the tai bao cao do loi mang hoac may chu');
  }
};
