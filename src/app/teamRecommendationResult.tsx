import { Back } from '@/assets/images/tool';
import TeamRecommendationCard from '@/components/ui/TeamRecommendationCard';
import { useTeamRecStore } from '@/store/teamRecStore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 40;

export default function TeamRecommendationResultScreen() {
  const router = useRouter();
  const { teamRec, fetchTeamRec, hasHydrated } = useTeamRecStore();

  useEffect(() => {
    if (!hasHydrated) return;
    fetchTeamRec({ force: true });
  }, [fetchTeamRec, hasHydrated]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-6 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
        </TouchableOpacity>
        <Text className="text-black text-2xl font-pretendard-bold">팀 추천 결과</Text>
        <View style={{ width: 26, height: 26 }} />
      </View>

      <ScrollView className="flex-1 px-5 pt-5" contentContainerStyle={{ paddingBottom: 32 }}>
        {teamRec.status === 'loading' && (
          <View className="items-center justify-center py-16">
            <ActivityIndicator color="#4F46E5" />
          </View>
        )}

        {teamRec.status === 'empty' && (
          <View className="bg-gray-50 rounded-2xl p-5 items-center">
            <Text className="text-gray-500">추천할 수 있는 팀이 아직 없어요.</Text>
          </View>
        )}

        {teamRec.status === 'error' && (
          <View className="bg-gray-50 rounded-2xl p-5 items-center">
            <Text className="text-gray-500">추천 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</Text>
          </View>
        )}

        {teamRec.status === 'ready' && (
          <View className="gap-3">
            {teamRec.teams.map((team) => (
              <TeamRecommendationCard
                key={team.teamId}
                team={team}
                width={CARD_WIDTH}
                onPress={() => router.push({ pathname: '/teamDetail', params: { teamId: team.teamId } })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
