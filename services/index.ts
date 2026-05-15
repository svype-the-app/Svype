// Barrel file — all existing imports from '@/services/api' continue to work.
export { apiClient, resolveMediaUrl, API_BASE_URL, MEDIA_BASE_URL } from './client';
export * from './types';
export { authApi } from './auth';
export { jobsApi } from './jobs';
export type { CompatibilityScore, CompatibilityBreakdown } from './jobs';
export { profileApi } from './profile';
export { companyApi } from './company';
export { applicationsApi } from './applications';
export { notificationsApi } from './notifications';
export { aiChatApi } from './ai-chat';
export type {
  CareerStartResponse,
  CheckInStatusResponse,
  CheckInSettingsResponse,
  AiCheckInFrequency,
} from './ai-chat';
export { aiOnboardingApi } from './ai-onboarding';
export type { OnboardingStartResponse, OnboardingMessageResponse } from './ai-onboarding';
export { cvApi } from './cv';
export type { CvTemplate, CvReadyResponse, CvGenerateResponse, CvSections } from './cv';
export { getRouteForUserState } from './routing';
export { githubApi } from './github';
export type { GitHubConnectResult, GitHubRefreshResult } from './github';
