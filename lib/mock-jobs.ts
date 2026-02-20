export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  type: string;
  salary_min: number;
  salary_max: number;
  requirements: string[];
  posted_at: string;
}

export interface CompanyJob {
  id: number;
  title: string;
  applicants: number;
  status: 'active' | 'closed';
  posted: string;
}

export interface CompanyStats {
  activeJobs: number;
  totalApplicants: number;
  viewsThisWeek: number;
  hiredThisMonth: number;
}

let mockCompanyJobs: CompanyJob[] = [
  { id: 1, title: 'Senior Frontend Engineer', applicants: 5, status: 'active', posted: '2 days ago' },
  { id: 2, title: 'Product Designer', applicants: 5, status: 'active', posted: '1 week ago' },
  { id: 3, title: 'Backend Developer', applicants: 5, status: 'active', posted: '1 week ago' },
  { id: 4, title: 'Marketing Lead', applicants: 5, status: 'closed', posted: '2 weeks ago' },
];

let mockCompanyStats: CompanyStats = {
  activeJobs: 5,
  totalApplicants: 142,
  viewsThisWeek: 387,
  hiredThisMonth: 8,
};

export function getCompanyJobs(): CompanyJob[] {
  return mockCompanyJobs;
}

export function addCompanyJob(job: CompanyJob) {
  mockCompanyJobs.push(job);
}

export function getCompanyStats(): CompanyStats {
  return mockCompanyStats;
}

export function getAvailableJobs(): Job[] {
  return [
    {
      id: 'job-1',
      title: 'Senior Frontend Developer',
      company: 'TechCorp Solutions',
      location: 'London, UK',
      description: 'We are looking for an experienced Frontend Developer to join our dynamic team. You will work on cutting-edge web applications using modern technologies like React, TypeScript, and Next.js.',
      type: 'Full-time',
      salary_min: 60000,
      salary_max: 80000,
      requirements: ['React', 'TypeScript', 'Next.js', '5+ years experience'],
      posted_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'job-2',
      title: 'Product Designer',
      company: 'Creative Studio',
      location: 'Manchester, UK',
      description: 'Join our creative team to design innovative digital products. You will be responsible for creating user-centered designs and prototypes.',
      type: 'Full-time',
      salary_min: 50000,
      salary_max: 70000,
      requirements: ['Figma', 'UI/UX', 'Prototyping', 'Design Systems'],
      posted_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 'job-3',
      title: 'Full Stack Developer',
      company: 'StartupHub',
      location: 'Remote',
      description: 'Build scalable web applications with modern technologies. Work in a fast-paced startup environment with cutting-edge tech stack.',
      type: 'Full-time',
      salary_min: 55000,
      salary_max: 75000,
      requirements: ['Node.js', 'React', 'MongoDB', 'AWS'],
      posted_at: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: 'job-4',
      title: 'Backend Engineer',
      company: 'DataFlow Inc',
      location: 'Birmingham, UK',
      description: 'Develop robust backend systems and APIs. Work with large-scale data processing and microservices architecture.',
      type: 'Full-time',
      salary_min: 65000,
      salary_max: 85000,
      requirements: ['Python', 'Django', 'PostgreSQL', 'Docker'],
      posted_at: new Date(Date.now() - 604800000).toISOString(),
    },
    {
      id: 'job-5',
      title: 'Mobile Developer',
      company: 'AppWorks',
      location: 'Edinburgh, UK',
      description: 'Create beautiful mobile experiences with React Native. Build cross-platform applications for iOS and Android.',
      type: 'Full-time',
      salary_min: 58000,
      salary_max: 78000,
      requirements: ['React Native', 'TypeScript', 'Mobile UI', 'Redux'],
      posted_at: new Date(Date.now() - 432000000).toISOString(),
    },
  ];
}

// Swipe Jobs for Job Seeker
export interface SwipeJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary_min: number;
  salary_max: number;
  posted_at: string;
  description: string;
  requirements: string[];
}

export const mockSwipeJobs: SwipeJob[] = [
  {
    id: '1',
    title: 'Senior Full-Stack Developer',
    company: 'Tech Corp',
    location: 'London, UK',
    type: 'Full-time • Remote',
    salary_min: 60000,
    salary_max: 80000,
    posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'We are looking for an experienced full-stack developer to join our growing team. You will be responsible for developing and maintaining our web applications using modern technologies.',
    requirements: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', '5+ years experience'],
  },
  {
    id: '2',
    title: 'Frontend Developer',
    company: 'StartupXYZ',
    location: 'Manchester, UK',
    type: 'Full-time • Hybrid',
    salary_min: 45000,
    salary_max: 60000,
    posted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Join our innovative startup as a frontend developer. Work on cutting-edge projects and help shape our product.',
    requirements: ['React', 'CSS', 'JavaScript', 'Git', '3+ years experience'],
  },
  {
    id: '3',
    title: 'Backend Engineer',
    company: 'Cloud Services Ltd',
    location: 'Remote',
    type: 'Full-time • Remote',
    salary_min: 55000,
    salary_max: 75000,
    posted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Build scalable backend systems for our cloud platform. Work with microservices and modern cloud technologies.',
    requirements: ['Python', 'AWS', 'Docker', 'Kubernetes', '4+ years experience'],
  },
];
