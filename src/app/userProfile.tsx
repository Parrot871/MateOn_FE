// app/userProfile.tsx
import { getPublicUserProfile, UserNotFoundError, type PublicUserProfile } from '@/api/user';
import { Back, ProfileUser } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Chip({ label }: { label: string }) {
  return (
    <View className="bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5 mr-2 mb-2">
      <Text className="text-gray-600 text-xs font-pretendard-medium">{label}</Text>
    </View>
  );
}

function ChipGroup({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View className="mt-5">
      <Text className="text-gray-400 text-base font-pretendard-semibold mb-2">{title}</Text>
      <View className="flex-row flex-wrap">
        {items.map((item, idx) => (
          <Chip key={`${item}-${idx}`} label={item} />
        ))}
      </View>
    </View>
  );
}

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const id = Number(userId);

      if (!userId || Number.isNaN(id)) {
        setErrorMessage('잘못된 접근입니다.');
        return;
      }

      let active = true;
      setErrorMessage(null);

      getPublicUserProfile(id)
        .then((data) => {
          if (active) setProfile(data);
        })
        .catch((err) => {
          if (!active) return;
          if (err instanceof UserNotFoundError) {
            setErrorMessage('존재하지 않는 사용자예요.');
          } else {
            setErrorMessage(err instanceof Error ? err.message : '조회에 실패했습니다.');
          }
        });

      return () => {
        active = false;
      };
    }, [userId])
  );

  const metaLine = profile
    ? [profile.college, profile.major, profile.grade].filter(Boolean).join(' · ')
    : '';

  return (
    <View className="flex-1 bg-gray-50/60">
      <View
        className="px-5 bg-white border-b border-gray-100 flex-row items-center justify-between"
        style={{ paddingTop: Math.max(insets.top, 16) + 6, paddingBottom: 12 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="w-8 h-8 justify-center items-start"
        >
          <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
        </TouchableOpacity>
        <Text className="text-gray-900 text-2xl font-pretendard-bold flex-1 text-center mr-8 tracking-tight">
          프로필
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5"
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {!profile && !errorMessage && (
          <View className="py-24 items-center justify-center">
            <ActivityIndicator color="#2563eb" size="small" />
            <Text className="text-gray-400 font-pretendard text-xs mt-3">프로필을 불러오는 중...</Text>
          </View>
        )}

        {errorMessage && (
          <View className="py-16 items-center justify-center bg-white rounded-3xl p-6 border border-gray-100">
            <Text className="text-gray-800 font-pretendard-semibold text-sm mb-1">프로필을 불러올 수 없습니다</Text>
            <Text className="text-gray-400 font-pretendard text-xs text-center">{errorMessage}</Text>
          </View>
        )}

        {profile && (
          <>
            {/* 기본 정보 카드 */}
            <View
              className="bg-white border border-gray-100/80 rounded-3xl p-5 mb-4"
              style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-row flex-1 pr-3">
                  <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center overflow-hidden mr-3">
                    {profile.profileImageUrl ? (
                      <Image
                        source={{ uri: profile.profileImageUrl }}
                        style={{ width: 56, height: 56 }}
                        contentFit="cover"
                      />
                    ) : (
                      <Image source={ProfileUser} style={{ width: 32, height: 32 }} contentFit="contain" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-black text-xl font-pretendard-bold">{profile.name}</Text>
                    {!!profile.tagline && (
                      <Text className="text-gray-500 text-lg font-pretendard-medium mt-1">{profile.tagline}</Text>
                    )}
                    {metaLine.length > 0 && (
                      <Text className="text-gray-400 text-base font-pretendard-medium mt-1">{metaLine}</Text>
                    )}
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-gray-400 text-base font-pretendard-medium mb-0.5">협업 온도</Text>
                  <Text className="text-blue-600 text-lg font-pretendard-bold">
                    {profile.collaborationTemperature !== null ? `${profile.collaborationTemperature}°C` : '평가 부족'}
                  </Text>
                </View>
              </View>

              {profile.experienceLevel && (
                <View className="mt-4 pt-4 border-t border-gray-50 flex-row">
                  <Text className="text-gray-400 text-sm font-pretendard-medium">경험 수준 : </Text>
                  <Text className="text-gray-600 text-sm font-pretendard-semibold">{profile.experienceLevel}</Text>
                </View>
              )}

              {profile.activityStyle && (
                <View className="mt-1 flex-row">
                  <Text className="text-gray-400 text-sm font-pretendard-medium">활동 스타일 : </Text>
                  <Text className="text-gray-600 text-sm font-pretendard-semibold">{profile.activityStyle}</Text>
                </View>
              )}

              <ChipGroup title="희망 역할" items={profile.desiredRoles} />
              <ChipGroup title="보유 기술" items={profile.skills} />
            </View>

            {/* 참여 활동 이력 카드 */}
            <View
              className="bg-white border border-gray-100/80 rounded-3xl p-5"
              style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}
            >
              <Text className="text-black text-lg font-pretendard-bold mb-3">과거 참여 활동 이력</Text>

              {profile.participatedActivities.length === 0 ? (
                <Text className="text-gray-400 font-pretendard text-sm">아직 참여한 활동이 없어요.</Text>
              ) : (
                <View className="flex-row flex-wrap">
                  {profile.participatedActivities.map((activity) => (
                    <Chip key={activity.id} label={activity.title} />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
