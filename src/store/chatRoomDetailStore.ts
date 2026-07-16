// src/store/chatRoomDetailStore.ts
import { fetchChatMessages, markChatAsRead } from '@/api/chat';
import { connectStomp, sendChatMessage, subscribeToRoom, unsubscribeFromRoom } from '@/lib/stompClient';
import type { StompChatMessage } from '@/types/chat';
import type { StompSubscription } from '@stomp/stompjs';
import { create } from 'zustand';

let currentSubscription: StompSubscription | null = null;
let currentSubscribedRoomId: number | null = null;
let readDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingRead: { roomId: number; messageId: number } | null = null;

interface ChatRoomDetailState {
  messages: StompChatMessage[];
  isLoading: boolean;
  isStompConnected: boolean;
  currentRoomId: number | null;
  enterRoom: (roomId: number) => Promise<void>;
  leaveRoom: () => void;
  sendMessage: (content: string) => void;
}

function scheduleMarkAsRead(roomId: number, lastMessageId: number) {
  pendingRead = { roomId, messageId: lastMessageId };
  if (readDebounceTimer) clearTimeout(readDebounceTimer);
  readDebounceTimer = setTimeout(() => {
    readDebounceTimer = null;
    const toSend = pendingRead;
    pendingRead = null;
    if (!toSend) return;
    markChatAsRead(toSend.roomId, toSend.messageId).then((ok) => {
      if (!ok) console.warn('읽음 처리 실패 (무시 가능)');
    });
  }, 300);
}

function flushPendingRead() {
  if (readDebounceTimer) {
    clearTimeout(readDebounceTimer);
    readDebounceTimer = null;
  }
  if (pendingRead) {
    const toSend = pendingRead;
    pendingRead = null;
    markChatAsRead(toSend.roomId, toSend.messageId).then((ok) => {
      if (!ok) console.warn('읽음 처리 실패 (무시 가능)');
    });
  }
}

export const useChatRoomDetailStore = create<ChatRoomDetailState>((set, get) => ({
  messages: [],
  isLoading: false,
  isStompConnected: false,
  currentRoomId: null,

  enterRoom: async (roomId) => {
    currentSubscription?.unsubscribe();
    currentSubscription = null;
    if (currentSubscribedRoomId !== null) {
      unsubscribeFromRoom(currentSubscribedRoomId);
      currentSubscribedRoomId = null;
    }
    flushPendingRead();

    set({ isLoading: true, currentRoomId: roomId, messages: [], isStompConnected: false });

    try {
      const history = await fetchChatMessages(roomId);

      if (get().currentRoomId !== roomId) return;

      set({ messages: history });

      const lastHistoryMessage = history[history.length - 1];
      if (lastHistoryMessage) {
        const ok = await markChatAsRead(roomId, lastHistoryMessage.messageId);
        if (!ok) console.warn('읽음 처리 실패 (무시 가능)');
      }
    } catch (e) {
      console.error('메시지 이력 조회 실패', e);
    } finally {
      if (get().currentRoomId === roomId) {
        set({ isLoading: false });
      }
    }

    connectStomp(() => {
      if (get().currentRoomId !== roomId) return;

      currentSubscription = subscribeToRoom(roomId, (newMessage) => {
        if (get().currentRoomId !== roomId) return;

        set((state) => ({ messages: [...state.messages, newMessage] }));
        scheduleMarkAsRead(roomId, newMessage.messageId);
      });
      currentSubscribedRoomId = roomId;
      set({ isStompConnected: true });
    });
  },

  leaveRoom: () => {
    currentSubscription?.unsubscribe();
    currentSubscription = null;
    if (currentSubscribedRoomId !== null) {
      unsubscribeFromRoom(currentSubscribedRoomId);
      currentSubscribedRoomId = null;
    }
    flushPendingRead();
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
