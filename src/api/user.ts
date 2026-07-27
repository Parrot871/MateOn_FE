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

export type UpdateProfilePayload = {
  name: string;
  college: string;
  major: string;
  interestJobPrimary: string;
  interestJobSecondary: string;
  interestJobTertiary: string;
};

export async function updateProfile(payload: UpdateProfilePayload) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const result: ApiResponse<UserProfile> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `회원정보 수정 실패: ${response.status}`);
  }

  return result.data;
}

export class UserNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

export type ParticipatedActivity = {
  id: number;
  title: string;
  category: string;
};

export type PublicUserProfile = {
  id: number;
  name: string;
  campus: string | null;
  college: string | null;
  major: string | null;
  grade: string | null;
  tagline: string | null;
  desiredRoles: string[];
  skills: string[];
  experienceLevel: string | null;
  activityStyle: string | null;
  collaborationTemperature: number | null;
  participatedActivities: ParticipatedActivity[];
  isMe: boolean;
};

// 타인의 공개 프로필 조회 (추천 목록/지원자/역제안/DM 등에서 사용). email/schoolEmail/providerId는 내려오지 않음
export async function getPublicUserProfile(userId: number): Promise<PublicUserProfile> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  const result: ApiResponse<PublicUserProfile> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    const message = result?.message || `사용자 정보 조회 실패: ${response.status}`;

    if (response.status === 404) {
      throw new UserNotFoundError(message);
    }

    throw new Error(message);
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
