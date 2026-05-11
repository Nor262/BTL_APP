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
import { registerForPushNotificationsAsync } from '@/utils/notifications';
import * as Notifications from 'expo-notifications';
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
    if (isMounted && user) {
      registerForPushNotificationsAsync();

      // Lắng nghe khi thông báo tới lúc đang mở app
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received in foreground:', notification);
      });

      // Lắng nghe khi người dùng nhấn vào thông báo
      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification clicked:', response);
        // Tự động điều hướng đến trang thông báo
        router.push('/notifications');
      });

      return () => {
        Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
      };
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


