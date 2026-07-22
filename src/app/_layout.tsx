import { getAccessToken } from '@/api/tokenStorage';
import { PretendardFonts } from '@/constants/theme';
import { useTeamRecStore } from '@/store/teamRecStore';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "../../global.css";

SplashScreen.preventAutoHideAsync();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FAFAFC',
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts(PretendardFonts);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const fetchTeamRec = useTeamRecStore((s) => s.fetchTeamRec);

  useEffect(() => {
    getAccessToken().then((token) => {
      setIsAuthenticated(!!token);
      setIsAuthChecked(true);
    });
  }, [segments]);

  useEffect(() => {
    if (!isAuthChecked) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthChecked, isAuthenticated, segments]);

  // 인증 확인되면 홈에서 쓸 팀 추천 데이터 미리 당겨오기
  useEffect(() => {
    if (isAuthChecked && isAuthenticated) {
      fetchTeamRec();
    }
  }, [isAuthChecked, isAuthenticated, fetchTeamRec]);

  useEffect(() => {
    if (fontsLoaded && isAuthChecked) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isAuthChecked]);

  if (!fontsLoaded || !isAuthChecked) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={MyTheme}>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}