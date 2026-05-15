import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { apiClient, API_BASE_URL, REQUEST_TIMEOUT_MS, TOKEN_KEY, USER_KEY } from './client';
import type { AuthResponse, User, UserState } from './types';

export const authApi = {
  async register(data: {
    email: string;
    username: string;
    password: string;
    password_confirm: string;
    user_type: 'jobseeker' | 'company';
    full_name: string;
  }): Promise<AuthResponse> {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    apiClient.setToken(null);

    const response = await apiClient.post<AuthResponse>('/auth/register/', data);
    
    try {
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch (storageError) {
      console.warn('Failed to save auth data to storage:', storageError);
    }
    apiClient.setToken(response.token);
    
    return response;
  },

  async registerCompany(data: {
    email: string;
    password: string;
    password_confirm: string;
    company_name: string;
    website?: string;
    location?: string;
    description?: string;
  }): Promise<AuthResponse> {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    apiClient.setToken(null);

    const response = await apiClient.post<AuthResponse>('/auth/register/company/', data);
    
    try {
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch (storageError) {
      console.warn('Failed to save auth data to storage:', storageError);
    }
    apiClient.setToken(response.token);
    
    return response;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    apiClient.setToken(null);

    const response = await apiClient.post<AuthResponse>('/auth/login/', {
      email,
      password,
    });
    
    try {
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch (storageError) {
      console.warn('Failed to save auth data to storage:', storageError);
    }
    apiClient.setToken(response.token);
    
    return response;
  },

  async loginWithGithub(): Promise<{
    token: string;
    user_type: string;
    user_state: string;
    is_new: boolean;
    name: string;
  }> {
    const initUrl = `${API_BASE_URL}/auth/github/`;

    // Use openBrowserAsync + deep-link listener so the OAuth browser
    // survives the user tabbing out for a 2FA code.
    let resolveCallback: (url: string | null) => void = () => {};
    const callbackPromise = new Promise<string | null>((resolve) => {
      resolveCallback = resolve;
    });

    const sub = Linking.addEventListener('url', (event) => {
      // Backend redirects to svype://auth/github?token=...&user_type=...
      if (!event.url.includes('auth/github')) return;
      resolveCallback(event.url);
      WebBrowser.dismissBrowser();
    });

    let captured: string | null = null;
    try {
      const browserPromise = WebBrowser.openBrowserAsync(initUrl, {
        dismissButtonStyle: 'close',
        enableBarCollapsing: true,
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      }).then(() => null);

      captured = await Promise.race([callbackPromise, browserPromise]);
    } finally {
      sub.remove();
    }

    if (!captured) {
      throw new Error('GitHub login was cancelled');
    }

    const parsed = Linking.parse(captured);
    const p = (parsed.queryParams ?? {}) as Record<string, string>;

    if (p.error) {
      throw new Error(`GitHub login failed: ${p.error}`);
    }

    const token = p.token;
    const user_type = p.user_type ?? 'jobseeker';
    const user_state = p.user_state ?? 'new';
    const is_new = p.is_new === 'true';
    const name = p.name ?? '';

    if (!token) {
      throw new Error('GitHub login failed: no token returned');
    }

    const userData = { user_type, user_state, first_name: name };

    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (storageError) {
      console.warn('Failed to save GitHub auth data to storage:', storageError);
    }
    apiClient.setToken(token);

    return { token, user_type, user_state, is_new, name };
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout/', {});
    } catch {
      // Ignore errors on logout
    }
    
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (storageError) {
      console.warn('Failed to clear auth data from storage:', storageError);
    }
    apiClient.setToken(null);
  },

  async getMe(): Promise<User> {
    return apiClient.get<User>('/auth/me/');
  },

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  },

  async updateState(state: UserState): Promise<{ user: User; message: string }> {
    return apiClient.post('/auth/update-state/', { state });
  },

  async uploadAvatar(fileUri: string, fileName: string): Promise<User> {
    const token = await this.getStoredToken();
    const url = `${API_BASE_URL}/auth/avatar/`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const formData = new FormData();
    formData.append('avatar', {
      uri: fileUri,
      name: fileName,
      type: 'image/jpeg',
    } as any);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Token ${token}` } : {},
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const raw = await response.text();
      let data: any = {};
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = { detail: raw };
        }
      }

      if (!response.ok) {
        throw {
          message: data.error || data.detail || 'Failed to upload profile image',
          errors: data,
          status: response.status,
        };
      }

      const user = data.user as User;
      try {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch (storageError) {
        console.warn('Failed to persist updated user avatar:', storageError);
      }
      return user;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') {
        throw { message: `Avatar upload timed out after ${REQUEST_TIMEOUT_MS / 1000}s.` };
      }
      if (error?.message === 'Network request failed') {
        throw { message: `Unable to upload avatar. Check backend connectivity at ${API_BASE_URL}.` };
      }
      throw error;
    }
  },
};
