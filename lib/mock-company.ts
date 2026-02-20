// Company Profile Data
export interface CompanyData {
  name: string;
  slug?: string;
  description: string;
  industry: string;
  size: string;
  founded: string;
  location: string;
  website: string;
  rating: number;
  reviews: number;
  culture: string[];
  benefits: string[];
  openJobs: number;
  followers: number;
}

export interface CompanyJobListing {
  id: string;
  title: string;
  location: string;
  type: string;
  posted: string;
}

export interface CompanyReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  content: string;
}

export const mockCompanyData: CompanyData = {
  name: 'Company Name',
  description: "Leading technology company focused on innovation and creating exceptional user experiences. We build products that millions of people use every day.",
  industry: "Technology",
  size: "100-500 employees",
  founded: "2015",
  location: "London, UK",
  website: "www.company.com",
  rating: 4.5,
  reviews: 127,
  culture: ["Remote-friendly", "Work-life balance", "Learning & Development", "Diverse & Inclusive"],
  benefits: ["Health Insurance", "Pension Scheme", "Flexible Hours", "Remote Work", "Learning Budget", "Stock Options"],
  openJobs: 12,
  followers: 3429
};

export const mockCompanyJobs: CompanyJobListing[] = [
  { id: "1", title: "Senior Frontend Engineer", location: "London, UK", type: "Full-time", posted: "2 days ago" },
  { id: "2", title: "Product Designer", location: "Remote", type: "Full-time", posted: "5 days ago" },
  { id: "3", title: "Backend Developer", location: "London, UK", type: "Full-time", posted: "1 week ago" },
];

export const mockCompanyReviews: CompanyReview[] = [
  {
    id: "1",
    author: "Current Employee - Software Engineer",
    rating: 5,
    date: "2 months ago",
    title: "Great place to grow",
    content: "Excellent work environment with supportive colleagues and interesting projects. Good work-life balance and learning opportunities."
  },
  {
    id: "2",
    author: "Former Employee - Product Manager",
    rating: 4,
    date: "4 months ago",
    title: "Solid company culture",
    content: "Enjoyed my time here. Good benefits and the team is very collaborative. Room for improvement in some processes."
  }
];

// Company Posts/Blogs
export interface CompanyPost {
  id: number;
  type: 'blog' | 'update';
  title: string;
  content: string;
  likes: number;
  comments: number;
  views: number;
  publishedAt: string;
}

export const mockCompanyPosts: CompanyPost[] = [
  {
    id: 1,
    type: 'blog',
    title: "Why We're Building the Future of Work",
    content: "At TechCorp, we believe in empowering teams with cutting-edge technology...",
    likes: 234,
    comments: 45,
    views: 1523,
    publishedAt: '2 days ago',
  },
  {
    id: 2,
    type: 'update',
    title: "We're Hiring! Join Our Growing Team",
    content: "Exciting news! We're expanding our engineering team and looking for talented developers...",
    likes: 189,
    comments: 28,
    views: 892,
    publishedAt: '1 week ago',
  },
  {
    id: 3,
    type: 'blog',
    title: 'Our Journey to Remote-First Culture',
    content: 'How we transformed into a fully remote company and the lessons we learned along the way...',
    likes: 412,
    comments: 67,
    views: 2341,
    publishedAt: '2 weeks ago',
  },
];

// Company Dashboard Data
export interface RecentJob {
  id: number;
  title: string;
  applicants: number;
  status: 'active' | 'closed';
  posted: string;
}

export interface RecentApplicant {
  id: number;
  name: string;
  job: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  applied: string;
}

export interface DashboardStats {
  activeJobs: number;
  totalApplicants: number;
  viewsThisWeek: number;
  hiredThisMonth: number;
}

export const mockDashboardStats: DashboardStats = {
  activeJobs: 5,
  totalApplicants: 142,
  viewsThisWeek: 387,
  hiredThisMonth: 8,
};

export const mockRecentJobs: RecentJob[] = [
  { id: 1, title: 'Senior Frontend Engineer', applicants: 23, status: 'active', posted: '2 days ago' },
  { id: 2, title: 'Product Designer', applicants: 18, status: 'active', posted: '1 week ago' },
  { id: 3, title: 'Backend Developer', applicants: 31, status: 'active', posted: '1 week ago' },
  { id: 4, title: 'Marketing Lead', applicants: 15, status: 'closed', posted: '2 weeks ago' },
];

export const mockRecentApplicants: RecentApplicant[] = [
  { id: 1, name: 'Sarah Johnson', job: 'Senior Frontend Engineer', status: 'pending', applied: '2 hours ago' },
  { id: 2, name: 'Michael Chen', job: 'Product Designer', status: 'pending', applied: '5 hours ago' },
  { id: 3, name: 'Emma Wilson', job: 'Backend Developer', status: 'reviewing', applied: '1 day ago' },
  { id: 4, name: 'James Brown', job: 'Senior Frontend Engineer', status: 'pending', applied: '1 day ago' },
];
