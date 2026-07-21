// src/app/bookMark.tsx
import { EventCard, type ActivityItem } from '@/components/ui/EventCard';
import { Back } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const BOOKMARKED_ITEMS: ActivityItem[] = [];

export default function BookmarkScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-6 pt-20 pb-10">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
        </TouchableOpacity>
        <Text className="text-black text-2xl font-pretendard-bold">북마크</Text>
        <View style={{ width: 26, height: 26 }} />
      </View>

      {BOOKMARKED_ITEMS.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8 pb-20">
          <Text className="text-gray-400 font-pretendard text-base">북마크가 비었어요.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-10">
          {BOOKMARKED_ITEMS.map((item) => (
            <EventCard key={item.id} item={item} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
