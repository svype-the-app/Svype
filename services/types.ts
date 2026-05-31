// User state types - matches backend USER_STATE_CHOICES
export type UserState = 
  | 'new'
  | 'profile_preview'
  | 'data_collection'
  | 'active'
  | 'suspended'
  | 'deactivated';

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
    headline: boolean;
    about: boolean;
    location: boolean;
    experience: boolean;
    skills: boolean;
    education: boolean;
    avatar: boolean;
    resume: boolean;
  };
  weights: {
    name: number;
    email: number;
    headline: number;
    about: number;
    location: number;
    experience: number;
    skills: number;
    education: number;
    avatar: number;
    resume: number;
  };
}

export interface WorkExperienceEntry {
  id: number;
  job_title: string;
  company: string;
  duration: number | null;
  is_current: boolean;
  description: string;
  location: string;
  employment_type: string;
  order: number;
}

export interface EducationEntry {
  id: number;
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: number | null;
  end_year: number | null;
  is_ongoing: boolean;
  grade: string;
  order: number;
}

export interface JobSeekerProfile {
  id: number;
  full_name: string;
  contact_number: string;
  headline: string;
  about: string;
  location: string;
  experience: string;
  education: string;
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
  ai_checkin_frequency?: 'every_5_mins' | 'daily' | 'every_3_days' | 'weekly' | 'never';
  last_ai_checkin_at?: string | null;
  completion?: ProfileCompletion;
  work_experiences?: WorkExperienceEntry[];
  education_entries?: EducationEntry[];
}

export interface CompanyCompletion {
  percentage: number;
  filled: {
    name: boolean;
    email: boolean;
    location: boolean;
    website: boolean;
    description: boolean;
    logo: boolean;
    culture: boolean;
    benefits: boolean;
  };
  weights: {
    name: number;
    email: number;
    location: number;
    website: number;
    description: number;
    logo: number;
    culture: number;
    benefits: number;
  };
}

export interface CompanyProfile {
  id: number;
  name: string;
  email: string;
  website: string;
  location: string;
  description: string;
  logo?: string;
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

export interface Job {
  id: number;
  title: string;
  company_name: string;
  company_logo?: string;
  location: string;
  job_type: string;
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

export interface QuizQuestionPayload {
  type: 'multiple-choice' | 'text';
  question: string;
  options?: string[];
  correctAnswer?: number;
  points?: number;
  order?: number;
}

export interface Application {
  id: number;
  job: Job;
  status: string;
  applied_at: string;
  // Pre-screening quiz results (null until a quiz-gated application is completed).
  quiz_score?: number | null;
  quiz_completed_at?: string | null;
  cover_letter?: string;
}

export interface ResumeRecord {
  id: number;
  file: string;
  file_name: string;
  file_size: string;
  is_primary: boolean;
  uploaded_at: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  description: string;
  related_object_id: number | null;
  is_read: boolean;
  created_at: string;
}

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
