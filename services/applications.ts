import { apiClient } from './client';
import type { Application } from './types';

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
