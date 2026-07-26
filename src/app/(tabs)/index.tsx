import { fetchRecommendedEvents, type EventItem } from '@/api/events';
import { MypageMLogo, NotificationNewDot } from '@/assets/images/tool';
import { EventCard } from '@/components/ui/EventCard';
import TeamRecommendationCard from '@/components/ui/TeamRecommendationCard';
import { useTeamRecStore } from '@/store/teamRecStore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

type RecommendedEventsState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | { status: 'ready'; events: EventItem[] };

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { teamRec, fetchTeamRec, hasHydrated } = useTeamRecStore();
  const [recommendedEvents, setRecommendedEvents] = useState<RecommendedEventsState>({ status: 'loading' });

  useEffect(() => {
    if (!hasHydrated) return;
    fetchTeamRec();
  }, [hasHydrated, fetchTeamRec]);

  useEffect(() => {
    const controller = new AbortController();

    fetchRecommendedEvents(controller.signal)
      .then((events) => {
        setRecommendedEvents(events.length ? { status: 'ready', events } : { status: 'empty' });
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setRecommendedEvents({
          status: 'error',
          message: error instanceof Error ? error.message : '맞춤 활동 추천을 불러오지 못했어요.',
        });
      });

    return () => controller.abort();
  }, []);

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
            <Image source={NotificationNewDot} style={{ width: 30, height: 30 }} contentFit="contain" />
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
          <Text className="text-black text-xl font-pretendard-bold mb-3">맞춤 활동 추천</Text>

          {recommendedEvents.status === 'loading' && (
            <View className="items-center justify-center py-10">
              <ActivityIndicator />
            </View>
          )}

          {recommendedEvents.status === 'empty' && (
            <View className="bg-gray-50 rounded-2xl p-5 items-center">
              <Text className="text-gray-500">지금은 추천할 만한 활동이 없어요.</Text>
            </View>
          )}

          {recommendedEvents.status === 'error' && (
            <View className="bg-gray-50 rounded-2xl p-5 items-center">
              <Text className="text-gray-500 mb-2">{recommendedEvents.message}</Text>
            </View>
          )}

          {recommendedEvents.status === 'ready' && (
            <View className="gap-3">
              {recommendedEvents.events.map((event) => (
                <EventCard key={event.id} item={event} />
              ))}
            </View>
          )}
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