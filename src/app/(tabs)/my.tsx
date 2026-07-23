import { getMyApplications } from '@/api/apply';
import { clearTokens } from '@/api/tokenStorage';
import { getMyProfile, type UserProfile } from '@/api/user';
import { Back, Bookmark, Flag, MypageMLogo, NotificationNewDot, UserIcon } from '@/assets/images/tool';
import { useTeamRecStore } from '@/store/teamRecStore';
import { getUnivByEmail } from '@/utils/univ';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

function CircleProgress({
  value,
  max,
  size,
  strokeWidth,
  color,
  trackColor,
  label,
}: {
  value: number;
  max: number;
  size: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
  label: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          fill="none"
        />
      </Svg>
      <View className="absolute items-center">
        <Text className="text-black text-2xl font-pretendard-bold">{label}</Text>
      </View>
    </View>
  );
}

export default function MypageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applicationCount, setApplicationCount] = useState(0);
  const univ = getUnivByEmail(profile?.email);

  useFocusEffect(
    useCallback(() => {
      getMyProfile()
        .then(setProfile)
        .catch((error) => console.error('내 정보 조회 실패:', error));

      getMyApplications()
        .then((data) => setApplicationCount(data.length))
        .catch((error) => console.error('지원서 목록 조회 실패:', error));
    }, [])
  );

  const ACTIVITIES = [
  { label: '지원 및 제안', count: applicationCount, icon: Flag, path: '/myApplications' },
  { label: '모집한 팀', count: 2, icon: Flag, path: '/myteamLeader' },
  { label: '팀원 평가', count: 2, icon: Bookmark, path: '/bookMark' },
] as const;

  const SETTINGS = [
    { label: '학교 인증', onPress: () => {} },
    { label: '비밀번호 변경', onPress: () => router.push('/pwchange') },
    {
      label: '로그아웃',
      onPress: () =>
        Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
          { text: '취소', style: 'cancel' },
          {
            text: '로그아웃',
            style: 'destructive',
            onPress: () => {
              clearTokens();
              useTeamRecStore.getState().reset();
              router.replace('/login');
            },
          },
        ]),
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-5"
      contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}
    >
      <View className="flex-row justify-between items-center pt-20 pb-6">
        <TouchableOpacity onPress={() => router.push('/')}>
          <Image source={MypageMLogo} style={{ width: 32, height: 32 }} contentFit="contain" />
        </TouchableOpacity>

        <Image source={NotificationNewDot} style={{ width: 30, height: 30 }} contentFit="contain" />
      </View>

      <View className="flex-row items-center mb-6">
        <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center">
          <Image source={UserIcon} style={{ width: 40, height: 40 }} contentFit="contain" />
          <View className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white border border-gray-300 items-center justify-center">
            <View className="w-2.5 h-2.5 rounded-full bg-gray-400" />
          </View>
        </View>

        <View className="ml-8">
          <Text className="text-black text-3xl font-pretendard-semibold">{profile?.name ?? ''}</Text>
          <Text className="text-gray-700 font-pretendard text-lg">
            {profile?.schoolVerified ? `${univ ?? ''} ${profile?.major ?? ''} 재학생` : '재학생 인증 필요'}
          </Text>
          <Text className="text-gray-400 font-pretendard text-lg mt-0.5">
            희망직무 : {profile?.interestJobPrimary ?? ''}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/editprofile')}
        className="h-12 mb-8 rounded-xl border border-[#3E6AF4] bg-white justify-center items-center"
      >
        <Text className="text-[#3E6AF4] text-lg font-pretendard-semibold">회원정보 수정</Text>
      </TouchableOpacity>

      <Text className="text-black text-xl font-pretendard-bold mb-3">내 협업온도</Text>
      <View className="flex-row justify-around items-center mb-8 py-6 rounded-2xl border border-gray-200">
        <View className="items-center">
          <CircleProgress
            value={36.5}
            max={100}
            size={88}
            strokeWidth={8}
            color="#FF0000"
            trackColor="#FDE2E2"
            label="36.5"
          />
        </View>
      </View>

      <Text className="text-black text-xl font-pretendard-bold mb-3">내 활동</Text>
      <View className="flex-row gap-3 mb-8">
        {ACTIVITIES.map((activity) => (
          <TouchableOpacity
            key={activity.label}
            disabled={!activity.path}
            onPress={() => activity.path && router.push(activity.path)}
            className="flex-1 items-center py-5 rounded-xl border border-gray-200"
          >
            <Image source={activity.icon} style={{ width: 22, height: 22 }} contentFit="contain" />
            <Text className="text-black font-pretendard-semibold mt-2 text-base">{activity.label}</Text>
            <Text className="text-black font-pretendard text-lg mt-0.5">{activity.count}개</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-black text-xl font-pretendard-bold mb-1">계정 설정</Text>
      
      <View className="border-t border-gray-100">
        {SETTINGS.map((setting, index) => (
          <TouchableOpacity
            key={setting.label}
            onPress={setting.onPress}
            className={`flex-row justify-between items-center py-4 ${
              index !== SETTINGS.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <View className="flex-row items-center">
              <Text className="text-black text-lg font-pretendard">{setting.label}</Text>
              {setting.label === '학교 인증' && profile?.schoolVerified && (
                <View className="ml-2 px-2 py-0.5 rounded-full bg-green-50">
                  <Text className="text-green-600 text-sm font-pretendard-semibold">인증 완료됨</Text>
                </View>
              )}
            </View>
            <Image
              source={Back}
              style={{ width: 14, height: 14, transform: [{ rotate: '180deg' }] }}
              contentFit="contain"
            />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
