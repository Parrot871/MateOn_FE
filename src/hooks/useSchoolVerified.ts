import { getMyProfile } from '@/api/user';
import { useEffect, useState } from 'react';

// 로딩 중에는 낙관적으로 true를 반환해 버튼이 불필요하게 깜빡이지 않도록 한다.
// 실제 인증 여부는 각 API 호출에서 SchoolNotVerifiedError로도 다시 검증된다.
export function useSchoolVerified() {
  const [schoolVerified, setSchoolVerified] = useState(true);

  useEffect(() => {
    getMyProfile()
      .then((profile) => setSchoolVerified(profile.schoolVerified))
      .catch(() => {});
  }, []);

  return schoolVerified;
}
