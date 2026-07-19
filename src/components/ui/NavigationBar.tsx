import {
  HomeFill,
  HomeLine,
  MessageFill,
  MessageLine,
  SearchFill,
  SearchLine,
  UserFill,
  UserLine,
} from '@/assets/icons';
import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 탭 하나하나의 정보를 배열로 미리 정의
const TABS = [
  { path: '/', label: '홈', LineIcon: HomeLine, FillIcon: HomeFill },
  { path: '/activity', label: '활동', LineIcon: SearchLine, FillIcon: SearchFill },
  { path: '/chat', label: '채팅', LineIcon: MessageLine, FillIcon: MessageFill },
  { path: '/my', label: '마이', LineIcon: UserLine, FillIcon: UserFill },
];

export default function NavigationBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  const leftTabs = TABS.slice(0, 2);
  const rightTabs = TABS.slice(2, 4);

  const renderTab = (tab: (typeof TABS)[number]) => {
    const isFocused = pathname === tab.path;
    const Icon = isFocused ? tab.FillIcon : tab.LineIcon;

    return (
      <Pressable key={tab.path} onPress={() => router.replace(tab.path as never)} className="flex-1 items-center">
        <Image source={Icon} style={{ width: 30, height: 30 }} contentFit="contain" />
        <Text className={`mt-1 text-xs ${isFocused ? 'text-slate-900' : 'text-slate-400'}`}>{tab.label}</Text>
      </Pressable>
    );
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0"
      style={{ height: 90 + insets.bottom }}
      pointerEvents="box-none"
    >
      <View
        className="absolute self-center top-[-10] w-24 h-24 rounded-full z-10"
        style={{ backgroundColor: '#FAFAFC' }}
      />
      <View className="absolute self-center top-[-4] w-20 h-20 rounded-full bg-[#C9C9EE] z-10" />
      <Pressable
        onPress={() => router.push('/chatbot' as never)}
        className="absolute self-center top-0 w-16 h-16 rounded-full items-center justify-center z-10"
      >
        <Image source={require('@/assets/icons/dreamy.png')} style={{ width: 64, height: 64 }} contentFit="contain" />
      </Pressable>

      <View
        className="absolute bottom-0 left-0 right-0 flex-row bg-white pt-2 border-t border-gray-100"
        style={{ paddingBottom: insets.bottom }}
      >
        {leftTabs.map(renderTab)}
        <View className="w-16" />
        {rightTabs.map(renderTab)}
      </View>
    </View>
  );
}
