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
  resume_url: string | null;
  cv_url: string | null;
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

export interface ApplicantCompatibilityHistoryItem {
  application_id: number;
  job_id: number;
  job_title: string;
  applicant_name: string;
  applicant_email: string;
  overall_score: number;
  report: ApplicantCompatibilityReport;
  computed_at: string;
}

export interface AcceptedApplicantMessage {
  id: number;
  content: string;
  sent_at: string;
}

export interface AcceptedApplicant {
  application_id: number;
  applicant_name: string;
  applicant_email: string;
  job_title: string;
  accepted_at: string;
}

export interface ShortlistRun {
  id: number;
  job_id: number;
  applicant_count: number;
  created_at: string;
}

export interface ShortlistRunDetail extends ShortlistRun {
  applicants: ApplicantCard[];
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

  // `coverLetter` (optional): the text the user edited on the swipe cover-letter
  // card. When omitted, the backend generates one (unchanged legacy behaviour).
  async apply(jobId: number, coverLetter?: string): Promise<ApplyResponse> {
    const body: { job_id: number; cover_letter?: string } = { job_id: jobId };
    if (coverLetter !== undefined) body.cover_letter = coverLetter;
    return apiClient.post<ApplyResponse>('/apply/', body);
  },

  async submitQuiz(applicationId: number, answers: Answer[]): Promise<QuizSubmitResponse> {
    return apiClient.postAI<QuizSubmitResponse>(
      `/apply/${applicationId}/quiz/submit/`,
      { answers },
    );
  },

  // Quiz integrity telemetry. Sent alongside submitQuiz (and on forced cancel).
  async logQuizAttempt(
    applicationId: number,
    data: {
      total_duration_ms?: number;
      time_per_question_ms?: Record<string, number>;
      answer_change_counts?: Record<string, number>;
      suspected_paste_questions?: number[];
      left_screen_count?: number;
      was_cancelled_by_leave?: boolean;
    },
  ): Promise<{ flagged: boolean }> {
    return apiClient.post<{ flagged: boolean }>(`/apply/${applicationId}/quiz/log/`, data);
  },

  // Fetch the pre-screening quiz for an existing application the user owns —
  // used by the dashboard Quizzes flow to take a pending quiz / review a done one.
  async getApplicationQuiz(applicationId: number): Promise<ApplyQuiz> {
    return apiClient.get<ApplyQuiz>(`/applications/${applicationId}/quiz/`);
  },

  // Generate (and persist on the backend) an AI cover letter for this job.
  async generateCoverLetter(jobId: number): Promise<{ cover_letter: string }> {
    return apiClient.postAI<{ cover_letter: string }>(`/jobs/${jobId}/cover-letter/generate/`, {});
  },

  // Fetch a previously-saved draft cover letter for this job (404 if none).
  async getDraftCoverLetter(jobId: number): Promise<{ cover_letter: string; generated_at: string }> {
    return apiClient.get<{ cover_letter: string; generated_at: string }>(
      `/jobs/${jobId}/cover-letter/draft/`,
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

  async getCompatibilityHistory(jobId?: number): Promise<ApplicantCompatibilityHistoryItem[]> {
    const url = jobId
      ? `/ai/applicant-compatibility/history/?job_id=${jobId}`
      : '/ai/applicant-compatibility/history/';
    return apiClient.get<ApplicantCompatibilityHistoryItem[]>(url);
  },

  async runShortlist(jobId: number): Promise<ShortlistRunDetail> {
    return apiClient.post<ShortlistRunDetail>(`/jobs/${jobId}/shortlist/`, {});
  },

  async getShortlistHistory(jobId: number): Promise<ShortlistRun[]> {
    return apiClient.get<ShortlistRun[]>(`/jobs/${jobId}/shortlist/history/`);
  },

  async getShortlistRun(jobId: number, runId: number): Promise<ShortlistRunDetail> {
    return apiClient.get<ShortlistRunDetail>(`/jobs/${jobId}/shortlist/${runId}/`);
  },

  async getApplicationMessages(applicationId: number): Promise<AcceptedApplicantMessage[]> {
    return apiClient.get<AcceptedApplicantMessage[]>(`/applications/${applicationId}/messages/`);
  },

  async sendApplicationMessage(applicationId: number, content: string): Promise<AcceptedApplicantMessage> {
    return apiClient.post<AcceptedApplicantMessage>(`/applications/${applicationId}/messages/`, { content });
  },

  async getAcceptedApplicants(): Promise<AcceptedApplicant[]> {
    return apiClient.get<AcceptedApplicant[]>('/jobs/accepted-applicants/');
  },
};
