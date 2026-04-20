import { apiClient } from './client';
import type { CompanyProfile } from './types';

export const companyApi = {
  async getMyCompany(): Promise<CompanyProfile> {
    return apiClient.get<CompanyProfile>('/companies/me/');
  },

  async updateMyCompany(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
    return apiClient.patch<CompanyProfile>('/companies/me/', data);
  },
};
