const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function loginWithKakao(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/social/kakao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken }),
  });

  if (!response.ok) {
    throw new Error(`카카오톡 로그인 요청 실패: ${response.status}`);
  }
  
  return response.json();
}
