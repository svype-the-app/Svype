import { Stack } from 'expo-router';

export default function SwipeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="job" />
    </Stack>
  );
}
