import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ IMPORTANT: Replace with your computer's IP address
// Find it by running 'ipconfig' in terminal and look for IPv4 Address
// Both your phone and PC must be on the SAME WiFi network
// You can also set EXPO_PUBLIC_API_BASE_URL in your env for easier switching
const API_BASE_URL = __DEV__ 
  ? (process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://192.168.227.66:8000/api')
  : 'https://your-production-url.com/api';

const REQUEST_TIMEOUT_MS = 10000;

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
  profile?: JobSeekerProfile;
  company?: CompanyProfile;
}

export interface ProfileCompletion {
  percentage: number;
  filled: {
    name: boolean;
    email: boolean;
    bio: boolean;
    location: boolean;
    experience: boolean;
    skills: boolean;
    education: boolean;
    preferences: boolean;
    resume: boolean;
  };
  weights: {
    name: number;
    email: number;
    bio: number;
    location: number;
    experience: number;
    skills: number;
    education: number;
    preferences: number;
    resume: number;
  };
}

export interface JobSeekerProfile {
  id: number;
  full_name: string;
  bio: string;
  location: string;
  experience: string;
  career_goals: string;
  life_goals: string;
  skills: string[];
  interests: string[];
  preferred_locations: string[];
  preferred_job_types: string[];
  salary_min: number | null;
  salary_max: number | null;
  remote_preference: boolean;
  hybrid_preference: boolean;
  onsite_preference: boolean;
  completion?: ProfileCompletion;
}

export interface CompanyCompletion {
  percentage: number;
  filled: {
    name: boolean;
    email: boolean;
    location: boolean;
    website: boolean;
    description: boolean;
  };
  weights: {
    name: number;
    email: number;
    location: number;
    website: number;
    description: number;
  };
}

export interface CompanyProfile {
  id: number;
  name: string;
  email: string;
  website: string;
  location: string;
  description: string;
  industry: string;
  size: string;
  founded: string;
  rating: string;
  reviews_count: number;
  followers_count: number;
  jobs_count: number;
  culture: string[];
  benefits: string[];
  completion?: CompanyCompletion;
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    
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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        throw {
          message: data.error || data.detail || 'Request failed',
          errors: data,
          status: response.status,
        };
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error?.name === 'AbortError') {
        throw { message: `Server timeout after ${REQUEST_TIMEOUT_MS / 1000}s. Check backend connectivity at ${API_BASE_URL}.` };
      }

      if (error?.message === 'Network request failed') {
        throw { message: `Unable to connect to backend (${API_BASE_URL}). Check backend server and IP address.` };
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
    // Clear any stale token first — sending an invalid token causes Django to reject the request
    // even on AllowAny endpoints
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    apiClient.setToken(null);

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

  async registerCompany(data: {
    email: string;
    password: string;
    password_confirm: string;
    company_name: string;
    website?: string;
    location?: string;
    description?: string;
  }): Promise<AuthResponse> {
    // Clear any stale token first — sending an invalid token causes Django to reject the request
    // even on AllowAny endpoints
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    apiClient.setToken(null);

    const response = await apiClient.post<AuthResponse>('/auth/register/company/', data);
    
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
    // Clear any stale token first — sending an invalid token causes Django to reject the request
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    apiClient.setToken(null);

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

export const companyApi = {
  async getMyCompany(): Promise<CompanyProfile> {
    return apiClient.get<CompanyProfile>('/companies/me/');
  },

  async updateMyCompany(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
    return apiClient.patch<CompanyProfile>('/companies/me/', data);
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
  has_questions?: boolean;
  applicants_count?: number;
  views_count?: number;
  posted_at: string;
}

export const jobsApi = {
  async getJobs(): Promise<Job[]> {
    return apiClient.get<Job[]>('/jobs/');
  },

  async getMyJobs(): Promise<Job[]> {
    return apiClient.get<Job[]>('/jobs/my_jobs/');
  },

  async getJob(id: number): Promise<Job> {
    return apiClient.get<Job>(`/jobs/${id}/`);
  },

  async createJob(data: {
    title: string;
    description: string;
    location: string;
    job_type: 'full-time' | 'part-time' | 'contract' | 'internship';
    is_remote?: boolean;
    salary_min?: number;
    salary_max?: number;
    requirements?: string[];
    has_questions?: boolean;
    status?: 'active' | 'closed' | 'draft';
  }): Promise<Job> {
    return apiClient.post<Job>('/jobs/', data);
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
