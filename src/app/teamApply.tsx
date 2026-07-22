import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { submitTeamApplication } from '@/api/apply';
import { useTeamRecStore } from '@/store/teamRecStore';

export default function TeamApplyScreen() {
  const router = useRouter();
  const {
    teamId,
    introduction: initialIntroduction,
    message: initialMessage,
  } = useLocalSearchParams<{
    teamId: string;
    introduction?: string;
    message?: string;
  }>();

  const [introduction, setIntroduction] = useState(initialIntroduction ?? '');
  const [message, setMessage] = useState(initialMessage ?? '');
  const [contactNumber, setContactNumber] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI 초안을 받아서 들어온 경우인지 (안내 배너 표시용)
  const isFromAI = !!initialMessage;

  const canSubmit =
    message.trim().length > 0 && contactNumber.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (submitting) return;

    if (message.trim().length === 0) {
      Alert.alert('알림', '지원 동기를 입력해주세요.');
      return;
    }
    if (contactNumber.trim().length === 0) {
      Alert.alert('알림', '연락처를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await submitTeamApplication(Number(teamId), {
        introduction: introduction.trim() || undefined,
        message: message.trim(),
        contactNumber: contactNumber.trim(),
        portfolioUrl: portfolioUrl.trim() || undefined,
      });
      // 지원서 제출이 실제로 성공했을 때만 홈 화면의 팀 추천 캐시를 무효화한다.
      // 홈 화면에서 매번 포커스마다 재조회하지 않고, 이 시점에만 강제 갱신을 트리거한다.
      useTeamRecStore.getState().fetchTeamRec({ force: true });

      Alert.alert('지원 완료', '지원서가 제출됐어요.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert(
        '오류',
        err instanceof Error ? err.message : '지원서 제출에 실패했어요. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* 상단 헤더 */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-start justify-center -ml-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-2xl text-gray-800">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-pretendard-bold text-gray-900">
          지원서 작성
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1 px-5 pt-5"
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {isFromAI && (
          <View className="bg-indigo-50 rounded-xl px-4 py-3 mb-5">
            <Text className="text-indigo-600 text-xs font-pretendard-medium leading-5">
              ✨ AI가 초안을 작성했어요. 자유롭게 수정한 뒤 제출해주세요.
            </Text>
          </View>
        )}

        {/* 소개 (선택) */}
        <View className="mb-5">
          <Text className="text-gray-900 text-sm font-pretendard-bold mb-2">
            간단한 소개{' '}
            <Text className="text-gray-400 font-pretendard-regular">(선택)</Text>
          </Text>
          <TextInput
            value={introduction}
            onChangeText={setIntroduction}
            placeholder="본인의 역량이나 강점을 간단히 소개해주세요"
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            className="bg-gray-50 rounded-xl px-4 py-3 text-sm font-pretendard-regular text-gray-900 min-h-[80px]"
          />
        </View>

        {/* 지원 동기 (필수) */}
        <View className="mb-5">
          <Text className="text-gray-900 text-sm font-pretendard-bold mb-2">
            지원 동기 <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="이 팀에 지원하는 이유를 자세히 적어주세요"
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            className="bg-gray-50 rounded-xl px-4 py-3 text-sm font-pretendard-regular text-gray-900 min-h-[140px]"
          />
        </View>

        {/* 연락처 (필수) */}
        <View className="mb-5">
          <Text className="text-gray-900 text-sm font-pretendard-bold mb-2">
            연락처 <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={contactNumber}
            onChangeText={setContactNumber}
            placeholder="010-0000-0000"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            className="bg-gray-50 rounded-xl px-4 py-3 text-sm font-pretendard-regular text-gray-900"
          />
        </View>

        {/* 포트폴리오 URL (선택) */}
        <View className="mb-5">
          <Text className="text-gray-900 text-sm font-pretendard-bold mb-2">
            포트폴리오 / GitHub URL{' '}
            <Text className="text-gray-400 font-pretendard-regular">(선택)</Text>
          </Text>
          <TextInput
            value={portfolioUrl}
            onChangeText={setPortfolioUrl}
            placeholder="https://github.com/..."
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="url"
            className="bg-gray-50 rounded-xl px-4 py-3 text-sm font-pretendard-regular text-gray-900"
          />
        </View>
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View className="px-5 pt-3 pb-6 border-t border-gray-100 bg-white">
        <TouchableOpacity
          activeOpacity={0.8}
          className="bg-indigo-600 rounded-xl py-4 items-center"
          disabled={!canSubmit}
          style={{ opacity: canSubmit ? 1 : 0.4 }}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-pretendard-bold text-base">
              지원서 제출
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}