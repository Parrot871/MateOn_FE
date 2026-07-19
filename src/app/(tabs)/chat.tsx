// src/app/(tabs)/chat.tsx
import { SearchLineBasic } from '@/assets/icons';
import { ChatFilterChips } from '@/components/ui/ChatFilterChips';
import { ChatListItem } from '@/components/ui/ChatListItem';
import { useChatListStore } from '@/store/chatList';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FILTERS = ['전체', 'DM', '팀'] as const;
type Filter = (typeof FILTERS)[number];

// 화면에 머무는 동안 이 주기(ms)로 목록을 재조회한다.
// 백엔드에 유저 단위 실시간 채널(웹소켓)이 생기면 이 폴링은 걷어내고 구독 방식으로 교체 예정.
const POLL_INTERVAL_MS = 2000;

export default function ChatListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState<Filter>('전체');

  const { rooms, isLoading, error, fetchRooms } = useChatListStore();

  useFocusEffect(
    useCallback(() => {
      fetchRooms();

      const interval = setInterval(() => {
        fetchRooms();
      }, POLL_INTERVAL_MS);

      // 다른 앱 갔다가 돌아왔을 때 폴링 주기 기다리지 않고 바로 최신화
      const appStateSub = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') fetchRooms();
      });

      return () => {
        clearInterval(interval);
        appStateSub.remove();
      };
    }, [])
  );

  const filteredRooms = useMemo(() => {
    if (selectedFilter === 'DM') return rooms.filter((room) => room.type === 'DM');
    if (selectedFilter === '팀') return rooms.filter((room) => room.type === 'GROUP');
    return rooms;
  }, [rooms, selectedFilter]);

  return (
    <View className="flex-1" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-4 bg-white">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold">채팅</Text>
          <TouchableOpacity>
            <Image source={SearchLineBasic} style={{ width: 24, height: 24 }} contentFit="contain" />
          </TouchableOpacity>
        </View>
        <View className="flex-row mb-4">
          {FILTERS.map((filter) => (
            <ChatFilterChips
              key={filter}
              label={filter}
              active={selectedFilter === filter}
              onPress={() => setSelectedFilter(filter)}
            />
          ))}
        </View>
      </View>
      {isLoading && rooms.length === 0 ? (
        <ActivityIndicator className="mt-8" />
      ) : error && rooms.length === 0 ? (
        <Text className="text-center text-gray-400 mt-8">
          목록을 불러오지 못했어요. 다시 시도해주세요.
        </Text>
      ) : (
        <FlatList
          data={filteredRooms}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 90 + insets.bottom }}
          keyExtractor={(item) => String(item.roomId)}
          renderItem={({ item }) => (
            <ChatListItem
              room={item}
              onPress={(roomId) =>
                router.push({
                  pathname: '../chatDetail',
                  params: { roomId: String(roomId), title: item.title },
                })
              }
            />
          )}
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-8">채팅방이 없어요</Text>
          }
        />
      )}
    </View>
  );
}