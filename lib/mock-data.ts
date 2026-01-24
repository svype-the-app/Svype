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
}

export interface Application {
  id: string;
  job: Job;
  applied_at: string;
  applicationStatus: 'APPLIED' | 'SHORTLISTED' | 'INTERVIEW' | 'REJECTED';
  status: 'active' | 'closed';
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  career_goals: string;
  life_goals: string;
  interests: string[];
}

export interface CompanyProfile {
  id: string;
  name: string;
  email: string;
  website: string;
  location: string;
  description: string;
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

let mockApplications: Application[] = [];
let mockProfile: Profile = {
  id: '1',
  full_name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  career_goals: 'To become a senior frontend developer at a leading tech company, working on innovative products that make a real difference in people\'s lives. I want to master modern web technologies and eventually lead a development team.',
  life_goals: 'Achieve a healthy work-life balance while building a successful career in tech. Travel to at least 3 new countries each year and maintain strong relationships with family and friends.',
  interests: ['React', 'TypeScript', 'UI/UX Design', 'Web Performance', 'Remote Work', 'Startups'],
};

let mockCompanyProfile: CompanyProfile = {
  id: '1',
  name: 'TechCorp Inc.',
  email: 'hr@techcorp.com',
  website: 'https://techcorp.com',
  location: 'London, UK',
  description: 'TechCorp is a leading software development company focused on innovative solutions.',
};

let mockCompanyStats: CompanyStats = {
  activeJobs: 5,
  totalApplicants: 142,
  viewsThisWeek: 387,
  hiredThisMonth: 8,
};

let mockCompanyJobs: CompanyJob[] = [
  { id: 1, title: "Senior Frontend Engineer", applicants: 23, status: "active", posted: "2 days ago" },
  { id: 2, title: "Product Designer", applicants: 18, status: "active", posted: "1 week ago" },
  { id: 3, title: "Backend Developer", applicants: 31, status: "active", posted: "1 week ago" },
  { id: 4, title: "Marketing Lead", applicants: 15, status: "closed", posted: "2 weeks ago" },
];

export function initializeMockData() {
  if (mockApplications.length > 0) return;

  mockApplications = [
    {
      id: '1',
      applied_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      applicationStatus: 'APPLIED',
      status: 'active',
      job: {
        id: 'job-1',
        title: 'Senior Frontend Developer',
        company: 'TechCorp Solutions',
        location: 'London, UK',
        description: 'We are looking for an experienced Frontend Developer to join our dynamic team...',
        type: 'Full-time',
        salary_min: 60000,
        salary_max: 80000,
        requirements: ['React', 'TypeScript', 'Next.js'],
      },
    },
    {
      id: '2',
      applied_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      applicationStatus: 'SHORTLISTED',
      status: 'active',
      job: {
        id: 'job-2',
        title: 'Product Designer',
        company: 'Creative Studio',
        location: 'Manchester, UK',
        description: 'Join our creative team to design innovative digital products...',
        type: 'Full-time',
        salary_min: 50000,
        salary_max: 70000,
        requirements: ['Figma', 'UI/UX', 'Prototyping'],
      },
    },
    {
      id: '3',
      applied_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      applicationStatus: 'INTERVIEW',
      status: 'active',
      job: {
        id: 'job-3',
        title: 'Full Stack Developer',
        company: 'StartupHub',
        location: 'Remote',
        description: 'Build scalable web applications with modern technologies...',
        type: 'Full-time',
        salary_min: 55000,
        salary_max: 75000,
        requirements: ['Node.js', 'React', 'MongoDB'],
      },
    },
    {
      id: '4',
      applied_at: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
      applicationStatus: 'REJECTED',
      status: 'closed',
      job: {
        id: 'job-4',
        title: 'Backend Engineer',
        company: 'DataFlow Inc',
        location: 'Birmingham, UK',
        description: 'Develop robust backend systems and APIs...',
        type: 'Full-time',
        salary_min: 65000,
        salary_max: 85000,
        requirements: ['Python', 'Django', 'PostgreSQL'],
      },
    },
    {
      id: '5',
      applied_at: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
      applicationStatus: 'APPLIED',
      status: 'active',
      job: {
        id: 'job-5',
        title: 'Mobile Developer',
        company: 'AppWorks',
        location: 'Edinburgh, UK',
        description: 'Create beautiful mobile experiences with React Native...',
        type: 'Full-time',
        salary_min: 58000,
        salary_max: 78000,
        requirements: ['React Native', 'TypeScript', 'Mobile UI'],
      },
    },
  ];
}

export function getApplications(): Application[] {
  return mockApplications;
}

export function getApplicationById(id: string): Application | undefined {
  return mockApplications.find(app => app.id === id);
}

export function addApplication(application: Application) {
  mockApplications.push(application);
}

export function getProfile(): Profile {
  return mockProfile;
}

export function updateProfile(updates: Partial<Profile>) {
  mockProfile = { ...mockProfile, ...updates };
}

export function getCompanyProfile(): CompanyProfile {
  return mockCompanyProfile;
}

export function updateCompanyProfile(updates: Partial<CompanyProfile>) {
  mockCompanyProfile = { ...mockCompanyProfile, ...updates };
}

export function getCompanyStats(): CompanyStats {
  return mockCompanyStats;
}

export function getCompanyJobs(): CompanyJob[] {
  return mockCompanyJobs;
}

export function addCompanyJob(job: CompanyJob) {
  mockCompanyJobs.push(job);
}
