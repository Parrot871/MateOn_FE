// app/team/proposal.tsx
import {
  AiServerError,
  createTeamOffer,
  DuplicateResourceError,
  ForbiddenAccessError,
  getTeamToUserProposalDraft,
  InvalidInputError,
  RecommendationNotFoundError,
  ResourceNotFoundError,
  SchoolNotVerifiedError,
  TeamRecruitmentClosedError,
} from '@/api/team';
import { Back } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TeamProposalDraftScreen() {
  const params = useLocalSearchParams<{
    teamId: string;
    userId: string;
    name: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const teamId = Number(params.teamId);
  const userId = Number(params.userId);

  const [message, setMessage] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (Number.isNaN(teamId) || Number.isNaN(userId)) {
      setDraftError('잘못된 요청이에요.');
      return;
    }

    let isMounted = true;
    setDraftLoading(true);
    setDraftError(null);

    getTeamToUserProposalDraft({ teamId, userId })
      .then((draft) => {
        if (!isMounted) return;
        setMessage(draft.message);
      })
      .catch((error) => {
        if (!isMounted) return;

        if (error instanceof ForbiddenAccessError) {
          setDraftError('이 팀의 팀장만 제안 문구를 생성할 수 있어요.');
        } else if (error instanceof RecommendationNotFoundError) {
          setDraftError('최근 추천 결과에서 이 유저를 찾을 수 없어요.');
        } else if (error instanceof AiServerError) {
          setDraftError('AI 서버가 잠시 응답하지 않고 있어요. 잠시 후 다시 시도해주세요.');
        } else {
          setDraftError('제안 문구를 불러오지 못했어요.');
        }
      })
      .finally(() => {
        if (isMounted) setDraftLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [teamId, userId]);

  const handleSend = async () => {
    if (Number.isNaN(teamId) || Number.isNaN(userId) || sending) return;

    setSending(true);
    try {
      await createTeamOffer({ teamId, userId, message });
      Alert.alert('제안 완료', `${params.name ?? '해당 유저'}에게 제안을 보냈어요.`, [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error) {
      if (error instanceof SchoolNotVerifiedError) {
        Alert.alert('알림', '학교 인증 후 제안을 보낼 수 있어요.');
      } else if (error instanceof TeamRecruitmentClosedError) {
        Alert.alert('알림', '모집이 마감되었거나 종료된 팀이에요.');
      } else if (error instanceof InvalidInputError) {
        Alert.alert('알림', '자기 자신에게는 제안을 보낼 수 없어요.');
      } else if (error instanceof DuplicateResourceError) {
        Alert.alert('알림', '이미 팀원이거나 지원/제안이 진행 중인 유저예요.');
      } else if (error instanceof ForbiddenAccessError) {
        Alert.alert('권한 없음', '이 팀의 팀장만 제안을 보낼 수 있어요.');
      } else if (error instanceof ResourceNotFoundError) {
        Alert.alert('알림', '팀 또는 유저 정보를 찾을 수 없어요.');
      } else {
        Alert.alert('오류', '제안을 보내지 못했어요. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50/60">
      <View className="bg-white border-b border-gray-200">
        <View
          className="px-5 flex-row items-center justify-between"
          style={{ paddingTop: Math.max(insets.top, 16) + 6, paddingBottom: 14 }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="w-8 h-8 justify-center items-start"
          >
            <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
          </TouchableOpacity>
          <Text className="text-black text-2xl font-pretendard-bold flex-1 text-center mr-8">
            제안 문구 작성
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5"
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {params.name && (
          <Text className="text-gray-500 text-sm font-pretendard-medium mb-3">
            {params.name} 님에게 보낼 제안이에요
          </Text>
        )}

        <View
          className="bg-white border border-gray-100/80 rounded-3xl p-5"
          style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}
        >
          <Text className="text-black text-base font-pretendard-bold mb-3">✨ AI 제안 초안</Text>

          {draftLoading ? (
            <View className="py-10 items-center justify-center">
              <ActivityIndicator color="#2563eb" size="small" />
            </View>
          ) : draftError ? (
            <Text className="text-gray-400 font-pretendard text-xs">{draftError}</Text>
          ) : (
            <TextInput
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical="top"
              className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-pretendard-medium text-gray-700 min-h-[160px]"
              placeholder="제안 메시지를 입력하세요"
            />
          )}
        </View>
      </ScrollView>

      <View
        className="flex-row bg-white border-t border-gray-100 px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          disabled={sending}
          className="flex-1 mr-2 border border-gray-200 rounded-2xl py-3.5 items-center justify-center"
        >
          <Text className="text-gray-500 font-pretendard-bold text-sm">취소</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || draftLoading || !!draftError}
          className="flex-1 ml-2 bg-blue-600 rounded-2xl py-3.5 items-center justify-center"
          style={sending || draftLoading || !!draftError ? { opacity: 0.5 } : undefined}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-white font-pretendard-bold text-sm">보내기</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}