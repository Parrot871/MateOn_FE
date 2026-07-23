
// app/myApplicationEdit.tsx
import { getApplicationDetail, updateApplication } from '@/api/apply';
import { Back } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function FormField({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="text-xs font-pretendard-semibold text-gray-400 mb-2">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`rounded-2xl border border-gray-100 bg-gray-50/80 px-4 font-pretendard text-sm text-gray-900 ${
          multiline ? 'h-28 py-3.5 leading-relaxed' : 'h-12'
        }`}
      />
    </View>
  );
}

export default function MyApplicationEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [introduction, setIntroduction] = useState('');
  const [message, setMessage] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  useFocusEffect(
    useCallback(() => {
      const applicationId = Number(id);

      if (!id || Number.isNaN(applicationId)) {
        setErrorMessage('잘못된 접근입니다.');
        setLoading(false);
        return;
      }

      let active = true;
      setLoading(true);
      setErrorMessage(null);

      getApplicationDetail(applicationId)
        .then((data) => {
          if (!active) return;
          setIntroduction(data.introduction ?? '');
          setMessage(data.message ?? '');
          setContactNumber(data.contactNumber ?? '');
          setPortfolioUrl(data.portfolioUrl ?? '');
        })
        .catch((err) => {
          console.error('지원서 조회 실패:', err);
          if (active) setErrorMessage(err instanceof Error ? err.message : '조회에 실패했습니다.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [id])
  );

  const handleSave = async () => {
    const applicationId = Number(id);

    if (!message.trim()) {
      Alert.alert('알림', '지원 동기를 입력해주세요.');
      return;
    }
    if (!contactNumber.trim()) {
      Alert.alert('알림', '연락처를 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      await updateApplication(applicationId, {
        introduction: introduction.trim(),
        message: message.trim(),
        contactNumber: contactNumber.trim(),
        portfolioUrl: portfolioUrl.trim(),
      });
      Alert.alert('완료', '지원서가 수정되었습니다.', [{ text: '확인', onPress: () => router.back() }]);
    } catch (err) {
      console.error('지원서 수정 실패:', err);
      Alert.alert('오류', err instanceof Error ? err.message : '지원서 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-gray-50/60" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* GNB Header */}
      <View
        className="px-5 bg-white border-b border-gray-100 flex-row items-center justify-between"
        style={{ paddingTop: Math.max(insets.top, 16) + 6, paddingBottom: 14 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="w-8 h-8 justify-center items-start"
        >
          <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
        </TouchableOpacity>
        <Text className="text-gray-900 text-2xl font-pretendard-bold flex-1 text-center mr-8 tracking-tight">
          지원서 수정
        </Text>
      </View>

      {/* Loading State */}
      {loading && (
        <View className="py-24 items-center justify-center flex-1">
          <ActivityIndicator color="#2563eb" size="small" />
          <Text className="text-gray-400 font-pretendard text-xs mt-3">지원서를 불러오는 중...</Text>
        </View>
      )}

      {/* Error State */}
      {errorMessage && !loading && (
        <View className="p-5 flex-1 justify-center">
          <View className="py-16 items-center justify-center bg-white rounded-3xl p-6 border border-gray-100">
            <Text className="text-gray-800 font-pretendard-semibold text-sm mb-1">지원서를 불러올 수 없습니다</Text>
            <Text className="text-gray-400 font-pretendard text-xs text-center">{errorMessage}</Text>
          </View>
        </View>
      )}

      {/* Edit Form */}
      {!loading && !errorMessage && (
        <>
          <ScrollView
            className="flex-1"
            contentContainerClassName="p-5"
            contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
            showsVerticalScrollIndicator={false}
          >
            {/* 지원 동기 & 한 줄 소개 카드 */}
            <View
              className="bg-white border border-gray-100/80 rounded-3xl p-5 mb-4 shadow-sm"
              style={{
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <FormField
                label="지원 동기"
                required
                value={message}
                onChangeText={setMessage}
                placeholder="지원 동기 및 자세한 내용을 입력해주세요"
                multiline
              />
              <FormField
                label="한 줄 소개"
                value={introduction}
                onChangeText={setIntroduction}
                placeholder="간단한 역량 및 본인 소개를 입력해주세요"
                multiline
              />
            </View>

            {/* 제출 연락 정보 카드 */}
            <View
              className="bg-white border border-gray-100/80 rounded-3xl p-5 shadow-sm"
              style={{
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <FormField
                label="연락처"
                required
                value={contactNumber}
                onChangeText={setContactNumber}
                placeholder="010-XXXX-XXXX"
              />
              <FormField
                label="포트폴리오"
                value={portfolioUrl}
                onChangeText={setPortfolioUrl}
                placeholder="포트폴리오 혹은 깃허브 URL"
              />
            </View>
          </ScrollView>

          {/* Fixed Bottom Save Button */}
          <View
            className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 12) + 4 }}
          >
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.88}
              className="h-12 rounded-2xl bg-blue-600 items-center justify-center"
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text className="text-white font-pretendard-bold text-sm">저장하기</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}
