import { EVENT_FIELD_LABELS, fetchEvents, searchEvents, type EventCategory, type EventField, type EventItem } from '@/api/events';
import { SearchLineBasic } from '@/assets/icons';
import { EventCard } from '@/components/ui/EventCard';
import { useBookmarkedEventIds } from '@/hooks/useBookmarkedEvents';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOP_TABS = ['공모전', '대외활동'] as const;
type TopTab = (typeof TOP_TABS)[number];

const TOP_TAB_CATEGORY: Record<TopTab, EventCategory> = {
  공모전: 'CONTEST',
  대외활동: 'EXTERNAL'
};

const FIELD_FILTERS: { label: string; value: EventField | null }[] = [
  { label: '전체', value: null },
  ...(Object.entries(EVENT_FIELD_LABELS) as [EventField, string][]).map(([value, label]) => ({ label, value })),
];

export default function ActivityScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const [topTab, setTopTab] = useState<TopTab>('공모전');
  const [filter, setFilter] = useState<EventField | null>(null);
  const [items, setItems] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const { bookmarkedIds, toggleBookmark } = useBookmarkedEventIds();

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedKeyword(searchQuery.trim()), 400);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const isFiltering = filter !== null || debouncedKeyword.length > 0;

  useEffect(() => {
    const controller = new AbortController();
    const category = TOP_TAB_CATEGORY[topTab];

    const request = isFiltering
      ? searchEvents({ category, field: filter ?? undefined, keyword: debouncedKeyword || undefined, size: 100 }, controller.signal)
      : fetchEvents(category, controller.signal).then((events) => events.filter((event) => event.category === category));

    request
      .then(setItems)
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.warn('[ActivityScreen] 목록 조회 실패', error);
        setItems([]);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [topTab, filter, debouncedKeyword, isFiltering]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setIsLoading(true);
  };

  const handleSearchSubmit = () => {
    setDebouncedKeyword(searchQuery.trim());
    setIsLoading(true);
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-5 pt-20 pb-4 gap-6">
        {TOP_TABS.map((tab) => {
          const isActive = topTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                setTopTab(tab);
                setIsLoading(true);
              }}
            >
              <Text
                className={`text-2xl ${
                  isActive ? 'text-black font-pretendard-bold' : 'text-gray-300 font-pretendard-semibold'
                }`}
              >
                {tab}
              </Text>
              {isActive && <View className="h-0.5 bg-black mt-2 rounded-full" />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-12 px-5"
        contentContainerClassName="gap-2"
      >
        {FIELD_FILTERS.map(({ label, value }) => {
          const isSelected = filter === value;
          return (
            <TouchableOpacity
              key={label}
              onPress={() => {
                setFilter(value);
                setIsLoading(true);
              }}
              className={`h-9 px-4 rounded-full justify-center items-center border ${
                isSelected ? 'bg-[#3E6AF4] border-[#3E6AF4]' : 'bg-white border-gray-200'
              }`}
            >
              <Text className={`font-pretendard-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View className="flex-row items-center gap-2 px-5 pb-2">
        <TextInput
          value={searchQuery}
          onChangeText={handleSearchChange}
          onSubmitEditing={handleSearchSubmit}
          placeholder="활동을 검색해보세요"
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          className="flex-1 h-11 px-4 rounded-full bg-gray-100 text-base font-pretendard text-black"
        />
        <TouchableOpacity
          onPress={handleSearchSubmit}
          className="h-11 w-11 rounded-full bg-[#3E6AF4] items-center justify-center"
        >
          <Image source={SearchLineBasic} style={{ width: 20, height: 20 }} contentFit="contain" tintColor="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#3E6AF4" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="gap-4"
          contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}
        >
          {isFiltering && items.length === 0 ? (
            <Text className="text-gray-400 text-center mt-10 font-pretendard-medium">검색 결과가 없어요.</Text>
          ) : (
            items.map((item) => (
              <EventCard
                key={item.id}
                item={item}
                isBookmarked={bookmarkedIds.has(item.id)}
                onToggleBookmark={toggleBookmark}
              />
            ))
          )}
        </ScrollView>
      )}
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/event/register',
            params: { category: TOP_TAB_CATEGORY[topTab]}
          })
        }
        style={{ bottom: 24 + tabBarHeight }}
        className="absolute right-5 h-14 w-14 rounded-full bg-[#3E6AF4] items-center justify-center shadow-lg"
        >
          <Text className="text-white text-3xl font-pretendard-bold">+</Text>
        </TouchableOpacity>
    </View>
  );
}
