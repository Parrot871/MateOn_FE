import type { EventItem } from '@/api/events';
import { getMyNotifications } from '@/api/notification';
import { getMyTeams, type TeamPost } from '@/api/team';
import { NotificationLine } from '@/assets/icons';
import { MypageMLogo, NotificationNewDot } from '@/assets/images/tool';
import { EventCard } from '@/components/ui/EventCard';
import { MyTeamCard } from '@/components/ui/MyTeamCard';
import TeamRecommendationCard from '@/components/ui/TeamRecommendationCard';
import { useNotificationSSE } from '@/hooks/useNotificationSSE';
import { useTeamRecStore } from '@/store/teamRecStore';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 12;
const CARD_WIDTH = SCREEN_WIDTH * 0.8;
const MY_TEAM_CARD_WIDTH = SCREEN_WIDTH * 0.75;

const BANNER_WIDTH = SCREEN_WIDTH - 40;
const BANNER_HEIGHT = BANNER_WIDTH / 3;

const BANNERS = [
  { id: 'banner-1', image: require('@/assets/images/banner_ai_dreamy.png'), path: '/chatbot' },
  { id: 'banner-2', image: require('@/assets/images/banner_activity.png'), path: '/activity' },
];

const DUMMY_EVENTS: EventItem[] = [
  {
    id: 1,
    title: '2026 창업경진대회',
    category: 'CONTEST',
    field: 'SCIENCE_ENGINEERING_TECH_IT',
    fieldLabel: 'IT/개발',
    organizer: '중소벤처기업부',
    description: null,
    summarizedDescription: null,
    detailUrl: '',
    imageUrl: null,
    campusScope: 'ALL',
    startDate: '2026-07-01',
    endDate: '2026-07-30',
    recommendedTargets: null,
    targetColleges: null,
    targetSchool: null,
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { teamRec, fetchTeamRec, hasHydrated } = useTeamRecStore();
  const [hasUnread, setHasUnread] = useState(false);
  const { notifications: sseNotifications } = useNotificationSSE();

  // 내가 모집한 팀 현황
  const [myTeams, setMyTeams] = useState<TeamPost[] | null>(null);
  const [myTeamsError, setMyTeamsError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    fetchTeamRec();
  }, [hasHydrated, fetchTeamRec]);

  useFocusEffect(
    useCallback(() => {
      getMyNotifications()
        .then((list) => setHasUnread(list.some((n) => !n.isRead)))
        .catch(console.error);

      getMyTeams()
        .then((teams) => {
          setMyTeams(teams);
          setMyTeamsError(null);
        })
        .catch((err) => {
          console.error('내 팀 목록 조회 실패:', err);
          setMyTeamsError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
        });
    }, [])
  );

  useEffect(() => {
    if (sseNotifications.length > 0) {
      setHasUnread(true);
    }
  }, [sseNotifications]);

  return (
    <View className="flex-1 bg-white">
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

        <View className="mb-8" style={{ height: BANNER_HEIGHT }}>
          <Carousel
            width={BANNER_WIDTH}
            height={BANNER_HEIGHT}
            data={BANNERS}
            loop
            autoPlay
            autoPlayInterval={4000}
            scrollAnimationDuration={600}
            style={{ width: BANNER_WIDTH }}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push(item.path as never)}
                style={{ width: '100%', height: '100%' }}
              >
                <Image
                  source={item.image}
                  style={{ width: '100%', height: '100%', borderRadius: 16 }}
                  contentFit="cover"
                />
              </TouchableOpacity>
            )}
          />
        </View>

        {/* 내 팀 현황 — myTeams가 비어있으면 섹션 자체를 숨긴다 */}
        {myTeams === null || myTeams.length > 0 ? (
          <View className="mb-8">
            <Text className="text-black text-xl font-pretendard-bold mb-3">내 팀 현황</Text>

            {myTeams === null && !myTeamsError && (
              <View className="items-center justify-center py-10">
                <ActivityIndicator />
              </View>
            )}

            {myTeamsError && (
              <View className="bg-gray-50 rounded-2xl p-5 items-center">
                <Text className="text-gray-500">{myTeamsError}</Text>
              </View>
            )}

            {myTeams !== null && myTeams.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={MY_TEAM_CARD_WIDTH + CARD_GAP}
                snapToAlignment="start"
                contentContainerStyle={{ paddingRight: 20, gap: CARD_GAP }}
                style={{ marginHorizontal: -20, paddingLeft: 20 }}
              >
                {myTeams.map((team) => (
                  <View key={team.id} style={{ width: MY_TEAM_CARD_WIDTH }}>
                    <MyTeamCard
                      team={team}
                      onPress={() => router.push({ pathname: '/teamDetail', params: { teamId: team.id } })}
                    />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}

        <View className="mb-8">
          <Text className="text-black text-xl font-pretendard-bold mb-3">맞춤 공모전 추천</Text>
          <View className="gap-3">
            {DUMMY_EVENTS.map((event) => (
              <EventCard key={event.id} item={event} />
            ))}
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-black text-xl font-pretendard-bold mb-3">맞춤 팀 추천</Text>

          {(teamRec.status === 'idle' || teamRec.status === 'loading') && (
            <View className="items-center justify-center py-10">
              <ActivityIndicator />
            </View>
          )}

          {teamRec.status === 'empty' && (
            <View className="bg-gray-50 rounded-2xl p-5 items-center">
              <Text className="text-gray-500">지금은 추천할 만한 팀이 없어요.</Text>
            </View>
          )}

          {teamRec.status === 'error' && (
            <View className="bg-gray-50 rounded-2xl p-5 items-center">
              <Text className="text-gray-500 mb-2">{teamRec.message}</Text>
            </View>
          )}

          {teamRec.status === 'ready' && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + CARD_GAP}
              snapToAlignment="start"
              contentContainerStyle={{ paddingRight: 20, gap: CARD_GAP }}
              style={{ marginHorizontal: -20, paddingLeft: 20 }}
            >
              {teamRec.teams.slice(0, 3).map((team) => (
                <TeamRecommendationCard
                  key={team.teamId}
                  team={team}
                  width={CARD_WIDTH}
                  onPress={() => router.push({ pathname: '/teamDetail', params: { teamId: team.teamId } })}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </View>
  );
}