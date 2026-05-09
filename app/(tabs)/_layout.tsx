import { Tabs } from 'expo-router';
import React from 'react';
import { View, Platform } from 'react-native';
import { IconOutline } from '@ant-design/icons-react-native';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#CC0D00',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          height: 70,
          borderRadius: 35,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'white',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          paddingBottom: Platform.OS === 'ios' ? 0 : 0,
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="light" style={{ flex: 1 }} />
          ) : null
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          marginBottom: 10,
        },
        tabBarIconStyle: {
          marginTop: 10,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'TRANG CHỦ',
          tabBarIcon: ({ color }) => <IconOutline name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'CÁ NHÂN',
          tabBarIcon: ({ color }) => <IconOutline name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
