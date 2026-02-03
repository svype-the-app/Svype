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

let mockProfile: Profile = {
  id: '1',
  full_name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  career_goals:
    "To become a senior frontend developer at a leading tech company, working on innovative products that make a real difference in people's lives. I want to master modern web technologies and eventually lead a development team.",
  life_goals:
    'Achieve a healthy work-life balance while building a successful career in tech. Travel to at least 3 new countries each year and maintain strong relationships with family and friends.',
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
