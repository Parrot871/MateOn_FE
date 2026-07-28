// src/app/schoolVerify.tsx
import { requestEmailCode, verifyEmailCode } from '@/api/auth';
import { Back } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

const RESEND_COOLDOWN_SECONDS = 60;

export default function SchoolVerifyScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('알림', '학교 이메일을 입력해주세요.', [{ text: '확인' }]);
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
      await verifyEmailCode(email, code);
      setIsCodeVerified(true);
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : '인증코드 검증에 실패했습니다.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleComplete = () => {
    Alert.alert('학교 인증 완료', '학교 인증이 완료되었습니다.', [
      { text: '확인', onPress: () => router.back() },
    ]);
  };

  return (
    <View className="flex-1 bg-white">
      <TouchableOpacity onPress={() => router.back()} className="px-6 pt-20 pb-6">
        <Image source={Back} style={{ width: 24, height: 24 }} contentFit="contain" />
      </TouchableOpacity>

      <View className="flex-1 px-8">
        <Text className="text-black text-2xl font-pretendard-bold mb-10">
          재학생 인증을 위해{'\n'}학교 이메일을 입력해 주세요.
        </Text>

        <View className="flex-row items-center border-b border-gray-300 mb-6">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="학교 이메일 주소"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!isCodeVerified}
            style={{ verticalAlign: 'middle' }}
            className="flex-1 h-12 text-black font-pretendard"
          />
          <TouchableOpacity onPress={handleSendCode} disabled={isSendingCode || cooldown > 0 || isCodeVerified}>
            <Text className={`font-pretendard-semibold ${cooldown > 0 || isCodeVerified ? 'text-gray-400' : 'text-black'}`}>
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

        <TouchableOpacity
          onPress={handleComplete}
          disabled={!isCodeVerified}
          className={`h-14 mt-4 rounded-xl border border-[#3E6AF4] bg-white justify-center items-center ${
            isCodeVerified ? '' : 'opacity-40'
          }`}
        >
          <Text className="text-[#3E6AF4] text-lg font-pretendard-semibold">완료</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
