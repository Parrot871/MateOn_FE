// app/myBookmarks.tsx
import { fetchBookmarkedEvents, type EventItem } from '@/api/events';
import { Back } from '@/assets/images/tool';
import { EventCard } from '@/components/ui/EventCard';
import { useBookmarkedEventIds } from '@/hooks/useBookmarkedEvents';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MyBookmarksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { bookmarkedIds, toggleBookmark } = useBookmarkedEventIds();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setErrorMessage(null);

      fetchBookmarkedEvents({ size: 100 })
        .then((data) => {
          if (active) setEvents(data);
        })
        .catch((err) => {
          console.error('북마크 목록 조회 실패:', err);
          if (active) setErrorMessage(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
        });

      return () => {
        active = false;
      };
    }, [])
  );

  const handleToggleBookmark = (eventId: number, next: boolean) => {
    toggleBookmark(eventId, next);
    if (!next) {
      setEvents((prev) => (prev ? prev.filter((event) => event.id !== eventId) : prev));
    }
  };

  return (
    <View className="flex-1 bg-gray-50/60">
      <View
        className="px-5 bg-white border-b border-gray-100 flex-row items-center justify-between"
        style={{ paddingTop: Math.max(insets.top, 16) + 6, paddingBottom: 14 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="w-8 h-8 justify-center items-start"
        >
          <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
        </TouchableOpacity>
        <Text className="text-gray-900 text-2xl font-pretendard-bold flex-1 text-center mr-8 tracking-tight">
          북마크
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-5"
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {events === null && !errorMessage && (
          <View className="py-24 items-center justify-center">
            <ActivityIndicator color="#2563eb" size="small" />
            <Text className="text-gray-400 font-pretendard text-xs mt-3">북마크 목록을 불러오는 중...</Text>
          </View>
        )}

        {errorMessage && (
          <View className="py-16 items-center justify-center bg-white rounded-3xl p-6 border border-gray-100">
            <Text className="text-gray-800 font-pretendard-semibold text-sm mb-1">목록을 불러오지 못했습니다</Text>
            <Text className="text-gray-400 font-pretendard text-xs text-center">{errorMessage}</Text>
          </View>
        )}

        {events !== null && events.length === 0 && (
          <View className="py-24 items-center justify-center px-8">
            <Text className="text-gray-400 font-pretendard text-base">아직 북마크한 활동이 없어요.</Text>
          </View>
        )}

        {events?.map((event) => (
          <EventCard
            key={event.id}
            item={event}
            isBookmarked={bookmarkedIds.has(event.id)}
            onToggleBookmark={handleToggleBookmark}
          />
        ))}
      </ScrollView>
    </View>
  );
}
