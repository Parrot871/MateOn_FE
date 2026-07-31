import type { ApiResponse } from './auth';
import { getAccessToken } from './tokenStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export type PortfolioSummary = {
  summary: string;
};

// PDF 포트폴리오를 업로드해 AI 요약(마크다운)을 받아온다.
// RN 특유의 { uri, name, type } FormData 파트는 fetch 폴리필이 지원하지 않아 XMLHttpRequest로 전송한다.
export function summarizePortfolio(file: { uri: string; name: string }): Promise<PortfolioSummary> {
  return new Promise((resolve, reject) => {
    getAccessToken().then((accessToken) => {
      if (!accessToken) {
        reject(new Error('로그인이 필요합니다.'));
        return;
      }

      const formData = new FormData();
      formData.append('pdf_file', {
        uri: file.uri,
        name: file.name,
        type: 'application/pdf',
      } as unknown as Blob);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/api/portfolios/summarize`);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

      xhr.onload = () => {
        let result: ApiResponse<PortfolioSummary> | null = null;
        try {
          result = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        } catch {
          // JSON 파싱 실패 시 아래 status 체크로 넘어감
        }
        console.log('[summarizePortfolio] status:', xhr.status, 'body:', xhr.responseText);

        if (xhr.status >= 200 && xhr.status < 300 && result?.success) {
          resolve(result.data);
        } else {
          reject(new Error(result?.message || `포트폴리오 요약 실패: ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('네트워크 오류가 발생했습니다.'));
      xhr.send(formData);
    });
  });
}
