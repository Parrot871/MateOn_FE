// app/myApplicationDetail.tsx
import {
  cancelApplication,
  getApplicationDetail,
  type Application,
  type ApplicationStatus,
} from '@/api/apply';
import { Back } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_CONFIG: Record <
  ApplicationStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING: {
    label: '검토 중',
    bg: 'bg-blue-50/80',
    text: 'text-blue-600',
    dot: 'bg-blue-600',
  },
  APPROVED: {
    label: '승인 확정',
    bg: 'bg-emerald-50/80',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
  REJECTED: {
    label: '지원 종료',
    bg: 'bg-gray-100/80',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
  },
};

export default function MyApplicationDetailScreen() {
  const { applicationId: applicationIdParam } = useLocalSearchParams<{ applicationId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [application, setApplication] = useState<Application | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const applicationId = Number(applicationIdParam);

      if (!applicationIdParam || Number.isNaN(applicationId)) {
        setApplication(null);
        setErrorMessage('잘못된 접근입니다.');
        return;
      }

      let active = true;
      setErrorMessage(null);

      getApplicationDetail(applicationId)
        .then((data) => {
          if (active) setApplication(data);
        })
        .catch((err) => {
          console.error('지원서 상세 조회 실패:', err);
          if (active) setErrorMessage(err instanceof Error ? err.message : '조회에 실패했습니다.');
        });

      return () => {
        active = false;
      };
    }, [applicationIdParam])
  );

  const handleEdit = () => {
    if (!application) return;
    setMenuVisible(false);
    router.push({
      pathname: '/applications/[applicationId]/edit',
      params: { applicationId: String(application.applicationId) },
    });
  };

  const handleCancel = () => {
    if (!application) return;
    setMenuVisible(false);

    Alert.alert('지원 취소', '정말 지원을 취소하시겠습니까?\n취소 후에는 복구할 수 없습니다.', [
      { text: '아니오', style: 'cancel' },
      {
        text: '지원 취소',
        style: 'destructive',
        onPress: async () => {
          try {
            setCanceling(true);
            await cancelApplication(application.applicationId);
            router.back();
          } catch (err) {
            console.error('지원 취소 실패:', err);
            Alert.alert('오류', err instanceof Error ? err.message : '지원 취소에 실패했습니다.');
          } finally {
            setCanceling(false);
          }
        },
      },
    ]);
  };

  const status = application ? STATUS_CONFIG[application.status] : null;
  const formattedDate = application
    ? new Date(application.createdAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <View className="flex-1 bg-gray-50/60">
      {/* GNB / Header */}
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
        <Text className="text-gray-900 text-2xl font-pretendard-bold flex-1 text-center tracking-tight">
          지원서 상세
        </Text>
        {application?.status === 'PENDING' ? (
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="w-8 h-8 justify-center items-end"
          >
            <Text className="text-gray-900 font-pretendard-bold pt-2" style={{ fontSize: 26, lineHeight: 26 }}>
              ⋮
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 26, height: 26 }} />
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5"
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading */}
        {!application && !errorMessage && (
          <View className="py-24 items-center justify-center">
            <ActivityIndicator color="#2563eb" size="small" />
            <Text className="text-gray-400 font-pretendard text-xs mt-3">
              지원서를 불러오는 중...
            </Text>
          </View>
        )}

        {/* Error */}
        {errorMessage && (
          <View className="py-16 items-center justify-center bg-white rounded-3xl p-6 border border-gray-100">
            <Text className="text-gray-800 font-pretendard-semibold text-sm mb-1">
              지원서를 불러올 수 없습니다
            </Text>
            <Text className="text-gray-400 font-pretendard text-xs text-center">
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Main Content */}
        {application && status && (
          <View className="space-y-4">
            {/* 1. 팀 타이틀 & 상태 헤더 카드 */}
            <View
              className="bg-white border border-gray-100/80 rounded-3xl p-5 mb-3 shadow-sm"
              style={{
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <View className="flex-row justify-between items-center mb-3">
                <View className={`flex-row items-center px-2.5 py-1 rounded-full ${status.bg}`}>
                  <View className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`} />
                  <Text className={`text-xs font-pretendard-semibold ${status.text}`}>
                    {status.label}
                  </Text>
                </View>

                <Text className="text-[11px] text-gray-400 font-pretendard-medium">
                  {formattedDate} 작성
                </Text>
              </View>

              <Text className="text-xl font-pretendard-bold text-gray-900 tracking-tight leading-snug">
                {application.teamTitle}
              </Text>
            </View>

            {/* 2. 작성 내용 섹션 카드 */}
            <View
              className="bg-white border border-gray-100/80 rounded-3xl p-5 mb-3 shadow-sm space-y-4"
              style={{
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              {/* 지원 메시지 */}
              <View className="mb-4">
                <Text className="text-sm font-pretendard-semibold text-gray-400 mb-2">
                  지원 동기
                </Text>
                <View className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100/60">
                  <Text className="text-base font-pretendard text-gray-800 leading-relaxed">
                    {application.message || '작성된 지원 메시지가 없습니다.'}
                  </Text>
                </View>
              </View>

              {/* 자기소개 */}
              {!!application.introduction && (
                <View className="mb-2">
                  <Text className="text-sm font-pretendard-semibold text-gray-400 mb-2">
                    한 줄 소개
                  </Text>
                  <View className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100/60">
                    <Text className="text-base font-pretendard text-gray-800 leading-relaxed">
                      {application.introduction}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* 3. 제출한 연락처 & 포트폴리오 정보 카드 */}
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
              <Text className="text-base font-pretendard-semibold text-gray-400 mb-3">
                제출 정보
              </Text>

              {/* 연락처 */}
              <View className="flex-row items-center justify-between py-2.5 border-b border-gray-50">
                <Text className="text-base font-pretendard-medium text-gray-500">연락처</Text>
                <Text className="text-base font-pretendard-semibold text-gray-900">
                  {application.contactNumber || '-'}
                </Text>
              </View>

              {/* 포트폴리오 */}
              <View className="flex-row items-center justify-between pt-2.5">
                <Text className="text-base font-pretendard-medium text-gray-500">포트폴리오</Text>
                {application.portfolioUrl ? (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(application.portfolioUrl)}
                    activeOpacity={0.7}
                  >
                    <Text className="text-base font-pretendard-semibold text-blue-600 underline">
                      링크 열기 ↗
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text className="text-base font-pretendard text-gray-400">-</Text>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 수정하기 / 삭제하기 드롭다운 메뉴 */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
          className="flex-1"
          style={{ paddingTop: Math.max(insets.top, 16) + 50 }}
        >
          <View className="items-end px-3">
            <View className="bg-white rounded-2xl w-36 overflow-hidden shadow-lg" style={{ elevation: 4 }}>
              <TouchableOpacity onPress={handleEdit} activeOpacity={0.7} className="px-4 py-3.5 border-b border-gray-50">
                <Text className="text-gray-900 font-pretendard-medium text-lg">수정하기</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancel} disabled={canceling} activeOpacity={0.7} className="px-4 py-3.5">
                {canceling ? (
                  <ActivityIndicator color="#ef4444" size="small" />
                ) : (
                  <Text className="text-red-500 font-pretendard-medium text-lg">삭제하기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}