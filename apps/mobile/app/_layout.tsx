import "../global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Sentry from "@sentry/react-native";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { configure } from "@myrio/api";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { queryClient } from "@/lib/query-client";
import { configurePushHandler } from "@/lib/push";
import { checkForOTAUpdate } from "@/lib/updates";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
});

configure({
  apiBaseUrl:
    (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080") + "/api/v1",
});

configurePushHandler();

SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthGate() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  // Navigating before the root navigator mounts throws on cold-start deep links.
  const navState = useRootNavigationState();
  const navReady = !!navState?.key;

  useEffect(() => {
    if (loading || !navReady) return;
    const inAuth = segments[0] === "(auth)";
    if (!user && !inAuth) router.replace("/(auth)/login");
    else if (user && inAuth) router.replace("/(tabs)");
  }, [user, loading, segments, navReady]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    checkForOTAUpdate();
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AuthGate />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="sale/[eventId]" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="item/[eventId]/[bundleId]/[itemId]" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="conversation/[convId]" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="notifications" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="purchases" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="+not-found" />
            </Stack>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
