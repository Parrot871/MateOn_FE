// src/app/(auth)/login.tsx
import {KakaoLogo, ID, PW, MateOnLogo} from '@/assets/images/login';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View className="flex-1 justify-center px-10 bg-[#8BA9FF]">
      
      <View className="items-center mb-8">
        <Image source={MateOnLogo} style={{ width: 150, height: 120 }} contentFit="contain" />
        <Text className="text-white text-5xl font-pretendard-medium">MateOn</Text>
        <Text className="text-white text-lg font-pretendard mt-2">함께할 최고의 팀원을 만나보세요</Text>
      </View>

      <TouchableOpacity className="h-14 rounded-xl bg-[#FAE100] flex-row justify-center items-center">
        <Image source={KakaoLogo} style={{ width: 20, height: 20 }} contentFit="contain" />
        <Text className="text-black font-pretendard-semibold ml-2">카카오 계정으로 로그인</Text>
      </TouchableOpacity>

      <View className="flex-row items-center my-8">
        <View className="flex-1 h-[1.5] bg-white" />
        <Text className="mx-4 text-white font-pretendard">또는</Text>
        <View className="flex-1 h-[1.5] bg-white" />
      </View>

      <View className="flex-row items-center h-14 px-4 mb-6 bg-white rounded-xl border border-gray-300">
        <Image source={ID} style={{ width: 20, height: 20 }} contentFit="contain" />
        <TextInput
          value={id}
          onChangeText={setId}
          placeholder="이메일을 입력해주세요"
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 h-full ml-3 font-pretendard"
        />
      </View>

      <View className="flex-row items-center h-14 px-4 mb-6 bg-white rounded-xl border border-gray-300">
        <Image source={PW} style={{ width: 20, height: 20 }} contentFit="contain" />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호를 입력해주세요"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 h-full ml-3 font-pretendard"
        />
      </View>

      <TouchableOpacity className="h-14 rounded-xl bg-[#3E6AF4] justify-center items-center mb-8">
        <Text className="text-white text-lg font-pretendard-semibold">로그인</Text>
      </TouchableOpacity>

      <Link href="/signup" asChild>
        <View className="items-center">
          <TouchableOpacity>
            <Text className="text-white text-base font-pretendard-semibold"> MateOn으로 회원가입하기</Text>
            <View className="h-px bg-white mt-0.5" />
          </TouchableOpacity>
        </View>
      </Link>
    </View>
  );
}
