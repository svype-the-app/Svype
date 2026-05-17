import { Stack } from 'expo-router';

export default function AIToolsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="generate-cv" />
    </Stack>
  );
}
