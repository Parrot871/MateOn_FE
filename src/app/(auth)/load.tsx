// src/app/(auth)/load.tsx
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

const logoLight = require('../../../assets/images/login/MateOnLogo.svg');

const LOAD_DURATION = 2000;

export default function LoadScreen() {
  const router = useRouter();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: LOAD_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(() => {
      router.replace('/login');
    });
  }, [progress, router]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className="flex-1 justify-center items-center px-10 bg-[#8BA9FF]">
      <Image source={logoLight} style={{ width: 230, height: 200 }} contentFit="contain" />
      
      <View className="w-full h-2 bg-white/30 rounded-full mt-12 overflow-hidden">
        <Animated.View style={{ width: progressWidth }} className="h-full bg-white rounded-full" />
      </View>
    </View>
  );
}
