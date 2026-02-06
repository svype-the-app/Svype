export interface AIInsight {
  strengths: string[]
  concerns: string[]
  recommendation: 'strong-match' | 'potential-match' | 'weak-match'
}

export interface AIShortlistedCandidate {
  id: string
  name: string
  email: string
  appliedDate: string
  matchScore: number
  experience: string
  location: string
  skills: string[]
  aiInsights: AIInsight
  status: 'pending' | 'shortlisted' | 'rejected'
}

const mockAIShortlistedCandidates: AIShortlistedCandidate[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    appliedDate: '2024-01-15',
    matchScore: 94,
    experience: '5 years',
    location: 'San Francisco, CA',
    skills: ['React', 'TypeScript', 'Node.js', 'System Design'],
    aiInsights: {
      strengths: [
        'Strong React expertise with 5+ years experience',
        'Excellent problem-solving in previous roles',
        'Leadership experience managing teams of 3-5',
      ],
      concerns: ['Limited experience with Vue.js mentioned in requirements'],
      recommendation: 'strong-match',
    },
    status: 'pending',
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'm.chen@email.com',
    appliedDate: '2024-01-14',
    matchScore: 88,
    experience: '4 years',
    location: 'Austin, TX',
    skills: ['React', 'Python', 'AWS', 'Docker'],
    aiInsights: {
      strengths: [
        'Solid full-stack background',
        'Strong cloud infrastructure knowledge',
        'Quick learner based on career progression',
      ],
      concerns: ['Less experience than preferred for senior role', 'No TypeScript mentioned in resume'],
      recommendation: 'potential-match',
    },
    status: 'pending',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@email.com',
    appliedDate: '2024-01-13',
    matchScore: 92,
    experience: '6 years',
    location: 'New York, NY',
    skills: ['React', 'TypeScript', 'GraphQL', 'Testing'],
    aiInsights: {
      strengths: [
        'Extensive testing and quality assurance experience',
        'Strong technical writing and documentation',
        'Open source contributor',
      ],
      concerns: [],
      recommendation: 'strong-match',
    },
    status: 'shortlisted',
  },
  {
    id: '4',
    name: 'David Park',
    email: 'd.park@email.com',
    appliedDate: '2024-01-12',
    matchScore: 76,
    experience: '2 years',
    location: 'Seattle, WA',
    skills: ['JavaScript', 'React', 'CSS', 'Figma'],
    aiInsights: {
      strengths: ['Strong design sensibility', 'Good communication skills'],
      concerns: ['Limited professional experience', 'Missing several required technical skills', 'No backend experience'],
      recommendation: 'weak-match',
    },
    status: 'pending',
  },
]

export function getAIShortlistedCandidates(): AIShortlistedCandidate[] {
  return mockAIShortlistedCandidates
}
