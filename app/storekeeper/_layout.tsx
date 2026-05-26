import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function StorekeeperLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#15803D',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: Platform.OS === 'ios' ? 92 : 72,
          paddingBottom: Platform.OS === 'ios' ? 32 : 12,
          paddingTop: 10,
          position: 'absolute',
        },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 10, marginTop: -2 },
      }}
    >
      <Tabs.Screen name="handover" options={{ title: 'GIAO', tabBarIcon: ({ color }) => <Feather name="package" size={22} color={color} /> }} />
      <Tabs.Screen name="inventory" options={{ title: 'KHO', tabBarIcon: ({ color }) => <Feather name="archive" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'TÔI', tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }} />
      {/* Màn quét bàn giao/nhận — điều hướng tới khi cần, ẩn khỏi thanh tab */}
      <Tabs.Screen name="scan" options={{ href: null }} />
    </Tabs>
  );
}
