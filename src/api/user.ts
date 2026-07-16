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

  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const result: ApiResponse<UserProfile> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || `내 정보 조회 실패: ${response.status}`);
  }

  return result.data;
}
