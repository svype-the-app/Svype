import { apiClient } from './client';
import type { Job, QuizQuestionPayload } from './types';

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
    job_type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
    salary_min?: number;
    salary_max?: number;
    requirements?: string[];
    has_questions?: boolean;
    quiz_questions?: QuizQuestionPayload[];
    status?: 'active' | 'closed' | 'draft';
  }): Promise<Job> {
    return apiClient.post<Job>('/jobs/', data);
  },

  async updateJob(
    id: number,
    data: Partial<{
      title: string;
      description: string;
      location: string;
      job_type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
      salary_min: number;
      salary_max: number;
      requirements: string[];
      has_questions: boolean;
      quiz_questions: QuizQuestionPayload[];
      status: 'active' | 'closed' | 'draft';
    }>
  ): Promise<Job> {
    return apiClient.patch<Job>(`/jobs/${id}/`, data);
  },

  async deleteJob(id: number): Promise<void> {
    await apiClient.delete<void>(`/jobs/${id}/`);
  },

  async getSwipeJobs(): Promise<Job[]> {
    return apiClient.get<Job[]>('/jobs/swipe/');
  },

  async swipe(jobId: number, action: 'like' | 'dislike'): Promise<void> {
    await apiClient.post('/swipe/', { job: jobId, action });
  },
};
