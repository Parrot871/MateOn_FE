import { createOrGetDmRoom } from '@/api/chat';
import {
  AiServerError,
  ForbiddenAccessError,
  getUserRecommendationReason,
  RecommendationNotFoundError,
} from '@/api/team';
import { getUserProfile, UserNotFoundError, type UserProfilePublic } from '@/api/user';
import { Back } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Chip({ label }: { label: string }) {
  return (
    <View className="bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5 mr-2 mb-2">
      <Text className="text-gray-600 text-xs font-pretendard-medium">{label}</Text>
    </View>
  );
}

function ChipGroup({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View className="mt-5">
      <Text className="text-gray-400 text-sm font-pretendard-semibold mb-2">{title}</Text>
      <View className="flex-row flex-wrap">
        {items.map((item, idx) => (
          <Chip key={`${item}-${idx}`} label={item} />
        ))}
      </View>
    </View>
  );
}

export default function TeamMembersDetailScreen() {
  const params = useLocalSearchParams<{
    teamId: string;
    userId: string;
    name: string;
    tagline: string;
    school: string;
    major: string;
    grade: string;
    experienceLevel: string;
    activityStyle: string;
    score: string;
    label: string;
    desiredRoles: string;
    skills: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const teamId = Number(params.teamId);
  const userId = Number(params.userId);

  // ── 프로필 API (신규) ──
  const [profile, setProfile] = useState<UserProfilePublic | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(userId)) return;
    let isMounted = true;
    setProfileLoading(true);
    setProfileError(null);

    getUserProfile(userId)
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err instanceof UserNotFoundError) {
          setProfileError('존재하지 않는 사용자예요.');
        } else {
          setProfileError('프로필 정보를 불러오지 못했어요.');
        }
      })
      .finally(() => {
        if (isMounted) setProfileLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // params는 AI 추천 진입 시에만 채워짐(score, label 등) → fallback으로만 사용
  // 나머지 필드는 profile(API)이 우선
  const name = profile?.name ?? params.name;
  const tagline = profile?.tagline ?? params.tagline;
  const school = profile?.school ?? params.school;
  const major = profile?.major ?? params.major;
  const grade = profile?.grade ?? params.grade;
  const experienceLevel = profile?.experienceLevel ?? params.experienceLevel;
  const activityStyle = profile?.activityStyle ?? params.activityStyle;
  const desiredRoles = profile?.desiredRoles ?? (params.desiredRoles ? params.desiredRoles.split(',').filter(Boolean) : []);
  const skills = profile?.skills ?? (params.skills ? params.skills.split(',').filter(Boolean) : []);

  // AI 추천 전용 필드는 params에만 존재 (지원자 경로로 오면 없음 → 배지 자체를 숨김)
  const scoreNumber = params.score ? Number(params.score) : null;
  const scorePercent = scoreNumber !== null ? Math.round(scoreNumber * 100) : null;

  const metaLine = [school, major, grade].filter(Boolean).join(' · ');

  const [detailReason, setDetailReason] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // AI 추천 이유는 score/label(AI 추천 진입)일 때만 의미가 있으니, 있을 때만 조회
  useEffect(() => {
    if (!params.teamId || !params.userId || !params.score) return;

    if (Number.isNaN(teamId) || Number.isNaN(userId)) {
      setDetailError('잘못된 요청이에요.');
      return;
    }

    let isMounted = true;
    setDetailLoading(true);
    setDetailError(null);

    getUserRecommendationReason({ teamId, userId })
      .then((reason) => {
        if (!isMounted) return;
        setDetailReason(reason);
      })
      .catch((error) => {
        if (!isMounted) return;
        if (error instanceof ForbiddenAccessError) {
          setDetailError('이 팀원의 추천 이유를 볼 수 있는 권한이 없어요.');
        } else if (error instanceof RecommendationNotFoundError) {
          setDetailError('추천 이유 정보를 찾을 수 없어요.');
        } else if (error instanceof AiServerError) {
          setDetailError('AI 서버가 잠시 응답하지 않고 있어요. 잠시 후 다시 시도해주세요.');
        } else {
          setDetailError('추천 상세 이유를 불러오지 못했어요.');
        }
      })
      .finally(() => {
        if (isMounted) setDetailLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [params.teamId, params.userId, params.score]);

  const [dmLoading, setDmLoading] = useState(false);

  const handleChat = async () => {
    if (Number.isNaN(userId) || dmLoading) return;
    setDmLoading(true);
    try {
      const room = await createOrGetDmRoom(userId);
      router.push({
        pathname: '/chatDetail',
        params: { roomId: String(room.roomId), title: name },
      });
    } catch (error) {
      Alert.alert('오류', '대화방을 여는 데 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setDmLoading(false);
    }
  };

  const handlePropose = () => {
    if (Number.isNaN(teamId) || Number.isNaN(userId)) return;
    router.push({
      pathname: '/teamProposal',
      params: { teamId: String(teamId), userId: String(userId), name },
    });
  };

  return (
    <View className="flex-1 bg-gray-50/60">
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
            후보 상세
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5"
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {profileLoading && !profile && (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator color="#2563eb" size="small" />
          </View>
        )}

        {profileError && (
          <View className="bg-white border border-gray-100/80 rounded-3xl p-5 mb-4">
            <Text className="text-gray-400 font-pretendard text-xs">{profileError}</Text>
          </View>
        )}

        {/* 기본 정보 카드 */}
        <View
          className="bg-white border border-gray-100/80 rounded-3xl p-5 mb-4"
          style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center">
                <Text className="text-black text-xl font-pretendard-bold">{name}</Text>
                {profile?.schoolVerified && (
                  <View className="ml-2 bg-blue-50 rounded-full px-2 py-0.5">
                    <Text className="text-blue-600 text-[10px] font-pretendard-bold">재학인증</Text>
                  </View>
                )}
              </View>
              {tagline && (
                <Text className="text-gray-500 text-sm font-pretendard-medium mt-1">{tagline}</Text>
              )}
              {metaLine.length > 0 && (
                <Text className="text-gray-400 text-sm font-pretendard-medium mt-1">{metaLine}</Text>
              )}
            </View>

            {scorePercent !== null && (
              <View className="bg-blue-50 rounded-full px-3 py-1.5">
                <Text className="text-blue-600 text-sm font-pretendard-bold">✨ AI 추천 {scorePercent}%</Text>
              </View>
            )}
          </View>

          {params.label && (
            <Text className="text-blue-500 text-sm font-pretendard-medium mt-2">
              AI 추천 이유: {params.label}
            </Text>
          )}

          {experienceLevel && (
            <View className="mt-4 pt-4 border-t border-gray-50 flex-row">
              <Text className="text-gray-400 text-sm font-pretendard-medium">경험 수준 : </Text>
              <Text className="text-gray-600 text-sm font-pretendard-semibold">{experienceLevel}</Text>
            </View>
          )}

          {activityStyle && (
            <View className="mt-1 flex-row">
              <Text className="text-gray-400 text-sm font-pretendard-medium">활동 스타일 : </Text>
              <Text className="text-gray-600 text-sm font-pretendard-semibold">{activityStyle}</Text>
            </View>
          )}

          {/* 협업 온도 — 리뷰 2건 미만이면 null, "0"과 구분해서 안내 */}
          {profile && (
            <View className="mt-1 flex-row">
              <Text className="text-gray-400 text-sm font-pretendard-medium">협업 온도 : </Text>
              {profile.collaborationTemperature !== null ? (
                <Text className="text-gray-600 text-sm font-pretendard-semibold">
                  {profile.collaborationTemperature}° ({profile.collaborationReviewCount}건 평가)
                </Text>
              ) : (
                <Text className="text-gray-400 text-sm font-pretendard-medium">
                  아직 평가가 부족해요 ({profile.collaborationReviewCount}/2건)
                </Text>
              )}
            </View>
          )}

          <ChipGroup title="희망 역할" items={desiredRoles} />
          <ChipGroup title="보유 기술" items={skills} />
        </View>

        {/* 참여 활동 이력 (신규) */}
        {profile && profile.participatedActivities.length > 0 && (
          <View
            className="bg-white border border-gray-100/80 rounded-3xl p-5 mb-4"
            style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}
          >
            <Text className="text-black text-base font-pretendard-bold mb-3">참여 활동</Text>
            {profile.participatedActivities.map((activity) => (
              <View key={activity.id} className="flex-row items-center mb-2">
                <View className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2" />
                <Text className="text-gray-600 text-sm font-pretendard-medium">
                  {activity.title} · {activity.category}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 추천 상세 이유 섹션 — AI 추천 경로일 때만 표시 */}
        {params.score && (
          <View
            className="bg-white border border-gray-100/80 rounded-3xl p-5"
            style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}
          >
            <Text className="text-black text-base font-pretendard-bold mb-3">추천 상세 이유</Text>

            {detailLoading ? (
              <View className="py-8 items-center justify-center">
                <ActivityIndicator color="#2563eb" size="small" />
              </View>
            ) : detailError ? (
              <Text className="text-gray-400 font-pretendard text-xs">{detailError}</Text>
            ) : detailReason ? (
              <Text className="text-gray-600 text-base font-pretendard-medium leading-6">{detailReason}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* 하단 액션 버튼 — 본인 프로필이면 숨김 */}
      {!profile?.isMe && (
        <View
          className="flex-row bg-white border-t border-gray-100 px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <TouchableOpacity
            onPress={handleChat}
            disabled={dmLoading}
            className="flex-1 mr-2 border border-blue-200 rounded-2xl py-3.5 items-center justify-center"
          >
            {dmLoading ? (
              <ActivityIndicator color="#2563eb" size="small" />
            ) : (
              <Text className="text-blue-600 font-pretendard-bold text-sm">1대1 대화하기</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePropose}
            className="flex-1 ml-2 bg-blue-600 rounded-2xl py-3.5 items-center justify-center"
          >
            <Text className="text-white font-pretendard-bold text-base">제안하기</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}