import { PretendardFonts } from '@/constants/theme';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import "../../global.css";

SplashScreen.preventAutoHideAsync();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FAFAFC',
  },
};

// 노치 영역만 흰색으로 덮는 컴포넌트
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

export default function RootLayout() {
  const [fontsLoaded] = useFonts(PretendardFonts);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={MyTheme}>
        <Stack screenOptions={{ headerShown: false }} />
        <TopSafeAreaFill />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}