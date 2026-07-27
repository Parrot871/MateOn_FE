// src/components/ui/ChatInput.tsx
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

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
    <View className="flex-row items-center gap-2 px-5 pt-3 pb-3 border-t border-gray-100 bg-white">
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="메시지를 입력해주세요"
        placeholderTextColor="#9CA3AF"
        onSubmitEditing={handleSend}
        returnKeyType="send"
        className="flex-1 h-12 px-4 bg-gray-100 rounded-full text-black font-pretendard"
      />
      <TouchableOpacity
        onPress={handleSend}
        disabled={!text.trim()}
        className={`h-12 px-5 rounded-full justify-center items-center ${
          text.trim() ? 'bg-[#3E6AF4]' : 'bg-[#3E6AF4]/40'
        }`}
      >
        <Text className="text-white font-pretendard-semibold">전송</Text>
      </TouchableOpacity>
    </View>
  );
}