import { Stack } from 'expo-router';

export default function JobLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="pre-screening-quiz" />
      <Stack.Screen name="company/[slug]" />
      <Stack.Screen name="compatibility" />
    </Stack>
  );
}
