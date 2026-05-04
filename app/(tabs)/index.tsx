import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import BorrowerHome from '@/components/dashboard/BorrowerHome';
import StorekeeperHome from '@/components/dashboard/StorekeeperHome';
import { View } from '@/tw';

export default function HomeScreen() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <View className="flex-1">
      {user.role === 'borrower' ? <BorrowerHome /> : <StorekeeperHome />}
    </View>
  );
}
