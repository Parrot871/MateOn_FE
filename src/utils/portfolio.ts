export interface ParsedPortfolio {
  bulletPoints: string[];
  summaryText: string;
}

export function parsePortfolioSummary(rawText: string | null): ParsedPortfolio {
  if (!rawText) return { bulletPoints: [], summaryText: '' };

  // '요약' 키워드 기준으로 분리
  const parts = rawText.split(/\n\n요약\n|\n요약\n/);
  const rawBullets = parts[0] || '';
  const summaryText = parts[1] || '';

  // - 또는 • 문자로 시작하는 불렛 포인트 파싱
  const bulletPoints = rawBullets
    .split('\n')
    .map((line) => line.trim().replace(/^[-•]\s*/, ''))
    .filter((line) => line.length > 0);

  return {
    bulletPoints,
    summaryText: summaryText.trim(),
  };
}