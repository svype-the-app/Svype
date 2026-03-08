import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ IMPORTANT: Replace with your computer's IP address
// Find it by running 'ipconfig' in terminal and look for IPv4 Address
// Both your phone and PC must be on the SAME WiFi network
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.159.66:8000/api'  // ← CHANGE THIS to your PC's IP
  : 'https://your-production-url.com/api';

// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// User state types - matches backend USER_STATE_CHOICES
// Simplified states:
// - 'new': Early onboarding (sign-up-success, import data, upload CV)
// - 'profile_preview': User is at profile preview screen
// - 'active': User completed onboarding, ready to swipe
export type UserState = 
  | 'new'
  | 'profile_preview'
  | 'active'
  | 'suspended'
  | 'deactivated';

// Types
export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  user_type: 'jobseeker' | 'company';
  user_state: UserState;
  avatar?: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// =============================================================================
// HTTP CLIENT
// =============================================================================

class ApiClient {
  private token: string | null = null;

  async init() {
    this.token = await AsyncStorage.getItem(TOKEN_KEY);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Token ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data.error || data.detail || 'Request failed',
          errors: data,
          status: response.status,
        };
      }

      return data;
    } catch (error: any) {
      if (error.message === 'Network request failed') {
        throw { message: 'Unable to connect to server. Please check your internet connection.' };
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  setToken(token: string | null) {
    this.token = token;
  }
}

export const apiClient = new ApiClient();

// =============================================================================
// AUTH API
// =============================================================================

export const authApi = {
  async register(data: {
    email: string;
    username: string;
    password: string;
    password_confirm: string;
    user_type: 'jobseeker' | 'company';
    full_name: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register/', data);
    
    // Save token and user (gracefully handle storage errors)
    try {
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch (storageError) {
      console.warn('Failed to save auth data to storage:', storageError);
      // Continue anyway - user is registered
    }
    apiClient.setToken(response.token);
    
    return response;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login/', {
      email,
      password,
    });
    
    // Save token and user (gracefully handle storage errors)
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
    } catch (error) {
      // Ignore errors on logout
    }
    
    // Clear local storage
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
};

// =============================================================================
// Helper function to get route based on user state
// =============================================================================
export function getRouteForUserState(user: User): string {
  const { user_type, user_state } = user;
  
  // Simplified state-based routing:
  // 'new' → sign-up-success (early onboarding: success → import → upload)
  // 'profile_preview' → profile preview screen
  // 'active' → swipe screen (completed onboarding)
  
  switch (user_state) {
    case 'new':
      // Early onboarding - start at sign-up-success
      return '/(auth)/sign-up-success';
    
    case 'profile_preview':
      // User is at profile preview stage
      return '/(onboarding)/profile-preview';
    
    case 'active':
      // User completed onboarding - go to swipe
      return user_type === 'company'
        ? '/(company)/dashboard'
        : '/(jobseeker)/swipe';
    
    case 'suspended':
    case 'deactivated':
      return '/(auth)/login';
    
    default:
      // Default to swipe for jobseeker, dashboard for company
      return user_type === 'company'
        ? '/(company)/dashboard'
        : '/(jobseeker)/swipe';
  }
}

// =============================================================================
// JOBS API
// =============================================================================

export interface Job {
  id: number;
  title: string;
  company_name: string;
  company_logo?: string;
  location: string;
  job_type: string;
  is_remote: boolean;
  salary_min?: number;
  salary_max?: number;
  description: string;
  requirements: string[];
  status: string;
  posted_at: string;
}

export const jobsApi = {
  async getJobs(): Promise<Job[]> {
    return apiClient.get<Job[]>('/jobs/');
  },

  async getJob(id: number): Promise<Job> {
    return apiClient.get<Job>(`/jobs/${id}/`);
  },

  async getSwipeJobs(): Promise<Job[]> {
    return apiClient.get<Job[]>('/jobs/swipe/');
  },

  async swipe(jobId: number, action: 'like' | 'dislike'): Promise<void> {
    await apiClient.post('/swipe/', { job: jobId, action });
  },
};

// =============================================================================
// APPLICATIONS API
// =============================================================================

export interface Application {
  id: number;
  job: Job;
  status: string;
  applied_at: string;
}

export const applicationsApi = {
  async getApplications(): Promise<Application[]> {
    return apiClient.get<Application[]>('/applications/');
  },

  async apply(jobId: number, coverLetter?: string): Promise<Application> {
    return apiClient.post<Application>('/applications/', {
      job: jobId,
      cover_letter: coverLetter,
    });
  },
};

// =============================================================================
// PROFILE API
// =============================================================================

export interface JobSeekerProfile {
  id: number;
  full_name: string;
  bio: string;
  location: string;
  experience: string;
  skills: string[];
  career_goals: string;
  life_goals: string;
}

export const profileApi = {
  async getProfile(): Promise<JobSeekerProfile> {
    return apiClient.get<JobSeekerProfile>('/profiles/me/');
  },

  async updateProfile(data: Partial<JobSeekerProfile>): Promise<JobSeekerProfile> {
    return apiClient.patch<JobSeekerProfile>('/profiles/me/', data);
  },
};

// =============================================================================
// NOTIFICATIONS API
// =============================================================================

export interface Notification {
  id: number;
  type: string;
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  async getNotifications(): Promise<Notification[]> {
    return apiClient.get<Notification[]>('/notifications/');
  },

  async markAsRead(id: number): Promise<void> {
    await apiClient.post(`/notifications/${id}/mark_read/`, {});
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/mark_all_read/', {});
  },
};

// =============================================================================
// AI CHAT API
// =============================================================================

export interface AIChatSession {
  id: number;
  context: string;
  title: string;
  messages: AIChatMessage[];
  created_at: string;
}

export interface AIChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
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
    return apiClient.post(`/ai-chat/${sessionId}/send_message/`, { content });
  },
};

// Initialize on app start
apiClient.init();
