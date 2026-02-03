export interface Applicant {
  id: string;
  name: string;
  email: string;
  location: string;
  experience: string;
  skills: string[];
  bio: string;
  appliedFor: string;
  appliedAt: string;
  avatar?: string;
}

const generateApplicants = (jobTitle: string): Applicant[] => {
  const names = [
    { first: 'Sarah', last: 'Johnson' },
    { first: 'Michael', last: 'Chen' },
    { first: 'Emma', last: 'Wilson' },
    { first: 'James', last: 'Rodriguez' },
    { first: 'Priya', last: 'Patel' },
  ];

  const skillSets = {
    'Senior Frontend Engineer': [
      ['React', 'TypeScript', 'Next.js', 'Node.js', 'UI/UX'],
      ['Vue.js', 'JavaScript', 'CSS', 'Web Performance', 'Testing'],
      ['Angular', 'TypeScript', 'RxJS', 'State Management', 'Design Systems'],
      ['React', 'GraphQL', 'Redux', 'Testing', 'DevOps'],
      ['React Native', 'TypeScript', 'Mobile UI', 'Performance', 'Firebase'],
    ],
    'Product Designer': [
      ['Figma', 'UI Design', 'Prototyping', 'Design Systems', 'User Research'],
      ['Adobe XD', 'Wireframing', 'Usability Testing', 'Design Thinking', 'Accessibility'],
      ['Sketch', 'Interaction Design', 'Design Systems', 'Animation', 'Brand Design'],
      ['Figma', 'User Experience', 'Research', 'Prototyping', 'Design Sprints'],
      ['Adobe Creative Suite', 'UI/UX', 'Motion Design', 'Design Tools', 'Collaboration'],
    ],
    'Backend Developer': [
      ['Node.js', 'PostgreSQL', 'AWS', 'Docker', 'REST APIs'],
      ['Python', 'Django', 'MongoDB', 'Kubernetes', 'Microservices'],
      ['Java', 'Spring Boot', 'MySQL', 'Cloud Architecture', 'APIs'],
      ['Go', 'PostgreSQL', 'Redis', 'System Design', 'DevOps'],
      ['Node.js', 'GraphQL', 'Firebase', 'Serverless', 'Cloud Functions'],
    ],
    'Marketing Lead': [
      ['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics', 'Social Media'],
      ['Brand Strategy', 'Campaign Management', 'Data Analysis', 'Growth Hacking', 'Marketing Automation'],
      ['Product Marketing', 'Market Research', 'Positioning', 'Launch Strategy', 'Analytics'],
      ['Growth Marketing', 'Funnel Optimization', 'A/B Testing', 'Attribution', 'Analytics'],
      ['Content Marketing', 'SEO', 'Copywriting', 'Analytics', 'Community Building'],
    ],
  };

  const bios = [
    'Passionate engineer with a strong focus on creating intuitive user experiences. Previously worked at top tech companies building scalable solutions.',
    'Creative professional specializing in modern technologies and best practices. Love transforming complex problems into elegant solutions.',
    'Results-driven specialist with expertise in building high-performance systems. Strong focus on quality, reliability, and continuous improvement.',
    'Innovative thinker with a track record of delivering impactful projects. Excited about learning new technologies and collaborating with talented teams.',
    'Detail-oriented professional committed to excellence. Experienced in leading projects and mentoring junior team members.',
  ];

  return names.map((name, idx) => ({
    id: `${jobTitle.replace(/\s+/g, '-')}-${idx + 1}`,
    name: `${name.first} ${name.last}`,
    email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}@email.com`,
    location: ['London, UK', 'Manchester, UK', 'Remote', 'Birmingham, UK', 'Edinburgh, UK'][idx],
    experience: ['5 years', '3 years', '4 years', '6 years', '2 years'][idx],
    skills: skillSets[jobTitle as keyof typeof skillSets]?.[idx] || ['Skill 1', 'Skill 2', 'Skill 3'],
    bio: bios[idx],
    appliedFor: jobTitle,
    appliedAt: ['2 hours ago', '5 hours ago', '1 day ago', '2 days ago', '3 days ago'][idx],
  }));
};

let mockApplicantsByJob: { [key: string]: Applicant[] } = {};

export function getApplicantsByJob(jobTitle: string): Applicant[] {
  if (!mockApplicantsByJob[jobTitle]) {
    mockApplicantsByJob[jobTitle] = generateApplicants(jobTitle);
  }
  return mockApplicantsByJob[jobTitle];
}

export function rejectApplicant(jobTitle: string, applicantId: string): Applicant[] {
  if (!mockApplicantsByJob[jobTitle]) {
    mockApplicantsByJob[jobTitle] = generateApplicants(jobTitle);
  }
  mockApplicantsByJob[jobTitle] = mockApplicantsByJob[jobTitle].filter(app => app.id !== applicantId);
  return mockApplicantsByJob[jobTitle];
}
