import {
  getMyApplications,
  getReceivedOffers,
  OfferAlreadyRespondedError,
  respondToOffer,
  SchoolNotVerifiedError,
  TeamRecruitmentClosedError,
  type Application,
  type ApplicationStatus,
  type OfferStatus,
  type TeamOffer,
} from '@/api/apply';
import { Back } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING: { label: '검토 중', bg: 'bg-blue-50/80', text: 'text-blue-600', dot: 'bg-blue-600' },
  APPROVED: { label: '합류 확정', bg: 'bg-emerald-50/80', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  REJECTED: { label: '지원 종료', bg: 'bg-gray-100/80', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const OFFER_STATUS_CONFIG: Record<
  OfferStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING: { label: '응답 대기', bg: 'bg-blue-50/80', text: 'text-blue-600', dot: 'bg-blue-600' },
  ACCEPTED: { label: '수락함', bg: 'bg-emerald-50/80', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  REJECTED: { label: '거절함', bg: 'bg-gray-100/80', text: 'text-gray-500', dot: 'bg-gray-400' },
  CANCELED: { label: '제안 취소됨', bg: 'bg-gray-100/80', text: 'text-gray-400', dot: 'bg-gray-300' },
};

type TabKey = 'applied' | 'received';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'applied', label: '지원한 팀' },
  { key: 'received', label: '받은 제안' },
];

export default function MyApplicationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('applied');

  // 지원한 팀
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  // 받은 제안
  const [offers, setOffers] = useState<TeamOffer[] | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  const loadOffers = useCallback(() => {
    setOfferError(null);
    getReceivedOffers()
      .then(setOffers)
      .catch((err) => {
        console.error('받은 제안 목록 조회 실패:', err);
        setOfferError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setAppError(null);

      getMyApplications()
        .then((data) => {
          if (active) setApplications(data);
        })
        .catch((err) => {
          console.error('지원서 목록 조회 실패:', err);
          if (active) setAppError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
        });

      loadOffers();

      return () => {
        active = false;
      };
    }, [loadOffers])
  );

  const handleRespond = (offer: TeamOffer, accepted: boolean) => {
    const title = accepted ? '제안을 수락할까요?' : '제안을 거절할까요?';
    const body = accepted
      ? '수락 즉시 팀원으로 가입되며, 이 결정은 되돌릴 수 없어요.'
      : '거절하면 이 제안은 더 이상 목록에서 응답할 수 없어요.';

    Alert.alert(title, body, [
      { text: '취소', style: 'cancel' },
      {
        text: accepted ? '수락하기' : '거절하기',
        style: accepted ? 'default' : 'destructive',
        onPress: async () => {
          setRespondingId(offer.offerId);
          try {
            await respondToOffer(offer.offerId, accepted);
            loadOffers();
          } catch (err) {
            if (err instanceof SchoolNotVerifiedError) {
              Alert.alert('학교 인증이 필요해요', '제안을 수락하려면 먼저 학교 인증을 완료해주세요.', [
                { text: '취소', style: 'cancel' },
                { text: '인증하러 가기', onPress: () => router.push('/schoolVerify') },
              ]);
            } else if (err instanceof TeamRecruitmentClosedError) {
              Alert.alert('모집이 마감됐어요', '해당 팀의 모집이 이미 종료되어 응답할 수 없어요.');
              loadOffers();
            } else if (err instanceof OfferAlreadyRespondedError) {
              Alert.alert('이미 처리된 제안이에요', '다른 기기에서 먼저 응답했을 수 있어요.');
              loadOffers();
            } else {
              Alert.alert('오류가 발생했어요', err instanceof Error ? err.message : '잠시 후 다시 시도해주세요.');
            }
          } finally {
            setRespondingId(null);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50/60">
      {/* Header & Tabs Container */}
      <View className="bg-white border-b border-gray-200">
        {/* Header */}
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
            지원 및 제안
          </Text>
        </View>

        {/* Tabs */}
        <View className="flex-row px-6 pt-3">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className="mr-6 pb-3"
                style={{ borderBottomWidth: 2, borderBottomColor: isActive ? '#3E6AF4' : 'transparent' }}
              >
                <Text
                  className={`text-lg ${
                    isActive ? 'text-[#3E6AF4] font-pretendard-bold' : 'text-gray-400 font-pretendard-medium'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {activeTab === 'applied' ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-5"
          contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {applications && applications.length > 0 && (
            <View className="mb-3 flex-row items-center justify-between px-1">
              <Text className="text-[12px] font-pretendard-medium text-gray-400">
                총 <Text className="text-blue-600 font-pretendard-bold">{applications.length}</Text>개의 지원 내역
              </Text>
            </View>
          )}

          {applications === null && !appError && (
            <View className="py-24 items-center justify-center">
              <ActivityIndicator color="#2563eb" size="small" />
              <Text className="text-gray-400 font-pretendard text-xs mt-3">지원 내역을 불러오는 중...</Text>
            </View>
          )}

          {appError && (
            <View className="py-16 items-center justify-center bg-white rounded-3xl p-6 border border-gray-100">
              <Text className="text-gray-800 font-pretendard-semibold text-sm mb-1">목록을 불러오지 못했습니다</Text>
              <Text className="text-gray-400 font-pretendard text-xs text-center">{appError}</Text>
            </View>
          )}

          {applications !== null && applications.length === 0 && (
            <View className="pt-20 py-10 items-center justify-center bg-white rounded-3xl p-8 border border-gray-100">
              <View className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 justify-center items-center mb-3">
                <Text className="text-xl">📄</Text>
              </View>
              <Text className="text-gray-900 font-pretendard-bold text-lg mb-1">아직 지원한 팀이 없어요</Text>
              <Text className="text-gray-400 font-pretendard text-sm text-center mb-5">
                관심 있는 공모전이나 팀에 지원서를 제출해보세요.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/')}
                className="bg-blue-600 px-4 py-2.5 rounded-xl active:opacity-90"
              >
                <Text className="text-white font-pretendard-semibold text-sm">팀 탐색하러 가기</Text>
              </TouchableOpacity>
            </View>
          )}

          {applications?.map((application) => {
            const status = STATUS_CONFIG[application.status];
            const formattedDate = new Date(application.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            });

            return (
              <TouchableOpacity
                key={application.applicationId}
                activeOpacity={0.88}
                onPress={() =>
                  router.push({ pathname: '/myApplicationDetail', params: { id: application.applicationId } })
                }
                className="bg-white border border-gray-100/80 rounded-3xl p-4 mb-3 shadow-sm"
                style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}
              >
                <View className="flex-row justify-between items-center mb-3">
                  <View className={`flex-row items-center px-2.5 py-1 rounded-full ${status.bg}`}>
                    <View className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`} />
                    <Text className={`text-xs font-pretendard-semibold ${status.text}`}>{status.label}</Text>
                  </View>
                  <Text className="text-[11px] text-gray-400 font-pretendard-medium">{formattedDate} 지원</Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text numberOfLines={1} className="text-base font-pretendard-bold text-gray-900 tracking-tight flex-1 mr-2">
                    {application.teamTitle}
                  </Text>
                  <Text className="text-gray-300 text-lg font-pretendard-medium">›</Text>
                </View>

                {application.introduction ? (
                  <Text numberOfLines={1} className="text-[12px] font-pretendard-medium text-gray-400 mt-1">
                    {application.introduction}
                  </Text>
                ) : (
                  <Text className="text-[12px] font-pretendard-medium text-gray-300 mt-1">자기소개 없이 지원했어요</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-5"
          contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {offers && offers.length > 0 && (
            <View className="mb-3 flex-row items-center justify-between px-1">
              <Text className="text-[12px] font-pretendard-medium text-gray-400">
                총 <Text className="text-blue-600 font-pretendard-bold">{offers.length}</Text>개의 받은 제안
              </Text>
            </View>
          )}

          {offers === null && !offerError && (
            <View className="py-24 items-center justify-center">
              <ActivityIndicator color="#2563eb" size="small" />
              <Text className="text-gray-400 font-pretendard text-xs mt-3">받은 제안을 불러오는 중...</Text>
            </View>
          )}

          {offerError && (
            <View className="py-16 items-center justify-center bg-white rounded-3xl p-6 border border-gray-100">
              <Text className="text-gray-800 font-pretendard-semibold text-sm mb-1">목록을 불러오지 못했습니다</Text>
              <Text className="text-gray-400 font-pretendard text-xs text-center">{offerError}</Text>
            </View>
          )}

          {offers !== null && offers.length === 0 && (
            <View className="py-20 items-center justify-center bg-white rounded-3xl p-8 border border-gray-100">
              <View className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 justify-center items-center mb-3">
                <Text className="text-xl">📬</Text>
              </View>
              <Text className="text-gray-900 font-pretendard-bold text-lg mb-1">아직 받은 제안이 없어요</Text>
              <Text className="text-gray-400 font-pretendard text-sm text-center">
                팀장이 먼저 제안을 보내면 여기에 표시돼요.
              </Text>
            </View>
          )}

          {offers?.map((offer) => {
            const status = OFFER_STATUS_CONFIG[offer.status];
            const formattedDate = new Date(offer.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            });
            const isPending = offer.status === 'PENDING';
            const isResponding = respondingId === offer.offerId;

            return (
              <View
                key={offer.offerId}
                className="bg-white border border-gray-100/80 rounded-3xl p-4 mb-3 shadow-sm"
                style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}
              >
                <View className="flex-row justify-between items-center mb-3">
                  <View className={`flex-row items-center px-2.5 py-1 rounded-full ${status.bg}`}>
                    <View className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`} />
                    <Text className={`text-xs font-pretendard-semibold ${status.text}`}>{status.label}</Text>
                  </View>
                  <Text className="text-[11px] text-gray-400 font-pretendard-medium">{formattedDate} 제안받음</Text>
                </View>

                <Text numberOfLines={1} className="text-base font-pretendard-bold text-gray-900 tracking-tight mb-1">
                  {offer.teamTitle}
                </Text>

                {offer.leaderName && (
                  <Text className="text-[12px] font-pretendard-medium text-gray-400 mb-2">
                    {offer.leaderName} 팀장님이 보낸 제안이에요
                  </Text>
                )}

                {offer.message && (
                  <Text numberOfLines={2} className="text-[12px] font-pretendard-medium text-gray-500 mb-3">
                    “{offer.message}”
                  </Text>
                )}

                {isPending && (
                  <View className="flex-row gap-2 mt-1">
                    <TouchableOpacity
                      disabled={isResponding}
                      onPress={() => handleRespond(offer, false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 items-center justify-center"
                    >
                      <Text className="text-gray-500 text-sm font-pretendard-semibold">거절</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={isResponding}
                      onPress={() => handleRespond(offer, true)}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 items-center justify-center active:opacity-90"
                    >
                      {isResponding ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text className="text-white text-sm font-pretendard-semibold">수락</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
