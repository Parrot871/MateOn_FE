import { getTeams, type TeamSummary } from '@/api/team';
import { Back } from '@/assets/images/tool';
import { MyTeamCard } from '@/components/ui/MyTeamCard';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RecruitingState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | { status: 'ready'; teams: TeamSummary[] };

export default function RecruitingTeamsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<RecruitingState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;

    const fetchRecruitingTeams = async () => {
      setState({ status: 'loading' });
      try {
        // 내가 생성/모집한 팀 목록 불러오기
        const teams = await getTeams({ myPosts: true });
        if (!isMounted) return;

        setState(
          teams.length > 0 ? { status: 'ready', teams } : { status: 'empty' }
        );
      } catch (err) {
        if (!isMounted) return;
        setState({
          status: 'error',
          message:
            err instanceof Error
              ? err.message
              : '모집한 팀 목록을 불러오지 못했어요.',
        });
      }
    };

    fetchRecruitingTeams();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* 1. 상단 네비게이션 헤더 */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1 -ml-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Image
            source={Back}
            style={{ width: 20, height: 20 }}
            contentFit="contain"
          />
        </TouchableOpacity>
        <Text className="text-black text-lg font-pretendard-bold">
          모집한 팀
        </Text>
        {/* 오른쪽 여백 밸런스용 빈 공간 */}
        <View className="w-6" />
      </View>

      {/* 2. 상태별 화면 렌더링 */}
      {state.status === 'loading' && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3E6AF4" />
        </View>
      )}

      {state.status === 'empty' && (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-gray-400 text-base font-pretendard-medium mb-1">
            아직 직접 모집한 팀이 없어요.
          </Text>
          <Text className="text-gray-300 text-sm font-pretendard">
            새로운 공모전 팀원을 모집해보세요!
          </Text>
        </View>
      )}

      {state.status === 'error' && (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-gray-500 font-pretendard-medium mb-2">
            {state.message}
          </Text>
        </View>
      )}

      {state.status === 'ready' && (
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 40 + insets.bottom,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* 전체 개수 안내 */}
          <Text className="text-gray-500 text-sm font-pretendard-medium mb-1">
            총 <Text className="text-blue-600 font-pretendard-bold">{state.teams.length}</Text>개
          </Text>

          {/* 3. 전체 카드 리스트 (모집중 우선 -> 마감일 임박 순 정렬) */}
          {state.teams
            .slice()
            .sort((a, b) => {
              if (a.isRecruiting !== b.isRecruiting) {
                return a.isRecruiting ? -1 : 1;
              }
              return (
                new Date(a.recruitmentEndDate).getTime() -
                new Date(b.recruitmentEndDate).getTime()
              );
            })
            .map((team) => (
              <MyTeamCard
                key={team.id}
                team={team}
                onPress={() =>
                  router.push({
                    pathname: '/teamDetail',
                    params: { teamId: team.id },
                  })
                }
              />
            ))}
        </ScrollView>
      )}
    </View>
  );
}