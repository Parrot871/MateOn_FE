import type { ApiResponse } from './auth';
import { getAccessToken } from './tokenStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export type EventCategory = 'CONTEST' | 'EXTERNAL' | 'SCHOOL';

export type EventItem = {
  id: number;
  title: string;
  category: EventCategory;
  field: string;
  organizer: string;
  prize: string;
  dDay: string;
  synergy: number;
};

export async function fetchEvents(category: EventCategory, signal?: AbortSignal): Promise<EventItem[]> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/events?category=${category}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });

  const text = await response.text();
  const result: ApiResponse<EventItem[]> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `공모전 목록 조회 실패: ${response.status}`);
  }

  return result.data;
}
