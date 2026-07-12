// src/app/(auth)/signup.tsx
import { Link } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
  return (
    <View className="flex-1 justify-center items-center px-10 bg-[#8BA9FF]">
      <Text className="text-white text-2xl font-pretendard-bold mb-10">회원가입 화면</Text>

      <Link href="/signup-complete" asChild>
        <TouchableOpacity className="w-full h-14 rounded-xl bg-[#3E6AF4] justify-center items-center">
          <Text className="text-white text-lg font-pretendard-semibold">가입하기</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
