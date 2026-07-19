// src/app/pwchange.tsx
import { clearTokens } from '@/api/tokenStorage';
import { changePassword } from '@/api/user';
import { Lock, X } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PasswordChangeScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSubmitEnabled =
    !!currentPassword &&
    newPassword.length >= 10 &&
    newPassword.length <= 20 &&
    newPassword === newPasswordConfirm;

  const handleSubmit = async () => {
    if (!isSubmitEnabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword, newPasswordConfirm);
      Alert.alert('비밀번호 변경 완료', '비밀번호가 변경되었습니다.\n재로그인 해주세요.', [
        {
          text: '확인',
          onPress: () => {
            clearTokens();
            router.replace('/login');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('비밀번호 변경 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.', [
        { text: '확인' },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-6 pt-20 pb-10">
        <View style={{ width: 26, height: 26 }} />
        <Text className="text-black text-2xl font-pretendard-bold">비밀번호 변경</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={X} style={{ width: 26, height: 26 }} contentFit="contain" />
        </TouchableOpacity>
      </View>

      <View className="items-center mb-8">
        <View className="w-32 h-32 rounded-full border border-[#DCE4FE] items-center justify-center">
          <Image source={Lock} style={{ width: 56, height: 56 }} contentFit="contain" />
        </View>
      </View>

      <View className="px-8 mb-6">
        <Text className="text-gray-500 text-base font-pretendard-semibold">
          새 비밀번호는 10~20자 사이로 {'\n'}영문, 숫자, 특수문자를 모두 포함해주세요.
        </Text>
      </View>

      <View className="flex-1 px-8">
        <TextInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="현재 비밀번호"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={{ verticalAlign: 'middle' }}
          className="h-12 mb-6 text-black border-b border-gray-300 font-pretendard"
        />

        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="변경할 비밀번호"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={{ verticalAlign: 'middle' }}
          className="h-12 mb-6 text-black border-b border-gray-300 font-pretendard"
        />

        <TextInput
          value={newPasswordConfirm}
          onChangeText={setNewPasswordConfirm}
          placeholder="변경할 비밀번호 재입력"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={{ verticalAlign: 'middle' }}
          className="h-12 mb-6 text-black border-b border-gray-300 font-pretendard"
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isSubmitEnabled || isSubmitting}
          className={`h-14 mt-4 rounded-xl justify-center items-center ${
            isSubmitEnabled ? 'bg-[#3E6AF4]' : 'bg-[#3E6AF4]/40'
          }`}
        >
          <Text className="text-white text-lg font-pretendard-semibold">
            {isSubmitting ? '변경 중...' : '변경하기'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
