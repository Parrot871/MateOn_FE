import { Bookmark } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export type ActivityItem = {
  id: string;
  dDay: string;
  title: string;
  type: string;
  field: string;
  synergy: number;
  organizer: string;
  prize: string;
};

interface EventCardProps {
  item: ActivityItem;
  onPress?: (id: string) => void;
}

export function EventCard({ item, onPress }: EventCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <TouchableOpacity
      onPress={() => onPress?.(item.id)}
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
        <View className="w-24 h-24 rounded-xl bg-gray-200" />
        <View className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-500">
          <Text className="text-white text-xs font-pretendard-bold">{item.dDay}</Text>
        </View>
      </View>

      <View className="flex-1 justify-center pr-6">
        <Text className="text-black text-base font-pretendard-bold mb-2">{item.title}</Text>
        <View className="flex-row flex-wrap gap-1 mb-2">
          <View className="px-2 py-0.5 rounded-md bg-[#E5EBFF]">
            <Text className="text-[#3E6AF4] text-xs font-pretendard-semibold">{item.type}</Text>
          </View>
          <View className="px-2 py-0.5 rounded-md bg-[#E5EBFF]">
            <Text className="text-[#3E6AF4] text-xs font-pretendard-semibold">{item.field}</Text>
          </View>
          <View className="px-2 py-0.5 rounded-md bg-[#FDF0D5]">
            <Text className="text-[#B8860B] text-xs font-pretendard-semibold">시너지 {item.synergy}%</Text>
          </View>
        </View>
        <Text className="text-gray-500 text-xs font-pretendard">주최: {item.organizer}</Text>
        <Text className="text-gray-500 text-xs font-pretendard">상금: {item.prize}</Text>
      </View>
    </TouchableOpacity>
  );
}
