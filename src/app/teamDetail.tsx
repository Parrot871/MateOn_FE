import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AiServerError,
  getUserToTeamProposalDraft,
  MatchingIntentRequiredError,
  ProposalNotFoundError,
} from '@/api/apply';
import {
  cancelTeamOffer,
  completeTeamActivity,
  deleteTeam,
  ForbiddenAccessError,
  getTeamDetail,
  getTeamOffers,
  OfferAlreadyRespondedError,
  ResourceNotFoundError,
  TeamAlreadyEndedError,
  type OfferStatus,
  type TeamDetail,
  type TeamOfferResponseDTO,
} from '@/api/team';
import { Back } from '@/assets/images/tool';
import { getUnivByEmail } from '@/utils/univ';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: TeamDetail };

export default function TeamDetailScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const router = useRouter();

  const [state, setState] = useState<State>({ status: 'loading' });
  const [menuVisible, setMenuVisible] = useState(false);

  const load = useCallback(
    async (isRefetch = false) => {
      if (!isRefetch) {
        setState({ status: 'loading' });
      }

      try {
        const data = await getTeamDetail(Number(teamId));
        setState({ status: 'ready', data });
      } catch (err) {
        if (isRefetch) {
          return;
        }
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : '불러오지 못했어요.',
        });
      }
    },
    [teamId],
  );

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [load]),
  );

  const handleEndActivity = () => {
    Alert.alert(
      '활동 종료',
      '이 팀의 활동을 종료할까요? 종료 후에는 모집이 마감돼요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '종료하기',
          style: 'destructive',
          onPress: async () => {
            try {
              await completeTeamActivity(Number(teamId));
              await load(true);
              Alert.alert('완료', '팀 활동이 종료되었어요.');
            } catch (err) {
              if (err instanceof TeamAlreadyEndedError) {
                Alert.alert('알림', '이미 종료된 팀이에요.');
                load(true);
              } else if (err instanceof ForbiddenAccessError) {
                Alert.alert('권한 없음', '이 팀의 팀장만 종료할 수 있어요.');
              } else {
                Alert.alert('오류', '활동 종료에 실패했어요. 잠시 후 다시 시도해주세요.');
              }
            }
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert('팀 삭제', '이 팀을 삭제할까요? 이 작업은 되돌릴 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제하기',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTeam(Number(teamId));
            router.back();
          } catch (err) {
            if (err instanceof ForbiddenAccessError) {
              Alert.alert('권한 없음', '이 팀의 팀장만 삭제할 수 있어요.');
            } else if (err instanceof ResourceNotFoundError) {
              Alert.alert('알림', '이미 삭제되었거나 존재하지 않는 팀이에요.');
              router.back();
            } else {
              Alert.alert('오류', '삭제에 실패했어요. 잠시 후 다시 시도해주세요.');
            }
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-6 pt-2 pb-2 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
        </TouchableOpacity>
        <Text className="text-black text-2xl font-pretendard-bold">팀 상세정보</Text>
        {state.status === 'ready' && state.data.leader ? (
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Text className="text-2xl text-gray-700">⋯</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 26, height: 26 }} />
        )}
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable className="flex-1 bg-black/30 justify-end" onPress={() => setMenuVisible(false)}>
          <Pressable className="bg-white rounded-t-3xl pb-8" onPress={(e) => e.stopPropagation()}>
            <TouchableOpacity
              className="px-5 py-4 border-b border-gray-50"
              onPress={() => {
                setMenuVisible(false);
                router.push(`/teamEdit?teamId=${teamId}`);
              }}
            >
              <Text className="text-base font-pretendard-medium text-gray-900">모집글 수정하기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="px-5 py-4 border-b border-gray-50"
              onPress={() => {
                setMenuVisible(false);
                handleEndActivity();
              }}
            >
              <Text className="text-base font-pretendard-medium text-gray-900">활동 종료하기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="px-5 py-4"
              onPress={() => {
                setMenuVisible(false);
                handleDelete();
              }}
            >
              <Text className="text-base font-pretendard-medium text-red-500">모집글 삭제하기</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {state.status === 'loading' && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4F46E5" size="large" />
        </View>
      )}

      {state.status === 'error' && (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-gray-500 font-pretendard-medium text-center">
            {state.message}
          </Text>
        </View>
      )}

      {state.status === 'ready' && (
        <TeamDetailContent data={state.data} teamId={teamId} router={router} />
      )}
    </SafeAreaView>
  );
}

function Avatar() {
  return <View className="w-12 h-12 rounded-full bg-gray-200" />;
}

const OFFER_STATUS_LABEL: Record<OfferStatus, string> = {
  PENDING: '대기중',
  ACCEPTED: '수락됨',
  REJECTED: '거절됨',
  CANCELED: '취소됨',
};

const OFFER_STATUS_STYLE: Record<OfferStatus, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-600' },
  ACCEPTED: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  REJECTED: { bg: 'bg-red-50', text: 'text-red-500' },
  CANCELED: { bg: 'bg-gray-100', text: 'text-gray-400' },
};

function TeamDetailContent({
  data,
  teamId,
  router,
}: {
  data: TeamDetail;
  teamId: string;
  router: ReturnType<typeof useRouter>;
}) {
  const additionalMembers = data.currentMemberCount - 1;
  const leaderMetaLine = [getUnivByEmail(data.leaderEmail), data.leaderCollege, data.leaderMajor]
    .filter(Boolean)
    .join(' · ');
  const [aiLoading, setAiLoading] = useState(false);

  // 보낸 제안 목록 (팀장만)
  const [offers, setOffers] = useState<TeamOfferResponseDTO[] | null>(null);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  useEffect(() => {
    if (!data.leader) return;

    let isMounted = true;
    setOffersError(null);

    getTeamOffers(Number(teamId))
      .then((list) => {
        if (isMounted) setOffers(list);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err instanceof ForbiddenAccessError) {
          setOffersError('이 팀의 팀장만 볼 수 있어요.');
        } else {
          setOffersError(err instanceof Error ? err.message : '보낸 제안을 불러오지 못했어요.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [data.leader, teamId]);

  const handleCancelOffer = (offerId: number) => {
    Alert.alert('제안 취소', '보낸 제안을 취소할까요?', [
      { text: '아니요', style: 'cancel' },
      {
        text: '취소하기',
        style: 'destructive',
        onPress: async () => {
          setCancelingId(offerId);
          try {
            await cancelTeamOffer(offerId);
            setOffers((prev) =>
              prev
                ? prev.map((o) =>
                    o.offerId === offerId ? { ...o, status: 'CANCELED' as const } : o,
                  )
                : prev,
            );
          } catch (err) {
            if (err instanceof OfferAlreadyRespondedError) {
              Alert.alert('알림', '이미 응답이 처리된 제안이라 취소할 수 없어요.');
            } else if (err instanceof ForbiddenAccessError) {
              Alert.alert('권한 없음', '이 팀의 팀장만 취소할 수 있어요.');
            } else if (err instanceof ResourceNotFoundError) {
              Alert.alert('알림', '제안 정보를 찾을 수 없어요.');
            } else {
              Alert.alert('오류', '제안을 취소하지 못했어요. 잠시 후 다시 시도해주세요.');
            }
          } finally {
            setCancelingId(null);
          }
        },
      },
    ]);
  };

  const handleAIApply = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      const draft = await getUserToTeamProposalDraft(Number(teamId));
      router.push({
        pathname: '/teamApply',
        params: {
          teamId,
          introduction: draft.summary,
          message: draft.message,
        },
      });
    } catch (err) {
      if (err instanceof MatchingIntentRequiredError) {
        Alert.alert(
          '매칭 의도 설정이 필요해요',
          '먼저 매칭 의도를 입력한 뒤 다시 시도해주세요.',
        );
      } else if (err instanceof ProposalNotFoundError) {
        Alert.alert(
          '알림',
          '추천 목록에 없는 팀이거나 더 이상 존재하지 않는 팀이에요.',
        );
      } else if (err instanceof AiServerError) {
        Alert.alert('AI 서버 오류', '잠시 후 다시 시도해주세요.');
      } else {
        Alert.alert(
          '오류',
          err instanceof Error ? err.message : '문구 초안을 불러오지 못했어요.',
        );
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {!!data.characteristic && (
          <View className="self-start bg-indigo-50 rounded-lg px-2.5 py-1 mb-3">
            <Text className="text-indigo-600 text-xs font-pretendard-bold">
              #{data.characteristic}
            </Text>
          </View>
        )}

        <Text className="text-gray-900 text-2xl font-pretendard-bold leading-9 mb-5">
          {data.title}
        </Text>

        <View className="flex-row items-center mb-6 bg-gray-50 p-3.5 rounded-2xl">
          <Avatar />
          <View className="ml-3.5 flex-1">
            <View className="flex-row items-center gap-1.5 ml-1">
              <Text className="text-gray-900 text-lg font-pretendard-bold">
                {data.leaderName}
              </Text>
              <View className="bg-indigo-100 px-2 py-0.5 rounded">
                <Text className="text-indigo-600 text-[11px] font-pretendard-bold">
                  팀장
                </Text>
              </View>
            </View>
            <Text className="text-gray-500 text-base mt-1">
              {leaderMetaLine}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-gray-400 text-xs font-pretendard-medium mb-0.5">
              협업 온도
            </Text>
            <Text className="text-indigo-600 text-base font-pretendard-bold">
              {data.leaderCollaborationTemperature}°C
            </Text>
          </View>
        </View>

        <View className="flex-row bg-slate-50 rounded-2xl p-4 mb-7 justify-between items-center">
          <View className="flex-1 items-center">
            <Text className="text-gray-400 text-xs font-pretendard-medium mb-1">모집 인원</Text>
            <Text className="text-gray-900 text-base font-pretendard-bold">
              {data.capacity}명
            </Text>
          </View>
          <View className="w-[1px] h-6 bg-gray-200" />
          <View className="flex-1 items-center">
            <Text className="text-gray-400 text-xs font-pretendard-medium mb-1">모집 시작</Text>
            <Text className="text-gray-900 text-base font-pretendard-bold">
              {data.recruitmentStartDate.replaceAll('-', '.')}
            </Text>
          </View>
          <View className="w-[1px] h-6 bg-gray-200" />
          <View className="flex-1 items-center">
            <Text className="text-gray-400 text-xs font-pretendard-medium mb-1">모집 마감</Text>
            <Text className="text-gray-900 text-base font-pretendard-bold">
              {data.recruitmentEndDate.replaceAll('-', '.')}
            </Text>
          </View>
        </View>

        <View className="mb-7">
          <Text className="text-gray-900 text-lg font-pretendard-bold mb-2.5">
            팀 소개
          </Text>
          <Text className="text-gray-700 text-base leading-6 font-pretendard-regular">
            {data.promotionText}
          </Text>
        </View>

        <View className="mb-7">
          <Text className="text-gray-900 text-lg font-pretendard-bold mb-3">
            모집 역할
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {data.role.map((r) => (
              <View key={r} className="bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-2">
                <Text className="text-indigo-600 text-sm font-pretendard-bold">
                  {r}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {data.requiredSkills.length > 0 && (
          <View className="mb-7">
            <Text className="text-gray-900 text-lg font-pretendard-bold mb-3">
              요구 기술
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {data.requiredSkills.map((skill) => (
                <View key={skill} className="bg-gray-100 rounded-xl px-3.5 py-2">
                  <Text className="text-gray-700 text-sm font-pretendard-medium">
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 팀원 현황 */}
        <View className="border-t border-gray-100 pt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-900 text-lg font-pretendard-bold">
              팀원 현황 <Text className="text-indigo-600">{data.currentMemberCount}</Text>/{data.capacity}
            </Text>
            <View
              className={
                data.recruiting
                  ? 'bg-emerald-50 rounded-full px-3 py-1'
                  : 'bg-gray-100 rounded-full px-3 py-1'
              }
            >
              <Text
                className={
                  data.recruiting
                    ? 'text-emerald-600 text-sm font-pretendard-bold'
                    : 'text-gray-400 text-sm font-pretendard-bold'
                }
              >
                {data.recruiting ? '모집 중' : '모집 마감'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center py-2">
            <Avatar />
            <View className="ml-3 flex-1">
              <Text className="text-gray-900 text-lg font-pretendard-bold">
                {data.leaderName}
              </Text>
              <Text className="text-gray-400 text-sm mt-0.5">
                {leaderMetaLine}
              </Text>
            </View>
            <View className="bg-gray-100 rounded-lg px-2.5 py-1">
              <Text className="text-gray-600 text-sm font-pretendard-medium">
                팀장
              </Text>
            </View>
          </View>

          {additionalMembers > 0 && (
            <View className="mt-2 bg-gray-50 rounded-xl p-3 items-center">
              <Text className="text-gray-500 text-sm font-pretendard-medium">
                외 팀원 {additionalMembers}명이 참여 중이에요
              </Text>
            </View>
          )}
        </View>

        {/* 보낸 제안 (팀장 전용) */}
        {data.leader && (
          <View className="border-t border-gray-100 pt-6 mt-6">
            <Text className="text-gray-900 text-lg font-pretendard-bold mb-4">
              보낸 제안{offers ? ` ${offers.length}건` : ''}
            </Text>

            {offers === null && !offersError && (
              <View className="py-6 items-center justify-center">
                <ActivityIndicator color="#4F46E5" size="small" />
              </View>
            )}

            {offersError && (
              <Text className="text-gray-400 font-pretendard text-sm">{offersError}</Text>
            )}

            {offers !== null && offers.length === 0 && (
              <Text className="text-gray-400 font-pretendard text-sm">
                아직 보낸 제안이 없어요.
              </Text>
            )}

            {offers?.map((offer) => {
              const statusStyle = OFFER_STATUS_STYLE[offer.status];
              return (
                <View
                  key={offer.offerId}
                  className="flex-row items-center py-3 border-b border-gray-50 last:border-b-0"
                >
                  <Avatar />
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-900 text-base font-pretendard-bold">
                      {offer.targetUserName}
                    </Text>
                    <Text className="text-gray-400 text-sm mt-0.5">
                      {offer.targetUserSchool} · {offer.targetUserMajor}
                    </Text>
                  </View>

                  <View className={`${statusStyle.bg} rounded-lg px-2.5 py-1 mr-2`}>
                    <Text className={`${statusStyle.text} text-xs font-pretendard-bold`}>
                      {OFFER_STATUS_LABEL[offer.status]}
                    </Text>
                  </View>

                  {offer.status === 'PENDING' && (
                    <TouchableOpacity
                      onPress={() => handleCancelOffer(offer.offerId)}
                      disabled={cancelingId === offer.offerId}
                      className="border border-gray-200 rounded-lg px-2.5 py-1.5"
                    >
                      {cancelingId === offer.offerId ? (
                        <ActivityIndicator color="#9CA3AF" size="small" />
                      ) : (
                        <Text className="text-gray-500 text-xs font-pretendard-bold">취소</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View className="px-5 pt-3 pb-6 border-t border-gray-100 bg-white">
        {data.leader ? (
          data.recruiting ? (
            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-indigo-600 rounded-xl py-4 items-center"
              onPress={() => router.push(`/teamMembers?teamId=${teamId}`)}
            >
              <Text className="text-white font-pretendard-bold text-base">
                팀원 찾기 시작
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="bg-gray-100 rounded-xl py-4 items-center">
              <Text className="text-gray-400 font-pretendard-bold text-base">
                모집이 완료됐어요
              </Text>
            </View>
          )
        ) : data.hasApplied ? (
          <View className="bg-gray-100 rounded-xl py-4 items-center">
            <Text className="text-gray-400 font-pretendard-bold text-base">
              지원 완료
            </Text>
          </View>
        ) : (
          <>
            {data.recruiting && (
              <TouchableOpacity
                activeOpacity={0.8}
                className="bg-indigo-50 border border-indigo-600 rounded-xl py-4 items-center mb-2.5"
                onPress={handleAIApply}
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <ActivityIndicator color="#4F46E5" />
                ) : (
                  <Text className="text-indigo-600 font-pretendard-bold text-base">
                    ✨ AI로 지원서 작성하기
                  </Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-indigo-600 rounded-xl py-4 items-center"
              disabled={!data.recruiting}
              style={{ opacity: data.recruiting ? 1 : 0.4 }}
              onPress={() => router.push(`/teamApply?teamId=${teamId}`)}
            >
              <Text className="text-white font-pretendard-bold text-base">
                {data.recruiting ? '지원하기' : '모집이 마감됐어요'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}