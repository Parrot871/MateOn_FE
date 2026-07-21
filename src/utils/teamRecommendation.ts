export type UrgencyInfo = {
  label: string;
  bg: string;
  text: string;
};

export function getDaysLeft(dateStr: string): number {
  const end = new Date(dateStr + 'T23:59:59');
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getUrgencyInfo(daysLeft: number): UrgencyInfo {
  if (daysLeft < 0)
    return {
      label: '모집 종료',
      bg: 'bg-gray-100',
      text: 'text-gray-400',
    };

  if (daysLeft <= 3)
    return {
      label: `마감임박 D-${daysLeft}`,
      bg: 'bg-red-50',
      text: 'text-red-500',
    };

  if (daysLeft <= 7)
    return {
      label: `D-${daysLeft}`,
      bg: 'bg-orange-50',
      text: 'text-orange-500',
    };

  return {
    label: '모집 중',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  };
}

export function getRecommendation(score: number) {
  const pct = Math.round(score * 100);

  if (pct >= 90)
    return {
      label: '강력 추천',
      color: '#7C3AED',
      bg: '#F3E8FF',
      percent: pct,
    };

  if (pct >= 75)
    return {
      label: '추천',
      color: '#2563EB',
      bg: '#EFF6FF',
      percent: pct,
    };

  if (pct >= 60)
    return {
      label: '적합',
      color: '#0891B2',
      bg: '#ECFEFF',
      percent: pct,
    };

  return {
    label: '둘러보기',
    color: '#64748B',
    bg: '#F8FAFC',
    percent: pct,
  };
}