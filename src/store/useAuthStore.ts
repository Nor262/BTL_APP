import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'storekeeper' | 'borrower';
  phone?: string;
  avatar_url?: string;
  student_id?: string;
  class?: string;
  department?: string;
  penalty_points?: number;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      setUser: (user) => set({ user }),
      refreshMe: async () => {
        try {
          const { default: api } = await import('@/api/client');
          const res = await api.get('/auth/me');
          const u = res.data?.data || res.data;
          if (u) set({ user: u });
        } catch {}
      },
      logout: async () => {
        try {
          const { default: api } = await import('@/api/client');
          const Notifications = await import('expo-notifications');
          const tokenData = await Notifications.getDevicePushTokenAsync().catch(() => null);
          if (tokenData?.data) {
            await api.post('/notifications/remove-token', { token: tokenData.data }).catch(() => {});
          }
        } catch {}
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
