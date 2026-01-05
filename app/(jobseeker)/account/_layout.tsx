import { Stack } from 'expo-router';

export default function AccountLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="import-data" />
      <Stack.Screen name="premium-onboarding" />
      <Stack.Screen name="reset" />
    </Stack>
  );
}
