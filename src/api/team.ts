import type { ApiResponse } from "./auth";
import { getAccessToken } from "./tokenStorage";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export type TeamRecommendation = {
  teamId: number;
  title: string;
  role: string[];
  requiredSkills: string[] | null;
  promotionText: string;
  characteristic: string;
  capacity: number;
  currentMemberCount: number;
  eventId: number | null;
  connectedActivityTitle: string | null;
  connectedActivitySummary: string | null;
  leaderId: number;
  recruitmentEndDate: string;
  score: number;
  label: string;
};

export type TeamDetail = {
  id: number;
  title: string;
  role: string[];
  requiredSkills: string[];
  promotionText: string;
  characteristic: string;
  capacity: number;
  currentMemberCount: number;
  eventId: number | null;
  connectedActivityTitle: string | null;
  connectedActivitySummary: string | null;
  leaderId: number;
  leaderName: string;
  leaderCollege: string;
  leaderGrade: string;
  leaderMajor: string;
  leaderCollaborationTemperature: number;
  recruiting: boolean;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
  hasApplied: boolean;
  leader: boolean;
};

type GetRecommendedTeamsParams = {
  eventId?: number;
  limit?: number;
};

// 400 MATCHING_INTENT_REQUIRED를 구분해서 잡기 위한 전용 에러
export class MatchingIntentRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MatchingIntentRequiredError';
  }
}

export async function getRecommendedTeams(params?: GetRecommendedTeamsParams) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const query = new URLSearchParams();
  if (params?.eventId !== undefined) query.set('eventId', String(params.eventId));
  if (params?.limit !== undefined) query.set('limit', String(params.limit));
  const queryString = query.toString();

  const response = await fetch(
    `${API_BASE_URL}/api/matching/recommendations/user-to-team${queryString ? `?${queryString}` : ''}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const text = await response.text();
  const result: ApiResponse<TeamRecommendation[]> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    if (response.status === 400 && result?.message?.includes('MATCHING_INTENT_REQUIRED')) {
      throw new MatchingIntentRequiredError(result.message);
    }
    throw new Error(result?.message || `팀 추천 조회 실패: ${response.status}`);
  }

  return result.data;
}

export async function getTeamDetail(teamId: number) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  const result: ApiResponse<TeamDetail> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `팀 상세 조회 실패: ${response.status}`);
  }

  return result.data;
}

export type TeamPost = {
  id: number;
  title: string;
  role: string[];
  requiredSkills: string[];
  promotionText: string;
  characteristic: string;
  capacity: number;
  currentMemberCount: number;
  eventId: number | null;
  connectedActivityTitle: string | null;
  recruiting: boolean;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
};

// 내가 리더로 모집한(작성한) 팀 목록 — myPosts=true로 리더 소유 게시글만 필터링
export async function getMyTeams(signal?: AbortSignal): Promise<TeamPost[]> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams?myPosts=true`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });

  const text = await response.text();
  const result: ApiResponse<TeamPost[]> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `모집한 팀 조회 실패: ${response.status}`);
  }

  console.log('[getMyTeams]', text);

  return result.data;
}

export type TeamRequestPayload = {
  eventId?: number;
  title: string;
  promotionText?: string;
  role: string[];
  characteristic?: string;
  requiredSkills?: string[];
  capacity: number;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
};

export async function createTeamRecruitment(payload: TeamRequestPayload) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const result: ApiResponse<TeamDetail> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `팀 모집글 등록 실패: ${response.status}`);
  }

  return result.data;
}

export type TeamReviewTarget = {
  userId: number;
  name: string;
  major: string;
  alreadyReviewed: boolean;
};

export type TeamReviewTargets = {
  teamId: number;
  teamTitle: string;
  endedAt: string;
  reviewDeadline: string;
  targets: TeamReviewTarget[];
};

// 팀이 아직 종료되지 않았거나 접근 권한이 없으면 실패하므로, 호출부에서
// 성공(success: true) 여부로 "평가 가능한 종료된 팀"인지 판단한다.
export async function getTeamReviewTargets(teamId: number, signal?: AbortSignal): Promise<TeamReviewTargets> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/reviews/targets`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });

  const text = await response.text();
  const result: ApiResponse<TeamReviewTargets> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `평가 대상 조회 실패: ${response.status}`);
  }

  return result.data;
}

export type TeamReviewSubmission = {
  revieweeId: number;
  rating: number;
};

export async function submitTeamReviews(teamId: number, reviews: TeamReviewSubmission[]): Promise<void> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ reviews }),
  });

  const text = await response.text();
  const result: ApiResponse<null> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `평가 제출 실패: ${response.status}`);
  }
}

