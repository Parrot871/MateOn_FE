// src/components/ui/MyTeamCard.tsx
import type { TeamSummary } from '@/api/team';
import { Text, TouchableOpacity, View } from 'react-native';

interface MyTeamCardProps {
  team: TeamSummary;
  onPress: () => void;
}

export function MyTeamCard({ team, onPress }: MyTeamCardProps) {
  // 모집률 계산 (0~100%)
  const fillPercentage = Math.min(
    Math.round((team.currentMemberCount / team.capacity) * 100),
    100
  );

  const isFull = team.currentMemberCount >= team.capacity;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm"
      style={{
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      }}
    >
      {/* 1. 상단: 상태 뱃지 & 마감일 */}
      <View className="flex-row justify-between items-center mb-2.5">
        <View
          className={`flex-row items-center px-2.5 py-1 rounded-full ${
            team.isRecruiting ? 'bg-blue-50' : 'bg-gray-100'
          }`}
        >
          {team.isRecruiting && (
            <View className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5" />
          )}
          <Text
            className={`text-xs font-pretendard-semibold ${
              team.isRecruiting ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            {team.isRecruiting ? '모집 중' : '모집 완료'}
          </Text>
        </View>

        <View className="bg-gray-50 px-2.5 py-1 rounded-lg">
          <Text className="text-[11px] text-gray-500 font-pretendard-medium">
            마감 {team.recruitmentEndDate}
          </Text>
        </View>
      </View>

      {/* 2. 중단: 팀 제목 및 연결된 공모전 (여백 축소 mb-4 -> mb-2) */}
      <View className="mb-2">
        <Text
          numberOfLines={1}
          className="text-base font-pretendard-bold text-gray-900 mb-1 tracking-tight"
        >
          {team.title}
        </Text>

        {!!team.connectedActivityTitle ? (
          <View className="self-start bg-blue-50/60 border border-blue-100/80 px-2 py-0.5 rounded-md">
            <Text
              numberOfLines={1}
              className="text-[11px] font-pretendard-medium text-blue-700"
            >
              🏆 {team.connectedActivityTitle}
            </Text>
          </View>
        ) : (
          /* 공모전 연결이 없어도 간격 밸런스 유지를 위한 최소 빈 공간 */
          <View className="h-1" />
        )}
      </View>

      {/* 3. 하단: Progress Bar (모집률 시각화) */}
      <View className="bg-gray-50/80 p-2.5 rounded-2xl border border-gray-100/60">
        <View className="flex-row justify-between items-center mb-1.5">
          <Text className="text-[11px] font-pretendard-medium text-gray-500">
            팀원 충원율
          </Text>
          <Text className="text-xs font-pretendard-semibold text-gray-700">
            <Text
              className={
                isFull
                  ? 'text-emerald-600 font-pretendard-bold'
                  : 'text-blue-600 font-pretendard-bold'
              }
            >
              {team.currentMemberCount}
            </Text>
            <Text className="text-gray-400"> / {team.capacity}명</Text>
            <Text className="text-gray-400"> ({fillPercentage}%)</Text>
          </Text>
        </View>

        {/* Progress Bar 트랙 */}
        <View className="w-full h-2 bg-gray-200/60 rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full ${
              isFull ? 'bg-emerald-500' : 'bg-blue-600'
            }`}
            style={{ width: `${fillPercentage}%` }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}