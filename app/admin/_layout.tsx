import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#CC0D00',
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
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="approval"
        options={{
          title: 'DUYỆT',
          tabBarIcon: ({ color }) => <Feather name="check-square" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="equipment"
        options={{
          title: 'KHO',
          tabBarIcon: ({ color }) => <Feather name="box" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'USERS',
          tabBarIcon: ({ color }) => <Feather name="users" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'TÔI',
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
        }}
      />
      {/* Hidden routes (không có icon riêng trên tab bar) */}
      <Tabs.Screen
        name="add-equipment"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      {/* data.tsx vẫn giữ tab bar để user quay lại tab khác */}
      <Tabs.Screen name="data" options={{ href: null }} />
      <Tabs.Screen name="maintenance" options={{ href: null }} />
      <Tabs.Screen name="maintenance/[equipmentId]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="audit-log" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="import-equipment" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
