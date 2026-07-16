// src/store/chatRoomDetailStore.ts
import { fetchChatMessages } from '@/api/chat';
import { connectStomp, sendChatMessage, subscribeToRoom } from '@/lib/stompClient';
import type { StompChatMessage } from '@/types/chat';
import type { StompSubscription } from '@stomp/stompjs';
import { create } from 'zustand';

let currentSubscription: StompSubscription | null = null;

interface ChatRoomDetailState {
  messages: StompChatMessage[];
  isLoading: boolean;
  isStompConnected: boolean;
  currentRoomId: number | null;
  enterRoom: (roomId: number) => Promise<void>;
  leaveRoom: () => void;
  sendMessage: (content: string) => void;
}

export const useChatRoomDetailStore = create<ChatRoomDetailState>((set, get) => ({
  messages: [],
  isLoading: false,
  isStompConnected: false,
  currentRoomId: null,

  enterRoom: async (roomId) => {
    currentSubscription?.unsubscribe();
    currentSubscription = null;

    set({ isLoading: true, currentRoomId: roomId, messages: [], isStompConnected: false });

    try {
      const history = await fetchChatMessages(roomId);
      set({ messages: history });
    } catch (e) {
      console.error('메시지 이력 조회 실패', e);
    } finally {
      set({ isLoading: false });
    }

    connectStomp(() => {
      currentSubscription = subscribeToRoom(roomId, (newMessage) => {
        set((state) => ({ messages: [...state.messages, newMessage] }));
      });
      set({ isStompConnected: true });
    });
  },

  leaveRoom: () => {
    currentSubscription?.unsubscribe();
    currentSubscription = null;
    set({ messages: [], currentRoomId: null, isStompConnected: false });
  },

  sendMessage: (content) => {
    const { currentRoomId, isStompConnected } = get();
    if (!currentRoomId || !content.trim()) return;
    if (!isStompConnected) {
      console.warn('아직 채팅 연결 중입니다');
      return;
    }
    sendChatMessage(currentRoomId, content.trim());
  },
}));