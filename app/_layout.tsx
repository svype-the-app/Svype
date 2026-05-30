import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRootNavigationState, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ChatUnreadProvider } from '@/lib/chat-unread-context';
import { asyncStoragePersister, clearCachedData, GC_TIME, prefetchForUser, queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { authApi } from '@/services/api';
import { apiClient } from '@/services/client';
import { getRouteForUserState } from '@/services/routing';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    // You can add custom fonts here if needed
    // 'CustomFont-Regular': require('../assets/fonts/CustomFont-Regular.ttf'),
  });

  const router = useRouter();
  const navState = useRootNavigationState();

  const [authChecked, setAuthChecked] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  // Restore the stored session (if any) before the first screen renders.
  // If we find a valid token + user, route them straight to their app home
  // (or onboarding-in-progress) instead of dropping them on the welcome
  // screen and forcing a manual sign-in.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await apiClient.init();
        const [token, user] = await Promise.all([
          authApi.getStoredToken(),
          authApi.getStoredUser(),
        ]);
        if (!cancelled && token && user) {
          setPendingRoute(getRouteForUserState(user));
          // Warm the query cache for this user's home tabs in parallel, so the
          // first screen they land on renders from cache instead of spinning.
          prefetchForUser(user);
          // Token validation doubles as a cache warm: fetchQuery populates the
          // `me` cache AND dedupes with the prefetch above (same key → one
          // request, not two). If the token was invalidated server-side, bounce
          // back to the welcome screen. Network errors are ignored so an offline
          // launch doesn't force a re-login.
          queryClient
            .fetchQuery({ queryKey: queryKeys.auth.me(), queryFn: authApi.getMe })
            .catch((err: any) => {
              if (err?.status === 401) {
                clearCachedData();
                authApi.logout().finally(() => router.replace('/'));
              }
            });
        }
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Issue the redirect only after the navigator is mounted — calling
  // router.replace before navState.key is set is a no-op and logs a warning.
  useEffect(() => {
    if (!navState?.key || !authChecked || !pendingRoute) return;
    router.replace(pendingRoute as any);
    setPendingRoute(null);
  }, [navState?.key, authChecked, pendingRoute, router]);

  useEffect(() => {
    if (fontsLoaded && authChecked && !pendingRoute) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authChecked, pendingRoute]);

  if (!fontsLoaded || !authChecked) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister, maxAge: GC_TIME, buster: 'v1' }}
    >
    <SafeAreaProvider>
    <ChatUnreadProvider>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(jobseeker)" />
          <Stack.Screen name="(company)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="github-webview" options={{ presentation: 'modal' }} />
          <Stack.Screen name="github-callback" />
          <Stack.Screen name="+not-found" />
        </Stack>
        {pendingRoute ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' },
            ]}
          />
        ) : null}
      </View>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
    </ChatUnreadProvider>
    </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
