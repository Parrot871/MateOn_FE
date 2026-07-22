// src/app/myteamLeader.tsx
import { Back } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

// TODO: 내가 모집한 팀 목록 조회 API가 아직 백엔드에 구현되지 않음. 준비되면 연결.
export default function MyTeamLeaderScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-6 pt-20 pb-10">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
        </TouchableOpacity>
        <Text className="text-black text-2xl font-pretendard-bold">모집한 팀</Text>
        <View style={{ width: 26, height: 26 }} />
      </View>

      <View className="flex-1 items-center justify-center px-8 pb-20">
        <Text className="text-gray-400 font-pretendard text-base">아직 모집한 팀이 없어요.</Text>
      </View>
    </View>
  );
}
