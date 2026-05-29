import { Stack } from 'expo-router';

export default function DashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="job_detail" />
      <Stack.Screen name="edit_job" />
      <Stack.Screen name="compatibility-history" />
      <Stack.Screen name="accepted-applicants" />
    </Stack>
  );
}
