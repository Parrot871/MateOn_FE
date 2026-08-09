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
  portfolio: string | null;
  profileImageUrl: string | null;
  collaborationTemperature: number | null;
  collaborationReviewCount: number;
  participatedActivities: ParticipatedActivity[];
};

export async function getMyProfile() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
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
  schoolEmail?: string | null;
  schoolVerified?: boolean;
  profileImageUrl?: string | null;
  tagline?: string | null;
  portfolio?:string | null;
  // schoolEmail 변경 시, 실제로 인증코드를 검증했다는 증명으로 함께 보낸다 (verifyEmailCode 응답값).
  verificationToken?: string;
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
    cache: 'no-store',
  });

  const text = await response.text();
  console.log('[updateProfile] status:', response.status, 'body:', text);
  const result: ApiResponse<UserProfile> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `회원정보 수정 실패: ${response.status}`);
  }

  return result.data;
}

// Expo의 fetch 폴리필은 RN 특유의 { uri, name, type } FormData 파트를 지원하지 않아
// ("Unsupported FormDataPart implementation") XMLHttpRequest(RN 네이티브 네트워킹 브리지)로 직접 전송한다.
export function uploadProfileImage(file: { uri: string; name: string; type: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    getAccessToken().then((accessToken) => {
      if (!accessToken) {
        reject(new Error('로그인이 필요합니다.'));
        return;
      }

      const formData = new FormData();
      formData.append('image', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/api/users/me/profile-image`);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

      xhr.onload = () => {
        let result: ApiResponse<null> | null = null;
        try {
          result = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        } catch {
          // JSON 파싱 실패 시 아래 status 체크로 넘어감
        }

        if (xhr.status >= 200 && xhr.status < 300 && result?.success) {
          resolve();
        } else {
          reject(new Error(result?.message || `프로필 사진 업로드 실패: ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('네트워크 오류가 발생했습니다.'));
      xhr.send(formData);
    });
  });
}

export async function deleteProfileImage() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/users/me/profile-image`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  const result: ApiResponse<null> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `프로필 사진 삭제 실패: ${response.status}`);
  }
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
  collaborationReviewCount: number;
  participatedActivities: ParticipatedActivity[];
  isMe: boolean;
  portfolio: string | null;
  profileImageUrl: string | null;
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
