import {
  createEvent,
  EVENT_FIELD_LABELS,
  extractEventImage,
  type EventCategory,
  type EventField,
} from '@/api/events';
import { X } from '@/assets/images/tool';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
];

const FIELD_OPTIONS = Object.entries(EVENT_FIELD_LABELS) as [EventField, string][];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

function formatDisplayDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function formatIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseIsoDate(value: string): Date {
  if (!value) return new Date();
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function CalendarModal({
  initialDate,
  onSelect,
  onClose,
}: {
  initialDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity className="flex-1 bg-black/40 items-center justify-center" activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} className="bg-white rounded-2xl p-4">
          <DateTimePicker
            value={initialDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            themeVariant="light"
            onValueChange={(_event, date) => onSelect(date)}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

type ActiveDatePicker = 'start' | 'end' | null;

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
  const [activeDatePicker, setActiveDatePicker] = useState<ActiveDatePicker>(null);

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

    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
      Alert.alert('사진 용량 초과', '10MB 이하의 이미지만 업로드할 수 있어요.');
      return;
    }

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
    <View className="flex-1 bg-white">
      {/* GNB / Header - 스크롤 밖에 고정 */}
      <View
        className="px-5 bg-white border-b border-gray-100 flex-row items-center justify-between"
        style={{ paddingTop: Math.max(insets.top, 16) + 6, paddingBottom: 14 }}
      >
        <View style={{ width: 26, height: 26 }} />
        <Text className="text-gray-900 text-2xl font-pretendard-bold flex-1 text-center tracking-tight">
          활동 등록
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="w-8 h-8 justify-center items-end"
        >
          <Image source={X} style={{ width: 26, height: 26 }} contentFit="contain" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="px-5"
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
        >
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
                <Text className="text-gray-300 text-xs font-pretendard mt-1">jpg/png/webp, 최대 1MB</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 카테고리 */}
          <Text className="text-black text-base font-pretendard-bold mb-2">카테고리 </Text>
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
          <Text className="text-black text-base font-pretendard-bold mb-2">활동 분야 </Text>
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
          <Text className="text-black text-base font-pretendard-bold mb-2">제목 </Text>
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
            placeholder="주최 기관명을 입력해주세요"
            placeholderTextColor="#9CA3AF"
            className="h-12 px-4 mb-5 rounded-xl bg-gray-100 text-base font-pretendard text-black"
          />

          {/* 기간 */}
          <Text className="text-black text-base font-pretendard-bold mb-2">활동 기간</Text>
          <View className="flex-row gap-2 mb-5">
            <TouchableOpacity
              onPress={() => setActiveDatePicker('start')}
              className="flex-1 h-12 px-4 rounded-xl bg-gray-100 justify-center"
            >
              <Text
                className={`text-base font-pretendard ${form.startDate ? 'text-black' : 'text-gray-400'}`}
              >
                {form.startDate ? formatDisplayDate(parseIsoDate(form.startDate)) : '시작일 선택'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveDatePicker('end')}
              className="flex-1 h-12 px-4 rounded-xl bg-gray-100 justify-center"
            >
              <Text
                className={`text-base font-pretendard ${form.endDate ? 'text-black' : 'text-gray-400'}`}
              >
                {form.endDate ? formatDisplayDate(parseIsoDate(form.endDate)) : '종료일 선택'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 대상 학교 */}
          <Text className="text-black text-base font-pretendard-bold mb-2">대상 학교</Text>
          <TextInput
            value={form.targetSchool}
            onChangeText={(text) => updateField('targetSchool', text)}
            placeholder="미입력 시 전국 대상"
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

      {activeDatePicker === 'start' && (
        <CalendarModal
          initialDate={form.startDate ? parseIsoDate(form.startDate) : new Date()}
          onSelect={(date) => {
            updateField('startDate', formatIsoDate(date));
            // 시작일이 종료일보다 늦어지면 종료일도 같이 맞춰줌
            if (form.endDate && parseIsoDate(form.endDate) < date) {
              updateField('endDate', formatIsoDate(date));
            }
            setActiveDatePicker(null);
          }}
          onClose={() => setActiveDatePicker(null)}
        />
      )}

      {activeDatePicker === 'end' && (
        <CalendarModal
          initialDate={form.endDate ? parseIsoDate(form.endDate) : parseIsoDate(form.startDate)}
          onSelect={(date) => {
            updateField('endDate', formatIsoDate(date));
            setActiveDatePicker(null);
          }}
          onClose={() => setActiveDatePicker(null)}
        />
      )}
    </View>
  );
}