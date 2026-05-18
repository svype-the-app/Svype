import { ApplicationsProvider } from '@/lib/applications-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ChatUnreadProvider, useChatUnread } from '@/lib/chat-unread-context';
import { aiChatApi, authApi, jobsApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';

// How often to re-check the AI check-in cadence while the user is inside
// the jobseeker section. 60s is short enough that an 'every_5_mins' test
// cadence reliably surfaces a new badge within the window, and infrequent
// enough that idle users don't burn battery on polling.
const CHECKIN_POLL_INTERVAL_MS = 60_000;

function CheckInPoller() {
  const { setHasUnreadAiMsg } = useChatUnread();

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const status = await aiChatApi.checkInStatus();
        if (!cancelled && status.due) {
          setHasUnreadAiMsg(true);
        }
      } catch {
        // Silently ignore — not worth surfacing a network blip to the user.
      }
    };

    // Initial check the moment the user enters the jobseeker section.
    poll();
    // Periodic re-check so a newly-due check-in lights the badge without
    // requiring the user to manually navigate tabs.
    const intervalId = setInterval(poll, CHECKIN_POLL_INTERVAL_MS);
    // Re-check when the app comes back to the foreground from background.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') poll();
    });

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      appStateSub.remove();
    };
  }, [setHasUnreadAiMsg]);

  return null;
}

/**
 * Prevents users in 'profile_preview' state from accessing any tab other than
 * the profile preview screen. Redirects back on mount and whenever the app
 * returns from the background.
 */
function ProfilePreviewGuard() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const user = await authApi.getStoredUser();
        if (!cancelled && user?.user_state === 'profile_preview') {
          router.replace('/(onboarding)/profile-preview' as any);
        }
      } catch {
        // Silently ignore — don't block rendering on a storage read failure.
      }
    };

    check();

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });

    return () => {
      cancelled = true;
      appStateSub.remove();
    };
  }, [router]);

  return null;
}

/**
 * Fires a fire-and-forget warm request so the backend starts pre-ranking
 * jobs immediately when the jobseeker section loads — before the user
 * even taps the Swipe tab. Also re-warms whenever the app comes back
 * to the foreground (session resume scenario).
 */
function SwipeCacheWarmer() {
  useEffect(() => {
    jobsApi.warmSwipeCache();

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') jobsApi.warmSwipeCache();
    });

    return () => appStateSub.remove();
  }, []);

  return null;
}

function ChatTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { hasUnreadAiMsg } = useChatUnread();
  return (
    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={hasUnreadAiMsg ? '#7c3aed' : color} />
      {hasUnreadAiMsg && !focused && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 9,
            height: 9,
            borderRadius: 5,
            backgroundColor: '#7c3aed',
            borderWidth: 1.5,
            borderColor: '#ffffff',
          }}
        />
      )}
    </View>
  );
}

function JobSeekerTabs() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const [userState, setUserState] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadUserState = async () => {
      try {
        const user = await authApi.getStoredUser();
        if (!cancelled) {
          setUserState(user?.user_state ?? null);
        }
      } catch {
        if (!cancelled) {
          setUserState(null);
        }
      }
    };

    loadUserState();

    return () => {
      cancelled = true;
    };
  }, [segments]);

  const hideTabBar = userState === 'profile_preview';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].primary,
        headerShown: false,
        tabBarStyle: hideTabBar
          ? { display: 'none' }
          : {
              paddingBottom: 10,
              paddingTop: 8,
              height: 60,
            },
      }}>
      <Tabs.Screen
        name="swipe"
        options={{
          title: 'Swipe',
          href: '/swipe',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          href: '/dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Chat',
          href: '/chat',
          tabBarIcon: ({ color, focused }) => (
            <ChatTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: '/(jobseeker)/profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      {/* Hidden routes - accessible but not in tab bar */}
      <Tabs.Screen name="job" options={{ href: null }} />
      <Tabs.Screen name="saved" options={{ href: null }} />
      <Tabs.Screen name="ai-tools" options={{ href: null }} />
      <Tabs.Screen name="account" options={{ href: null }} />
      <Tabs.Screen name="github-connect" options={{ href: null }} />
      <Tabs.Screen name="+not-found" options={{ href: null }} />
    </Tabs>
  );
}

export default function JobSeekerLayout() {
  return (
    <ApplicationsProvider>
      <ProfilePreviewGuard />
      <CheckInPoller />
      <SwipeCacheWarmer />
      <JobSeekerTabs />
    </ApplicationsProvider>
  );
}
