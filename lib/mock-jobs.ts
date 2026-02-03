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
