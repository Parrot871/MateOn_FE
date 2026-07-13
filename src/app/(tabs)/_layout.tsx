import NavigationBar from '@/components/ui/NavigationBar';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}
    tabBar={(props) => <NavigationBar {...props as any} />}>
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="activity" options={{ title: '활동'}} />
      <Tabs.Screen name="chatbot" options={{ title: '챗봇'}} />
      <Tabs.Screen name="chat" options={{ title: '채팅'}} />
      <Tabs.Screen name="my" options={{ title: '마이'}} />
    </Tabs>
  );
}