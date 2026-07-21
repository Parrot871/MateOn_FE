

// app/notification/index.tsx
import { UserAddFill } from '@/assets/icons';
import { X } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NOTI_TABS = ['전체', '가입신청', '가입요청', '메세지'] as const;
type NotiTab = (typeof NOTI_TABS)[number];

type NotificationItem = {
  id: string;
  category: Exclude<NotiTab, '전체'>;
  message: string;
  timeAgo: string;
};

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    category: '가입신청',
    message: '이지원님이 [데분 캠프] 데이터 분석 팀 1 모집에 지원했습니다',
    timeAgo: '5분전',
  },
  {
    id: '2',
    category: '가입신청',
    message: '이지원님이 [데분 캠프] 데이터 분석 팀 1 모집에 지원했습니다',
    timeAgo: '5분전',
  },
  {
    id: '3',
    category: '가입신청',
    message: '이지원님이 [데분 캠프] 데이터 분석 팀 1 모집에 지원했습니다',
    timeAgo: '5분전',
  },
];

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<NotiTab>('전체');

  const filteredItems =
    tab === '전체'
      ? MOCK_NOTIFICATIONS
      : MOCK_NOTIFICATIONS.filter((item) => item.category === tab);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* 헤더 */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <View className="w-8" />
        <Text className="text-lg font-pretendard-bold text-black">알림</Text>
        <TouchableOpacity onPress={() => router.back()} className="w-8 items-end">
          <Image source={X} style={{ width: 22, height: 22 }} contentFit="contain" />
        </TouchableOpacity>
      </View>

      {/* 탭 */}
      <View className="flex-row px-5 border-b border-gray-100">
        {NOTI_TABS.map((item) => {
          const isActive = tab === item;
          return (
            <TouchableOpacity
              key={item}
              onPress={() => setTab(item)}
              className="mr-5 pb-3"
            >
              <Text
                className={`text-sm ${
                  isActive
                    ? 'text-black font-pretendard-bold'
                    : 'text-gray-400 font-pretendard-semibold'
                }`}
              >
                {item}
              </Text>
              {isActive && (
                <View className="h-0.5 bg-black rounded-full mt-2" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 리스트 */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
      >
        {filteredItems.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400 text-sm">알림이 없습니다</Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="flex-row items-start px-5 py-4 border-b border-gray-50"
            >
              <View className="w-10 h-10 rounded-full bg-[#FCE9E9] items-center justify-center mr-3">
                <Image
                  source={UserAddFill}
                  style={{ width: 20, height: 20 }}
                  contentFit="contain"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-black font-pretendard-medium leading-5">
                  {item.message}
                </Text>
                <Text className="text-xs text-gray-400 mt-1">{item.timeAgo}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
