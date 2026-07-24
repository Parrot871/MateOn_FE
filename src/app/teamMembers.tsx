import {
  AiServerError,
  ForbiddenAccessError,
  getRecommendedUsers,
  TeamEmbeddingNotReadyError,
  type UserRecommendation,
} from '@/api/team';
import { Back } from '@/assets/images/tool';
import MemberCandidateCard from '@/components/ui/MemberCandidateCard';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabKey = 'applicant' | 'ai';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'applicant', label: '지원자순' },
  { key: 'ai', label: 'AI 추천순' },
];

export default function TeamMembersScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabKey>('applicant');

  // AI 추천순
  const [aiCandidates, setAiCandidates] = useState<UserRecommendation[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [applicants, setApplicants] = useState<unknown[] | null>(null);
  const [applicantsError, setApplicantsError] = useState<string | null>(null);

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
    // TODO: 실제 지원자 목록 API 연결
    setApplicants([]);
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

          {applicants !== null && applicants.length === 0 && (
            <View className="pt-20 py-10 items-center justify-center bg-white rounded-3xl p-8 border border-gray-100">
              <View className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 justify-center items-center mb-3">
                <Text className="text-xl">📄</Text>
              </View>
              <Text className="text-gray-900 font-pretendard-bold text-lg mb-1">지원자 목록 기능은 준비 중이에요</Text>
              <Text className="text-gray-400 font-pretendard text-sm text-center">
                지원서 API 연결이 끝나면 여기에 표시돼요.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}