import { computeDDay, EventEmbeddingNotReadyError, fetchSimilarityMap, type SimilarityMap } from '@/api/events';
import { getRecommendedTeams, MatchingIntentRequiredError, type TeamRecommendation } from '@/api/team';
import { GroupFill } from '@/assets/icons';
import { Alarm, Back, Bookmark, DateIcon, Point } from '@/assets/images/tool';
import { SimilarEventsPanel } from '@/components/ui/SimilarEventsPanel';
import { useBookmarkedEventIds } from '@/hooks/useBookmarkedEvents';
import { useSchoolVerified } from '@/hooks/useSchoolVerified';
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
  const [needsMatchingIntent, setNeedsMatchingIntent] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(1);
  const [similarityMap, setSimilarityMap] = useState<SimilarityMap | null>(null);
  const [similarityStatus, setSimilarityStatus] = useState<'loading' | 'ready' | 'empty' | 'not-ready' | 'error'>(
    'loading'
  );
  const { bookmarkedIds, toggleBookmark } = useBookmarkedEventIds();
  const schoolVerified = useSchoolVerified();

  useEffect(() => {
  if (!event) return;

  setIsLoadingTeams(true);
  setNeedsMatchingIntent(false);

  getRecommendedTeams({ eventId: event.id })
    .then(setTeams)
    .catch((error) => {
      if (error instanceof MatchingIntentRequiredError) {
        setNeedsMatchingIntent(true);
      } else {
        console.warn('[getRecommendedTeams] 실패', error);
      }
      setTeams([]);
    })
    .finally(() => setIsLoadingTeams(false));
}, [event]);

  useEffect(() => {
    if (!event) return;

    let cancelled = false;
    setSimilarityStatus('loading');

    fetchSimilarityMap(event.id, 20)
      .then((map) => {
        if (cancelled) return;
        const points = map.points.filter((p) => Math.round(p.similarity * 100) < 100).slice(0, 10);
        setSimilarityMap({ ...map, points });
        setSimilarityStatus(points.length > 0 ? 'ready' : 'empty');
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof EventEmbeddingNotReadyError) {
          setSimilarityStatus('not-ready');
        } else {
          console.warn('[fetchSimilarityMap] 실패', error);
          setSimilarityStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
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
        <TouchableOpacity
          onPress={() => toggleBookmark(event.id, !bookmarkedIds.has(event.id))}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="w-[26px] h-[26px] items-center justify-center"
        >
          <Image
            source={Bookmark}
            style={{ width: 22, height: 22 }}
            contentFit="contain"
            tintColor={bookmarkedIds.has(event.id) ? '#EF4444' : undefined}
          />
        </TouchableOpacity>
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

        {similarityStatus === 'loading' ? (
          <View className="mt-4 py-10 items-center rounded-2xl border border-gray-200">
            <ActivityIndicator color="#4F46E5" />
            <Text className="text-gray-400 font-pretendard-medium mt-3">비슷한 활동을 불러오는 중이에요</Text>
          </View>
        ) : similarityStatus === 'not-ready' ? (
          <View className="mt-4 py-10 items-center bg-gray-50 rounded-2xl">
            <Text className="text-gray-400 font-pretendard-medium text-center px-6">
              유사도 분석을 준비하고 있어요.{'\n'}잠시 후 다시 확인해주세요.
            </Text>
          </View>
        ) : similarityStatus === 'empty' ? (
          <View className="mt-4 py-10 items-center bg-gray-50 rounded-2xl">
            <Text className="text-gray-400 font-pretendard-medium">아직 비교할 만한 유사 활동이 없어요.</Text>
          </View>
        ) : similarityStatus === 'ready' && similarityMap ? (
          <SimilarEventsPanel map={similarityMap} />
        ) : null}

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

        {schoolVerified ? (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/team/recruit',
                params: { eventId: String(event.id), eventTitle: event.title },
              })
            }
            className="mt-3 py-4 rounded-xl bg-indigo-600 items-center"
          >
            <Text className="text-white font-pretendard-bold text-base">이 활동으로 팀 만들기</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/(auth)/schoolVerify')}
            className="mt-3 py-4 rounded-xl bg-gray-100 items-center"
          >
            <Text className="text-gray-400 font-pretendard-bold text-base">학교 인증하고 팀 만들기</Text>
          </TouchableOpacity>
        )}

        <View className="flex-row items-center gap-1.5 mt-8 mb-3">
          <Image source={Point} style={{ width: 18, height: 18 }} contentFit="contain" />
          <Text className="text-black text-lg font-pretendard-bold">이 활동으로 모집중인 팀</Text>
        </View>

        {isLoadingTeams ? (
          <View className="py-10 items-center">
            <ActivityIndicator color="#4F46E5" />
          </View>
        ) : !schoolVerified ? (
          <TouchableOpacity
            onPress={() => router.push('/schoolVerify')}
            className="py-10 items-center bg-gray-50 rounded-xl"
          >
            <Text className="text-gray-400 font-pretendard-medium">학교 인증하고 팀 지원하기</Text>
          </TouchableOpacity>
        ) : needsMatchingIntent ? (
          <TouchableOpacity
            onPress={() => router.push('/chatbot')}
            className="py-10 items-center bg-gray-50 rounded-xl"
          >
            <Text className="text-gray-400 font-pretendard-medium">매칭 의도를 설정하면 추천 팀을 볼 수 있어요</Text>
          </TouchableOpacity>
        ) : teams.length === 0 ? (
          <View className="py-10 items-center bg-gray-50 rounded-xl">
            <Text className="text-gray-400 font-pretendard-medium">아직 모집중인 팀이 없어요.</Text>
          </View>
        ) : (
          teams.map((team) => (
            <TeamListCard
              key={team.teamId}
              team={team}
              onPress={() => router.push({ pathname: '/team/[teamId]', params: { teamId: team.teamId } })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
