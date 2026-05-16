import { apiClient } from './client';

export type AIQuizQuestionType = 'multiple-choice' | 'text';
export type AIQuizQuestionTypesOption = 'multiple-choice' | 'text' | 'mixed';
export type AIQuizDifficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export interface AIQuizGenerateParams {
  job_title: string;
  job_description: string;
  requirements: string[];
  num_questions: number;
  time_limit_minutes: number;
  question_types: AIQuizQuestionTypesOption;
  difficulty: AIQuizDifficulty;
}

export interface AIQuizGeneratedQuestion {
  type: AIQuizQuestionType;
  question: string;
  options: string[];
  correct_option_index: number | null;
  explanation: string;
  points: number;
}

export interface AIQuizGenerateResponse {
  title: string;
  passing_score: number;
  questions: AIQuizGeneratedQuestion[];
}

export const aiQuizApi = {
  async generate(params: AIQuizGenerateParams): Promise<AIQuizGenerateResponse> {
    return apiClient.postAI<AIQuizGenerateResponse>('/ai/quiz/generate/', params);
  },
};
