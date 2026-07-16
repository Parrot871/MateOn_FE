// src/api/chat.ts
import type { ChatRoom, StompChatMessage } from '@/types/chat';
import { getAccessToken } from './tokenStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function fetchChatRooms(signal?: AbortSignal): Promise<ChatRoom[]> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/chat/rooms`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });

  if (!response.ok) {
    throw new Error(`채팅방 목록 조회 실패: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function fetchChatMessages(
  roomId: number,
  options?: { before?: number; size?: number },
  signal?: AbortSignal
): Promise<StompChatMessage[]> {
  const accessToken = await getAccessToken();

  const params = new URLSearchParams();
  if (options?.before !== undefined) {
    params.append('before', String(options.before));
  }
  if (options?.size !== undefined) {
    params.append('size', String(options.size));
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/chat/rooms/${roomId}/messages${
    queryString ? `?${queryString}` : ''
  }`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });

  if (!response.ok) {
    throw new Error(`메시지 이력 조회 실패: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * 채팅방 읽음 처리.
 * 실패해도 채팅 화면 자체를 막으면 안 되는 로직이라 throw 대신
 * boolean을 반환한다. 호출부에서 실패 시 재시도 큐에 넣는 등 유연하게 처리.
 */
export async function markChatAsRead(
  roomId: number,
  lastReadMessageId: number,
  signal?: AbortSignal
): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}/read`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lastReadMessageId }),
      signal,
    });

    if (!response.ok) {
      console.warn(`[markChatAsRead] 읽음 처리 실패: ${response.status}`);
      return false;
    }
    return true;
  } catch (e) {
    // AbortController로 취소된 요청은 에러로 취급하지 않음
    if (e instanceof Error && e.name === 'AbortError') {
      return false;
    }
    console.warn('[markChatAsRead] 네트워크 오류', e);
    return false;
  }
}
