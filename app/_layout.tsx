import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../src/global.css';


import { useColorScheme } from '@/hooks/use-color-scheme';
import { Provider as AntProvider } from '@ant-design/react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { registerForPushNotificationsAsync, setupNotificationHandler } from '@/utils/notifications';
import Constants from 'expo-constants';
import { useRef } from 'react';

export const unstable_settings = {
  anchor: '(tabs)',
};

import ErrorBoundary from '@/components/common/ErrorBoundary';

import CustomAlert from '@/components/common/CustomAlert';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle Redirection
  useEffect(() => {
    if (!isMounted || !navigationState?.key) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, navigationState?.key, isMounted]);

  // Handle Notifications Registration (Only when user changes)
  useEffect(() => {
    // Chỉ chạy nếu không phải Expo Go và user đã đăng nhập
    if (isMounted && user && Constants.appOwnership !== 'expo') {
      const setup = async () => {
        await setupNotificationHandler();
        await registerForPushNotificationsAsync();
        
        const Notifications = await import('expo-notifications');

        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
          console.log('Notification received in foreground:', notification);
        });

        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('Notification clicked:', response);
          router.push('/notifications');
        });

        return () => {
          notificationListener.remove();
          responseListener.remove();
        };
      };

      const cleanup = setup();
      return () => {
        cleanup.then(fn => fn && fn());
      };
    } else if (isMounted && user && Constants.appOwnership === 'expo') {
      // Nếu là Expo Go, vẫn gọi hàm register để in ra cảnh báo nhưng không đăng ký listener
      registerForPushNotificationsAsync();
    }
  }, [user, isMounted]);

  return (
    <ErrorBoundary>
      <AntProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
          <CustomAlert />
        </ThemeProvider>
      </AntProvider>
    </ErrorBoundary>
  );
}


