import type { User } from './types';

// =============================================================================
// Helper function to get route based on user state
// =============================================================================
export function getRouteForUserState(user: User): string {
  const { user_type, user_state } = user;
  
  switch (user_state) {
    case 'new':
      return '/(auth)/sign-up-success';
    
    case 'profile_preview':
      return '/(jobseeker)/profile/profile-preview';
    
    case 'active':
      return user_type === 'company'
        ? '/(company)/dashboard'
        : '/(jobseeker)/swipe';
    
    case 'suspended':
    case 'deactivated':
      return '/(auth)/login';
    
    default:
      return user_type === 'company'
        ? '/(company)/dashboard'
        : '/(jobseeker)/swipe';
  }
}
