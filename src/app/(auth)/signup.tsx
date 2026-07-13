// src/app/(auth)/signup.tsx
import { Back } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const isNextEnabled =
    !!email &&
    !!code &&
    password.length >= 10 &&
    password.length <= 20 &&
    password === passwordConfirm;

  const handleSendCode = () => {
    if (!email) return;
    // TODO: 이메일 인증번호 발송 API 연동
  };

  const handleNext = () => {
    if (!isNextEnabled) return;
    router.push('/myInfo');
  };

  return (
    <View className="flex-1 bg-white">
      <TouchableOpacity onPress={() => router.back()} className="px-6 pt-20 pb-6">
        <Image source={Back} style={{ width: 24, height: 24 }} contentFit="contain" />
      </TouchableOpacity>

      <View className="flex-1 px-8">
        <Text className="text-black text-2xl font-pretendard-bold mb-10">
          MateOn 회원가입을 위해{'\n'}이메일과 비밀번호를 입력해 주세요.
        </Text>

        <View className="flex-row items-center border-b border-gray-300 mb-6">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="이메일 주소"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={{ verticalAlign: 'middle' }}
            className="flex-1 h-12 text-black font-pretendard"
          />
          <TouchableOpacity onPress={handleSendCode} disabled={!email}>
            <Text className="text-black font-pretendard-semibold">인증요청</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="인증번호 6자리"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={6}
          style={{ verticalAlign: 'middle' }}
          className="h-12 mb-6 text-black border-b border-gray-300 font-pretendard"
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="새 비밀번호 (10 ~ 20자리 이내)"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={{ verticalAlign: 'middle' }}
          className="h-12 mb-6 text-black border-b border-gray-300 font-pretendard"
        />

        <TextInput
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          placeholder="새 비밀번호 확인"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={{ verticalAlign: 'middle' }}
          className="h-12 mb-6 text-black border-b border-gray-300 font-pretendard"
        />

        <TouchableOpacity
          onPress={handleNext}
          disabled={!isNextEnabled}
          className={`h-14 mt-4 rounded-xl border border-[#3E6AF4] bg-white justify-center items-center ${
            isNextEnabled ? '' : 'opacity-40'
          }`}
        >
          <Text className="text-[#3E6AF4] text-lg font-pretendard-semibold">다음</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
