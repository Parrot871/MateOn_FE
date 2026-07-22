// api/application.ts
import type { ApiResponse } from './auth';
import { getAccessToken } from './tokenStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// ── 에러 타입 ──────────────────────────────

// 400 MATCHING_INTENT_REQUIRED
export class MatchingIntentRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MatchingIntentRequiredError';
  }
}

// 404 RECOMMENDATION_NOT_FOUND / RESOURCE_NOT_FOUND
export class ProposalNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProposalNotFoundError';
  }
}

// 502/503 AI 서버 에러
export class AiServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiServerError';
  }
}

// ── AI 지원 문구 초안 ──────────────────────────────

export type ProposalDraft = {
  direction: 'USER_TO_TEAM';
  teamId: number;
  userId: number;
  synergyScore: number;
  summary: string;
  message: string;
};

export async function getUserToTeamProposalDraft(teamId: number) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/matching/proposals/user-to-team`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ teamId }),
    },
  );

  const text = await response.text();
  const result: ApiResponse<ProposalDraft> | null = text ? JSON.parse(text) : null;

  if (!response.ok || !result?.success) {
    const message = result?.message || `지원 문구 초안 생성 실패: ${response.status}`;

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
    throw new Error(message);
  }

  return result.data;
}

// ── 지원서 제출 ──────────────────────────────

export type TeamApplicationRequest = {
  introduction?: string;
  message: string;
  contactNumber: string;
  portfolioUrl?: string;
};

export async function submitTeamApplication(
  teamId: number,
  body: TeamApplicationRequest,
) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/apply`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const result: ApiResponse<{ applicationId: number }> | null = text
    ? JSON.parse(text)
    : null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `지원서 제출 실패: ${response.status}`);
  }

  return result.data;
}