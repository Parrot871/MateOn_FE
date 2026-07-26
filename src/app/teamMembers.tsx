import {
  getTeamApplications,
  OfferForbiddenError,
  ProposalNotFoundError,
  respondToApplication,
  type Application,
  type ApplicationStatus,
} from '@/api/apply';
import {
  AiServerError,
  ForbiddenAccessError,
  getRecommendedUsers,
  TeamEmbeddingNotReadyError,
  type UserRecommendation,
} from '@/api/team';
import { Back } from '@/assets/images/tool';
import MemberCandidateCard from '@/components/ui/MemberCandidateCard';
import { getUnivByEmail } from '@/utils/univ';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabKey = 'applicant' | 'ai';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'applicant', label: '지원자순' },
  { key: 'ai', label: 'AI 추천순' },
];

const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  REJECTED: '거절됨',
};

const APPLICATION_STATUS_STYLE: Record<ApplicationStatus, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-600' },
  APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  REJECTED: { bg: 'bg-red-50', text: 'text-red-500' },
};

function ApplicantAvatar() {
  return <View className="w-12 h-12 rounded-full bg-gray-200" />;
}

export default function TeamMembersScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabKey>('applicant');

  // AI 추천순
  const [aiCandidates, setAiCandidates] = useState<UserRecommendation[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // 지원자순
  const [applicants, setApplicants] = useState<Application[] | null>(null);
  const [applicantsError, setApplicantsError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  const loadAiCandidates = useCallback(() => {
    if (!teamId) return;
    setAiError(null);
    getRecommendedUsers({ teamId: Number(teamId) })
      .then(setAiCandidates)
      .catch((err) => {
        console.error('AI 추천 목록 조회 실패:', err);
        if (err instanceof TeamEmbeddingNotReadyError) {
          setAiError('팀 정보가 아직 준비 중이에요. 잠시 후 다시 시도해주세요.');
        } else if (err instanceof ForbiddenAccessError) {
          setAiError('이 팀의 팀장만 추천을 볼 수 있어요.');
        } else if (err instanceof AiServerError) {
          setAiError('추천 서버에 문제가 생겼어요. 잠시 후 다시 시도해주세요.');
        } else {
          setAiError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
        }
      });
  }, [teamId]);

  const loadApplicants = useCallback(() => {
    if (!teamId) return;
    setApplicantsError(null);
    getTeamApplications(Number(teamId))
      .then(setApplicants)
      .catch((err) => {
        console.error('지원자 목록 조회 실패:', err);
        if (err instanceof OfferForbiddenError) {
          setApplicantsError('이 팀의 팀장만 지원자 목록을 볼 수 있어요.');
        } else if (err instanceof ProposalNotFoundError) {
          setApplicantsError('팀 정보를 찾을 수 없어요.');
        } else {
          setApplicantsError(err instanceof Error ? err.message : '지원자 목록을 불러오지 못했습니다.');
        }
      });
  }, [teamId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (activeTab === 'ai') {
        loadAiCandidates();
      } else {
        loadApplicants();
      }

      return () => {
        active = false;
      };
    }, [activeTab, loadAiCandidates, loadApplicants])
  );

  function handlePressCandidate(item: UserRecommendation) {
  router.push({
    pathname: '/teamMembersDetail',
    params: {
      teamId: String(teamId),
      userId: String(item.userId),
      name: item.name,
      school: item.school,
      major: item.major,
      grade: String(item.grade),
      experienceLevel: item.experienceLevel,
      activityStyle: item.activityStyle,
      score: String(item.score),
      label: item.label,
      tagline: item.tagline,
      desiredRoles: item.desiredRoles?.join(','),
      skills: item.skills?.join(','),
    },
  });
}

  function handleRespondApplication(application: Application, isApproved: boolean) {
    Alert.alert(
      isApproved ? '지원 승인' : '지원 거절',
      isApproved
        ? `${application.applicant.name}님의 지원을 승인할까요?`
        : `${application.applicant.name}님의 지원을 거절할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: isApproved ? '승인하기' : '거절하기',
          style: isApproved ? 'default' : 'destructive',
          onPress: async () => {
            setRespondingId(application.applicationId);
            try {
              await respondToApplication(application.applicationId, isApproved);
              setApplicants((prev) =>
                prev
                  ? prev.map((a) =>
                      a.applicationId === application.applicationId
                        ? { ...a, status: isApproved ? 'APPROVED' : 'REJECTED' }
                        : a,
                    )
                  : prev,
              );
            } catch (err) {
              if (err instanceof OfferForbiddenError) {
                Alert.alert('권한 없음', '이 팀의 팀장만 처리할 수 있어요.');
              } else if (err instanceof ProposalNotFoundError) {
                Alert.alert('알림', '지원서 정보를 찾을 수 없어요.');
              } else {
                Alert.alert('오류', '처리에 실패했어요. 잠시 후 다시 시도해주세요.');
              }
            } finally {
              setRespondingId(null);
            }
          },
        },
      ],
    );
  }

  return (
    <View className="flex-1 bg-gray-50/60">
      {/* Header & Tabs */}
      <View className="bg-white border-b border-gray-200">
        <View
          className="px-5 flex-row items-center justify-between"
          style={{ paddingTop: Math.max(insets.top, 16) + 6, paddingBottom: 14 }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="w-8 h-8 justify-center items-start"
          >
            <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
          </TouchableOpacity>
          <Text className="text-black text-2xl font-pretendard-bold flex-1 text-center mr-8">
            팀원 찾기
          </Text>
        </View>

        <View className="flex-row px-6 pt-3">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className="mr-6 pb-3"
                style={{ borderBottomWidth: 2, borderBottomColor: isActive ? '#3E6AF4' : 'transparent' }}
              >
                <Text
                  className={`text-lg ${
                    isActive ? 'text-[#3E6AF4] font-pretendard-bold' : 'text-gray-400 font-pretendard-medium'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {activeTab === 'ai' ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-5"
          contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {aiCandidates && aiCandidates.length > 0 && (
            <View className="mb-3 flex-row items-center justify-between px-1">
              <Text className="text-[12px] font-pretendard-medium text-gray-400">
                총 <Text className="text-blue-600 font-pretendard-bold">{aiCandidates.length}</Text>명의 추천 후보
              </Text>
            </View>
          )}

          {aiCandidates === null && !aiError && (
            <View className="py-24 items-center justify-center">
              <ActivityIndicator color="#2563eb" size="small" />
              <Text className="text-gray-400 font-pretendard text-xs mt-3">추천 후보를 불러오는 중...</Text>
            </View>
          )}

          {aiError && (
            <View className="py-16 items-center justify-center bg-white rounded-3xl p-6 border border-gray-100">
              <Text className="text-gray-800 font-pretendard-semibold text-sm mb-1">목록을 불러오지 못했습니다</Text>
              <Text className="text-gray-400 font-pretendard text-xs text-center">{aiError}</Text>
            </View>
          )}

          {aiCandidates !== null && aiCandidates.length === 0 && (
            <View className="pt-20 py-10 items-center justify-center bg-white rounded-3xl p-8 border border-gray-100">
              <View className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 justify-center items-center mb-3">
                <Text className="text-xl">✨</Text>
              </View>
              <Text className="text-gray-900 font-pretendard-bold text-lg mb-1">아직 추천할 후보가 없어요</Text>
              <Text className="text-gray-400 font-pretendard text-sm text-center">
                조건에 맞는 유저가 생기면 여기에 표시돼요.
              </Text>
            </View>
          )}

          {aiCandidates?.map((item) => (
            <MemberCandidateCard
              key={item.userId}
              name={item.name}
              school={item.school}
              major={item.major}
              grade={item.grade}
              desiredRoles={item.desiredRoles}
              experienceLevel={item.experienceLevel}
              activityStyle={item.activityStyle}
              tagline={item.tagline}
              score={item.score}
              label={item.label}
              onPress={() => handlePressCandidate(item)}
            />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-5"
          contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {applicants && applicants.length > 0 && (
            <View className="mb-3 flex-row items-center justify-between px-1">
              <Text className="text-[12px] font-pretendard-medium text-gray-400">
                총 <Text className="text-blue-600 font-pretendard-bold">{applicants.length}</Text>명의 지원자
              </Text>
            </View>
          )}

          {applicants === null && !applicantsError && (
            <View className="py-24 items-center justify-center">
              <ActivityIndicator color="#2563eb" size="small" />
              <Text className="text-gray-400 font-pretendard text-xs mt-3">지원자 목록을 불러오는 중...</Text>
            </View>
          )}

          {applicantsError && (
            <View className="py-16 items-center justify-center bg-white rounded-3xl p-6 border border-gray-100">
              <Text className="text-gray-800 font-pretendard-semibold text-sm mb-1">목록을 불러오지 못했습니다</Text>
              <Text className="text-gray-400 font-pretendard text-xs text-center">{applicantsError}</Text>
            </View>
          )}

          {applicants !== null && applicants.length === 0 && !applicantsError && (
            <View className="pt-20 py-10 items-center justify-center bg-white rounded-3xl p-8 border border-gray-100">
              <View className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 justify-center items-center mb-3">
                <Text className="text-xl">📄</Text>
              </View>
              <Text className="text-gray-900 font-pretendard-bold text-lg mb-1">아직 지원자가 없어요</Text>
              <Text className="text-gray-400 font-pretendard text-sm text-center">
                지원서가 도착하면 여기에 표시돼요.
              </Text>
            </View>
          )}

          {applicants?.map((application) => {
            const statusStyle = APPLICATION_STATUS_STYLE[application.status];
            const univ = getUnivByEmail(application.applicant?.email);
            return (
              <View
                key={application.applicationId}
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
              >
                <View className="flex-row items-center">
                  <ApplicantAvatar />
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-900 text-base font-pretendard-bold">
                      {application.applicant?.name}
                    </Text>
                    <Text className="text-gray-400 text-sm mt-0.5">
                      {[univ, application.applicant?.major].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <View className={`${statusStyle.bg} rounded-lg px-2.5 py-1`}>
                    <Text className={`${statusStyle.text} text-xs font-pretendard-bold`}>
                      {APPLICATION_STATUS_LABEL[application.status]}
                    </Text>
                  </View>
                </View>

                {!!application.introduction && (
                  <Text className="text-gray-700 text-sm mt-3 leading-5" numberOfLines={3}>
                    {application.introduction}
                  </Text>
                )}
                {!!application.message && (
                  <Text className="text-gray-500 text-sm mt-1.5 leading-5" numberOfLines={3}>
                    {application.message}
                  </Text>
                )}

                {application.status === 'PENDING' && (
                  <View className="flex-row gap-2 mt-3.5">
                    <TouchableOpacity
                      onPress={() => handleRespondApplication(application, false)}
                      disabled={respondingId === application.applicationId}
                      className="flex-1 border border-gray-200 rounded-xl py-2.5 items-center"
                    >
                      {respondingId === application.applicationId ? (
                        <ActivityIndicator color="#9CA3AF" size="small" />
                      ) : (
                        <Text className="text-gray-500 text-sm font-pretendard-bold">거절</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRespondApplication(application, true)}
                      disabled={respondingId === application.applicationId}
                      className="flex-1 bg-[#3E6AF4] rounded-xl py-2.5 items-center"
                    >
                      {respondingId === application.applicationId ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text className="text-white text-sm font-pretendard-bold">승인</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}