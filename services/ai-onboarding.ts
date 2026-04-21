import { apiClient } from './client';

export interface OnboardingStartResponse {
  session_id: number;
  messages: { role: 'user' | 'assistant'; content: string; created_at: string }[];
  is_complete: boolean;
  fields_remaining: string[];
  total_fields: number;
  completed_fields: number;
  next_route: string | null;
}

export interface OnboardingMessageResponse {
  session_id: number;
  reply: string;
  fields_updated: string[];
  fields_remaining: string[];
  is_complete: boolean;
  model_used: string;
  total_fields: number;
  completed_fields: number;
  next_route: string | null;
}

export const aiOnboardingApi = {
  async startSession(): Promise<OnboardingStartResponse> {
    return apiClient.post<OnboardingStartResponse>('/ai/onboarding/start/', {});
  },

  async sendMessage(sessionId: number, message: string): Promise<OnboardingMessageResponse> {
    return apiClient.post<OnboardingMessageResponse>('/ai/onboarding/message/', {
      session_id: sessionId,
      message,
    });
  },
};
