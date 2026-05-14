import { apiClient } from './client';

export interface GitHubConnectResult {
  success: boolean;
  skills_added: string[];
  github_username: string;
  error?: string;
}

export interface GitHubRefreshResult {
  skills_added: string[];
  total_skills: number;
}

export const githubApi = {
  async getAuthUrl(redirectUrl?: string): Promise<{ auth_url: string }> {
    const qs = redirectUrl ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : '';
    return apiClient.get(`/auth/github/initiate/${qs}`);
  },

  async disconnect(): Promise<{ ok: boolean }> {
    return apiClient.post('/auth/github/disconnect/', {});
  },

  async refreshSkills(): Promise<GitHubRefreshResult> {
    return apiClient.post('/auth/github/refresh/', {});
  },
};
