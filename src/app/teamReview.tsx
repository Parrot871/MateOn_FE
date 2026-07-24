// src/app/teamReview.tsx
import { getMyApplications } from '@/api/apply';
import { getMyTeams, getTeamReviewTargets, submitTeamReviews, type TeamReviewTargets } from '@/api/team';
import { Back, FilledStar, Star, UserIcon } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Text, TouchableOpacity, View } from 'react-native';

const QUESTIONS = [
  { key: 'contribution', label: '프로젝트에 얼마나 기여했나요?' },
  { key: 'diligence', label: '프로젝트에 성실히 참여했나요?' },
  { key: 'respect', label: '다른 팀원들을 존중하며 소통했나요?' },
] as const;

type QuestionKey = (typeof QUESTIONS)[number]['key'];
type Ratings = Record<QuestionKey, number>;
const EMPTY_RATINGS: Ratings = { contribution: 0, diligence: 0, respect: 0 };

// 테스트용 더미 팀 — 실제 API 없이 UI 흐름만 확인할 때 사용. teamId를 음수로 둬서 실서버 팀과 절대 겹치지 않게 한다.
const DUMMY_TEAM: TeamReviewTargets = {
  teamId: -1,
  teamTitle: '[더미] IT 서비스 기획 공고전 팀원 모집',
  endedAt: new Date().toISOString(),
  reviewDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  targets: [
    { userId: -1, name: '김단국', major: '단국대학교 소프트웨어학과', alreadyReviewed: false },
    { userId: -2, name: '김루미', major: '서울대학교 의학과', alreadyReviewed: false },
  ],
};

function StarRating({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <View className="flex-row gap-3">
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
          <Image source={n <= value ? FilledStar : Star} style={{ width: 28, height: 28 }} contentFit="contain" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function TeamReviewScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [teams, setTeams] = useState<TeamReviewTargets[]>([]);

  const [activeTeam, setActiveTeam] = useState<TeamReviewTargets | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ratingsByTarget, setRatingsByTarget] = useState<Record<number, Ratings>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeams = () => {
    return Promise.all([
      getMyApplications().catch(() => []),
      getMyTeams().catch(() => []),
    ])
      .then(async ([applications, myTeams]) => {
        // 내가 지원해 합류한(APPROVED) 팀 + 내가 리더로 모집한 팀 모두 평가 대상 후보로 합친다.
        const teamIds = Array.from(
          new Set([
            ...applications.filter((a) => a.status === 'APPROVED').map((a) => a.teamId),
            ...myTeams.map((t) => t.id),
          ])
        );

        const results = await Promise.all(
          teamIds.map((id) =>
            getTeamReviewTargets(id)
              .then((data) => ({ ok: true as const, data }))
              .catch(() => ({ ok: false as const }))
          )
        );

        // 활동이 아직 종료되지 않은 팀은 reviews/targets 조회 자체가 실패하므로,
        // success=true로 응답한(=종료된) 팀만 남긴다.
        const reviewable = results
          .filter((r): r is { ok: true; data: TeamReviewTargets } => r.ok)
          .map((r) => r.data);

        setTeams(reviewable);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  };

  const loadTeams = () => {
    setStatus('loading');
    fetchTeams();
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const openTeam = (team: TeamReviewTargets) => {
    setActiveTeam(team);
    setActiveIndex(0);
    setRatingsByTarget({});
    setShowIntro(true);
  };

  const closeFlow = () => {
    setActiveTeam(null);
    setShowIntro(false);
  };

  const currentTarget = activeTeam?.targets[activeIndex] ?? null;
  const isFirstTarget = activeIndex === 0;
  const isLastTarget = activeTeam ? activeIndex === activeTeam.targets.length - 1 : false;
  const currentRatings = currentTarget ? ratingsByTarget[currentTarget.userId] ?? EMPTY_RATINGS : EMPTY_RATINGS;
  const canProceed = currentRatings.contribution > 0 && currentRatings.diligence > 0 && currentRatings.respect > 0;

  const setCurrentRating = (key: QuestionKey, value: number) => {
    if (!currentTarget) return;
    setRatingsByTarget((prev) => ({
      ...prev,
      [currentTarget.userId]: { ...(prev[currentTarget.userId] ?? EMPTY_RATINGS), [key]: value },
    }));
  };

  const handlePrev = () => {
    if (isFirstTarget) return;
    setActiveIndex((i) => i - 1);
  };

  const handleNext = async () => {
    if (!activeTeam || !currentTarget || !canProceed) return;

    if (isLastTarget) {
      const reviews = activeTeam.targets.map((target) => {
        const r = ratingsByTarget[target.userId] ?? EMPTY_RATINGS;
        return {
          revieweeId: target.userId,
          rating: Math.round((r.contribution + r.diligence + r.respect) / 3),
        };
      });

      if (activeTeam.teamId === DUMMY_TEAM.teamId) {
        // 더미 팀은 실제 서버로 제출하지 않고 UI 흐름만 확인한다.
        closeFlow();
        Alert.alert('평가 완료 (더미)', '실제 서버에는 제출되지 않았어요.');
        return;
      }

      setIsSubmitting(true);
      try {
        await submitTeamReviews(activeTeam.teamId, reviews);
        closeFlow();
        Alert.alert('평가 완료', '팀원 평가가 제출됐어요.');
        loadTeams();
      } catch (error) {
        Alert.alert(
          '오류',
          error instanceof Error ? error.message : '평가 제출에 실패했어요. 잠시 후 다시 시도해주세요.'
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setActiveIndex((i) => i + 1);
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-6 pt-20 pb-10">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
        </TouchableOpacity>
        <Text className="text-black text-2xl font-pretendard-bold">팀원 평가</Text>
        <View style={{ width: 26, height: 26 }} />
      </View>

      {status === 'error' && (
        <View className="px-5 pb-3">
          <Text className="text-gray-400 text-xs font-pretendard">목록을 불러오지 못했어요.</Text>
        </View>
      )}

      {status === 'loading' ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#3E6AF4" />
        </View>
      ) : (
        <View className="px-5 gap-3">
          {[DUMMY_TEAM, ...teams].map((team) => {
            const needsReview = team.targets.some((t) => !t.alreadyReviewed);
            return (
              <TouchableOpacity
                key={team.teamId}
                disabled={!needsReview}
                onPress={() => openTeam(team)}
                className="px-4 py-4 rounded-xl border border-gray-200 flex-row items-center justify-between"
                style={{ opacity: needsReview ? 1 : 0.5 }}
              >
                <View className="flex-1 pr-3">
                  <Text className="text-black font-pretendard-bold text-xl mb-1" numberOfLines={1}>
                    {team.teamTitle}
                  </Text>
                  <Text className="text-gray-400 text-sm font-pretendard">
                    {team.endedAt.slice(0, 10).replaceAll('-', '.')} 종료
                  </Text>
                </View>
                <Text
                  className={`text-base font-pretendard-semibold ${needsReview ? 'text-[#3E6AF4]' : 'text-gray-400'}`}
                >
                  {needsReview ? '평가하기' : '평가완료'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* 종료 안내 팝업 (얼럿 서식) */}
      <Modal visible={showIntro} transparent animationType="fade" onRequestClose={closeFlow}>
        <View className="flex-1 bg-black/40 items-center justify-center px-12">
          <View className="bg-gray-100 rounded-2xl overflow-hidden w-full">
            <View className="px-5 pt-5 pb-6 items-center">
              <Text className="text-black text-lg font-pretendard-bold text-center leading-6 mb-2">
                팀장이 [{activeTeam?.teamTitle}]{'\n'}프로젝트를 종료했습니다.
              </Text>
              <Text className="text-gray-600 text-base font-pretendard text-center leading-5">
                팀원들에 대한 평가를 남겨주세요.
              </Text>
            </View>
            <View className="h-[1px] bg-gray-300" />
            <TouchableOpacity onPress={() => setShowIntro(false)} className="py-3.5 items-center">
              <Text className="text-[#3E6AF4] font-pretendard-bold text-lg">확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 팀원별 평가 카드 */}
      <Modal visible={!showIntro && !!activeTeam} transparent animationType="fade" onRequestClose={closeFlow}>
        <View className="flex-1 bg-black/40 items-center justify-center px-8">
          {currentTarget && (
            <View className="bg-white rounded-2xl px-6 pt-6 pb-4 w-full">
              <View className="items-center mb-6">
                <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
                  <Image source={UserIcon} style={{ width: 32, height: 32 }} contentFit="contain" />
                </View>
                <Text className="text-black text-xl font-pretendard-bold">{currentTarget.name}</Text>
                <Text className="text-gray-400 text-sm font-pretendard mt-0.5">{currentTarget.major}</Text>
              </View>

              <View className="gap-5 mb-6">
                {QUESTIONS.map((q) => (
                  <View key={q.key} className="items-center gap-2">
                    <Text className="text-gray-700 text-base font-pretendard-medium">{q.label}</Text>
                    <StarRating value={currentRatings[q.key]} onChange={(value) => setCurrentRating(q.key, value)} />
                  </View>
                ))}
              </View>

              <View className="flex-row items-center pt-4 border-t border-gray-300">
                <TouchableOpacity
                  onPress={handlePrev}
                  disabled={isFirstTarget || isSubmitting}
                  style={{ opacity: isFirstTarget ? 0.3 : 1 }}
                  className="flex-1 items-center"
                >
                  <Text className="text-gray-500 font-pretendard-bold text-lg">이전</Text>
                </TouchableOpacity>

                <View className="w-[1px] h-6 bg-gray-300" />

                <TouchableOpacity
                  onPress={handleNext}
                  disabled={!canProceed || isSubmitting}
                  style={{ opacity: canProceed ? 1 : 0.4 }}
                  className="flex-1 items-center"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#3E6AF4" />
                  ) : (
                    <Text className="text-[#3E6AF4] font-pretendard-bold text-lg">
                      {isLastTarget ? '완료' : '다음'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
