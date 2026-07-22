import { computeDDay, fetchEventDetail } from '@/api/events';
import { getRecommendedTeams, type TeamRecommendation } from '@/api/team';
import { Alarm, Back, DateIcon, Point } from '@/assets/images/tool';
import { GroupFill } from '@/assets/icons';
import { useEventDetailStore } from '@/store/eventDetailStore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function TeamListCard({ team, onPress }: { team: TeamRecommendation; onPress: () => void }) {
  const tag = team.characteristic || team.role[0];

  return (
    <TouchableOpacity onPress={onPress} className="px-4 py-3.5 rounded-xl border border-gray-200 mb-3">
      <Text className="text-gray-900 font-pretendard-bold text-base mb-1.5" numberOfLines={1}>
        {tag ? `[${tag}] ` : ''}
        {team.title}
      </Text>
      <Text className="text-gray-500 text-sm font-pretendard-regular mb-2.5" numberOfLines={2}>
        {team.promotionText}
      </Text>
      <View className="flex-row items-center gap-1">
        <Image source={GroupFill} style={{ width: 16, height: 16 }} contentFit="contain" />
        <Text className="text-gray-400 text-xs font-pretendard-medium">
          {team.currentMemberCount}/{team.capacity}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function EventInfoScreen() {
  const router = useRouter();
  const event = useEventDetailStore((s) => s.selectedEvent);

  const [teams, setTeams] = useState<TeamRecommendation[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [imageAspectRatio, setImageAspectRatio] = useState(1);

  useEffect(() => {
    if (!event) return;

    // TODO: /api/events/{id} 응답에 모집중인 팀 정보가 포함되는지 확인 중인 임시 디버그 로그
    fetchEventDetail(event.id).catch((error) => console.warn('[fetchEventDetail] 실패', error));

    getRecommendedTeams({ eventId: event.id })
      .then(setTeams)
      .catch(() => setTeams([]))
      .finally(() => setIsLoadingTeams(false));
  }, [event]);

  if (!event) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-6 py-3 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
          </TouchableOpacity>
          <Text className="text-black text-2xl font-pretendard-bold">활동 정보</Text>
          <View style={{ width: 26, height: 26 }} />
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-400 font-pretendard-medium text-center">활동 정보를 찾을 수 없어요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-6 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
        </TouchableOpacity>
        <Text className="text-black text-2xl font-pretendard-bold">활동 정보</Text>
        <View style={{ width: 26, height: 26 }} />
      </View>

      <ScrollView className="flex-1 px-5 pt-5" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="text-black text-2xl font-pretendard-bold mb-4">{event.title}</Text>

        {event.imageUrl ? (
          <Image
            source={{ uri: event.imageUrl }}
            style={{ width: '100%', aspectRatio: imageAspectRatio, borderRadius: 16, backgroundColor: '#F3F4F6' }}
            contentFit="contain"
            onLoad={(e) => {
              const { width, height } = e.source;
              if (width && height) setImageAspectRatio(width / height);
            }}
          />
        ) : (
          <View className="w-full h-[200px] rounded-2xl border border-gray-200 items-center justify-center">
            <Text className="text-gray-400 font-pretendard-medium">이미지가 없어요</Text>
          </View>
        )}

        <View className="flex-row items-center mt-4 px-4 py-4 rounded-2xl border border-gray-200">
          <View className="flex-1 flex-row items-center justify-center gap-4">
            <Image source={DateIcon} style={{ width: 24, height: 24 }} contentFit="contain" />
            <View>
              <Text className="text-gray-400 text-base font-pretendard-medium">기간</Text>
              <Text className="text-gray-900 text-lg font-pretendard-bold">{event.startDate.replaceAll('-', '.')} ~ </Text>
              <Text className="text-gray-900 text-lg font-pretendard-bold">{event.endDate.replaceAll('-', '.')}</Text>
            </View>
          </View>
          <View className="w-[1px] h-9 bg-gray-200" />
          <View className="flex-1 flex-row items-center justify-center gap-4">
            <Image source={Alarm} style={{ width: 24, height: 24 }} contentFit="contain" />
            <View>
              <Text className="text-gray-400 text-base font-pretendard-medium">마감일</Text>
              <Text className="text-indigo-600 text-lg font-pretendard-bold">{computeDDay(event.endDate)}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => Linking.openURL(event.detailUrl)}
          className="mt-4 py-4 rounded-xl border border-gray-200 items-center"
        >
          <Text className="text-gray-700 font-pretendard-bold text-base">상세 페이지 보기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/teamRecruit',
              params: { eventId: String(event.id), eventTitle: event.title },
            })
          }
          className="mt-3 py-4 rounded-xl bg-indigo-600 items-center"
        >
          <Text className="text-white font-pretendard-bold text-base">이 활동으로 팀 만들기</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-1.5 mt-8 mb-3">
          <Image source={Point} style={{ width: 18, height: 18 }} contentFit="contain" />
          <Text className="text-black text-lg font-pretendard-bold">이 활동으로 모집중인 팀</Text>
        </View>

        {isLoadingTeams ? (
          <View className="py-10 items-center">
            <ActivityIndicator color="#4F46E5" />
          </View>
        ) : teams.length === 0 ? (
          <View className="py-10 items-center bg-gray-50 rounded-xl">
            <Text className="text-gray-400 font-pretendard-medium">아직 모집중인 팀이 없어요.</Text>
          </View>
        ) : (
          teams.map((team) => (
            <TeamListCard
              key={team.teamId}
              team={team}
              onPress={() => router.push({ pathname: '/teamDetail', params: { teamId: team.teamId } })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
