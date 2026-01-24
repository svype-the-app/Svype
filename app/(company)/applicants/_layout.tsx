import { Stack } from 'expo-router';

export default function ApplicantsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="ai-shortlist" />
      <Stack.Screen name="review-applicants" />
      <Stack.Screen name="interview-results" />
    </Stack>
  );
}
