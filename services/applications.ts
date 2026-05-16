import { apiClient } from './client';
import type { Application } from './types';

// ─── Types shared by apply / quiz / applicants endpoints ────────────────────
export interface SkillMatch {
  matched: boolean;
  matched_skills: string[];
  missing_skills: string[];
  message: string;
}

export interface ApplyQuizQuestion {
  id: number;
  question: string;
  question_type: 'multiple-choice' | 'text';
  options: string[];
  points: number;
  order: number;
}

export interface ApplyQuiz {
  id: number;
  title: string;
  explanation: string;
  passing_score: number;
  questions: ApplyQuizQuestion[];
}

export interface ApplyResponse {
  application_id: number;
  requires_quiz: boolean;
  cover_letter?: string;
  skill_match: SkillMatch;
  quiz?: ApplyQuiz;
}

export interface Answer {
  question_id: number;
  selected_option?: number;
  text_answer?: string;
}

export interface QuizFeedbackItem {
  question_id: number;
  feedback: string;
}

export interface QuizSubmitResponse {
  score: number;
  passed: boolean;
  passing_score: number;
  cover_letter: string;
  feedback: QuizFeedbackItem[];
}

export interface ApplicantCardApplicant {
  id: number;
  full_name: string;
  headline: string;
  current_job_title: string;
  skills: string[];
  avatar_url: string | null;
  email: string;
  location: string;
  total_years_experience: number | null;
  about: string;
}

export interface ApplicantCard {
  application_id: number;
  status: string;
  applied_at: string;
  quiz_score: number | null;
  cover_letter: string;
  applicant: ApplicantCardApplicant;
}

export interface ApplicantCompatibilityReport {
  overall_score: number;
  skills_match: number;
  experience_match: number;
  role_fit: number;
  strengths: string[];
  gaps: string[];
  verdict: string;
  personality_analysis: {
    summary: string;
    workplace_fit: string;
  };
  quiz_analysis: {
    assessment: string;
  } | null;
}

export const applicationsApi = {
  // Jobseeker — existing API kept for compatibility with legacy callers.
  async getApplications(): Promise<Application[]> {
    return apiClient.get<Application[]>('/applications/');
  },

  // Fetch a single application by id. DRF's ApplicationViewSet auto-provides
  // the retrieve action at /applications/<id>/ and filters by request.user,
  // so a 404 here means "this app doesn't exist OR doesn't belong to you."
  async getApplication(id: number): Promise<Application> {
    return apiClient.get<Application>(`/applications/${id}/`);
  },

  async apply(jobId: number): Promise<ApplyResponse> {
    return apiClient.postAI<ApplyResponse>('/apply/', { job_id: jobId });
  },

  async submitQuiz(applicationId: number, answers: Answer[]): Promise<QuizSubmitResponse> {
    return apiClient.postAI<QuizSubmitResponse>(
      `/apply/${applicationId}/quiz/submit/`,
      { answers },
    );
  },

  async getApplicants(jobId: number): Promise<ApplicantCard[]> {
    return apiClient.get<ApplicantCard[]>(`/jobs/${jobId}/applicants/`);
  },

  // Note: backend `update_status` is a DRF @action(methods=['POST']) — we POST
  // here rather than PATCH despite the spec, because that's what the existing
  // ApplicationViewSet exposes and we must not modify it.
  async updateStatus(applicationId: number, status: string): Promise<void> {
    await apiClient.post<unknown>(
      `/applications/${applicationId}/update_status/`,
      { status },
    );
  },

  async getAICompatibility(
    applicationId: number
  ): Promise<ApplicantCompatibilityReport> {
    return apiClient.post<ApplicantCompatibilityReport>(
      '/ai/applicant-compatibility/',
      {
        application_id: applicationId,
      }
    );
  },
};
