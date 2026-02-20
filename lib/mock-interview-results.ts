export interface InterviewQuestion {
  question: string;
  score: number;
  duration: string;
  analysis: {
    clarity: number;
    confidence: number;
    relevance: number;
  };
  transcript: string;
  insights: string[];
}

export interface CandidateInfo {
  name: string;
  email: string;
  avatar: string;
  position: string;
}

export interface AIAnalysis {
  eyeMovement: {
    score: number;
    naturalLooking: number;
    screenReading: number;
    distraction: number;
  };
  responseTiming: {
    averageThinkTime: string;
    consistency: number;
    pausePatterns: string;
  };
  confidenceScore: number;
  behavioralPatterns: {
    enthusiasm: number;
    authenticity: number;
    professionalism: number;
  };
}

export interface Recommendation {
  decision: 'strong-recommend' | 'recommend' | 'consider' | 'not-recommend';
  reasoning: string;
}

export interface InterviewResultsData {
  candidate: CandidateInfo;
  overallScore: number;
  reliability: number;
  completedAt: string;
  duration: string;
  aiAnalysis: AIAnalysis;
  questions: InterviewQuestion[];
  strengths: string[];
  concerns: string[];
  recommendation: Recommendation;
}

export const mockInterviewResults: InterviewResultsData = {
  candidate: {
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    avatar: '',
    position: 'Senior Frontend Developer',
  },
  overallScore: 87,
  reliability: 92,
  completedAt: '2024-01-15T14:30:00',
  duration: '45 minutes',
  aiAnalysis: {
    eyeMovement: {
      score: 88,
      naturalLooking: 94,
      screenReading: 12,
      distraction: 6,
    },
    responseTiming: {
      averageThinkTime: '3.2s',
      consistency: 89,
      pausePatterns: 'Natural',
    },
    confidenceScore: 85,
    behavioralPatterns: {
      enthusiasm: 92,
      authenticity: 87,
      professionalism: 94,
    },
  },
  questions: [
    {
      question: 'Tell me about your experience with React and how you\'ve used it in recent projects.',
      score: 92,
      duration: '4:32',
      analysis: {
        clarity: 95,
        confidence: 90,
        relevance: 91,
      },
      transcript:
        "I've been working with React for over 5 years now. In my current role at TechCorp, I lead a team building a customer portal that serves over 100,000 users...",
      insights: [
        'Strong technical depth and specific examples',
        'Demonstrated leadership experience',
        'Good articulation of complex concepts',
      ],
    },
    {
      question: 'How do you approach debugging a complex issue in production?',
      score: 85,
      duration: '3:45',
      analysis: {
        clarity: 88,
        confidence: 82,
        relevance: 85,
      },
      transcript:
        "My approach is systematic. First, I try to reproduce the issue locally. If that's not possible, I check our monitoring tools...",
      insights: [
        'Methodical problem-solving approach',
        'Familiarity with industry-standard tools',
        'Slight hesitation initially, then strong recovery',
      ],
    },
  ],
  strengths: [
    'Excellent technical knowledge and depth',
    'Strong communication and clarity',
    'Demonstrates leadership qualities',
    'Authentic and engaged responses',
    'Good problem-solving methodology',
  ],
  concerns: ['Slightly lower confidence on debugging question', 'Could provide more specific metrics in examples'],
  recommendation: {
    decision: 'strong-recommend',
    reasoning:
      'Candidate demonstrates strong technical expertise, excellent communication skills, and leadership potential. Recommend advancing to final round.',
  },
};
