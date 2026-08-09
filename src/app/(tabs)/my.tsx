import { getMyApplications, getReceivedOffers } from '@/api/apply';
import { fetchBookmarkedEventIds } from '@/api/events';
import { getMyNotifications } from '@/api/notification';
import { summarizePortfolio } from '@/api/portfolio';
import { getMyTeams, getTeamReviewTargets } from '@/api/team';
import { clearTokens, getAccessToken } from '@/api/tokenStorage';
import { deleteProfileImage, getMyProfile, updateProfile, uploadProfileImage, type UserProfile } from '@/api/user';
import { HappyLine, NotificationLine } from '@/assets/icons';
import { Back, Bookmark, FlagIcon, MypageMLogo, NotificationNewDot, ProfileUser, Star, UserIcon } from '@/assets/images/tool';
import { useNotificationSSE } from '@/hooks/useNotificationSSE';
import { useAuthStore } from '@/store/authStore';
import { useTeamRecStore } from '@/store/teamRecStore';
import { parsePortfolioSummary } from '@/utils/portfolio';
import { getUnivByEmail } from '@/utils/univ';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_PORTFOLIO_SIZE = 20 * 1024 * 1024;

function TemperatureBar({ value, max }: { value: number; max: number }) {
  const progress = Math.min(value / max, 1) * 100;

  return (
    <View className="h-2 rounded-full bg-[#FDE2E2] overflow-hidden">
      <View className="h-2 rounded-full bg-[#FF0000]" style={{ width: `${progress}%` }} />
    </View>
  );
}

async function getReviewableTeamCount(): Promise<number> {
  const [applications, myTeams] = await Promise.all([
    getMyApplications().catch(() => []),
    getMyTeams().catch(() => []),
  ]);

  const teamIds = Array.from(
    new Set([
      ...applications.filter((a) => a.status === 'APPROVED').map((a) => a.teamId),
      ...myTeams.map((t) => t.id),
    ])
  );

  const results = await Promise.all(
    teamIds.map((id) =>
      getTeamReviewTargets(id)
        .then(() => true)
        .catch(() => false)
    )
  );

  return results.filter(Boolean).length;
}

export default function MypageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applicationCount, setApplicationCount] = useState(0);
  const [myTeamCount, setMyTeamCount] = useState(0);
  const [reviewableTeamCount, setReviewableTeamCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  const { notifications: sseNotifications } = useNotificationSSE();
  const [isExpanded, setIsExpanded] = useState(false);
  const { bulletPoints, summaryText } = parsePortfolioSummary(profile?.portfolio ?? null);
  const univ = getUnivByEmail(profile?.schoolEmail ?? profile?.email);

  useFocusEffect(
    useCallback(() => {
      getMyProfile()
        .then(setProfile)
        .catch((error) => console.error('내 정보 조회 실패:', error));

      getAccessToken().then((token) => {
        if (!token) return;

        getMyNotifications()
          .then((list) => setHasUnread(list.some((n) => !n.isRead)))
          .catch(console.error);
      });

      Promise.all([
        getMyApplications().catch(() => []),
        getReceivedOffers().catch(() => []),
      ])
        .then(([applications, offers]) => {
          setApplicationCount(applications.length + offers.length);
        })
        .catch((error) => console.error('지원 및 제안 목록 조회 실패:', error));

      getMyTeams()
        .then((data) => setMyTeamCount(data.length))
        .catch((error) => console.error('모집한 팀 목록 조회 실패:', error));

      getReviewableTeamCount()
        .then(setReviewableTeamCount)
        .catch((error) => console.error('평가 대상 팀 개수 조회 실패:', error));

      fetchBookmarkedEventIds()
        .then((ids) => setBookmarkCount(ids.length))
        .catch((error) => console.error('북마크 개수 조회 실패:', error));
    }, [])
  );

  useEffect(() => {
    if (sseNotifications.length > 0) {
      setHasUnread(true);
    }
  }, [sseNotifications]);

  const handleChangePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('사진 접근 권한 필요', '설정에서 사진 보관함 접근 권한을 허용해주세요.', [
        { text: '확인' },
      ]);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setLocalImageUri(asset.uri);

    try {
      await uploadProfileImage({
        uri: asset.uri,
        name: asset.fileName ?? 'profile.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
      getMyProfile().then(setProfile).catch(() => {});
    } catch (error) {
      setLocalImageUri(null);
      Alert.alert('업로드 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.');
    }
  };

  const handleDeletePhoto = async () => {
    const previousLocalImageUri = localImageUri;
    setLocalImageUri(null);

    try {
      await deleteProfileImage();
      setProfile((prev) => (prev ? { ...prev, profileImageUrl: null } : prev));
    } catch (error) {
      setLocalImageUri(previousLocalImageUri);
      Alert.alert('삭제 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.');
    }
  };

    const handleUploadPortfolio = async () => {
    if (isUploadingPortfolio || !profile) return;

    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (result.canceled) return;

    const file = result.assets[0];
    if (file.size && file.size > MAX_PORTFOLIO_SIZE) {
      Alert.alert('파일 용량 초과', 'PDF 파일은 최대 20MB까지 업로드할 수 있어요.');
      return;
    }

     setIsUploadingPortfolio(true);
    try {
      // 1. POST — PDF 분석해서 요약 텍스트 받기
      const { summary } = await summarizePortfolio({ uri: file.uri, name: file.name });

      // 2. PUT — 받은 요약을 실제 프로필에 저장
      const updated = await updateProfile({
        name: profile.name,
        college: profile.college ?? '',
        major: profile.major ?? '',
        interestJobPrimary: profile.interestJobPrimary ?? '',
        interestJobSecondary: profile.interestJobSecondary ?? '',
        interestJobTertiary: profile.interestJobTertiary ?? '',
        portfolio: summary,
      });

      // 3. 화면 갱신
      setProfile(updated);
    } catch (error) {
      Alert.alert('업로드 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.');
    } finally {
      setIsUploadingPortfolio(false);
    }
  };

  const handlePressCamera = () => setPhotoSheetVisible(true);

  const ACTIVITIES = [
    { label: '지원 및 제안', count: applicationCount, icon: UserIcon, path: '/myApplications' },
    { label: '모집한 팀', count: myTeamCount, icon: FlagIcon, path: '/myteamLeader' },
    { label: '북마크', count: bookmarkCount, icon: Bookmark, path: '/myBookmarks' },
    { label: '팀원 평가', count: reviewableTeamCount, icon: Star, path: '/teamReview' },
  ] as const;

  const SETTINGS = [
    { label: '학교 인증', onPress: () => router.push('/schoolVerify') },
    { label: '비밀번호 변경', onPress: () => router.push('/pwchange') },
    {
      label: '로그아웃',
      onPress: () =>
        Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
          { text: '취소', style: 'cancel' },
          {
            text: '로그아웃',
            style: 'destructive',
            onPress: () => {
              clearTokens();
              useTeamRecStore.getState().reset();
              useAuthStore.getState().resetAuth();
              router.replace('/login');
            },
          },
        ]),
    },
  ];

  return (
    <>
      <ScrollView
        className="flex-1 bg-white"
        contentContainerClassName="px-5"
        contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}
      >
        <View className="flex-row justify-between items-center pt-20 pb-6">
          <TouchableOpacity onPress={() => router.push('/')}>
            <Image source={MypageMLogo} style={{ width: 32, height: 32 }} contentFit="contain" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/notification')}>
            <Image
              source={hasUnread ? NotificationNewDot : NotificationLine}
              style={{ width: 30, height: 30 }}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center mb-6">
          <View className="w-20 h-20">
            <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center overflow-hidden">
              {localImageUri || profile?.profileImageUrl ? (
                <Image
                  source={{ uri: localImageUri ?? profile?.profileImageUrl ?? undefined }}
                  style={{ width: 80, height: 80 }}
                  contentFit="cover"
                />
              ) : (
                <Image source={ProfileUser} style={{ width: 40, height: 40 }} contentFit="contain" />
              )}
            </View>
            <TouchableOpacity
              onPress={handlePressCamera}
              className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white border border-gray-300 items-center justify-center"
            >
              <Image
                source={require('@/assets/images/tool/cmr.png')}
                style={{ width: 10, height: 10 }}
                contentFit="contain"
              />
            </TouchableOpacity>
          </View>

          <View className="ml-6">
            <Text className="text-black text-3xl font-pretendard-semibold">{profile?.name ?? ''}</Text>
            <Text className="text-gray-700 font-pretendard text-lg">
              {profile?.schoolVerified ? `${univ ?? ''} ${profile?.major ?? ''} 재학생` : '재학생 인증 필요'}
            </Text>
            <Text className="text-gray-400 font-pretendard text-lg mt-0.5">
              희망직무 : {profile?.interestJobPrimary ?? ''}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/editprofile')}
          className="h-12 mb-8 rounded-xl border border-[#3E6AF4] bg-white justify-center items-center"
        >
          <Text className="text-[#3E6AF4] text-lg font-pretendard-semibold">회원정보 수정</Text>
        </TouchableOpacity>
                <View className="mb-8 p-5 rounded-2xl border border-gray-200">
                  <Text className="text-black text-xl font-pretendard-bold mb-4">협업온도</Text>
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-[#FF0000] text-3xl font-pretendard-bold">{profile?.collaborationTemperature ?? 0}°C</Text>
                    <Image source={HappyLine} style={{ width: 26, height: 26 }} contentFit="contain" />
                  </View>
                  <TemperatureBar value={profile?.collaborationTemperature ?? 0} max={100} />
                </View>

        {/* AI 포트폴리오 분석 리포트 카드 */}
    <View className="mb-8 rounded-2xl bg-white border border-[#D8E1FD] shadow-sm overflow-hidden">
      {/* 카드 상단 헤더 (Gradient 느낌의 Light Blue Background) */}
      <View className="p-4 bg-[#F5F7FF] border-b border-[#E8EEFF] flex-row justify-between items-center">
        <View className="flex-row items-center gap-2">
          <View className="w-6 h-6 rounded-full bg-[#3E6AF4]/10 items-center justify-center">
            <Text className="text-xs">✨</Text>
          </View>
          <Text className="text-black text-lg font-pretendard-bold">AI 포트폴리오 리포트</Text>
        </View>
      </View>

      {/* 본문 영역 */}
      {profile?.portfolio ? (
        <View className="p-5">
          {/* 1. 핵심 한 줄/한 단락 요약 (있는 경우 하이라이트 박스) */}
          {summaryText ? (
            <View className="mb-4 p-3.5 bg-[#F8FAFC] rounded-xl border-l-4 border-l-[#3E6AF4] border-y border-r border-gray-100">
              <Text className="text-[#3E6AF4] font-pretendard-bold text-xs mb-1">한 눈에 보는 역량</Text>
              <Text className="text-gray-800 font-pretendard-semibold text-sm leading-5">
                {summaryText}
              </Text>
            </View>
          ) : null}

          {/* 2. 주요 경력 & 실적 불렛 포인트 */}
          <Text className="text-gray-400 font-pretendard-bold text-xs mb-2.5 uppercase tracking-wider">
            Key Highlights
          </Text>
          
          <View className="gap-2.5">
            {(isExpanded ? bulletPoints : bulletPoints.slice(0, 2)).map((point, idx) => (
              <View key={idx} className="flex-row items-start gap-2">
                <Text className="text-[#3E6AF4] font-pretendard-bold text-sm mt-0.5">•</Text>
                <Text className="flex-1 text-gray-700 font-pretendard text-sm leading-5">
                  {point}
                </Text>
              </View>
            ))}
          </View>

          {/* 3. 더보기 / 접기 토글 버튼 */}
          {bulletPoints.length > 2 && (
            <TouchableOpacity
              onPress={() => setIsExpanded(!isExpanded)}
              className="mt-4 pt-3 border-t border-gray-100 flex-row justify-center items-center gap-1"
            >
              <Text className="text-gray-500 font-pretendard-semibold text-xs">
                {isExpanded ? '간략히 보기' : `주요 이력 ${bulletPoints.length - 2}개 더보기`}
              </Text>
              <Image
                source={Back}
                style={{
                  width: 10,
                  height: 10,
                  transform: [{ rotate: isExpanded ? '90deg' : '-90deg' }],
                }}
                contentFit="contain"
              />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* 포트폴리오 미등록 시 CTA */
        <TouchableOpacity
          onPress={handleUploadPortfolio}
          disabled={isUploadingPortfolio}
          className="p-6 items-center justify-center active:bg-gray-50"
        >
          {isUploadingPortfolio ? (
            <>
            <ActivityIndicator color="#3E6AF4" style={{marginBottom: 8 }} />
            <Text className="text-[#3E6AF4] font-pretendard-semibold text-base">
              AI가 포트폴리오를 분석하는 중...
            </Text>
            </>
          ) : (
          <>
            <Text className="text-[#3E6AF4] font-pretendard-semibold text-base mb-1">
              PDF 포트폴리오 업로드
            </Text>
            <Text className="text-gray-400 font-pretendard text-xs text-center">
              AI가 핵심 경력과 역량을 요약해 한눈에 보여드려요
            </Text>
          </>
          )}
        </TouchableOpacity>
      )}
    </View>

        <Text className="text-black text-xl font-pretendard-bold mb-3">내 활동</Text>
        <View className="flex-row flex-wrap gap-3 mb-8">
          {ACTIVITIES.map((activity) => (
            <TouchableOpacity
              key={activity.label}
              disabled={!activity.path}
              onPress={() => activity.path && router.push(activity.path)}
              style={{ width: '31.3%' }}
              className="items-center py-5 rounded-xl border border-gray-200"
            >
              <Image source={activity.icon} style={{ width: 22, height: 22 }} contentFit="contain" />
              <Text className="text-black font-pretendard-semibold mt-2 text-base">{activity.label}</Text>
              <Text className="text-black font-pretendard text-lg mt-0.5">{activity.count}건</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-black text-xl font-pretendard-bold mb-1">계정 설정</Text>

        <View className="border-t border-gray-100">
          {SETTINGS.map((setting, index) => {
            const isVerifiedSchoolAuth = setting.label === '학교 인증' && profile?.schoolVerified;
            return (
              <TouchableOpacity
                key={setting.label}
                onPress={setting.onPress}
                disabled={isVerifiedSchoolAuth}
                className={`flex-row justify-between items-center py-4 ${
                  index !== SETTINGS.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex-row items-center">
                  <Text className="text-black text-lg font-pretendard">{setting.label}</Text>
                  {isVerifiedSchoolAuth && (
                    <View className="ml-2 px-2 py-0.5 rounded-full bg-green-50">
                      <Text className="text-green-600 text-sm font-pretendard-semibold">인증 완료됨</Text>
                    </View>
                  )}
                </View>
                {!isVerifiedSchoolAuth && (
                  <Image
                    source={Back}
                    style={{ width: 14, height: 14, transform: [{ rotate: '180deg' }] }}
                    contentFit="contain"
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={photoSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoSheetVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPhotoSheetVisible(false)}
          className="flex-1 bg-black/40 justify-end px-2"
          style={{ paddingBottom: 8 + insets.bottom }}
        >
          <View onStartShouldSetResponder={() => true}>
            <View className="bg-[#F2F2F2] rounded-2xl overflow-hidden mb-2">
              <TouchableOpacity
                onPress={() => {
                  setPhotoSheetVisible(false);
                  handleChangePhoto();
                }}
                className="h-16 items-center justify-center"
              >
                <Text className="text-black text-lg font-pretendard">프로필 사진 변경</Text>
              </TouchableOpacity>

              <View className="h-[0.5px] bg-gray-300" />

              <TouchableOpacity
                onPress={() => {
                  setPhotoSheetVisible(false);
                  handleDeletePhoto();
                }}
                className="h-16 items-center justify-center"
              >
                <Text className="text-black text-lg font-pretendard">기본 이미지로 설정</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setPhotoSheetVisible(false)}
              className="h-16 items-center justify-center bg-[#F2F2F2] rounded-2xl"
            >
              <Text className="text-red-500 text-xl font-pretendard-semibold">취소</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}