// src/components/ui/MessageBubble.tsx
import type { StompChatMessage } from '@/types/chat';
import { formatChatTime } from '@/utils/formatChatTime';
import { Text, View } from 'react-native';

interface Props {
  message: StompChatMessage;
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: Props) {
  if (isMine) {
    return (
      <View className="px-4 mb-3 items-end">
        <View className="flex-row items-end flex-row-reverse">
          <View className="max-w-[75%] rounded-3xl rounded-tr-none px-4 py-2 bg-blue-500">
            <Text className="text-white">{message.content}</Text>
          </View>
          <Text className="text-[10px] text-gray-400 mr-1">
            {formatChatTime(message.createdAt)}
          </Text>
        </View>
      </View>
    );
  }

  // 받은 메시지: 프로필 사진이 아직 없어서 회색 원으로 자리만 표시
  return (
    <View className="px-4 mb-3 flex-row items-start">
      <View className="w-9 h-9 rounded-full bg-gray-300 mr-2" />
      <View className="items-start flex-1">
        <Text className="text-xs text-gray-500 mb-1">{message.senderName}</Text>
        <View className="flex-row items-end">
          <View className="max-w-[75%] rounded-3xl rounded-tl-none px-4 py-2 bg-gray-200">
            <Text className="text-gray-900">{message.content}</Text>
          </View>
          <Text className="text-[10px] text-gray-400 ml-1">
            {formatChatTime(message.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}