module.exports = {
  expo: {
    name: "MateOn",
    slug: "MateOn_FE",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo_light.png",
    scheme: "mateonfe",
    userInterfaceStyle: "automatic",
    ios: {
      icon: "./assets/images/logo_light.png",
      bundleIdentifier: "com.anonymous.MateOn-FE",
    },
    web: {
      output: "static",
      favicon: "./assets/images/logo_light.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#8BA9FF",
          image: "./assets/images/logo_light.png",
          imageWidth: 120,
        },
      ],
      [
        "@react-native-seoul/kakao-login",
        {
          kakaoAppKey: process.env.KAKAO_NATIVE_APP_KEY,
        },
      ],
      "expo-secure-store",
      "@react-native-community/datetimepicker",
      [
        "expo-image-picker",
        {
          photosPermission: "프로필 사진을 선택하기 위해 사진 보관함 접근 권한이 필요해요.",
        },
      ],
      "expo-image",
      "expo-status-bar",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    android: {
      package: "com.anonymous.MateOn_FE",
    },
  },
};
