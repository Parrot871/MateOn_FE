// src/store/authStore.ts
import { getMyProfile } from '@/api/user';
import { create } from 'zustand';

interface AuthState {
  myUserId: number | null;
  isLoaded: boolean;
  loadMyUserId: () => Promise<void>;
  resetAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  myUserId: null,
  isLoaded: false,

  loadMyUserId: async () => {
    if (get().isLoaded) return;
    try {
      const profile = await getMyProfile();
      set({ myUserId: profile.id, isLoaded: true });
    } catch (e) {
      console.error('내 프로필 조회 실패', e);
    }
  },

  resetAuth: () => set({ myUserId: null, isLoaded: false }),
}));