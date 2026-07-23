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

export type TeamSummary = {
  id: number;
  title: string;
  role: string[];
  isRecruiting: boolean;
  eventId: number | null;
  connectedActivityTitle: string | null;
  connectedActivitySummary: string | null;
  characteristic: string;
  requiredSkills: string[] | null;
  promotionText: string;
  capacity: number;
  currentMemberCount: number;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
  leaderId: number;
};

type GetTeamsParams = {
  eventId?: number;
  category?: string;
  myPosts?: boolean;
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

export async function getTeams(params?: GetTeamsParams) {
  const accessToken = await getAccessToken();

  if (params?.myPosts && !accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const query = new URLSearchParams();
  if (params?.eventId !== undefined) query.set('eventId', String(params.eventId));
  if (params?.category !== undefined) query.set('category', params.category);
  if (params?.myPosts !== undefined) query.set('myPosts', String(params.myPosts));
  const queryString = query.toString();

  const response = await fetch(
    `${API_BASE_URL}/api/teams${queryString ? `?${queryString}` : ''}`,
    {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    }
  );

  const text = await response.text();
  const result: ApiResponse<TeamSummary[]> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `팀 목록 조회 실패: ${response.status}`);
  }

  return result.data;
}