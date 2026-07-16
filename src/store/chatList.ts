// src/store/chatList.ts
import { fetchChatRooms } from '@/api/chat';
import type { ChatRoom } from '@/types/chat';
import { create } from 'zustand';

interface ChatListState {
  rooms: ChatRoom[];
  isLoading: boolean;
  error: boolean;
  fetchRooms: () => Promise<void>;
}

export const useChatListStore = create<ChatListState>((set) => ({
  rooms: [],
  isLoading: true,
  error: false,

  fetchRooms: async () => {
    set({ isLoading: true, error: false });
    try {
      const data = await fetchChatRooms();
      set({ rooms: data });
    } catch (e) {
      console.error('채팅방 목록 조회 실패:', e);
      set({ error: true });
    } finally {
      set({ isLoading: false });
    }
  },
}));