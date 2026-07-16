// src/app/chatDetail.tsx (ChatRoomScreen)
import { MoreFill } from '@/assets/icons';
import { Back } from '@/assets/images/tool';
import { ChatInput } from '@/components/ui/ChatInput';
import { MessageBubble } from '@/components/ui/MessageBubble';
import { useAuthStore } from '@/store/authStore';
import { useChatRoomDetailStore } from '@/store/chatRoomDetailStore';
import type { StompChatMessage } from '@/types/chat';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatRoomScreen() {
  const { roomId, title } = useLocalSearchParams<{ roomId: string; title?: string }>();
  const router = useRouter();
  const listRef = useRef<FlatList>(null);

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

  const renderItem = ({ item }: { item: StompChatMessage }) => (
    <MessageBubble message={item} isMine={item.senderId === myUserId} />
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {/* 헤더 */}
      <View className="flex-row items-center px-3 py-3 border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-2">
          <Image source={Back} style={{ width: 24, height: 24 }} contentFit="contain" />
        </Pressable>
        <Text className="text-lg font-bold flex-1" numberOfLines={1}>
          {title ?? '채팅방'}
        </Text>
        <Image source={MoreFill} style={{ width: 24, height: 24 }} contentFit="contain" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <ActivityIndicator className="mt-8" />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.messageId)}
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