import type { ApiResponse } from './auth';
import { getAccessToken } from './tokenStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export type UserProfile = {
  id: number;
  email: string;
  schoolEmail: string | null;
  schoolVerified: boolean;
  name: string;
  campus: string | null;
  college: string | null;
  major: string | null;
  grade: string | null;
  interestJobPrimary: string | null;
  interestJobSecondary: string | null;
  interestJobTertiary: string | null;
  tagline: string | null;
};

export async function getMyProfile() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  const result: ApiResponse<UserProfile> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `내 정보 조회 실패: ${response.status}`);
  }

  return result.data;
}

export async function changePassword(currentPassword: string, newPassword: string, newPasswordConfirm: string) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/users/password/change`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ currentPassword, newPassword, newPasswordConfirm }),
  });

  const text = await response.text();
  const result: ApiResponse<unknown> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `비밀번호 변경 실패: ${response.status}`);
  }

  return result.data;
}
