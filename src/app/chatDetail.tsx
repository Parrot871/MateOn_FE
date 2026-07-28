// src/app/chatDetail.tsx (ChatRoomScreen)
import { Back } from '@/assets/images/tool';
import { ChatDateSeparator } from '@/components/ui/ChatDateSeparator';
import { ChatInput } from '@/components/ui/ChatInput';
import { MessageBubble } from '@/components/ui/MessageBubble';
import { useAuthStore } from '@/store/authStore';
import { useChatRoomDetailStore } from '@/store/chatRoomDetailStore';
import type { StompChatMessage } from '@/types/chat';
import { formatChatDate, isSameDay } from '@/utils/formatChatDate';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatRoomScreen() {
  const { roomId, title, partnerId } = useLocalSearchParams<{
    roomId: string;
    title?: string;
    partnerId?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const { messages, isLoading, enterRoom, leaveRoom, sendMessage } =
    useChatRoomDetailStore();
  const { myUserId, loadMyUserId } = useAuthStore();

  useEffect(() => {
    loadMyUserId();
  }, []);

  useEffect(() => {
    if (!roomId) return;
    enterRoom(Number(roomId));
    return () => leaveRoom();
  }, [roomId]);

  type ChatListEntry =
    | { type: 'date'; key: string; date: string }
    | { type: 'message'; key: string; message: StompChatMessage };

  const listData = useMemo<ChatListEntry[]>(() => {
    const entries: ChatListEntry[] = [];
    let prevCreatedAt: string | null = null;
    for (const message of messages) {
      if (!isSameDay(prevCreatedAt, message.createdAt)) {
        entries.push({
          type: 'date',
          key: `date-${message.createdAt}`,
          date: formatChatDate(message.createdAt),
        });
      }
      entries.push({ type: 'message', key: String(message.messageId), message });
      prevCreatedAt = message.createdAt;
    }
    return entries;
  }, [messages]);

  const renderItem = ({ item }: { item: ChatListEntry }) =>
    item.type === 'date' ? (
      <ChatDateSeparator date={item.date} />
    ) : (
      <MessageBubble message={item.message} isMine={item.message.senderId === myUserId} />
    );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      {/* 헤더 */}
      <View
        className="flex-row items-center px-6 border-b border-gray-100"
        style={{ paddingTop: Math.max(insets.top, 16) + 6, paddingBottom: 12 }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} className="mr-3">
          <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
        </TouchableOpacity>
        <Text className="text-black text-2xl font-pretendard-bold flex-1" numberOfLines={1}>
          {title ?? '채팅방'}
        </Text>
        {partnerId ? (
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="w-8 h-8 justify-center items-end"
          >
            <Text className="text-gray-900 font-pretendard-bold pt-2" style={{ fontSize: 26, lineHeight: 26 }}>
              ⋮
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 26, height: 26 }} />
        )}
      </View>

      {/* 상대 정보 확인하기 드롭다운 메뉴 */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
          className="flex-1"
          style={{ paddingTop: Math.max(insets.top, 16) + 50 }}
        >
          <View className="items-end px-3">
            <View className="bg-white rounded-2xl w-44 overflow-hidden shadow-lg" style={{ elevation: 4 }}>
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  router.push({ pathname: '/userProfile', params: { userId: partnerId } });
                }}
                activeOpacity={0.7}
                className="px-4 py-3.5"
              >
                <Text className="text-gray-900 font-pretendard-medium text-lg">상대 정보 확인하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <ActivityIndicator className="mt-8" />
        ) : (
          <FlatList
            ref={listRef}
            data={listData}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 12 }}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
          />
        )}
        <ChatInput onSend={sendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}