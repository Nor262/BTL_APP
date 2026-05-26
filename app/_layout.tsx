import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { LocaleConfig } from 'react-native-calendars';
import '../src/global.css';

// Cấu hình locale tiếng Việt cho toàn bộ Calendar — phải load 1 lần duy nhất
// ngay khi app khởi động để tránh fallback về device locale (Trung/Hàn/...)
LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
  monthNamesShort: ['Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6', 'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12'],
  dayNames: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
  dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  today: 'Hôm nay',
};
LocaleConfig.defaultLocale = 'vi';

// Tắt cảnh báo strict mode của Reanimated khi đọc/ghi shared value trong lúc render
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});


import { useColorScheme } from '@/hooks/use-color-scheme';
import { Provider as AntProvider } from '@ant-design/react-native';

const antLocale = {
  locale: 'vi_VN',
  DatePickerView: { year: '', month: '', day: '', hour: '', minute: '', am: 'SA', pm: 'CH' },
  DatePicker: { okText: 'OK', dismissText: 'Hủy', extra: 'Vui lòng chọn', year: '', month: '', day: '', hour: '', minute: '', am: 'SA', pm: 'CH' },
} as any;
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
      <AntProvider locale={antLocale}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="verify-otp" />
            <Stack.Screen name="borrow-request" />
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


