import { Text, TouchableOpacity, View } from 'react-native';

export type MemberCandidateCardProps = {
  name: string;
  school?: string;
  major?: string;
  grade?: string;
  tagline?: string;
  desiredRoles?: string[];
  experienceLevel?: string;
  activityStyle?: string;
  // AI 추천(team-to-user)일 때만 내려오는 필드. 지원자 카드에서는 undefined로 두면 자동으로 숨겨짐
  // NOTE: score는 0~1 스케일이라고 가정하고 ×100 처리함. 백엔드가 이미 0~100이면 toPercentage에서 ×100 제거
  score?: number;
  label?: string;
  onPress?: () => void;
};

function toPercentage(score: number) {
  return Math.round(score * 100);
}

const MAX_VISIBLE_CHIPS = 3;

function ChipRow({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return null;

  const visible = items.slice(0, MAX_VISIBLE_CHIPS);
  const restCount = items.length - visible.length;

  return (
    <View className="flex-row flex-wrap gap-1.5 mt-2">
      {visible.map((item, idx) => (
        <View key={`${item}-${idx}`} className="bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
          <Text className="text-gray-600 text-xs font-pretendard-medium">{item}</Text>
        </View>
      ))}
      {restCount > 0 && (
        <View className="bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
          <Text className="text-gray-400 text-xs font-pretendard-medium">+{restCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function MemberCandidateCard({
  name,
  school,
  major,
  grade,
  desiredRoles,
  score,
  label,
  onPress,
}: MemberCandidateCardProps) {
  const metaLine = [school, major, grade].filter(Boolean).join(' · ');
  const isAiRecommendation = score !== undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white border border-gray-100 rounded-2xl p-4 mb-3"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {/* 상단: 이름/학교전공 + AI 추천 점수 뱃지 */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-black text-base font-pretendard-bold" numberOfLines={1}>
            {name}
          </Text>
          {metaLine.length > 0 && (
            <Text className="text-gray-400 text-xs font-pretendard-medium mt-0.5" numberOfLines={1}>
              {metaLine}
            </Text>
          )}
        </View>

        {isAiRecommendation && (
          <View className="bg-blue-50 rounded-full px-2.5 py-1 items-end">
            <Text className="text-blue-600 text-xs font-pretendard-bold">
              ✨ AI 추천 {toPercentage(score!)}%
            </Text>
          </View>
        )}
      </View>

      {/* AI 추천 근거 문구 */}
      {isAiRecommendation && label && (
        <Text className="text-blue-500 text-xs font-pretendard-medium mt-1.5" numberOfLines={1}>
         ✨ AI 추천 이유:  {label}
        </Text>
      )}
      
      {/* 희망 역할 */}
      <ChipRow items={desiredRoles} />

    </TouchableOpacity>
  );
}