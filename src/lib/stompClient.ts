// lib/stompClient.ts
import { Client, StompSubscription } from '@stomp/stompjs';
import { getAccessToken } from '../api/tokenStorage';
import { StompChatMessage } from '../types/chat';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const WS_URL = API_BASE_URL.replace(/^https/, 'wss').replace(/^http/, 'ws') + '/ws-stomp';

let client: Client | null = null;

const activeSubscriptions = new Map<number, (message: StompChatMessage) => void>();
const liveSubscriptions = new Map<number, StompSubscription>();

// SecureStore 접근은 비동기이므로, 매번 최신 토큰을 다시 읽어와 재연결 시 만료 토큰 재사용을 방지한다.
async function getFormattedToken(): Promise<string> {
  const token = await getAccessToken();
  return token ? `Bearer ${token}` : '';
}

export function connectStomp(onConnected?: () => void): Client {
  if (client && client.active) {
    onConnected?.();
    return client;
  }

  client = new Client({
    webSocketFactory: () => new (WebSocket as any)(WS_URL),

    reconnectDelay: 5000,
    forceBinaryWSFrames: true,
    appendMissingNULLonIncoming: true,

    // stompjs가 Promise를 기다려주므로 async 사용 가능
    beforeConnect: async () => {
      const formattedToken = await getFormattedToken();
      client!.connectHeaders = { Authorization: formattedToken };
    },

    onConnect: () => {
      resubscribeAll();
      onConnected?.();
    },

    onStompError: (frame) => {
      console.error('[STOMP] 연결 에러:', frame.headers['message']);
    },

    onWebSocketClose: () => {
      // 재연결은 reconnectDelay에 의해 자동 처리됨
    },
  });

  client.activate();
  return client;
}

export async function disconnectStomp() {
  activeSubscriptions.clear();
  liveSubscriptions.clear();
  await client?.deactivate();
  client = null;
}

export function getStompClient(): Client | null {
  return client;
}

function resubscribeAll() {
  if (!client || !client.active) return;
  activeSubscriptions.forEach((handler, roomId) => {
    const sub = client!.subscribe(`/topic/room.${roomId}`, (frame) => {
      const data: StompChatMessage = JSON.parse(frame.body);
      handler(data);
    });
    liveSubscriptions.set(roomId, sub);
  });
}

export function subscribeToRoom(
  roomId: number,
  onMessage: (message: StompChatMessage) => void
): StompSubscription | null {
  activeSubscriptions.set(roomId, onMessage);

  if (!client || !client.active) {
    console.warn('[STOMP] 연결되지 않은 상태에서 구독 시도 (연결되면 자동 구독됨)');
    return null;
  }

  const subscription = client.subscribe(`/topic/room.${roomId}`, (frame) => {
    const data: StompChatMessage = JSON.parse(frame.body);
    onMessage(data);
  });

  liveSubscriptions.set(roomId, subscription);
  return subscription;
}

export function unsubscribeFromRoom(roomId: number) {
  activeSubscriptions.delete(roomId);
  liveSubscriptions.get(roomId)?.unsubscribe();
  liveSubscriptions.delete(roomId);
}

export function sendChatMessage(roomId: number, content: string) {
  if (!client || !client.connected) {
    console.warn('[STOMP] 연결되지 않은 상태에서 전송 시도');
    return;
  }

  client.publish({
    destination: '/app/chat.send',
    body: JSON.stringify({ roomId, content }),
  });
}