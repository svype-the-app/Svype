import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Stack.Screen 
        name="user-type-selection" 
        options={{ title: 'Select User Type' }}
      />
      <Stack.Screen 
        name="job-seeker-onboarding" 
        options={{ title: 'Job Seeker Onboarding' }}
      />
      <Stack.Screen 
        name="onboarding-choice" 
        options={{ title: 'Import Data' }}
      />
      <Stack.Screen 
        name="profile-preview" 
        options={{ title: 'Profile Preview' }}
      />
      <Stack.Screen 
        name="upload-cv" 
        options={{ title: 'Upload CV' }}
      />
      <Stack.Screen 
        name="company-onboarding" 
        options={{ title: 'Company Onboarding' }}
      />
    </Stack>
  );
}
