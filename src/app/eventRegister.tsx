import {
  createEvent,
  EVENT_FIELD_LABELS,
  extractEventImage,
  type EventCategory,
  type EventField,
} from '@/api/events';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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

const CATEGORY_OPTIONS: { label: string; value: EventCategory }[] = [
  { label: '공모전', value: 'CONTEST' },
  { label: '대외활동', value: 'EXTERNAL' },
  { label: '교내활동', value: 'SCHOOL' },
  { label: '기타', value: 'ETC' },
];

const FIELD_OPTIONS = Object.entries(EVENT_FIELD_LABELS) as [EventField, string][];

type FormState = {
  category: EventCategory | null;
  field: EventField | null;
  title: string;
  description: string;
  imageUrl: string;
  detailUrl: string;
  startDate: string;
  endDate: string;
  organizer: string;
  targetSchool: string;
};

const EMPTY_FORM: FormState = {
  category: null,
  field: null,
  title: '',
  description: '',
  imageUrl: '',
  detailUrl: '',
  startDate: '',
  endDate: '',
  organizer: '',
  targetSchool: '',
};

export default function EventRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: EventCategory }>();

  const [form, setForm] = useState<FormState>({
    ...EMPTY_FORM,
    category: params.category ?? null,
  });
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePickPoster = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('사진 접근 권한 필요', '설정에서 사진 보관함 접근 권한을 허용해주세요.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setIsExtracting(true);

    try {
      const draft = await extractEventImage({
        uri: asset.uri,
        name: asset.fileName ?? 'poster.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });

      setForm({
        category: draft.category,
        field: draft.field,
        title: draft.title ?? '',
        description: draft.description ?? '',
        imageUrl: draft.imageUrl ?? '',
        detailUrl: draft.detailUrl ?? '',
        startDate: draft.startDate ?? '',
        endDate: draft.endDate ?? '',
        organizer: draft.organizer ?? '',
        targetSchool: draft.targetSchool ?? '',
      });
    } catch (error) {
      Alert.alert(
        '이미지 분석 실패',
        error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.category) {
      Alert.alert('카테고리를 선택해주세요.');
      return;
    }
    if (!form.field) {
      Alert.alert('활동 분야를 선택해주세요.');
      return;
    }
    if (!form.title.trim()) {
      Alert.alert('제목을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createEvent({
        category: form.category,
        field: form.field,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        detailUrl: form.detailUrl.trim() || undefined,
        startDate: form.startDate.trim() || undefined,
        endDate: form.endDate.trim() || undefined,
        organizer: form.organizer.trim() || undefined,
        targetSchool: form.targetSchool.trim() || undefined,
      });

      Alert.alert('등록 완료', '활동이 등록되었어요.', [
        { text: '확인', onPress: () => router.replace('/activity') },
      ]);
    } catch (error) {
      Alert.alert(
        '등록 실패',
        error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="px-5"
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 40 }}
      >
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-black text-lg font-pretendard">닫기</Text>
          </TouchableOpacity>
          <Text className="text-black text-xl font-pretendard-bold">활동 등록</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* 포스터 업로드 */}
        <TouchableOpacity
          onPress={handlePickPoster}
          disabled={isExtracting}
          className="h-40 mb-6 rounded-2xl border border-dashed border-gray-300 items-center justify-center overflow-hidden"
        >
          {isExtracting ? (
            <View className="items-center">
              <ActivityIndicator color="#3E6AF4" />
              <Text className="text-gray-400 mt-2 font-pretendard">포스터를 분석하고 있어요...</Text>
            </View>
          ) : form.imageUrl ? (
            <Image source={{ uri: form.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <View className="items-center">
              <Text className="text-gray-400 font-pretendard-semibold">+ 포스터 이미지로 자동 채우기</Text>
              <Text className="text-gray-300 text-xs font-pretendard mt-1">jpg/png/webp, 최대 10MB</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 카테고리 */}
        <Text className="text-black text-base font-pretendard-bold mb-2">카테고리 *</Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {CATEGORY_OPTIONS.map((opt) => {
            const isSelected = form.category === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => updateField('category', opt.value)}
                className={`h-9 px-4 rounded-full justify-center items-center border ${
                  isSelected ? 'bg-[#3E6AF4] border-[#3E6AF4]' : 'bg-white border-gray-200'
                }`}
              >
                <Text className={`font-pretendard-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 분야 */}
        <Text className="text-black text-base font-pretendard-bold mb-2">활동 분야 *</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
          className="mb-5"
        >
          {FIELD_OPTIONS.map(([value, label]) => {
            const isSelected = form.field === value;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => updateField('field', value)}
                className={`h-9 px-4 rounded-full justify-center items-center border ${
                  isSelected ? 'bg-[#3E6AF4] border-[#3E6AF4]' : 'bg-white border-gray-200'
                }`}
              >
                <Text className={`font-pretendard-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 제목 */}
        <Text className="text-black text-base font-pretendard-bold mb-2">제목 *</Text>
        <TextInput
          value={form.title}
          onChangeText={(text) => updateField('title', text)}
          placeholder="활동 제목을 입력해주세요"
          placeholderTextColor="#9CA3AF"
          className="h-12 px-4 mb-5 rounded-xl bg-gray-100 text-base font-pretendard text-black"
        />

        {/* 주최 */}
        <Text className="text-black text-base font-pretendard-bold mb-2">주최/주관</Text>
        <TextInput
          value={form.organizer}
          onChangeText={(text) => updateField('organizer', text)}
          placeholder="예: 업스테이지"
          placeholderTextColor="#9CA3AF"
          className="h-12 px-4 mb-5 rounded-xl bg-gray-100 text-base font-pretendard text-black"
        />

        {/* 기간 */}
        <Text className="text-black text-base font-pretendard-bold mb-2">활동 기간</Text>
        <View className="flex-row gap-2 mb-5">
          <TextInput
            value={form.startDate}
            onChangeText={(text) => updateField('startDate', text)}
            placeholder="시작일 YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
            className="flex-1 h-12 px-4 rounded-xl bg-gray-100 text-base font-pretendard text-black"
          />
          <TextInput
            value={form.endDate}
            onChangeText={(text) => updateField('endDate', text)}
            placeholder="종료일 YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
            className="flex-1 h-12 px-4 rounded-xl bg-gray-100 text-base font-pretendard text-black"
          />
        </View>

        {/* 대상 학교 */}
        <Text className="text-black text-base font-pretendard-bold mb-2">대상 학교</Text>
        <TextInput
          value={form.targetSchool}
          onChangeText={(text) => updateField('targetSchool', text)}
          placeholder="비우면 전국 대상 (예: 단국대학교,고려대학교)"
          placeholderTextColor="#9CA3AF"
          className="h-12 px-4 mb-5 rounded-xl bg-gray-100 text-base font-pretendard text-black"
        />

        {/* 상세 링크 */}
        <Text className="text-black text-base font-pretendard-bold mb-2">외부 상세 링크</Text>
        <TextInput
          value={form.detailUrl}
          onChangeText={(text) => updateField('detailUrl', text)}
          placeholder="https://..."
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          className="h-12 px-4 mb-5 rounded-xl bg-gray-100 text-base font-pretendard text-black"
        />

        {/* 상세 설명 */}
        <Text className="text-black text-base font-pretendard-bold mb-2">상세 설명</Text>
        <TextInput
          value={form.description}
          onChangeText={(text) => updateField('description', text)}
          placeholder="활동에 대해 자세히 설명해주세요"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          className="h-32 px-4 py-3 mb-8 rounded-xl bg-gray-100 text-base font-pretendard text-black"
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className="h-14 rounded-xl bg-[#3E6AF4] items-center justify-center"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-pretendard-semibold">등록하기</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}