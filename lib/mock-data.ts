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

let mockApplications: Application[] = [];
let mockProfile: Profile = {
  id: '1',
  full_name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  career_goals: 'To become a senior frontend developer at a leading tech company, working on innovative products that make a real difference in people\'s lives. I want to master modern web technologies and eventually lead a development team.',
  life_goals: 'Achieve a healthy work-life balance while building a successful career in tech. Travel to at least 3 new countries each year and maintain strong relationships with family and friends.',
  interests: ['React', 'TypeScript', 'UI/UX Design', 'Web Performance', 'Remote Work', 'Startups'],
};

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
