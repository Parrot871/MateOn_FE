import { Back } from '@/assets/images/tool';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TeamMembersScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-6 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={Back} style={{ width: 26, height: 26 }} contentFit="contain" />
        </TouchableOpacity>
        <Text className="text-black text-2xl font-pretendard-bold">팀원 찾기</Text>
        <View style={{ width: 26, height: 26 }} />
      </View>

      <View className="flex-1 items-center justify-center px-5">
        <Text className="text-gray-500 font-pretendard-medium text-center">
          팀 {teamId} 팀원 찾기 화면은 준비 중이에요.
        </Text>
      </View>
    </SafeAreaView>
  );
}
