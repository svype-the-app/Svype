import { apiClient } from './client';
import type { AIChatSession, AIChatMessage } from './types';

export interface CareerStartResponse {
  session_id: number;
  already_started: boolean;
  new_message: AIChatMessage | null;
}

export interface CheckInStatusResponse {
  due: boolean;
  message?: string;
  session_id?: number;
}

export type AiCheckInFrequency =
  | 'every_5_mins'
  | 'daily'
  | 'every_3_days'
  | 'weekly'
  | 'never';

export interface CheckInSettingsResponse {
  ai_checkin_frequency: AiCheckInFrequency;
}

export const aiChatApi = {
  async getSessions(): Promise<AIChatSession[]> {
    return apiClient.get<AIChatSession[]>('/ai-chat/');
  },

  async createSession(context: string = 'career_coach'): Promise<AIChatSession> {
    return apiClient.post<AIChatSession>('/ai-chat/', { context });
  },

  async sendMessage(sessionId: number, content: string): Promise<{
    user_message: AIChatMessage;
    ai_response: AIChatMessage;
  }> {
    return apiClient.postAI(`/ai-chat/${sessionId}/send_message/`, { content });
  },

  /** Get or create the career_coach session and send a proactive AI welcome. */
  async careerStart(): Promise<CareerStartResponse> {
    return apiClient.postAI<CareerStartResponse>('/ai-chat/career_start/', {});
  },

  /** Ask the backend whether the AI should initiate a proactive check-in. */
  async checkInStatus(): Promise<CheckInStatusResponse> {
    return apiClient.get<CheckInStatusResponse>('/ai/checkin/status/');
  },

  /** Update the user's check-in cadence (daily | every_3_days | weekly | never). */
  async updateCheckInSettings(frequency: AiCheckInFrequency): Promise<CheckInSettingsResponse> {
    return apiClient.patch<CheckInSettingsResponse>('/ai/checkin/settings/', {
      ai_checkin_frequency: frequency,
    });
  },
};
