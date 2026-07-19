import univInfo from '@/univInfo.json';

type UnivInfo = Record<string, string>;

const UNIV_INFO: UnivInfo = univInfo;

export function getUnivByEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;

  return UNIV_INFO[domain] ?? null;
}
