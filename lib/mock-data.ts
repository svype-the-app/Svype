// Re-export all mock data modules for easier imports
export { addCompanyJob, getAvailableJobs, getCompanyJobs, getCompanyStats } from './mock-jobs';
export type { CompanyJob, CompanyStats, Job } from './mock-jobs';

export { getCompanyProfile, getProfile, updateCompanyProfile, updateProfile } from './mock-profile';
export type { CompanyProfile, Profile } from './mock-profile';

export { addApplication, getApplicationById, getApplications, initializeMockData } from './mock-applications';
export type { Application } from './mock-applications';

export { getApplicantsByJob, rejectApplicant } from './mock-applicants';
export type { Applicant } from './mock-applicants';

