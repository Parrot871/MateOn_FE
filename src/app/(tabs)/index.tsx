import { MypageMLogo, NotificationNewDot } from '@/assets/images/tool';
import { EventCard, type ActivityItem } from '@/components/ui/EventCard';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const DUMMY_EVENTS: ActivityItem[] = [
  {
    id: '1',
    dDay: 'D-7',
    title: '2026 창업경진대회',
    type: '공모전',
    field: 'IT/개발',
    synergy: 85,
    organizer: '중소벤처기업부',
    prize: '1000만원',
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
            <Image source={NotificationNewDot} style={{ width: 32, height: 32 }} contentFit="contain" />
          </TouchableOpacity>
        </View>

        {/* 공모전 카드 섹션 */}
        <View>
          <Text className="text-black text-lg font-pretendard-bold mb-3">맞춤 공모전 추천</Text>
          <View className="gap-3">
            {DUMMY_EVENTS.map((event) => (
              <EventCard key={event.id} item={event} onPress={(id) => router.push(`/activity/${id}`)} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}