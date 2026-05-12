import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ChatUnreadProvider, useChatUnread } from '@/lib/chat-unread-context';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

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

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].primary,
        headerShown: false,
        tabBarStyle: {
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
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="ai-tools" options={{ href: null }} />
      <Tabs.Screen name="account" options={{ href: null }} />
      <Tabs.Screen name="+not-found" options={{ href: null }} />
    </Tabs>
  );
}

export default function JobSeekerLayout() {
  return (
    <ChatUnreadProvider>
      <JobSeekerTabs />
    </ChatUnreadProvider>
  );
}
