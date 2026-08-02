import { getMyApplications, getReceivedOffers } from '@/api/apply';
import { fetchBookmarkedEventIds } from '@/api/events';
import { getMyTeams, getTeamReviewTargets } from '@/api/team';
import { clearTokens } from '@/api/tokenStorage';
import { deleteProfileImage, getMyProfile, uploadProfileImage, type UserProfile } from '@/api/user';
import { HappyLine } from '@/assets/icons';
import { Back, Bookmark, FlagIcon, MypageMLogo, NotificationNewDot, ProfileUser, Star, UserIcon } from '@/assets/images/tool';
import { useAuthStore } from '@/store/authStore';
import { useTeamRecStore } from '@/store/teamRecStore';
import { getUnivByEmail } from '@/utils/univ';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 당근마켓 스타일 가로 온도바
function TemperatureBar({ value, max }: { value: number; max: number }) {
  const progress = Math.min(value / max, 1) * 100;

  return (
    <View className="h-2 rounded-full bg-[#FDE2E2] overflow-hidden">
      <View className="h-2 rounded-full bg-[#FF0000]" style={{ width: `${progress}%` }} />
    </View>
  );
}

// 내가 지원해 합류한(APPROVED) 팀 + 내가 리더로 모집한 팀의 teamId를 합쳐서
// 종료(reviews/targets 조회 성공)된 팀 개수를 센다. teamReview.tsx의 로직과 동일한 기준.
async function getReviewableTeamCount(): Promise<number> {
  const [applications, myTeams] = await Promise.all([
    getMyApplications().catch(() => []),
    getMyTeams().catch(() => []),
  ]);

  const teamIds = Array.from(
    new Set([
      ...applications.filter((a) => a.status === 'APPROVED').map((a) => a.teamId),
      ...myTeams.map((t) => t.id),
    ])
  );

  const results = await Promise.all(
    teamIds.map((id) =>
      getTeamReviewTargets(id)
        .then(() => true)
        .catch(() => false)
    )
  );

  return results.filter(Boolean).length;
}

export default function MypageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applicationCount, setApplicationCount] = useState(0);
  const [myTeamCount, setMyTeamCount] = useState(0);
  const [reviewableTeamCount, setReviewableTeamCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const univ = getUnivByEmail(profile?.schoolEmail ?? profile?.email);

  useFocusEffect(
    useCallback(() => {
      getMyProfile()
        .then(setProfile)
        .catch((error) => console.error('내 정보 조회 실패:', error));

      Promise.all([
      getMyApplications().catch(() => []),
      getReceivedOffers().catch(() => []),
    ])
      .then(([applications, offers]) => {
        setApplicationCount(applications.length + offers.length);
      })
      .catch((error) => console.error('지원 및 제안 목록 조회 실패:', error));

      getMyTeams()
        .then((data) => setMyTeamCount(data.length))
        .catch((error) => console.error('모집한 팀 목록 조회 실패:', error));

      getReviewableTeamCount()
        .then(setReviewableTeamCount)
        .catch((error) => console.error('평가 대상 팀 개수 조회 실패:', error));

      fetchBookmarkedEventIds()
        .then((ids) => setBookmarkCount(ids.length))
        .catch((error) => console.error('북마크 개수 조회 실패:', error));
    }, [])
  );

  const handleChangePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('사진 접근 권한 필요', '설정에서 사진 보관함 접근 권한을 허용해주세요.', [
        { text: '확인' },
      ]);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setLocalImageUri(asset.uri);

    try {
      await uploadProfileImage({
        uri: asset.uri,
        name: asset.fileName ?? 'profile.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
      getMyProfile().then(setProfile).catch(() => {});
    } catch (error) {
      setLocalImageUri(null);
      Alert.alert('업로드 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.');
    }
  };

  const handleDeletePhoto = async () => {
    const previousLocalImageUri = localImageUri;
    setLocalImageUri(null);

    try {
      await deleteProfileImage();
      setProfile((prev) => (prev ? { ...prev, profileImageUrl: null } : prev));
    } catch (error) {
      setLocalImageUri(previousLocalImageUri);
      Alert.alert('삭제 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.');
    }
  };

  const handlePressCamera = () => setPhotoSheetVisible(true);

  const ACTIVITIES = [
    { label: '지원 및 제안', count: applicationCount, icon: UserIcon, path: '/myApplications' },
    { label: '모집한 팀', count: myTeamCount, icon: FlagIcon, path: '/myteamLeader' },
    { label: '북마크', count: bookmarkCount, icon: Bookmark, path: '/myBookmarks' },
    { label: '팀원 평가', count: reviewableTeamCount, icon: Star, path: '/teamReview' },
  ] as const;

  const SETTINGS = [
    { label: '학교 인증', onPress: () => router.push('/schoolVerify') },
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
              useAuthStore.getState().resetAuth();
              router.replace('/login');
            },
          },
        ]),
    },
  ];

  const temperature = 36.5;

  return (
    <>
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-5"
      contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}
    >
      <View className="flex-row justify-between items-center pt-20 pb-6">
        <TouchableOpacity onPress={() => router.push('/')}>
          <Image source={MypageMLogo} style={{ width: 32, height: 32 }} contentFit="contain" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/notification')}>
          <Image source={NotificationNewDot} style={{ width: 30, height: 30 }} contentFit="contain" />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center mb-6">
        <View className="w-20 h-20">
          <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center overflow-hidden">
            {localImageUri || profile?.profileImageUrl ? (
              <Image
                source={{ uri: localImageUri ?? profile?.profileImageUrl ?? undefined }}
                style={{ width: 80, height: 80 }}
                contentFit="cover"
              />
            ) : (
              <Image source={ProfileUser} style={{ width: 40, height: 40 }} contentFit="contain" />
            )}
          </View>
          <TouchableOpacity
            onPress={handlePressCamera}
            className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white border border-gray-300 items-center justify-center"
          >
            <Image
              source={require('@/assets/images/tool/cmr.png')}
              style={{ width: 10, height: 10 }}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>

        <View className="ml-6">
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

      <View className="mb-8 p-5 rounded-2xl border border-gray-200">
        <Text className="text-black text-xl font-pretendard-bold mb-4">협업온도</Text>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-[#FF0000] text-3xl font-pretendard-bold">{temperature}°C</Text>
          <Image source={HappyLine} style={{ width: 26, height: 26 }} contentFit="contain" />
        </View>
        <TemperatureBar value={temperature} max={100} />
      </View>

      <Text className="text-black text-xl font-pretendard-bold mb-3">내 활동</Text>
      <View className="flex-row flex-wrap gap-3 mb-8">
        {ACTIVITIES.map((activity) => (
          <TouchableOpacity
            key={activity.label}
            disabled={!activity.path}
            onPress={() => activity.path && router.push(activity.path)}
            style={{ width: '31.3%' }}
            className="items-center py-5 rounded-xl border border-gray-200"
          >
            <Image source={activity.icon} style={{ width: 22, height: 22 }} contentFit="contain" />
            <Text className="text-black font-pretendard-semibold mt-2 text-base">{activity.label}</Text>
            <Text className="text-black font-pretendard text-lg mt-0.5">{activity.count}건</Text>
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

    <Modal
      visible={photoSheetVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setPhotoSheetVisible(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setPhotoSheetVisible(false)}
        className="flex-1 bg-black/40 justify-end px-2"
        style={{ paddingBottom: 8 + insets.bottom }}
      >
        <View onStartShouldSetResponder={() => true}>
          <View className="bg-[#F2F2F2] rounded-2xl overflow-hidden mb-2">
            <TouchableOpacity
              onPress={() => {
                setPhotoSheetVisible(false);
                handleChangePhoto();
              }}
              className="h-16 items-center justify-center"
            >
              <Text className="text-black text-lg font-pretendard">프로필 사진 변경</Text>
            </TouchableOpacity>

            <View className="h-[0.5px] bg-gray-300" />

            <TouchableOpacity
              onPress={() => {
                setPhotoSheetVisible(false);
                handleDeletePhoto();
              }}
              className="h-16 items-center justify-center"
            >
              <Text className="text-black text-lg font-pretendard">기본 이미지로 설정</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setPhotoSheetVisible(false)}
            className="h-16 items-center justify-center bg-[#F2F2F2] rounded-2xl"
          >
            <Text className="text-red-500 text-xl font-pretendard-semibold">취소</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
    </>
  );
}