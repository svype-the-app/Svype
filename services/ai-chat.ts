import { apiClient } from './client';
import type { AIChatSession, AIChatMessage } from './types';

export interface CareerStartResponse {
  session_id: number;
  already_started: boolean;
  new_message: AIChatMessage | null;
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
};
