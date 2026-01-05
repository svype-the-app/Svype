import { Stack } from 'expo-router';

export default function AIToolsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="generate-cover-letter" />
      <Stack.Screen name="generate-cv" />
      <Stack.Screen name="interview-prep" />
      <Stack.Screen name="skills-assessment" />
    </Stack>
  );
}
