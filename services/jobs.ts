import { apiClient } from './client';
import type { Job, QuizQuestionPayload } from './types';

export interface CompatibilityBreakdown {
  skills_match: number;
  experience_match: number;
  role_fit: number;
  location_match: number;
  salary_match: number;
  strengths: string[];
  gaps: string[];
  verdict: string;
}

export interface CompatibilityScore {
  job_id: number;
  overall_score: number;
  breakdown: CompatibilityBreakdown;
  summary: string;
  cached: boolean;
  computed_at: string;
}

export interface CompatibilityHistoryItem extends CompatibilityScore {
  job_title: string;
  company_name: string;
  job_location: string;
  job_type: string;
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

  /** Force a fresh re-ranking + new random batch (pull-to-refresh). The backend
   *  invalidates the cache when `refresh=true` is passed. */
  async refreshSwipeJobs(): Promise<Job[]> {
    return apiClient.get<Job[]>('/jobs/swipe/?refresh=true');
  },

  /** Fire-and-forget: asks the backend to pre-rank jobs in the background.
   *  Returns immediately (202). Call on app-load so the cache is warm
   *  before the user navigates to the swipe screen. */
  async warmSwipeCache(): Promise<void> {
    try {
      await apiClient.post('/jobs/warm/', {});
    } catch {
      // Non-critical — silently ignore if the server is unreachable
    }
  },

  async swipe(jobId: number, action: 'like' | 'dislike'): Promise<void> {
    await apiClient.post('/swipe/', { job: jobId, action });
  },

  async getCompatibility(jobId: number): Promise<CompatibilityScore> {
    return apiClient.get<CompatibilityScore>(`/jobs/${jobId}/compatibility/`);
  },

  async getCompatibilityHistory(): Promise<CompatibilityHistoryItem[]> {
    return apiClient.get<CompatibilityHistoryItem[]>('/jobs/compatibility/history/');
  },

  async saveJob(jobId: number): Promise<{ id: number; job: number }> {
    return apiClient.post<{ id: number; job: number }>('/saved-jobs/', { job: jobId });
  },
};
