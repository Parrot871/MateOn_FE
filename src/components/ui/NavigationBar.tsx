import { HomeLine, MessageLine, SearchLine, UserLine } from '@/assets/icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NavigationBar({ state, navigation }: BottomTabBarProps){
  const insets = useSafeAreaInsets();

  return (
    <View className="relative">
      <View className="absolute self-center -top-8 w-16 h-16 rounded-full bg-blue-500" />
      <View className="flex-row bg-white pt-2 pb-6 border-t border-gray-100" style={{ paddingBottom: insets.bottom }}>
        <View className="flex-1 items-center">
          <Image source={HomeLine} style={{ width: 24, height: 24}} contentFit="contain" />
          <Text>홈</Text>
        </View>
        <View className="flex-1 items-center">
          <Image source={SearchLine} style={{ width: 24, height: 24}} contentFit="contain" />
          <Text>활동</Text>
        </View>
        <View className="w-16" />
        <View className="flex-1 items-center">
          <Image source={MessageLine} style={{ width: 24, height: 24}} contentFit="contain" />
          <Text>채팅</Text>
        </View>
        <View className="flex-1 items-center">
          <Image source={UserLine} style={{ width: 24, height: 24}} contentFit="contain" />
          <Text>마이</Text>
        </View>        
      </View>
    </View>

  );
}