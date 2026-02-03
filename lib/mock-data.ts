// Re-export all mock data modules for easier imports
export type { Job, CompanyJob, CompanyStats } from './mock-jobs';
export { getCompanyJobs, addCompanyJob, getCompanyStats } from './mock-jobs';

export type { Profile, CompanyProfile } from './mock-profile';
export { getProfile, updateProfile, getCompanyProfile, updateCompanyProfile } from './mock-profile';

export type { Application } from './mock-applications';
export { initializeMockData, getApplications, getApplicationById, addApplication } from './mock-applications';

export type { Applicant } from './mock-applicants';
export { getApplicantsByJob, rejectApplicant } from './mock-applicants';
