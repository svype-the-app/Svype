import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ IMPORTANT: Replace with your computer's IP address
// Find it by running 'ipconfig' in terminal and look for IPv4 Address
// Both your phone and PC must be on the SAME WiFi network
// Set EXPO_PUBLIC_API_BASE_URL in .env for easier switching
const ENV_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, '');
if (!ENV_API_BASE_URL) {
  throw new Error('Missing EXPO_PUBLIC_API_BASE_URL. Set it in Svype/.env and restart Expo with "npx expo start -c".');
}
export const API_BASE_URL = ENV_API_BASE_URL;
export const MEDIA_BASE_URL = API_BASE_URL.endsWith('/api')
  ? API_BASE_URL.slice(0, -4)
  : API_BASE_URL;

export const REQUEST_TIMEOUT_MS = 10000;

// Token storage keys
export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'user_data';

class ApiClient {
  private token: string | null = null;

  private extractErrorMessage(data: any): string | null {
    if (!data) return null;

    if (typeof data === 'string') return data;

    if (Array.isArray(data)) {
      const first = data[0];
      return typeof first === 'string' ? first : null;
    }

    if (typeof data !== 'object') return null;

    if (typeof data.error === 'string') return data.error;
    if (typeof data.detail === 'string') return data.detail;

    for (const [field, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
        const prefix = field === 'non_field_errors' ? '' : `${field}: `;
        return `${prefix}${value[0]}`;
      }

      if (typeof value === 'string') {
        const prefix = field === 'non_field_errors' ? '' : `${field}: `;
        return `${prefix}${value}`;
      }
    }

    return null;
  }

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
      let data: any = {};
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = { detail: raw };
        }
      }

      if (!response.ok) {
        const message = this.extractErrorMessage(data) || `Request failed (${response.status})`;
        throw {
          message,
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

export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${MEDIA_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// Initialize on app start
apiClient.init();
