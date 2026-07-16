// src/components/ui/ChatInput.tsx
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

interface Props {
  onSend: (text: string) => void;
}

export function ChatInput({ onSend }: Props) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <View className="flex-row items-center px-3 py-2 border-t border-gray-200 bg-white">
      <TextInput
        className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
        placeholder="메세지를 입력해주세요"
        value={text}
        onChangeText={setText}
      />
      <Pressable onPress={handleSend} className="px-3 py-2">
        <Text className="text-blue-500 font-semibold">전송</Text>
      </Pressable>
    </View>
  );
} 