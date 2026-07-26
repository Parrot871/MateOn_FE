import type { ApiResponse } from "./auth";
import { getAccessToken } from "./tokenStorage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export type NotificationType = 'APPROVE' | 'REJECT' | 'INFO';

export interface NotificationResponseDTO {
  id: number;
  title: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

// 내 알림 목록 조회
export async function getMyNotifications(): Promise<NotificationResponseDTO[]> {
  const accessToken = await getAccessToken();

  const res = await fetch(`${API_BASE_URL}/api/notifications`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json: ApiResponse<NotificationResponseDTO[]> = await res.json();

  if (!json.success) {
    throw new Error(json.message);
  }

  return json.data;
}