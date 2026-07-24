import {
  AiServerError,
  ForbiddenAccessError,
  getUserRecommendationReason,
  RecommendationNotFoundError,
} from '@/api/team';
import { Back } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
      <Text className="text-gray-400 text-xs font-pretendard-semibold mb-2">{title}</Text>
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

  const desiredRoles = params.desiredRoles ? params.desiredRoles.split(',').filter(Boolean) : [];
  const skills = params.skills ? params.skills.split(',').filter(Boolean) : [];
  const scoreNumber = params.score ? Number(params.score) : null;
  const scorePercent = scoreNumber !== null ? Math.round(scoreNumber * 100) : null;
  const metaLine = [params.school, params.major, params.grade].filter(Boolean).join(' · ');

  const [detailReason, setDetailReason] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.teamId || !params.userId) return;

    const teamId = Number(params.teamId);
    const userId = Number(params.userId);

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
  }, [params.teamId, params.userId]);

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
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* 기본 정보 카드 */}
        <View
          className="bg-white border border-gray-100/80 rounded-3xl p-5 mb-4"
          style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-black text-xl font-pretendard-bold">{params.name}</Text>
              {params.tagline && (
                <Text className="text-gray-500 text-sm font-pretendard-medium mt-1">
                  {params.tagline}
                </Text>
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
            <Text className="text-blue-500 text-xs font-pretendard-medium mt-2">
              AI 추천 이유: {params.label}
            </Text>
          )}

          {params.experienceLevel && (
            <View className="mt-4 pt-4 border-t border-gray-50 flex-row">
              <Text className="text-gray-400 text-xs font-pretendard-medium">경험 수준 : </Text>
              <Text className="text-gray-600 text-xs font-pretendard-semibold">{params.experienceLevel}</Text>
            </View>
          )}

          {params.activityStyle && (
            <View className="mt-1 flex-row">
              <Text className="text-gray-400 text-xs font-pretendard-medium">활동 스타일 : </Text>
              <Text className="text-gray-600 text-xs font-pretendard-semibold">{params.activityStyle}</Text>
            </View>
          )}

          <ChipGroup title="희망 역할" items={desiredRoles} />
          <ChipGroup title="보유 기술" items={skills} />
        </View>

        {/* 추천 상세 이유 섹션 */}
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
            <Text className="text-gray-600 text-sm font-pretendard-medium leading-5">{detailReason}</Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}