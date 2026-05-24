import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import '../src/global.css';

// Tắt cảnh báo strict mode của Reanimated khi đọc/ghi shared value trong lúc render
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});


import { useColorScheme } from '@/hooks/use-color-scheme';
import { Provider as AntProvider } from '@ant-design/react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { registerForPushNotificationsAsync, setupNotificationHandler } from '@/utils/notifications';
import Constants from 'expo-constants';
import { useRef } from 'react';

// anchor động theo role được xử lý bằng router.replace trong effect bên dưới

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

    const inAuthGroup =
      segments[0] === 'login' ||
      segments[0] === 'register' ||
      segments[0] === 'forgot-password' ||
      segments[0] === 'verify-otp' ||
      segments[0] === 'reset-password';

    const homeForRole =
      user?.role === 'admin'
        ? '/admin/dashboard'
        : user?.role === 'storekeeper'
        ? '/storekeeper/handover'
        : '/(tabs)';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace(homeForRole as any);
    } else if (user) {
      // Đứng sai tab group theo role → kéo về home đúng
      const inWrongGroup =
        (user.role === 'admin' && (segments[0] === '(tabs)' || segments[0] === 'storekeeper')) ||
        (user.role === 'storekeeper' && (segments[0] === '(tabs)' || segments[0] === 'admin')) ||
        (user.role === 'borrower' && (segments[0] === 'admin' || segments[0] === 'storekeeper'));
      if (inWrongGroup) router.replace(homeForRole as any);
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
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="verify-otp" />
            <Stack.Screen name="borrow-request" />
            <Stack.Screen name="return" />
            <Stack.Screen name="transactions/[id]" />
            <Stack.Screen name="equipment/availability" />
            <Stack.Screen name="reset-password" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="storekeeper" />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
          <CustomAlert />
        </ThemeProvider>
      </AntProvider>
    </ErrorBoundary>
  );
}


