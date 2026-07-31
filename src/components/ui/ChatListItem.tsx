// components/ChatListItem.tsx
import { getPublicUserProfile } from '@/api/user';
import { ProfileUser } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ChatRoom } from '../../types/chat';
import { formatChatTime } from '../../utils/formatChatTime';

interface ChatListItemProps {
  room: ChatRoom;
  onPress?: (roomId: number) => void;
}

export function ChatListItem({ room, onPress }: ChatListItemProps) {
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!room.partnerId) return;
    getPublicUserProfile(room.partnerId)
      .then((profile) => setProfileImageUrl(profile.profileImageUrl))
      .catch(() => {});
  }, [room.partnerId]);

  return (
    <Pressable
      onPress={() => onPress?.(room.roomId)}
      className="flex-row items-center px-4 py-3"
    >
      <View className="w-14 h-14 rounded-full bg-gray-100 mr-3 items-center justify-center overflow-hidden">
        {profileImageUrl ? (
          <Image source={{ uri: profileImageUrl }} style={{ width: 56, height: 56 }} contentFit="cover" />
        ) : (
          <Image source={ProfileUser} style={{ width: 25, height: 25 }} contentFit="contain" />
        )}
      </View>

      <View className="flex-1">
        <Text className="font-pretendard-semibold text-lg">{room.title}</Text>
        <Text className="text-gray-500 text-base" numberOfLines={1}>
          {room.lastMessage ?? '아직 메시지가 없어요'}
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-gray-400 text-sm font-pretendard-medium mb-1">
          {formatChatTime(room.lastMessageAt)}
        </Text>
        {room.unreadCount > 0 && (
          <View className="bg-red-500 rounded-full min-w-[20px] h-5 px-1 items-center justify-center">
            <Text className="text-white text-xs font-pretendard-bold">
              {room.unreadCount > 99 ? '99+' : room.unreadCount}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}