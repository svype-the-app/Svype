// Barrel file — all existing imports from '@/services/api' continue to work.
export { apiClient, resolveMediaUrl, API_BASE_URL, MEDIA_BASE_URL } from './client';
export * from './types';
export { authApi } from './auth';
export { jobsApi } from './jobs';
export type { CompatibilityScore, CompatibilityBreakdown, CompatibilityHistoryItem } from './jobs';
export { profileApi } from './profile';
export { companyApi } from './company';
export { applicationsApi } from './applications';
export type {
  Answer,
  ApplyResponse,
  ApplyQuiz,
  ApplyQuizQuestion,
  SkillMatch,
  QuizSubmitResponse,
  QuizFeedbackItem,
  ApplicantCard,
  ApplicantCardApplicant,
  ApplicantCompatibilityReport,
  ApplicantCompatibilityHistoryItem,
  ShortlistRun,
  ShortlistRunDetail,
  AcceptedApplicantMessage,
  AcceptedApplicant,
} from './applications';
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
export { aiQuizApi } from './ai-quiz';
export type {
  AIQuizGenerateParams,
  AIQuizGenerateResponse,
  AIQuizGeneratedQuestion,
  AIQuizQuestionType,
  AIQuizQuestionTypesOption,
  AIQuizDifficulty,
} from './ai-quiz';
export { cvApi } from './cv';
export type { CvTemplate, CvReadyResponse, CvGenerateResponse, CvSections } from './cv';
export { getRouteForUserState } from './routing';
export { githubApi } from './github';
export type { GitHubConnectResult, GitHubRefreshResult } from './github';
