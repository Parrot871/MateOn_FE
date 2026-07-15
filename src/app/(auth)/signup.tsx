// src/app/(auth)/signup.tsx
import { requestEmailCode, verifyEmailCode } from '@/api/auth';
import { Back } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

const RESEND_COOLDOWN_SECONDS = 60;

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const isNextEnabled =
    !!email &&
    isCodeVerified &&
    !!verificationToken &&
    password.length >= 10 &&
    password.length <= 20 &&
    password === passwordConfirm;

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('알림', '이메일을 입력해주세요.', [{ text: '확인' }]);
      return;
    }
    if (isSendingCode || cooldown > 0) return;

    setIsSendingCode(true);
    setEmailError(null);
    try {
      await requestEmailCode(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      Alert.alert('인증코드 발송 완료', '인증코드 발송이 완료되었습니다.\n5분 내로 인증코드를 입력해 주세요.', [{ text: '확인' }]);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : '인증코드 발송에 실패했습니다.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      Alert.alert('알림', '인증번호를 입력해주세요.', [{ text: '확인' }]);
      return;
    }
    if (isVerifyingCode || isCodeVerified) return;

    setIsVerifyingCode(true);
    setCodeError(null);
    try {
      const token = await verifyEmailCode(email, code);
      console.log('verificationToken:', token);
      setVerificationToken(token);
      setIsCodeVerified(true);
      Alert.alert('알림', '인증이 완료되었습니다.', [{ text: '확인' }]);
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : '인증코드 검증에 실패했습니다.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleNext = () => {
    if (!isNextEnabled || !verificationToken) return;
    router.push({
      pathname: '/myInfo',
      params: { email, password, passwordConfirm, verificationToken },
    });
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
          <TouchableOpacity onPress={handleSendCode} disabled={isSendingCode || cooldown > 0}>
            <Text className={`font-pretendard-semibold ${cooldown > 0 ? 'text-gray-400' : 'text-black'}`}>
              {isSendingCode ? '전송 중...' : cooldown > 0 ? `재요청 (${cooldown}초)` : '인증요청'}
            </Text>
          </TouchableOpacity>
        </View>

        {emailError && <Text className="text-red-500 font-pretendard text-xs -mt-4 mb-4">{emailError}</Text>}

        <View className="flex-row items-center border-b border-gray-300 mb-6">
          <TextInput
            value={code}
            onChangeText={(text) => {
              setCode(text);
              setIsCodeVerified(false);
              setVerificationToken(null);
            }}
            placeholder="인증번호 6자리"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            maxLength={6}
            editable={!isCodeVerified}
            style={{ verticalAlign: 'middle' }}
            className="flex-1 h-12 text-black font-pretendard"
          />
          <TouchableOpacity onPress={handleVerifyCode} disabled={isVerifyingCode || isCodeVerified}>
            <Text className={`font-pretendard-semibold ${isCodeVerified ? 'text-gray-400' : 'text-black'}`}>
              {isCodeVerified ? '인증완료' : isVerifyingCode ? '확인 중...' : '확인'}
            </Text>
          </TouchableOpacity>
        </View>

        {codeError && <Text className="text-red-500 font-pretendard text-xs -mt-4 mb-4">{codeError}</Text>}

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
