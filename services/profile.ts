import { apiClient, API_BASE_URL, REQUEST_TIMEOUT_MS } from './client';
import { authApi } from './auth';
import type { JobSeekerProfile, ResumeRecord } from './types';

export const profileApi = {
  async getProfile(): Promise<JobSeekerProfile> {
    return apiClient.get<JobSeekerProfile>('/profiles/me/');
  },

  async updateProfile(data: Partial<JobSeekerProfile>): Promise<JobSeekerProfile> {
    return apiClient.patch<JobSeekerProfile>('/profiles/me/', data);
  },

  async getResumes(): Promise<ResumeRecord[]> {
    return apiClient.get<ResumeRecord[]>('/resumes/');
  },

  async uploadResume(fileUri: string, fileName: string, fileSizeBytes: number = 0): Promise<ResumeRecord> {
    const token = await authApi.getStoredToken();
    const url = `${API_BASE_URL}/resumes/`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: 'application/pdf',
    } as any);
    formData.append('file_name', fileName);

    const sizeKb = Math.max(1, Math.round(fileSizeBytes / 1024));
    formData.append('file_size', `${sizeKb} KB`);

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
          message: data.error || data.detail || 'Failed to upload resume',
          errors: data,
          status: response.status,
        };
      }

      return data as ResumeRecord;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') {
        throw { message: `Resume upload timed out after ${REQUEST_TIMEOUT_MS / 1000}s.` };
      }
      if (error?.message === 'Network request failed') {
        throw { message: `Unable to upload resume. Check backend connectivity at ${API_BASE_URL}.` };
      }
      throw error;
    }
  },
};
