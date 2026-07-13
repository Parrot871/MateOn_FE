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
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavigationBarProps = {
  state: { index: number; routeNames: string[] };
  navigation: any;
};

// 탭 하나하나의 정보를 배열로 미리 정의
const TABS = [
  { routeName: 'index', label: '홈', LineIcon: HomeLine, FillIcon: HomeFill },
  { routeName: 'activity', label: '활동', LineIcon: SearchLine, FillIcon: SearchFill },
  { routeName: 'chat', label: '채팅', LineIcon: MessageLine, FillIcon: MessageFill },
  { routeName: 'my', label: '마이', LineIcon: UserLine, FillIcon: UserFill },
];

export default function NavigationBar({ state, navigation }: NavigationBarProps) {
  const insets = useSafeAreaInsets();

  const leftTabs = TABS.slice(0, 2);
  const rightTabs = TABS.slice(2, 4);

  const renderTab = (tab: typeof TABS[number]) => {
    const routeIndex = state.routeNames.indexOf(tab.routeName);
    const isFocused = state.index === routeIndex;
    const Icon = isFocused ? tab.FillIcon : tab.LineIcon;

    return (
      <Pressable
        key={tab.routeName}
        onPress={() => navigation.navigate(tab.routeName)}
        className="flex-1 items-center"
      >
        <Image source={Icon} style={{ width: 24, height: 24 }} contentFit="contain" />
        <Text className={`mt-1 text-xs ${isFocused ? 'text-slate-900' : 'text-slate-400'}`}>
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={{ height: 90 + insets.bottom }}>
      <View
        className="absolute self-center top-[-10] w-24 h-24 rounded-full z-10"
        style={{ backgroundColor: '#FAFAFC' }}
      />
      <View
        className="absolute self-center top-[-4] w-20 h-20 rounded-full bg-[#C9C9EE] z-10"
      />
      <Pressable
        onPress={() => navigation.navigate('chatbot')}
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