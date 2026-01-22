import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="company-sign-up" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="sign-up-success" />
    </Stack>
  );
}
