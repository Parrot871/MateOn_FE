// api/application.ts
import type { ApiResponse } from './auth';
import { getAccessToken } from './tokenStorage';
import type { UserProfile } from './user';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;


export class MatchingIntentRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MatchingIntentRequiredError';
  }
}

export class ProposalNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProposalNotFoundError';
  }
}

export class AiServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiServerError';
  }
}


export class OfferAlreadyRespondedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfferAlreadyRespondedError';
  }
}

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

export class OfferForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfferForbiddenError';
  }
}


async function authenticatedFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await response.text();
  let result: ApiResponse<T> | null = null;

  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      // JSON 파싱 실패 시 (502 HTML 에러 등)
      throw new Error(`서버 응답 오류가 발생했습니다. (${response.status})`);
    }
  }

  if (!response.ok || !result?.success) {
    const message = result?.message || `요청 실패: ${response.status}`;

    // 커스텀 에러 분류
    if (response.status === 400 && message.includes('MATCHING_INTENT_REQUIRED')) {
      throw new MatchingIntentRequiredError(message);
    }
    if (
      response.status === 404 &&
      (message.includes('RECOMMENDATION_NOT_FOUND') || message.includes('RESOURCE_NOT_FOUND'))
    ) {
      throw new ProposalNotFoundError(message);
    }
    if (response.status === 502 || response.status === 503 || message.includes('AI_SERVER')) {
      throw new AiServerError(message);
    }
    // 역제안 관련 에러 분류
    if (response.status === 400 && message.includes('OFFER_ALREADY_RESPONDED')) {
      throw new OfferAlreadyRespondedError(message);
    }
    if (response.status === 400 && message.includes('SCHOOL_NOT_VERIFIED')) {
      throw new SchoolNotVerifiedError(message);
    }
    if (response.status === 400 && message.includes('TEAM_RECRUITMENT_CLOSED')) {
      throw new TeamRecruitmentClosedError(message);
    }
    if (response.status === 403 && message.includes('FORBIDDEN_ACCESS')) {
      throw new OfferForbiddenError(message);
    }
    throw new Error(message);
  }
  return result;
}

export type ProposalDraft = {
  direction: 'USER_TO_TEAM';
  teamId: number;
  userId: number;
  synergyScore: number;
  summary: string;
  message: string;
};

export type TeamApplicationRequest = {
  introduction?: string;
  message: string;
  contactNumber: string;
  portfolioUrl?: string;
};

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type Application = {
  applicationId: number;
  teamId: number;
  teamTitle: string;
  applicant: UserProfile;
  introduction: string;
  message: string;
  contactNumber: string;
  portfolioUrl: string;
  isMine: boolean;
  status: ApplicationStatus;
  createdAt: string;
};

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';

export type TeamOffer = {
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

// ── API 함수 목록 ──────────────────────────────

// 1. AI 지원 문구 초안
export async function getUserToTeamProposalDraft(teamId: number) {
  const result = await authenticatedFetch<ProposalDraft>(
    '/api/matching/proposals/user-to-team',
    {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    }
  );
  return result.data;
}

// 2. 지원서 제출
export async function submitTeamApplication(
  teamId: number,
  body: TeamApplicationRequest
) {
  const result = await authenticatedFetch<{ applicationId: number }>(
    `/api/teams/${teamId}/apply`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
  return result.data;
}

// 3. 내가 쓴 지원서 목록 조회
export async function getMyApplications() {
  const result = await authenticatedFetch<Application[]>('/api/teams/applications/me');
  return result.data;
}

// 4. 지원서 상세 단건 조회
export async function getApplicationDetail(applicationId: number) {
  const result = await authenticatedFetch<Application>(
    `/api/teams/applications/${applicationId}`
  );
  return result.data;
}

// 5. 지원서 수정
export async function updateApplication(
  applicationId: number,
  body: TeamApplicationRequest
) {
  const result = await authenticatedFetch<null>(
    `/api/teams/applications/${applicationId}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    }
  );
  return result.message;
}

// 6. 지원 취소
export async function cancelApplication(applicationId: number) {
  const result = await authenticatedFetch<null>(
    `/api/teams/applications/${applicationId}`,
    {
      method: 'DELETE',
    }
  );
  return result.message;
}

// 7. 내가 받은 제안 목록
export async function getReceivedOffers() {
  const result = await authenticatedFetch<TeamOffer[]>('/api/teams/offers/me');
  return result.data;
}

// 8. 받은 제안 수락/거절
export async function respondToOffer(offerId: number, accepted: boolean) {
  const result = await authenticatedFetch<TeamOffer>(
    `/api/teams/offers/${offerId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ accepted }),
    }
  );
  return result.data;
}