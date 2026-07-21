import type { TeamRecommendation } from '@/api/team';
import { GroupFill } from '@/assets/icons';
import { getDaysLeft, getRecommendation, getUrgencyInfo } from '@/utils/teamRecommendation';
import { Image } from 'expo-image';
import { Text, TouchableOpacity, View } from 'react-native';

export default function TeamRecommendationCard({
  team,
  onPress,
  width,
}: {
  team: TeamRecommendation;
  onPress: () => void;
  width: number;
}) {
  const daysLeft = getDaysLeft(team.recruitmentEndDate);
  const urgency = getUrgencyInfo(daysLeft);
  const recommendation = getRecommendation(team.score);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="border border-gray-100 rounded-2xl p-4 bg-white"
      style={{
        width,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      {/* 상단 */}
      <View className="flex-row justify-between items-center mb-3">
        <View className={`${urgency.bg} px-2 py-1 rounded-full`}>
          <Text className={`${urgency.text} text-xs font-pretendard-bold`}>
            {urgency.label}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: '#EFF6FF',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 999,
          }}
        >
          <Text
            style={{
              color: '#2563EB',
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            ✨ AI 추천 {recommendation.percent}%
          </Text>
        </View>
      </View>

      {/* 제목 */}
      <Text
        className="text-black font-pretendard-bold text-base mb-1"
        numberOfLines={1}
      >
        {team.title}
      </Text>

      {/* 설명 */}
      <Text
        className="text-gray-500 text-sm mb-3"
        numberOfLines={2}
      >
        {team.label}
      </Text>

      {/* 연결 공모전 */}
      {team.connectedActivityTitle && (
        <Text
          className="text-gray-400 text-xs mb-2"
          numberOfLines={1}
        >
          🔗 {team.connectedActivityTitle}
        </Text>
      )}

      {/* 역할 */}
      <View className="flex-row flex-wrap gap-1.5 mb-3">
        {team.role.map((r) => (
          <View
            key={r}
            className="bg-gray-100 px-2 py-0.5 rounded-full"
          >
            <Text className="text-gray-600 text-xs">{r}</Text>
          </View>
        ))}
      </View>

      {/* 하단 */}
      <View className="flex-row items-center gap-1">
          <Image source={GroupFill} style={{ width: 16, height: 16 }} contentFit="contain" />
          <Text className="text-gray-400 text-xs">
            {team.currentMemberCount}/{team.capacity}명 참여 중
          </Text>
      </View>
    </TouchableOpacity>
  );
}