import type { ApiResponse } from './auth';
import { getAccessToken } from './tokenStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export type EventCategory = 'CONTEST' | 'EXTERNAL' | 'SCHOOL';

export type EventItem = {
  id: number;
  title: string;
  category: EventCategory;
  field: string;
  fieldLabel: string;
  organizer: string;
  description: string | null;
  summarizedDescription: string | null;
  detailUrl: string;
  imageUrl: string | null;
  campusScope: string;
  startDate: string;
  endDate: string;
  recommendedTargets: string | null;
  targetColleges: string[] | null;
  targetSchool: string | null;
};

export function computeDDay(endDate: string): string {
  const end = new Date(`${endDate}T23:59:59`);
  const now = new Date();
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return '마감';
  if (diffDays === 0) return 'D-DAY';
  return `D-${diffDays}`;
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${startDate.replaceAll('-', '.')}-${endDate.replaceAll('-', '.')}`;
}

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

export async function searchEvents(keyword: string, signal?: AbortSignal): Promise<EventItem[]> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/events/search?keyword=${encodeURIComponent(keyword)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });

  const text = await response.text();
  const result: ApiResponse<EventItem[]> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `활동 검색 실패: ${response.status}`);
  }

  console.log('[searchEvents]', keyword, text);

  return result.data;
}

export async function fetchEventDetail(id: number, signal?: AbortSignal): Promise<unknown> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });

  const text = await response.text();
  const result: ApiResponse<unknown> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `활동 상세 조회 실패: ${response.status}`);
  }

  console.log('[fetchEventDetail]', id, text);

  return result.data;
}
