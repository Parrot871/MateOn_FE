import { AiServerError, ForbiddenAccessError, getUserToTeamRecommendationReason, RecommendationNotFoundError, type TeamRecommendation } from '@/api/team';
import { GroupFill } from '@/assets/icons';
import { getDaysLeft, getRecommendation, getUrgencyInfo } from '@/utils/teamRecommendation';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

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

  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [loadingReason, setLoadingReason] = useState(false);

  const handleOpenReason = async () => {
    setReasonModalVisible(true);
    if (reason !== null) return;

    setLoadingReason(true);
    try {
      const detail = await getUserToTeamRecommendationReason({ teamId: team.teamId });
      setReason(detail);
    } catch (err) {
      if (err instanceof ForbiddenAccessError) {
        setReason('이 팀에 대한 추천 이유를 볼 수 없어요.');
      } else if (err instanceof RecommendationNotFoundError) {
        setReason('최근 추천 결과를 찾을 수 없어요.');
      } else if (err instanceof AiServerError) {
        setReason('AI 서버 오류로 이유를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      } else {
        setReason('추천 이유를 불러오지 못했어요.');
      }
    } finally {
      setLoadingReason(false);
    }
  };

  return (
    <>
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
        {/* 상단 뱃지 영역 */}
        <View className="flex-row justify-between items-center mb-3">
          <View className={`${urgency.bg} px-2.5 py-1 rounded-full`}>
            <Text className={`${urgency.text} text-xs font-pretendard-bold`}>
              {urgency.label}
            </Text>
          </View>

          <View className="bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            <Text className="text-blue-600 text-xs font-pretendard-bold">
              ✨ AI 추천 {recommendation.percent}%
            </Text>
          </View>
        </View>

        {/* 제목 */}
        <Text
          className="text-black font-pretendard-bold text-base mb-1.5"
          numberOfLines={1}
        >
          {team.title}
        </Text>

        {/* 연결 공모전 */}
        {team.connectedActivityTitle && (
          <Text
            className="text-gray-400 text-xs mb-3"
            numberOfLines={1}
          >
            🔗 {team.connectedActivityTitle}
          </Text>
        )}

        {/* AI 추천 이유 칩 영역 */}
        <TouchableOpacity
          onPress={handleOpenReason}
          activeOpacity={0.7}
          className="mb-3 bg-blue-50/60 border border-blue-100/80 rounded-xl p-2.5 flex-row items-center justify-between"
        >
          <View className="flex-1 mr-2 flex-row items-center">
            <Text className="text-gray-700 text-xs font-pretendard-medium flex-1 mr-2" numberOfLines={1}>
              <Text className="text-blue-700 font-pretendard-bold">✨ AI 추천 이유: </Text>
                  {team.label}
            </Text>
          </View>
          
          <Text className="text-blue-500 text-[11px] font-pretendard-semibold shrink-0">
            상세 보기 ›
          </Text>
        </TouchableOpacity>

        {/* 역할 태그 */}
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

        {/* 하단 인원 정보 */}
        <View className="flex-row items-center gap-1.5 mt-auto">
          <Image source={GroupFill} style={{ width: 15, height: 15 }} contentFit="contain" />
          <Text className="text-gray-400 text-xs font-pretendard-regular">
            {team.currentMemberCount}/{team.capacity}명 참여 중
          </Text>
        </View>
      </TouchableOpacity>

      {/* AI 추천 상세 이유 바텀시트 */}
      <Modal
        visible={reasonModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReasonModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setReasonModalVisible(false)}
        >
          <Pressable className="bg-white rounded-t-3xl p-5 pb-8" onPress={(e) => e.stopPropagation()}>
            <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-4" />
            <Text className="text-black font-pretendard-bold text-lg mb-1">
              ✨ {team.title}
            </Text>
            <Text className="text-gray-400 text-xs mb-4">AI 추천 이유</Text>

            {loadingReason ? (
              <View className="py-8 items-center">
                <ActivityIndicator color="#2563EB" />
              </View>
            ) : (
              <Text className="text-gray-700 text-sm leading-6">{reason}</Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}