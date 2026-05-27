import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import BorrowerHome from '@/components/dashboard/BorrowerHome';
import StorekeeperHome from '@/components/dashboard/StorekeeperHome';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function HomeScreen() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <Animated.View entering={FadeIn} className="flex-1">
      {user.role === 'borrower' ? <BorrowerHome /> : <StorekeeperHome />}
    </Animated.View>
  );
}
