// src/components/ui/ChatDateSeparator.tsx
import { Text, View } from 'react-native';

interface Props {
  date: string;
}

export function ChatDateSeparator({ date }: Props) {
  return (
    <View className="flex-row items-center my-3 px-6">
      <View className="flex-1 h-[1px] bg-gray-200" />
      <Text className="mx-3 text-xs text-gray-400 font-pretendard-medium">{date}</Text>
      <View className="flex-1 h-[1px] bg-gray-200" />
    </View>
  );
}
