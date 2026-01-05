import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="user-type-selection" />
      <Stack.Screen name="job-seeker-onboarding" />
      <Stack.Screen name="onboarding-choice" />
      <Stack.Screen name="upload-cv" />
      <Stack.Screen name="company-onboarding" />
    </Stack>
  );
}
