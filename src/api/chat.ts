// src/api/chat.ts
import type { ChatRoom, StompChatMessage } from '@/types/chat';
import { getAccessToken } from './tokenStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function fetchChatRooms(): Promise<ChatRoom[]> {
  const accessToken = await getAccessToken();
  const response = await fetch(`${API_BASE_URL}/api/chat/rooms`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`채팅방 목록 조회 실패: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function fetchChatMessages(
  roomId: number,
  options?: { before?: number; size?: number }
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
  });

  if (!response.ok) {
    throw new Error(`메시지 이력 조회 실패: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function markChatAsRead(
  roomId: number,
  lastReadMessageId: number
): Promise<void> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}/read`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ lastReadMessageId }),
  });

  if (!response.ok) {
    throw new Error(`읽음 처리 실패: ${response.status}`);
  }
}