// src/app/(auth)/login.tsx
import { loginWithEmail, loginWithKakao } from '@/api/auth';
import { peekJustSignedUp } from '@/api/tokenStorage';
import { ID, KakaoLogo, MateOnLogo, PW } from '@/assets/images/login';
import { getProfile as getKakaoProfile, login as kakaoLogin } from '@react-native-seoul/kakao-login';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleKakaoLogin = async () => {
    try {
      const { accessToken } = await kakaoLogin();
      await loginWithKakao(accessToken);
      const profile = await getKakaoProfile();
      router.replace({ pathname: '/myInfo', params: { provider: 'KAKAO', email: profile.email } });
    } catch (error) {
      console.error('카카오 로그인 실패:', error);
    }
  };

  const handleLogin = async () => {
    if (!id || !password) {
      Alert.alert('로그인 실패', '아이디와 비밀번호를 입력해주세요.', [{ text: '확인' }]);
      return;
    }
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    try {
      await loginWithEmail(id, password);
      const justSignedUp = await peekJustSignedUp();
      router.replace(justSignedUp ? '/chatbot' : '/');
    } catch (error) {
      Alert.alert('로그인 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.', [
        { text: '확인' },
      ]);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-10 bg-[#8BA9FF]">
      
      <View className="items-center mb-8">
        <Image source={MateOnLogo} style={{ width: 150, height: 120 }} contentFit="contain" />
        <Text className="text-white text-5xl font-pretendard-medium">MateOn</Text>
        <Text className="text-white text-lg font-pretendard mt-2">함께할 최고의 팀원을 만나보세요</Text>
      </View>

      <TouchableOpacity onPress={handleKakaoLogin} className="h-14 rounded-xl bg-[#FAE100] flex-row justify-center items-center">
        <Image source={KakaoLogo} style={{ width: 20, height: 20 }} contentFit="contain" />
        <Text className="text-black font-pretendard-semibold ml-2">카카오톡으로 로그인</Text>
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
          placeholderTextColor="#9CA3AF"
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
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 h-full ml-3 font-pretendard"
        />
      </View>

      <TouchableOpacity
        onPress={handleLogin}
        disabled={isLoggingIn}
        className="h-14 rounded-xl bg-[#3E6AF4] justify-center items-center mb-8"
      >
        <Text className="text-white text-lg font-pretendard-semibold">{isLoggingIn ? '로그인 중...' : '로그인'}</Text>
      </TouchableOpacity>

      <Link href="/signup" asChild>
        <TouchableOpacity className="self-center">
          <Text
            style={{ textDecorationLine: 'underline', textDecorationColor: 'white' }}
            className="text-white text-base font-pretendard-semibold"
          >
            교육기관 이메일로 회원가입하기
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
