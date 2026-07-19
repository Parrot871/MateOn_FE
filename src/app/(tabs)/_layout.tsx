import NavigationBar from '@/components/ui/NavigationBar';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TopSafeAreaFill() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: '#ffffff',
        zIndex: 100,
      }}
    />
  );
}

export default function TabLayout() {
  return (
    <>
      <Tabs screenOptions={{ headerShown: false }} tabBar={() => null}>
        <Tabs.Screen name="index" options={{ title: '홈' }} />
        <Tabs.Screen name="activity" options={{ title: '활동' }} />
        <Tabs.Screen name="chatbot" options={{ title: '챗봇' }} />
        <Tabs.Screen name="chat" options={{ title: '채팅' }} />
        <Tabs.Screen name="my" options={{ title: '마이' }} />
      </Tabs>
      <TopSafeAreaFill />
      <NavigationBar />
    </>
  );
}