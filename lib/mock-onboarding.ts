// Onboarding Steps
export interface OnboardingStep {
  question: string;
  placeholder: string;
  options?: string[];
}

export const onboardingSteps: OnboardingStep[] = [
  {
    question: "Great to meet you! What kind of role are you looking for?",
    placeholder: "e.g., Software Developer, Product Manager...",
  },
  {
    question: "What are your key skills or areas of expertise?",
    placeholder: "e.g., React, Python, Project Management...",
  },
  {
    question: "How many years of experience do you have?",
    placeholder: "e.g., 3 years, Entry level...",
    options: ["Entry level (0-2 years)", "Mid-level (3-5 years)", "Senior (5+ years)", "Lead/Management"]
  },
  {
    question: "What's your preferred work setup?",
    placeholder: "Select your preference",
    options: ["Remote", "Hybrid", "On-site", "Flexible"]
  },
  {
    question: "What's your expected salary range?",
    placeholder: "e.g., £40k - £60k",
  },
  {
    question: "Which locations are you interested in?",
    placeholder: "e.g., London, Manchester, Remote",
  },
];

// Profile Preview Data
export interface ProfileExperience {
  title: string;
  company: string;
  location: string;
  period: string;
  description: string;
}

export interface ProfileEducation {
  degree: string;
  institution: string;
  period: string;
}

export interface ProfilePreferences {
  jobType: string[];
  salaryMin: string;
  salaryMax: string;
  location: string;
}

export interface ProfilePreviewData {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: ProfileExperience[];
  education: ProfileEducation[];
  preferences: ProfilePreferences;
}

export const mockProfilePreviewData: ProfilePreviewData = {
  name: "John Doe",
  headline: "Senior Full-Stack Developer",
  email: "john.doe@example.com",
  phone: "+44 7700 900123",
  location: "London, UK",
  summary: "Experienced full-stack developer with 5+ years building scalable web applications. Passionate about React, Node.js, and cloud technologies. Looking for remote opportunities in innovative tech companies.",
  skills: [
    "React", "TypeScript", "Node.js", "Next.js", "Python",
    "AWS", "Docker", "PostgreSQL", "MongoDB", "REST APIs"
  ],
  experience: [
    {
      title: "Senior Developer",
      company: "Tech Corp",
      location: "London, UK",
      period: "2021 - Present",
      description: "Leading development of customer-facing web applications"
    },
    {
      title: "Full-Stack Developer",
      company: "StartupXYZ",
      location: "Remote",
      period: "2019 - 2021",
      description: "Built and maintained multiple microservices and frontend applications"
    }
  ],
  education: [
    {
      degree: "BSc Computer Science",
      institution: "University of London",
      period: "2015 - 2019"
    }
  ],
  preferences: {
    jobType: ["Full-time", "Remote"],
    salaryMin: "£50,000",
    salaryMax: "£80,000",
    location: "London or Remote"
  }
};
