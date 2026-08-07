import {
  ForbiddenAccessError,
  getTeamDetail,
  ResourceNotFoundError,
  updateTeamRecruitment,
} from '@/api/team';
import { Back, DateIcon } from '@/assets/images/tool';
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

function parseIsoDate(value: string) {
  // "YYYY-MM-DD" 형태를 로컬 타임존 자정 기준으로 안전하게 파싱
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

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

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready' };

export default function TeamEditScreen() {
  const router = useRouter();
  const { teamId } = useLocalSearchParams<{ teamId: string }>();

  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

  const [selectedEvent, setSelectedEvent] = useState<{ id: number; title: string } | null>(null);

  const [title, setTitle] = useState('');
  const [capacity, setCapacity] = useState(1);

  const [startDate, setStartDate] = useState(() => new Date());
  const [isStartDatePickerVisible, setIsStartDatePickerVisible] = useState(false);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isEndDatePickerVisible, setIsEndDatePickerVisible] = useState(false);

  const [roles, setRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState('');

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const [characteristic, setCharacteristic] = useState('');
  const [promotionText, setPromotionText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getTeamDetail(Number(teamId))
      .then((data) => {
        if (!isMounted) return;

        setSelectedEvent(
          data.eventId && data.connectedActivityTitle
            ? { id: data.eventId, title: data.connectedActivityTitle }
            : null,
        );
        setTitle(data.title);
        // capacity는 팀장 포함 총원으로 저장돼 있어서, 모집인원 입력값으로 되돌린다 (createTeamRecruitment와 대칭).
        setCapacity(Math.max(1, data.capacity - 1));
        setStartDate(parseIsoDate(data.recruitmentStartDate));
        setEndDate(parseIsoDate(data.recruitmentEndDate));
        setRoles(data.role);
        setSkills(data.requiredSkills ?? []);
        setCharacteristic(data.characteristic ?? '');
        setPromotionText(data.promotionText ?? '');

        setLoadState({ status: 'ready' });
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err instanceof ForbiddenAccessError) {
          setLoadState({ status: 'error', message: '이 팀의 팀장만 수정할 수 있어요.' });
        } else if (err instanceof ResourceNotFoundError) {
          setLoadState({ status: 'error', message: '팀 정보를 찾을 수 없어요.' });
        } else {
          setLoadState({
            status: 'error',
            message: err instanceof Error ? err.message : '팀 정보를 불러오지 못했어요.',
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [teamId]);

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
      await updateTeamRecruitment(Number(teamId), {
        eventId: selectedEvent?.id,
        title: title.trim(),
        promotionText: promotionText.trim() || undefined,
        role: roles,
        characteristic: characteristic.trim() || undefined,
        requiredSkills: skills.length > 0 ? skills : undefined,
        capacity: capacity + 1,
        recruitmentStartDate: formatIsoDate(startDate),
        recruitmentEndDate: formatIsoDate(endDate),
      });
      Alert.alert('수정 완료', '팀 모집글 수정이 완료되었어요.', [{ text: '확인', onPress: () => router.back() }]);
    } catch (error) {
      if (error instanceof ForbiddenAccessError) {
        Alert.alert('권한 없음', '이 팀의 팀장만 수정할 수 있어요.');
      } else if (error instanceof ResourceNotFoundError) {
        Alert.alert('알림', '팀 정보를 찾을 수 없어요.');
      } else {
        Alert.alert('오류', error instanceof Error ? error.message : '수정에 실패했어요. 잠시 후 다시 시도해주세요.');
      }
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
        <Text className="text-black text-2xl font-pretendard-bold">팀 모집글 수정</Text>
        <View style={{ width: 26, height: 26 }} />
      </View>

      {loadState.status === 'loading' && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4F46E5" size="large" />
        </View>
      )}

      {loadState.status === 'error' && (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-gray-500 font-pretendard-medium text-center">
            {loadState.message}
          </Text>
        </View>
      )}

      {loadState.status === 'ready' && (
        <>
          <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            <Text className="text-gray-400 text-base font-pretendard-regular mt-7 mb-7">
              모집글 내용을 수정해주세요.
            </Text>

            <View className="mb-6">
              <FieldLabel>연결할 활동 / 공모전</FieldLabel>
              <View className="flex-row items-center justify-between px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50">
                <Text
                  className={`flex-1 ${selectedEvent ? 'text-gray-500 font-pretendard-medium' : 'text-gray-400 font-pretendard-regular'}`}
                  numberOfLines={1}
                >
                  {selectedEvent ? selectedEvent.title : '연결 안 함 (자율 프로젝트)'}
                </Text>
              </View>
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
              <TouchableOpacity
                onPress={() => setIsStartDatePickerVisible(true)}
                className="flex-row items-center justify-between px-4 py-3.5 rounded-xl border border-gray-200"
              >
                <Text className="text-gray-900 font-pretendard-medium">{formatDisplayDate(startDate)}</Text>
                <Image source={DateIcon} style={{ width: 18, height: 18 }} contentFit="contain" />
              </TouchableOpacity>
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
                <Text className="text-white font-pretendard-bold text-base">수정하기</Text>
              )}
            </TouchableOpacity>
          </View>
          </KeyboardAvoidingView>

          {isStartDatePickerVisible && (
            <CalendarModal
              initialDate={startDate}
              onSelect={(date) => {
                setStartDate(date);
                setIsStartDatePickerVisible(false);
              }}
              onClose={() => setIsStartDatePickerVisible(false)}
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
        </>
      )}
    </SafeAreaView>
  );
}