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

export type TeamMember = {
  userId: number;
  major: string;
  name: string;
  isLeader: boolean;
}

export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

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
  leaderEmail?: string;
  leaderCollege: string;
  leaderGrade: string;
  leaderMajor: string;
  leaderCollaborationTemperature: number | null;
  recruiting: boolean;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
  hasApplied: boolean;
  leader: boolean;
  members: TeamMember[];
  myApplicationStatus: ApplicationStatus | null;
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
    if (
      response.status === 400 &&
      (result?.message?.includes('MATCHING_INTENT_REQUIRED') || result?.message?.includes('매칭 의도'))
    ) {
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
  college?: string;
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
  members: TeamMember[];

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
      throw new Error(message);
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
    const message = result?.message || `팀 모집글 등록 실패: ${response.status}`;

    if (message.includes('SCHOOL_NOT_VERIFIED')) {
      throw new SchoolNotVerifiedError(message);
    }

    throw new Error(message);
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

export type ProposalDraft = {
  direction: 'TEAM_TO_USER' | 'USER_TO_TEAM';
  userId: number;
  message: string;
};

type GetTeamToUserProposalDraftParams = {
  teamId: number;
  userId: number;
};

// 팀장이 추천받은 유저에게 보낼 제안 메시지 초안을 AI로 생성할 때 사용
export async function getTeamToUserProposalDraft(
  params: GetTeamToUserProposalDraftParams
): Promise<ProposalDraft> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/matching/proposals/team-to-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ teamId: params.teamId, userId: params.userId }),
  });

  const text = await response.text();
  const result: ApiResponse<ProposalDraft> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    const message = result?.message || `제안 문구 초안 조회 실패: ${response.status}`;

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

  return result.data;
}

// 팀 제안(offer) 발송 시 발생하는 400 에러들을 구분하기 위한 전용 에러
export class SchoolNotVerifiedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchoolNotVerifiedError';
  }
}

export class TeamRecruitmentClosedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TeamRecruitmentClosedError';
  }
}

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
  }
}

export class DuplicateResourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateResourceError';
  }
}

// 404 RESOURCE_NOT_FOUND / USER_NOT_FOUND — 팀 또는 대상 유저가 존재하지 않음
export class ResourceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceNotFoundError';
  }
}

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';


export type TeamOfferResponseDTO = {
  offerId: number;
  teamId: number;
  teamTitle: string;
  promotionText: string;
  role: string[];
  requiredSkills: string[];
  capacity: number;
  eventId: number | null;
  leaderId: number;
  leaderName: string | null;
  targetUserId: number;
  targetUserName: string;
  targetUserSchool: string;
  targetUserMajor: string;
  message: string | null;
  aiScore: number | null;
  aiLabel: string | null;
  status: OfferStatus;
  createdAt: string;
  respondedAt: string | null;
};

type CreateTeamOfferParams = {
  teamId: number;
  userId: number;
  message?: string;
};

// 팀장이 팀 참여를 원하는 유저에게 먼저 제안(offer)을 보낼 때 사용
export async function createTeamOffer(
  params: CreateTeamOfferParams
): Promise<TeamOfferResponseDTO> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/${params.teamId}/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ userId: params.userId, message: params.message }),
  });

  const text = await response.text();
  const result: ApiResponse<TeamOfferResponseDTO> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    const message = result?.message || `팀 제안 발송 실패: ${response.status}`;

    if (response.status === 400) {
      if (message.includes('SCHOOL_NOT_VERIFIED')) {
        throw new SchoolNotVerifiedError(message);
      }
      if (message.includes('TEAM_RECRUITMENT_CLOSED')) {
        throw new TeamRecruitmentClosedError(message);
      }
      if (message.includes('INVALID_INPUT')) {
        throw new InvalidInputError(message);
      }
      if (message.includes('DUPLICATE_RESOURCE')) {
        throw new DuplicateResourceError(message);
      }
    }
    if (response.status === 403 && message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(message);
    }
    if (response.status === 404) {
      throw new ResourceNotFoundError(message);
    }

    throw new Error(message);
  }

  return result.data;
}

// 400 OFFER_ALREADY_RESPONDED — 이미 수락/거절/취소된 제안을 다시 취소하려는 경우
export class OfferAlreadyRespondedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfferAlreadyRespondedError';
  }
}

// 팀장이 자기 팀이 보낸 제안 목록을 조회할 때 사용 (최신순)
export async function getTeamOffers(teamId: number): Promise<TeamOfferResponseDTO[]> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/offers`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  const result: ApiResponse<TeamOfferResponseDTO[]> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    const message = result?.message || `보낸 제안 목록 조회 실패: ${response.status}`;

    if (response.status === 403 && message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(message);
    }

    throw new Error(message);
  }

  return result.data;
}

// 아직 응답받지 않은 제안을 취소할 때 사용 (삭제가 아니라 CANCELED 상태로 보존됨)
export async function cancelTeamOffer(offerId: number): Promise<void> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/offers/${offerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  const result: ApiResponse<null> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    const message = result?.message || `제안 취소 실패: ${response.status}`;

    if (response.status === 400 && message.includes('OFFER_ALREADY_RESPONDED')) {
      throw new OfferAlreadyRespondedError(message);
    }
    if (response.status === 403 && message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(message);
    }
    if (response.status === 404) {
      throw new ResourceNotFoundError(message);
    }

    throw new Error(message);
  }
}
type GetUserToTeamRecommendationReasonParams = {
  teamId: number;
};

// 유저가 추천받은 특정 팀에 대한 상세 추천 이유를 조회할 때 사용
export async function getUserToTeamRecommendationReason(
  params: GetUserToTeamRecommendationReasonParams
): Promise<string> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/matching/recommendations/reason/user-to-team`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ teamId: params.teamId }),
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
// 400 TEAM_ALREADY_ENDED — 이미 종료된 팀을 다시 종료하려는 경우
export class TeamAlreadyEndedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TeamAlreadyEndedError';
  }
}

// 팀장이 자기 팀 모집글을 수정할 때 사용 (Body 구조는 등록용 TeamRequestPayload와 동일)
export async function updateTeamRecruitment(
  teamId: number,
  payload: TeamRequestPayload
): Promise<TeamDetail> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const result: ApiResponse<TeamDetail> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    const message = result?.message || `팀 모집글 수정 실패: ${response.status}`;

    if (response.status === 403 && message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(message);
    }
    if (response.status === 404) {
      throw new ResourceNotFoundError(message);
    }

    throw new Error(message);
  }

  return result.data;
}

// 팀장이 자기 팀 모집글을 삭제할 때 사용
export async function deleteTeam(teamId: number): Promise<void> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  const result: ApiResponse<null> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    const message = result?.message || `팀 모집글 삭제 실패: ${response.status}`;

    if (response.status === 403 && message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(message);
    }
    if (response.status === 404) {
      throw new ResourceNotFoundError(message);
    }

    throw new Error(message);
  }
}

// 팀장이 팀 활동 종료를 선언할 때 사용. endedAt 기록 + isRecruiting=false 처리 + 팀원 전체에게 평가 알림 발송.
// 참고: 연결된 Event 종료일이 지나면 배치 작업으로 자동 종료될 수도 있으므로,
// 호출 전 이미 종료된 상태일 수 있다는 점을 호출부에서 감안해야 함.
export async function completeTeamActivity(teamId: number): Promise<void> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  const result: ApiResponse<null> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    const message = result?.message || `팀 활동 종료 실패: ${response.status}`;

    if (response.status === 400 && message.includes('TEAM_ALREADY_ENDED')) {
      throw new TeamAlreadyEndedError(message);
    }
    if (response.status === 403 && message.includes('FORBIDDEN_ACCESS')) {
      throw new ForbiddenAccessError(message);
    }

    throw new Error(message);
  }
}