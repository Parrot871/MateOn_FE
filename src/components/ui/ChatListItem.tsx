// components/ChatListItem.tsx
import { Pressable, Text, View } from 'react-native';
import type { ChatRoom } from '../../types/chat';
import { formatChatTime } from '../../utils/formatChatTime';

interface ChatListItemProps {
  room: ChatRoom;
  onPress?: (roomId: number) => void;
}

export function ChatListItem({ room, onPress }: ChatListItemProps) {
  return (
    <Pressable
      onPress={() => onPress?.(room.roomId)}
      className="flex-row items-center px-4 py-3"
    >
      <View className="w-10 h-10 rounded-full bg-gray-100 mr-3" />

      <View className="flex-1">
        <Text className="font-semibold text-base">{room.title}</Text>
        <Text className="text-gray-500 text-sm" numberOfLines={1}>
          {room.lastMessage ?? '아직 메시지가 없어요'}
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-gray-400 text-xs mb-1">
          {formatChatTime(room.lastMessageAt)}
        </Text>
        {room.unreadCount > 0 && (
          <View className="bg-red-500 rounded-full min-w-[20px] h-5 px-1 items-center justify-center">
            <Text className="text-white text-xs font-bold">
              {room.unreadCount > 99 ? '99+' : room.unreadCount}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}