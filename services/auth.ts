import AsyncStorage from '@react-native-async-storage/async-storage';
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
