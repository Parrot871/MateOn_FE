import { Back, DateIcon, X } from '@/assets/images/tool';
import { fetchEvents, type EventCategory, type EventItem } from '@/api/events';
import { createTeamRecruitment } from '@/api/team';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORY_TABS: { label: string; value: EventCategory }[] = [
  { label: '공모전', value: 'CONTEST' },
  { label: '대외활동', value: 'EXTERNAL' },
  { label: '교내활동', value: 'SCHOOL' },
];

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

function FieldLabel({ children }: { children: string }) {
  return <Text className="text-gray-900 text-xl font-pretendard-bold mb-2">{children}</Text>;
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View className="flex-row items-center bg-indigo-50 rounded-full pl-3 pr-2 py-1.5 mr-2 mb-2">
      <Text className="text-indigo-600 text-base font-pretendard-medium mr-1">{label}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text className="text-indigo-400 text-base font-pretendard-bold">×</Text>
      </TouchableOpacity>
    </View>
  );
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

function ActivityPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (event: { id: number; title: string } | null) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<EventCategory>('CONTEST');
  const [items, setItems] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetchEvents(category, controller.signal)
      .then((events) => setItems(events.filter((e) => e.category === category)))
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setItems([]);
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, [category]);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-6 pt-2 pb-2">
          <View style={{ width: 26, height: 26 }} />
          <Text className="text-black text-2xl font-pretendard-bold">활동 선택</Text>
          <TouchableOpacity onPress={onClose}>
            <Image source={X} style={{ width: 26, height: 26 }} contentFit="contain" />
          </TouchableOpacity>
        </View>

        <View className="flex-row px-5 py-3 gap-2">
          {CATEGORY_TABS.map((tab) => {
            const isActive = category === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                onPress={() => {
                  setCategory(tab.value);
                  setIsLoading(true);
                }}
                className={`px-4 h-9 rounded-full justify-center items-center border ${
                  isActive ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'
                }`}
              >
                <Text className={`text-sm font-pretendard-semibold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => onSelect(null)}
          className="mx-5 mb-3 px-4 py-3 rounded-xl border border-gray-200 items-center"
        >
          <Text className="text-gray-600 font-pretendard-medium">연결 안 함 (자율 프로젝트)</Text>
        </TouchableOpacity>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#4F46E5" />
          </View>
        ) : (
          <ScrollView className="flex-1 px-5" contentContainerClassName="gap-2">
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => onSelect({ id: item.id, title: item.title })}
                className="px-4 py-3.5 rounded-xl border border-gray-200"
              >
                <Text className="text-gray-900 font-pretendard-medium" numberOfLines={2}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
            {items.length === 0 && (
              <Text className="text-gray-400 text-center mt-10 font-pretendard-medium">
                연결할 수 있는 활동이 없어요.
              </Text>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

export default function TeamRecruitScreen() {
  const router = useRouter();
  const { eventId, eventTitle } = useLocalSearchParams<{ eventId?: string; eventTitle?: string }>();

  const [selectedEvent, setSelectedEvent] = useState<{ id: number; title: string } | null>(
    eventId && eventTitle ? { id: Number(eventId), title: eventTitle } : null
  );
  const [activityModalVisible, setActivityModalVisible] = useState(false);

  const [title, setTitle] = useState('');
  const [capacity, setCapacity] = useState(1);

  const [startDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isEndDatePickerVisible, setIsEndDatePickerVisible] = useState(false);

  const [roles, setRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState('');

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const [characteristic, setCharacteristic] = useState('');
  const [promotionText, setPromotionText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const addRole = () => {
    const value = roleInput.trim();
    if (!value) return;
    if (!roles.includes(value)) setRoles((prev) => [...prev, value]);
    setRoleInput('');
  };

  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) return;
    if (!skills.includes(value)) setSkills((prev) => [...prev, value]);
    setSkillInput('');
  };

  const canSubmit =
    title.trim().length > 0 && roles.length > 0 && capacity >= 1 && !!endDate && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !endDate) return;

    if (endDate < startDate) {
      Alert.alert('알림', '모집 마감날짜는 시작날짜보다 빠를 수 없어요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTeamRecruitment({
        eventId: selectedEvent?.id,
        title: title.trim(),
        promotionText: promotionText.trim() || undefined,
        role: roles,
        characteristic: characteristic.trim() || undefined,
        requiredSkills: skills.length > 0 ? skills : undefined,
        capacity,
        recruitmentStartDate: formatIsoDate(startDate),
        recruitmentEndDate: formatIsoDate(endDate),
      });
      Alert.alert('등록 완료', '팀 모집글 등록이 완료되었어요.', [{ text: '확인', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('오류', error instanceof Error ? error.message : '등록에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-6 pt-2 pb-2">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
        </TouchableOpacity>
        <Text className="text-black text-2xl font-pretendard-bold">팀 모집글 작성</Text>
        <View style={{ width: 26, height: 26 }} />
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Text className="text-gray-400 text-base font-pretendard-regular mt-7 mb-7">
          공모전·교내·대외 활동별로 함께할 팀원을 모집해보세요.
        </Text>

        <View className="mb-6">
          <FieldLabel>연결할 활동 / 공모전</FieldLabel>
          <TouchableOpacity
            onPress={() => setActivityModalVisible(true)}
            className="flex-row items-center justify-between px-4 py-3.5 rounded-xl border border-gray-200"
          >
            <Text
              className={`flex-1 ${selectedEvent ? 'text-gray-900 font-pretendard-medium' : 'text-gray-400 font-pretendard-regular'}`}
              numberOfLines={1}
            >
              {selectedEvent ? selectedEvent.title : '연결할 활동을 선택해주세요 (선택)'}
            </Text>
            {selectedEvent && (
              <TouchableOpacity
                onPress={() => setSelectedEvent(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="ml-2"
              >
                <Image source={X} style={{ width: 18, height: 18 }} contentFit="contain" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <FieldLabel>제목</FieldLabel>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력해주세요"
            placeholderTextColor="#9CA3AF"
            className="border-b border-gray-200 py-2 text-base font-pretendard-regular text-gray-900"
          />
        </View>

        <View className="mb-6">
          <FieldLabel>모집 인원</FieldLabel>
          <View className="flex-row items-center justify-between px-2">
            <TouchableOpacity
              onPress={() => setCapacity((c) => Math.max(1, c - 1))}
              className="w-9 h-9 rounded-full border border-gray-300 items-center justify-center"
            >
              <Text className="text-lg text-gray-600 font-pretendard-medium">−</Text>
            </TouchableOpacity>
            <Text className="text-lg font-pretendard-bold text-gray-900">{capacity}명</Text>
            <TouchableOpacity
              onPress={() => setCapacity((c) => c + 1)}
              className="w-9 h-9 rounded-full border border-gray-300 items-center justify-center"
            >
              <Text className="text-lg text-gray-600 font-pretendard-medium">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6">
          <FieldLabel>모집 시작날짜</FieldLabel>
          <View className="flex-row items-center justify-between px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50">
            <Text className="text-gray-500 font-pretendard-medium">{formatDisplayDate(startDate)} (오늘)</Text>
            <Image source={DateIcon} style={{ width: 18, height: 18 }} contentFit="contain" />
          </View>
        </View>

        <View className="mb-6">
          <FieldLabel>모집 마감날짜</FieldLabel>
          <TouchableOpacity
            onPress={() => setIsEndDatePickerVisible(true)}
            className="flex-row items-center justify-between px-4 py-3.5 rounded-xl border border-gray-200"
          >
            <Text className={endDate ? 'text-gray-900 font-pretendard-medium' : 'text-gray-400 font-pretendard-regular'}>
              {endDate ? formatDisplayDate(endDate) : 'YYYY.MM.DD'}
            </Text>
            <Image source={DateIcon} style={{ width: 18, height: 18 }} contentFit="contain" />
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <FieldLabel>역할</FieldLabel>
          <View className="flex-row items-center gap-3">
            <TextInput
              value={roleInput}
              onChangeText={setRoleInput}
              onSubmitEditing={addRole}
              returnKeyType="done"
              placeholder="역할을 입력해주세요"
              placeholderTextColor="#9CA3AF"
              className="flex-1 border-b border-gray-200 py-2 text-base font-pretendard-regular text-gray-900"
            />
            <TouchableOpacity
              onPress={addRole}
              className="w-8 h-8 rounded-full border border-gray-300 items-center justify-center"
            >
              <Text className="text-gray-600 font-pretendard-medium">+</Text>
            </TouchableOpacity>
          </View>
          {roles.length > 0 && (
            <View className="flex-row flex-wrap mt-3">
              {roles.map((role) => (
                <Chip key={role} label={role} onRemove={() => setRoles((prev) => prev.filter((r) => r !== role))} />
              ))}
            </View>
          )}
        </View>

        <View className="mb-6">
          <FieldLabel>우대 역량</FieldLabel>
          <View className="flex-row items-center gap-3">
            <TextInput
              value={skillInput}
              onChangeText={setSkillInput}
              onSubmitEditing={addSkill}
              returnKeyType="done"
              placeholder="역량을 입력해주세요"
              placeholderTextColor="#9CA3AF"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-base font-pretendard-regular text-gray-900"
            />
            <TouchableOpacity
              onPress={addSkill}
              className="w-8 h-8 rounded-full border border-gray-300 items-center justify-center"
            >
              <Text className="text-gray-600 font-pretendard-medium">+</Text>
            </TouchableOpacity>
          </View>
          {skills.length > 0 && (
            <View className="flex-row flex-wrap mt-3">
              {skills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  onRemove={() => setSkills((prev) => prev.filter((s) => s !== skill))}
                />
              ))}
            </View>
          )}
        </View>

        <View className="mb-6">
          <FieldLabel>특성</FieldLabel>
          <TextInput
            value={characteristic}
            onChangeText={setCharacteristic}
            placeholder="선호하는 특성을 입력해주세요"
            placeholderTextColor="#9CA3AF"
            className="border-b border-gray-200 py-2 text-base font-pretendard-regular text-gray-900"
          />
        </View>

        <View className="mb-4">
          <FieldLabel>진행 방식 및 한 줄 소개</FieldLabel>
          <TextInput
            value={promotionText}
            onChangeText={setPromotionText}
            placeholder="진행 방식을 상세하게 적어주세요"
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            className="px-4 py-3 rounded-xl border border-gray-200 text-base font-pretendard-regular text-gray-900 min-h-[110px]"
          />
        </View>
      </ScrollView>

      <View className="px-5 pt-3 pb-6 border-t border-gray-100 bg-white">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={{ opacity: canSubmit ? 1 : 0.4 }}
          className="bg-indigo-600 rounded-xl py-4 items-center"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-pretendard-bold text-base">등록하기</Text>
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>

      {activityModalVisible && (
        <ActivityPickerModal
          onSelect={(event) => {
            setSelectedEvent(event);
            setActivityModalVisible(false);
          }}
          onClose={() => setActivityModalVisible(false)}
        />
      )}

      {isEndDatePickerVisible && (
        <CalendarModal
          initialDate={endDate ?? startDate}
          onSelect={(date) => {
            setEndDate(date);
            setIsEndDatePickerVisible(false);
          }}
          onClose={() => setIsEndDatePickerVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}
