// src/app/(tabs)/chat.tsx
import { ChatListItem } from '@/components/ui/ChatListItem';
import { useChatListStore } from '@/store/chatList';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, AppState, FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const POLL_INTERVAL_MS = 2000;

export default function ChatListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { rooms, isLoading, error, fetchRooms } = useChatListStore();

  useFocusEffect(
    useCallback(() => {
      fetchRooms();

      const interval = setInterval(() => {
        fetchRooms();
      }, POLL_INTERVAL_MS);

      const appStateSub = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') fetchRooms();
      });

      return () => {
        clearInterval(interval);
        appStateSub.remove();
      };
    }, [])
  );

  return (
    <View className="flex-1">
      <View className="px-5 pt-20 pb-6 bg-white">
        <View className="flex-row justify-between items-center">
          <Text className="text-3xl font-bold">채팅</Text>
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
          data={rooms}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 90 + insets.bottom }}
          ListHeaderComponent={
            rooms.length > 0 ? (
              <Text className="px-5 mb-3 text-[14px] font-pretendard-medium text-gray-400">
                총 <Text className="text-blue-600 font-pretendard-bold">{rooms.length}</Text>개의 대화
              </Text>
            ) : null
          }
          keyExtractor={(item) => String(item.roomId)}
          ItemSeparatorComponent={() => <View className="h-[1px] bg-gray-100 ml-[68px]" />}
          renderItem={({ item }) => (
            <ChatListItem
              room={item}
              onPress={(roomId) =>
                router.push({
                  pathname: '/chatDetail',
                  params: {
                    roomId: String(roomId),
                    title: item.title,
                    partnerId: item.partnerId !== null ? String(item.partnerId) : undefined,
                  },
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