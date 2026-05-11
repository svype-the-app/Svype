import { apiClient } from './client';

export type OnboardingMode = 'essential' | 'extended';

export interface OnboardingStartResponse {
  session_id: number;
  messages: { role: 'user' | 'assistant'; content: string; created_at: string }[];
  is_complete: boolean;
  essential_complete?: boolean;
  mode?: OnboardingMode;
  phase?: string;
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
  essential_complete?: boolean;
  mode?: OnboardingMode;
  phase?: string;
  model_used: string;
  total_fields: number;
  completed_fields: number;
  next_route: string | null;
}

export const aiOnboardingApi = {
  async startSession(): Promise<OnboardingStartResponse> {
    return apiClient.postAI<OnboardingStartResponse>('/ai/onboarding/start/', {});
  },

  async sendMessage(sessionId: number, message: string): Promise<OnboardingMessageResponse> {
    return apiClient.postAI<OnboardingMessageResponse>('/ai/onboarding/message/', {
      session_id: sessionId,
      message,
    });
  },
};
