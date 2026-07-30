// app/notification/index.tsx
import { getMyNotifications, type NotificationResponseDTO } from '@/api/notification';
import { MessageFillBasic, UserAddFill } from '@/assets/icons';
import { Star, X } from '@/assets/images/tool';
import { useNotificationSSE } from '@/hooks/useNotificationSSE';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useAnimatedReaction, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

const DELETE_TRIGGER_TRANSLATION = -160;

function DeleteAction({ translation, onDelete }: { translation: SharedValue<number>; onDelete: () => void }) {
  const triggered = useSharedValue(false);

  useAnimatedReaction(
    () => translation.value,
    (value) => {
      if (!triggered.value && value < DELETE_TRIGGER_TRANSLATION) {
        triggered.value = true;
        scheduleOnRN(onDelete);
      }
    }
  );

  return (
    <TouchableOpacity onPress={onDelete} className="w-20 items-center justify-center bg-red-500">
      <Text className="text-white font-pretendard-bold text-base">삭제</Text>
    </TouchableOpacity>
  );
}

const NOTI_TABS = ['전체', '가입신청', '가입요청', '메세지', '평가'] as const;
type NotiTab = (typeof NOTI_TABS)[number];
type NotiCategory = Exclude<NotiTab, '전체'>;

// title 문자열로 탭 카테고리 분류 (백엔드 type만으론 4개 탭을 구분 못 해서 title 기준)
function categorize(title: string): NotiCategory {
  if (title === '가입승인' || title === '가입거절') return '가입신청';
  if (title === '팀 제안 도착' || title === '제안 거절' || title === '제안 수락') return '가입요청';
  if (title === '팀원 평가 요청') return '평가';
  return '메세지'; // "OOO님의 메시지" 패턴 등 나머지
}

// 카테고리별 아이콘 + 배경색 매핑
// TODO: '가입요청' 전용 아이콘 생기면 UserAddFill → 교체
const CATEGORY_ICON: Record<NotiCategory, { icon: any; bg: string }> = {
  '가입신청': { icon: UserAddFill, bg: '#FCE9E9' },
  '가입요청': { icon: UserAddFill, bg: '#E9F0FC' },
  '메세지': { icon: MessageFillBasic, bg: '#E9FCEF' },
  '평가': { icon: Star, bg: '#FFF6E0' },
};

function timeAgo(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금전';
  if (diffMin < 60) return `${diffMin}분전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간전`;
  return `${Math.floor(diffHour / 24)}일전`;
}

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<NotiTab>('전체');
  const [notifications, setNotifications] = useState<NotificationResponseDTO[]>([]);
  const { notifications: sseNotifications } = useNotificationSSE();

  // 초기 목록 조회
  useEffect(() => {
    getMyNotifications().then(setNotifications).catch(console.error);
  }, []);

  // SSE로 새 알림 들어오면 앞에 merge (id 중복 방지)
  useEffect(() => {
    if (sseNotifications.length === 0) return;
    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const newOnes = sseNotifications.filter((n) => !existingIds.has(n.id));
      return [...newOnes, ...prev];
    });
  }, [sseNotifications]);

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredItems =
    tab === '전체'
      ? notifications
      : notifications.filter((item) => categorize(item.title) === tab);

  return (
    <View className="flex-1 bg-white">
      {/* Header & Tabs Container */}
      <View className="bg-white border-b border-gray-200">
        {/* 헤더 */}
        <View
          className="px-5 flex-row items-center justify-between"
          style={{ paddingTop: Math.max(insets.top, 16) + 6, paddingBottom: 14 }}
        >
          <View style={{ width: 26, height: 26 }} />
          <Text className="text-black text-2xl font-pretendard-bold flex-1 text-center mr-8">알림</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={X} style={{ width: 24, height: 24 }} contentFit="contain" />
          </TouchableOpacity>
        </View>

        {/* 탭 */}
        <View className="flex-row px-6 pt-3">
          {NOTI_TABS.map((item) => {
            const isActive = tab === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setTab(item)}
                className="mr-6 pb-3"
                style={{ borderBottomWidth: 2, borderBottomColor: isActive ? '#3E6AF4' : 'transparent' }}
              >
                <Text
                  className={`text-lg ${
                    isActive ? 'text-[#3E6AF4] font-pretendard-bold' : 'text-gray-400 font-pretendard-medium'
                  }`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 리스트 */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}>
        {filteredItems.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400 text-base">알림이 없습니다</Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            const { icon, bg } = CATEGORY_ICON[categorize(item.title)];

            return (
              <Swipeable
                key={item.id}
                friction={2}
                animationOptions={{ damping: 40, stiffness: 200, mass: 1 }}
                renderRightActions={(_progress, translation) => (
                  <DeleteAction translation={translation} onDelete={() => removeNotification(item.id)} />
                )}
              >
                <TouchableOpacity className="flex-row items-start px-5 py-4 border-b border-gray-50 bg-white">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: bg }}
                  >
                    <Image source={icon} style={{ width: 20, height: 20 }} contentFit="contain" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base text-black font-pretendard-bold leading-5">
                        {item.title}
                      </Text>
                      <Text className="text-sm text-gray-400 ml-2">{timeAgo(item.createdAt)}</Text>
                    </View>
                    <Text className="text-sm text-gray-500 font-pretendard-medium leading-5 mt-1">
                      {item.content}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Swipeable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}