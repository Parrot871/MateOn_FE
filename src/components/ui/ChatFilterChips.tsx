import { Pressable, Text } from 'react-native';

interface ChatFilterChipsProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function ChatFilterChips({ label, active = false, onPress }: ChatFilterChipsProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full border mr-2 ${
        active
          ? 'bg-blue-600 border-blue-600'
          : 'bg-white border-gray-300'
      }`}
    >
      <Text className={active ? 'text-white font-pretendard-semibold': 'text-blue-600 font-pretendard-semibold'}>
        {label}
      </Text>
    </Pressable>
  );
}