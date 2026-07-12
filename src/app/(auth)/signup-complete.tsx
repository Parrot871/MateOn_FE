// src/app/(auth)/signup-complete.tsx
import { Link } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

export default function SignupCompleteScreen() {
  return (
    <View className="flex-1 justify-center items-center px-10 bg-[#8BA9FF]">
      <Text className="text-white text-3xl font-pretendard-bold mb-4">가입 완료!</Text>
      <Text className="text-white text-base font-pretendard mb-10">
        MateOn 회원가입이 완료되었어요
      </Text>

      <Link href="/login" asChild>
        <TouchableOpacity className="w-full h-14 rounded-xl bg-[#3E6AF4] justify-center items-center">
          <Text className="text-white text-lg font-pretendard-semibold">로그인하러 가기</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
