import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import BorrowerHome from '@/components/dashboard/BorrowerHome';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function HomeScreen() {
  const { user } = useAuthStore();

  if (!user) return null;
  // Admin/storekeeper sẽ được root layout redirect sang group đúng
  if (user.role !== 'borrower') return null;

  return (
    <Animated.View entering={FadeIn} className="flex-1">
      <BorrowerHome />
    </Animated.View>
  );
}
