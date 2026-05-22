import { Stack } from 'expo-router';
import React from 'react';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#CC0D00',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="users" 
        options={{
          title: 'Quản lý Người dùng',
        }} 
      />
      <Stack.Screen 
        name="categories" 
        options={{
          title: 'Quản lý Danh mục',
        }} 
      />
      <Stack.Screen 
        name="locations" 
        options={{
          title: 'Quản lý Vị trí lưu trữ',
        }} 
      />
      <Stack.Screen 
        name="suppliers" 
        options={{
          title: 'Quản lý Nhà cung cấp',
        }} 
      />
      <Stack.Screen 
        name="equipment" 
        options={{
          title: 'Quản lý Thiết bị',
        }} 
      />
    </Stack>
  );
}
