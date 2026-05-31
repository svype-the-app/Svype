import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="profile-preview" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="generate-cv" />
      <Stack.Screen name="github-connect" />
      <Stack.Screen name="saved/index" />
      <Stack.Screen name="ai-settings" />
    </Stack>
  );
}
