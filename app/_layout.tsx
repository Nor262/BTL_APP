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

export const unstable_settings = {
  anchor: '(tabs)',
};

import ErrorBoundary from '@/components/common/ErrorBoundary';

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

  useEffect(() => {
    if (!isMounted || !navigationState?.key) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    setTimeout(() => {
      if (!user && !inAuthGroup) {
        router.replace('/login');
      } else if (user && inAuthGroup) {
        router.replace('/(tabs)');
        registerForPushNotificationsAsync();
      } else if (user) {
        registerForPushNotificationsAsync();
      }
    }, 0);
  }, [user, segments, navigationState?.key, isMounted]);

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
        </ThemeProvider>
      </AntProvider>
    </ErrorBoundary>
  );
}


