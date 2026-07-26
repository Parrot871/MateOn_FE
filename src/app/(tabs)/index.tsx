import type { EventItem } from '@/api/events';
import { getMyNotifications } from '@/api/notification';
import { NotificationLine } from '@/assets/icons';
import { MypageMLogo, NotificationNewDot } from '@/assets/images/tool';
import { EventCard } from '@/components/ui/EventCard';
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

  useEffect(() => {
    if (!hasHydrated) return;
    fetchTeamRec();
  }, [hasHydrated, fetchTeamRec]);

  // 홈 화면에 포커스될 때마다(알림 화면 갔다 돌아왔을 때 포함) 안 읽은 알림 여부 갱신
  // 주의: 서버에 읽음 처리 API가 없어서, 여기서는 목록의 isRead 값만 그대로 반영한다.
  // 즉 알림 화면에 들어갔다 나와도 서버 값이 안 바뀌므로 점이 계속 뜰 수 있다 —
  // 읽음 처리 엔드포인트가 추가되면 그때 실제로 꺼지도록 연동 필요.
  useFocusEffect(
    useCallback(() => {
      getMyNotifications()
        .then((list) => setHasUnread(list.some((n) => !n.isRead)))
        .catch(console.error);
    }, [])
  );

  // 홈 화면이 떠있는 동안 SSE로 새 알림이 오면 즉시 점 표시
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