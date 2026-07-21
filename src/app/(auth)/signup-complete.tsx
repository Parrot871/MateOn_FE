// src/app/(auth)/signup-complete.tsx
import { setJustSignedUp } from '@/api/tokenStorage';
import { Check, X } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function SignupCompleteScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name?: string }>();

  useEffect(() => {
    setJustSignedUp();
  }, []);

  return (
    <View className="flex-1 bg-white">
      <TouchableOpacity onPress={() => router.replace('/login')} className="items-end px-6 pt-20 pb-6">
        <Image source={X} style={{ width: 30, height: 30 }} contentFit="contain" />
      </TouchableOpacity>

      <View className="flex-1 mt-60 items-center px-10">
        <Image source={Check} style={{ width: 96, height: 96 }} contentFit="contain" />
        <Text className="text-black text-2xl text-center font-pretendard-semibold mt-6">MateOn 회원가입이{"\n"}완료되었습니다.</Text>
        <Text className="text-black text-lg text-center font-pretendard mt-4">{name}님의 회원가입을 축하합니다.</Text>
      </View>

      <TouchableOpacity
        onPress={() => router.replace('/login')}
        className="h-14 mx-10 my-14 rounded-xl bg-[#3E6AF4] justify-center items-center"
      >
        <Text className="text-white text-lg font-pretendard-semibold">로그인 페이지로 이동하기</Text>
      </TouchableOpacity>
    </View>
  );
}
