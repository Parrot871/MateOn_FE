import { computeDDay, type EventCategory, type EventItem } from '@/api/events';
import { Bookmark } from '@/assets/images/tool';
import { useEventDetailStore } from '@/store/eventDetailStore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const CATEGORY_LABEL: Record<EventCategory, string> = {
  CONTEST: '공모전',
  EXTERNAL: '대외활동',
  SCHOOL: '교내활동',
};

interface EventCardProps {
  item: EventItem;
}

export function EventCard({ item }: EventCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const router = useRouter();
  const setSelectedEvent = useEventDetailStore((s) => s.setSelectedEvent);

  return (
    <TouchableOpacity
      onPress={() => {
        setSelectedEvent(item);
        router.push('/eventInfo');
      }}
      className="relative flex-row p-3 rounded-2xl border border-gray-200 gap-3"
    >
      <TouchableOpacity onPress={() => setIsBookmarked((prev) => !prev)} className="absolute top-3 right-3 z-10">
        <Image
          source={Bookmark}
          style={{ width: 20, height: 20 }}
          contentFit="contain"
          tintColor={isBookmarked ? '#EF4444' : undefined}
        />
      </TouchableOpacity>

      <View className="relative">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={{ width: 96, height: 96, borderRadius: 12 }} contentFit="cover" />
        ) : (
          <View className="w-24 h-24 rounded-xl bg-gray-200" />
        )}
        <View className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-500">
          <Text className="text-white text-xs font-pretendard-bold">{computeDDay(item.endDate)}</Text>
        </View>
      </View>

      <View className="flex-1 justify-center pr-6">
        <Text className="text-black text-base font-pretendard-bold mb-2" numberOfLines={2}>
          {item.title}
        </Text>
        <View className="flex-row flex-wrap gap-1 mb-2">
          <View className="px-2 py-0.5 rounded-md bg-[#E5EBFF]">
            <Text className="text-[#3E6AF4] text-xs font-pretendard-semibold">{CATEGORY_LABEL[item.category]}</Text>
          </View>
          <View className="px-2 py-0.5 rounded-md bg-[#E5EBFF]">
            <Text className="text-[#3E6AF4] text-xs font-pretendard-semibold">{item.fieldLabel}</Text>
          </View>
        </View>
        <Text className="text-gray-500 text-xs font-pretendard" numberOfLines={1}>
          주최: {item.organizer}
        </Text>
        <Text className="text-gray-500 text-xs font-pretendard">마감: {item.endDate.replaceAll('-', '.')}</Text>
      </View>
    </TouchableOpacity>
  );
}
