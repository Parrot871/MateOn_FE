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

// 역제안: 팀 맞춤 유저 추천(team-to-user)
export type UserRecommendation = {
  userId: number;
  name: string;
  school: string;
  major: string;
  grade: string;
  tagline: string;
  desiredRoles: string[];
  skills: string[];
  experienceLevel: string;
  activityStyle: string;
  collaborationTemperature: number | null; // 표본 부족 시 null (비공개, 결측 아님)
  score: number;
  label: string;
};
 
type GetRecommendedUsersParams = {
  teamId: number;
  limit?: number;
};
 
// 이 API의 예외 응답들을 구분해서 처리하기 위한 전용 에러
export class TeamEmbeddingNotReadyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TeamEmbeddingNotReadyError';
  }
}
 
export class ForbiddenAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenAccessError';
  }
}
 
export class AiServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiServerError'; // 502 AI_SERVER_ERROR, 503 AI_SERVER_UNAVAILABLE 공통
  }
}

// 404 RECOMMENDATION_NOT_FOUND — 최근 추천 결과에 해당 (teamId, userId) 조합이 없는 경우
export class RecommendationNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecommendationNotFoundError';
  }
}
 
// 팀장이 자기 팀 기준으로 적합한 유저를 추천받아 제안(offer)을 보낼 때 사용
export async function getRecommendedUsers(params: GetRecommendedUsersParams) {
  const accessToken = await getAccessToken();
 
  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }
 
  const query = new URLSearchParams();
  query.set('teamId', String(params.teamId));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
 
  const response = await fetch(
    `${API_BASE_URL}/api/matching/recommendations/team-to-user?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
 
  const text = await response.text();
  const result: ApiResponse<UserRecommendation[]> | null = text ? JSON.parse(text) : null;
 
  if (!response.ok || !result?.success) {
    const message = result?.message || `유저 추천 조회 실패: ${response.status}`;
 
    if (response.status === 400 && message.includes('TEAM_EMBEDDING_NOT_READY')) {
      throw new TeamEmbeddingNotReadyError(message);
    }
    if (response.status === 403 && message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(message);
    }
    if (response.status === 404) {
      throw new Error(message); // RESOURCE_NOT_FOUND — 팀이 존재하지 않음
    }
    if (response.status === 502 || response.status === 503) {
      throw new AiServerError(message);
    }
 
    throw new Error(message);
  }
 
  return result.data;
}

type GetUserRecommendationReasonParams = {
  teamId: number;
  userId: number;
};

// 팀장이 추천받은 특정 유저에 대한 상세 추천 이유를 조회할 때 사용
export async function getUserRecommendationReason(
  params: GetUserRecommendationReasonParams
): Promise<string> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/matching/recommendations/reason/team-to-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ teamId: params.teamId, userId: params.userId }),
    }
  );

  const text = await response.text();
  const result: ApiResponse<{ reason: string }> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    const message = result?.message || `추천 상세 이유 조회 실패: ${response.status}`;

    if (response.status === 403 && message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(message);
    }
    if (response.status === 404 && message.includes('RECOMMENDATION_NOT_FOUND')) {
      throw new RecommendationNotFoundError(message);
    }
    if (response.status === 502 || response.status === 503) {
      throw new AiServerError(message);
    }

    throw new Error(message);
  }

  return result.data.reason;
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

