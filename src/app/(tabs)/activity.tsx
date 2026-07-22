import { fetchEvents, searchEvents, type EventCategory, type EventItem } from '@/api/events';
import { SearchLineBasic } from '@/assets/icons';
import { EventCard } from '@/components/ui/EventCard';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOP_TABS = ['공모전', '대외활동', '교내활동'] as const;
type TopTab = (typeof TOP_TABS)[number];

const TOP_TAB_CATEGORY: Record<TopTab, EventCategory> = {
  공모전: 'CONTEST',
  대외활동: 'EXTERNAL',
  교내활동: 'SCHOOL',
};

const FILTERS = ['전체', '브랜드/네이밍', '기획/아이디어', '예체능', '데이터 분석', '기타'];

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const [topTab, setTopTab] = useState<TopTab>('공모전');
  const [filter, setFilter] = useState('전체');
  const [items, setItems] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EventItem[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const category = TOP_TAB_CATEGORY[topTab];
    fetchEvents(category, controller.signal)
      .then((events) => {
        // TODO: 서버가 category 쿼리 파라미터를 무시하고 항상 전체 목록을 반환해서
        // 임시로 클라이언트에서 한 번 더 걸러낸다. 서버 필터링이 정상화되면 제거.
        setItems(events.filter((event) => event.category === category));
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.warn('[ActivityScreen] 목록 조회 실패', error);
        setItems([]);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [topTab]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      setIsSearchLoading(false);
    } else {
      setIsSearchLoading(true);
    }
  };

  useEffect(() => {
    const keyword = searchQuery.trim();
    if (!keyword) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      searchEvents(keyword, controller.signal)
        .then(setSearchResults)
        .catch((error) => {
          if (error instanceof Error && error.name === 'AbortError') return;
          console.warn('[ActivityScreen] 검색 실패', error);
          setSearchResults([]);
        })
        .finally(() => setIsSearchLoading(false));
    }, 400);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  const handleSearchSubmit = () => {
    const keyword = searchQuery.trim();
    if (!keyword) return;

    setIsSearchLoading(true);
    searchEvents(keyword)
      .then(setSearchResults)
      .catch((error) => {
        console.warn('[ActivityScreen] 검색 실패', error);
        setSearchResults([]);
      })
      .finally(() => setIsSearchLoading(false));
  };

  const activeQuery = searchQuery.trim();
  const isShowingSearchResults = activeQuery.length > 0;
  const visibleItems = isShowingSearchResults ? searchResults : items;

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
        {FILTERS.map((item) => {
          const isSelected = filter === item;
          return (
            <TouchableOpacity
              key={item}
              onPress={() => setFilter(item)}
              className={`h-9 px-4 rounded-full justify-center items-center border ${
                isSelected ? 'bg-[#3E6AF4] border-[#3E6AF4]' : 'bg-white border-gray-200'
              }`}
            >
              <Text className={`font-pretendard-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                {item}
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

      {(isShowingSearchResults ? isSearchLoading : isLoading) ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#3E6AF4" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="gap-4"
          contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}
        >
          {isShowingSearchResults && visibleItems.length === 0 ? (
            <Text className="text-gray-400 text-center mt-10 font-pretendard-medium">검색 결과가 없어요.</Text>
          ) : (
            visibleItems.map((item) => <EventCard key={item.id} item={item} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}
