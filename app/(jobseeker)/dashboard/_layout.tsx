import { Stack } from 'expo-router';

export default function DashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="accepted-jobs" />
      <Stack.Screen name="compatibility-history" />
      <Stack.Screen name="quiz-history" />
      <Stack.Screen name="quiz/[applicationId]" />
      <Stack.Screen name="accepted-chat/[applicationId]" />
    </Stack>
  );
}
