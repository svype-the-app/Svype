import { apiClient } from './client';
import type { AIChatSession, AIChatMessage } from './types';

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
};
