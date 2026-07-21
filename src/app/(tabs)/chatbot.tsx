import { sendChatbotMessage } from '@/api/chatbot';
import { consumeJustSignedUp } from '@/api/tokenStorage';
import { Back } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ChatMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
};

export default function ChatBotScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    consumeJustSignedUp().then((justSignedUp) => {
      setMessages([
        {
          id: 'welcome',
          role: 'bot',
          text: justSignedUp
            ? '반가워! 난 MateOn 챗봇 드리미야. MateOn을 시작하기 앞서 내 몇 가지 질문에 대답해 줄래?'
            : '안녕? 오늘은 어떤걸 도와줄까?',
        },
      ]);
    });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setMessages((prev) => [...prev, { id: `${Date.now()}-user`, role: 'user', text }]);
    setInput('');
    setIsSending(true);

    try {
      const result = await sendChatbotMessage(text);
      setMessages((prev) => [...prev, { id: `${Date.now()}-bot`, role: 'bot', text: result.assistantMessage }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-bot-error`,
          role: 'bot',
          text: error instanceof Error ? error.message : '응답을 받지 못했어요. 잠시 후 다시 시도해주세요.',
        },
      ]);
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="flex-row items-center justify-between px-6 pt-20 pb-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
        </TouchableOpacity>
        <Text className="text-black text-2xl font-pretendard-bold">챗봇</Text>
        <View style={{ width: 26, height: 26 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-5"
        contentContainerClassName="gap-3 pb-4"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) =>
          message.role === 'bot' ? (
            <View key={message.id} className="flex-row self-start max-w-[80%] gap-2">
              <Image
                source={require('@/assets/icons/dreamy.png')}
                style={{ width: 32, height: 32, borderRadius: 16 }}
                contentFit="cover"
              />
              <View className="flex-1">
                <Text className="text-gray-500 text-xs font-pretendard mb-1">드리미</Text>
                <View className="px-4 py-3 rounded-2xl bg-gray-100 self-start">
                  <Text className="font-pretendard text-base text-black">{message.text}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View key={message.id} className="self-end max-w-[80%] px-4 py-3 rounded-2xl bg-[#3E6AF4]">
              <Text className="font-pretendard text-base text-white">{message.text}</Text>
            </View>
          )
        )}
      </ScrollView>

      <View
        className="flex-row items-center gap-2 px-5 pt-3 border-t border-gray-100 bg-white"
        style={{ paddingBottom: insets.bottom }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="메시지를 입력해주세요"
          placeholderTextColor="#9CA3AF"
          onSubmitEditing={handleSend}
          returnKeyType="send"
          className="flex-1 h-12 px-4 bg-gray-100 rounded-full text-black font-pretendard"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim() || isSending}
          className={`h-12 px-5 rounded-full justify-center items-center ${
            input.trim() ? 'bg-[#3E6AF4]' : 'bg-[#3E6AF4]/40'
          }`}
        >
          <Text className="text-white font-pretendard-semibold">전송</Text>
        </TouchableOpacity>
      </View>

      {!isKeyboardVisible && <View className="bg-white" style={{ height: 70 }} />}
    </KeyboardAvoidingView>
  );
}
