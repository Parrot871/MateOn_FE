import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTeamDetail, type TeamDetail } from '@/api/team';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: TeamDetail };

export default function TeamDetailScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const router = useRouter();

  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setState({ status: 'loading' });
      try {
        const data = await getTeamDetail(Number(teamId));
        if (!mounted) return;
        setState({ status: 'ready', data });
      } catch (err) {
        if (!mounted) return;
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : '불러오지 못했어요.',
        });
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [teamId]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* 상단 헤더 */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-start justify-center -ml-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-2xl text-gray-800">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-pretendard-bold text-gray-900">
          팀 정보
        </Text>
        {/* 우측 대칭을 위한 빈 영역 */}
        <View className="w-10" />
      </View>

      {state.status === 'loading' && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4F46E5" size="large" />
        </View>
      )}

      {state.status === 'error' && (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-gray-500 font-pretendard-medium text-center">
            {state.message}
          </Text>
        </View>
      )}

      {state.status === 'ready' && (
        <TeamDetailContent data={state.data} teamId={teamId} router={router} />
      )}
    </SafeAreaView>
  );
}

function Avatar() {
  return <View className="w-12 h-12 rounded-full bg-gray-200" />;
}

function TeamDetailContent({
  data,
  teamId,
  router,
}: {
  data: TeamDetail;
  teamId: string;
  router: ReturnType<typeof useRouter>;
}) {
  const additionalMembers = data.currentMemberCount - 1;

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 특성 태그 */}
        {!!data.characteristic && (
          <View className="self-start bg-indigo-50 rounded-lg px-2.5 py-1 mb-3">
            <Text className="text-indigo-600 text-xs font-pretendard-bold">
              #{data.characteristic}
            </Text>
          </View>
        )}

        {/* 제목 */}
        <Text className="text-gray-900 text-2xl font-pretendard-bold leading-9 mb-5">
          {data.title}
        </Text>

        {/* 팀장 정보 (+ 협업 온도) */}
        <View className="flex-row items-center mb-6 bg-gray-50 p-3.5 rounded-2xl">
          <Avatar />
          <View className="ml-3.5 flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-gray-900 text-base font-pretendard-bold">
                {data.leaderName}
              </Text>
              <View className="bg-indigo-100 px-2 py-0.5 rounded">
                <Text className="text-indigo-600 text-[11px] font-pretendard-bold">
                  팀장
                </Text>
              </View>
            </View>
            <Text className="text-gray-500 text-xs mt-1">
              {data.leaderCollege} · {data.leaderMajor}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-gray-400 text-xs font-pretendard-medium mb-0.5">
              협업 온도
            </Text>
            <Text className="text-indigo-600 text-base font-pretendard-bold">
              {data.leaderCollaborationTemperature}°C
            </Text>
          </View>
        </View>

        {/* 주요 요약 정보 (카드 스타일) */}
        <View className="flex-row bg-slate-50 rounded-2xl p-4 mb-7 justify-between items-center">
          <View className="flex-1 items-center">
            <Text className="text-gray-400 text-xs font-pretendard-medium mb-1">모집 인원</Text>
            <Text className="text-gray-900 text-base font-pretendard-bold">
              {data.capacity}명
            </Text>
          </View>
          <View className="w-[1px] h-6 bg-gray-200" />
          <View className="flex-1 items-center">
            <Text className="text-gray-400 text-xs font-pretendard-medium mb-1">모집 시작</Text>
            <Text className="text-gray-900 text-base font-pretendard-bold">
              {data.recruitmentStartDate.replaceAll('-', '.')}
            </Text>
          </View>
          <View className="w-[1px] h-6 bg-gray-200" />
          <View className="flex-1 items-center">
            <Text className="text-gray-400 text-xs font-pretendard-medium mb-1">모집 마감</Text>
            <Text className="text-gray-900 text-base font-pretendard-bold">
              {data.recruitmentEndDate.replaceAll('-', '.')}
            </Text>
          </View>
        </View>

        {/* 팀 소개 */}
        <View className="mb-7">
          <Text className="text-gray-900 text-base font-pretendard-bold mb-2.5">
            팀 소개
          </Text>
          <Text className="text-gray-700 text-sm leading-6 font-pretendard-regular">
            {data.promotionText}
          </Text>
        </View>

        {/* 모집 역할 */}
        <View className="mb-7">
          <Text className="text-gray-900 text-base font-pretendard-bold mb-3">
            모집 역할
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {data.role.map((r) => (
              <View key={r} className="bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-2">
                <Text className="text-indigo-600 text-sm font-pretendard-bold">
                  {r}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 요구 기술 */}
        {data.requiredSkills.length > 0 && (
          <View className="mb-7">
            <Text className="text-gray-900 text-base font-pretendard-bold mb-3">
              요구 기술
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {data.requiredSkills.map((skill) => (
                <View key={skill} className="bg-gray-100 rounded-xl px-3.5 py-2">
                  <Text className="text-gray-700 text-sm font-pretendard-medium">
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 팀원 현황 */}
        <View className="border-t border-gray-100 pt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-900 text-base font-pretendard-bold">
              팀원 현황 <Text className="text-indigo-600">{data.currentMemberCount}</Text>/{data.capacity}
            </Text>
            <View
              className={
                data.recruiting
                  ? 'bg-emerald-50 rounded-full px-3 py-1'
                  : 'bg-gray-100 rounded-full px-3 py-1'
              }
            >
              <Text
                className={
                  data.recruiting
                    ? 'text-emerald-600 text-xs font-pretendard-bold'
                    : 'text-gray-400 text-xs font-pretendard-bold'
                }
              >
                {data.recruiting ? '모집 중' : '모집 마감'}
              </Text>
            </View>
          </View>

          {/* 팀장 목록 아이템 */}
          <View className="flex-row items-center py-2">
            <Avatar />
            <View className="ml-3 flex-1">
              <Text className="text-gray-900 text-sm font-pretendard-bold">
                {data.leaderName}
              </Text>
              <Text className="text-gray-400 text-xs mt-0.5">
                {data.leaderCollege} · {data.leaderMajor}
              </Text>
            </View>
            <View className="bg-gray-100 rounded-lg px-2.5 py-1">
              <Text className="text-gray-600 text-xs font-pretendard-medium">
                팀장
              </Text>
            </View>
          </View>

          {/* 그 외 팀원 */}
          {additionalMembers > 0 && (
            <View className="mt-2 bg-gray-50 rounded-xl p-3 items-center">
              <Text className="text-gray-500 text-xs font-pretendard-medium">
                외 팀원 {additionalMembers}명이 참여 중이에요
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View className="px-5 pt-3 pb-6 border-t border-gray-100 bg-white">
        {data.leader ? (
          data.recruiting ? (
            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-indigo-600 rounded-xl py-4 items-center"
              onPress={() => router.push(`/teamMembers?teamId=${teamId}`)}
            >
              <Text className="text-white font-pretendard-bold text-base">
                팀원 찾기 시작
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="bg-gray-100 rounded-xl py-4 items-center">
              <Text className="text-gray-400 font-pretendard-bold text-base">
                모집이 완료됐어요
              </Text>
            </View>
          )
        ) : data.hasApplied ? (
          <View className="bg-gray-100 rounded-xl py-4 items-center">
            <Text className="text-gray-400 font-pretendard-bold text-base">
              지원 완료
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-indigo-600 rounded-xl py-4 items-center"
            disabled={!data.recruiting}
            style={{ opacity: data.recruiting ? 1 : 0.4 }}
            onPress={() => router.push(`/teamApply?teamId=${teamId}`)}
          >
            <Text className="text-white font-pretendard-bold text-base">
              {data.recruiting ? '지원하기' : '모집이 마감됐어요'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}