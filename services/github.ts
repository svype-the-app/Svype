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

  /**
   * Exchange the authorization code + state for a confirmed connection. Used
   * by the in-app WebView OAuth flow: the WebView intercepts GitHub's
   * redirect to our callback URL before the browser actually navigates
   * there, extracts the code/state, and calls this endpoint. Avoids the
   * ngrok URL ever being visible to the user.
   */
  async exchangeCode(code: string, state: string): Promise<GitHubConnectResult> {
    return apiClient.post('/auth/github/exchange/', { code, state });
  },

  async disconnect(): Promise<{ ok: boolean }> {
    return apiClient.post('/auth/github/disconnect/', {});
  },

  async refreshSkills(): Promise<GitHubRefreshResult> {
    return apiClient.post('/auth/github/refresh/', {});
  },
};
