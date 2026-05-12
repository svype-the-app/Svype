import { apiClient } from './client';

export type CvTemplate = 'modern' | 'classic' | 'creative' | 'minimal';

export interface CvReadyResponse {
  cv_ready: boolean;
  missing_fields: string[];
  work_count: number;
  education_count: number;
}

export interface CvSections {
  name?: string;
  headline?: string;
  summary?: string;
  experience?: {
    title: string;
    company: string;
    dates: string;
    bullets: string[];
  }[];
  education?: {
    degree: string;
    institution: string;
    dates: string;
    details?: string;
  }[];
  skills?: string[];
  languages?: { language: string; level: string }[];
  links?: { linkedin?: string; github?: string };
  contact?: { email?: string; phone?: string; location?: string };
}

export interface CvGenerateResponse {
  cv_url: string;
  sections: CvSections;
}

export const cvApi = {
  async checkCvReady(): Promise<CvReadyResponse> {
    return apiClient.get<CvReadyResponse>('/cv/check/');
  },

  async generateCv(params: { template: CvTemplate }): Promise<CvGenerateResponse> {
    return apiClient.postAI<CvGenerateResponse>('/cv/generate/', { template: params.template });
  },
};
