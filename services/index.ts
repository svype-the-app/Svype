// Barrel file — all existing imports from '@/services/api' continue to work.
export { apiClient, resolveMediaUrl, API_BASE_URL, MEDIA_BASE_URL } from './client';
export * from './types';
export { authApi } from './auth';
export { jobsApi } from './jobs';
export { profileApi } from './profile';
export { companyApi } from './company';
export { applicationsApi } from './applications';
export { notificationsApi } from './notifications';
export { aiChatApi } from './ai-chat';
export { getRouteForUserState } from './routing';
