import type { User } from './types';

// =============================================================================
// Helper function to get route based on user state
// =============================================================================
export function getRouteForUserState(user: User): string {
  const { user_type, user_state } = user;

  switch (user_state) {
    case 'new':
      // For jobseekers: route directly to the AI onboarding chat so they can
      // resume from where they left off. For company users, the sign-up-success
      // screen handles the company-specific onboarding flow.
      return user_type === 'company'
        ? '/(auth)/sign-up-success'
        : '/(onboarding)/job-seeker-onboarding';

    case 'profile_preview':
      return '/(onboarding)/profile-preview';

    case 'data_collection':
      return '/(jobseeker)/dashboard';

    case 'active':
      return user_type === 'company'
        ? '/(company)/dashboard'
        : '/(jobseeker)/dashboard';

    case 'suspended':
    case 'deactivated':
      return '/(auth)/login';

    default:
      return user_type === 'company'
        ? '/(company)/dashboard'
        : '/(jobseeker)/dashboard';
  }
}
