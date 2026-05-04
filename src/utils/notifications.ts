import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '@/api/client';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Constants.appOwnership === 'expo') {
    console.log('Push notifications are not supported in Expo Go. Use a development build.');
    return;
  }

  const Notifications = await import('expo-notifications');

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Project ID is required for Expo Push Token
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Push Token:', token);

    // Update token to backend
    if (token) {
      try {
        await api.patch('/auth/profile', { fcm_token: token });
      } catch (e) {
        console.error('Failed to update push token to backend', e);
      }
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
