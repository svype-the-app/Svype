// CV Templates
export interface CVTemplate {
  id: string;
  name: string;
  description: string;
}

export const cvTemplates: CVTemplate[] = [
  {
    id: "modern",
    name: "Modern Professional",
    description: "Clean and contemporary design"
  },
  {
    id: "classic",
    name: "Classic Executive",
    description: "Traditional and elegant"
  },
  {
    id: "creative",
    name: "Creative Designer",
    description: "Bold and artistic"
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and focused"
  }
];

// Job Options for CV/Cover Letter Generation
export interface JobOption {
  id: string;
  title: string;
  company: string;
  description?: string;
}

export const mockJobOptions: JobOption[] = [
  { id: "1", title: "Senior Frontend Engineer", company: "TechCorp Inc.", description: "Looking for an experienced React developer..." },
  { id: "2", title: "Full Stack Developer", company: "StartupXYZ", description: "Join our fast-growing startup..." },
  { id: "3", title: "React Developer", company: "Digital Agency", description: "Creative agency seeking talented developer..." }
];

// Cover Letter Tone Options
export interface ToneOption {
  value: string;
  label: string;
  description: string;
}

export const toneOptions: ToneOption[] = [
  { value: "professional", label: "Professional", description: "Formal and business-like" },
  { value: "enthusiastic", label: "Enthusiastic", description: "Passionate and energetic" },
  { value: "confident", label: "Confident", description: "Strong and assertive" },
  { value: "creative", label: "Creative", description: "Unique and innovative" }
];

// Interview Prep Types
export interface InterviewTopic {
  id: string;
  title: string;
  icon: string;
  description: string;
  questions: number;
  duration: string;
}

export interface InterviewResource {
  id: string;
  type: 'article' | 'video';
  title: string;
  description: string;
  readTime: string;
  popular: boolean;
}

export interface BehavioralQuestion {
  question: string;
  tips: string[];
  example: string;
}

export interface InterviewTip {
  title: string;
  description: string;
  icon: string;
}

export const interviewTopics: InterviewTopic[] = [
  {
    id: 'behavioral',
    title: 'Behavioral Questions',
    icon: '💬',
    description: 'Common behavioral interview questions and how to answer them',
    questions: 15,
    duration: '30 min',
  },
  {
    id: 'technical',
    title: 'Technical Questions',
    icon: '💻',
    description: 'Technical questions for software engineering roles',
    questions: 20,
    duration: '45 min',
  },
  {
    id: 'system-design',
    title: 'System Design',
    icon: '🏗️',
    description: 'Learn how to approach system design interviews',
    questions: 10,
    duration: '60 min',
  },
  {
    id: 'culture-fit',
    title: 'Culture Fit',
    icon: '🤝',
    description: 'Questions about company culture and values',
    questions: 12,
    duration: '20 min',
  },
];

export const interviewResources: InterviewResource[] = [
  {
    id: '1',
    type: 'article',
    title: 'The STAR Method for Behavioral Interviews',
    description: 'Learn how to structure your answers using Situation, Task, Action, Result',
    readTime: '5 min read',
    popular: true,
  },
  {
    id: '2',
    type: 'video',
    title: 'Mock Interview: Senior Frontend Engineer',
    description: 'Watch a full mock interview and learn from expert feedback',
    readTime: '45 min watch',
    popular: true,
  },
  {
    id: '3',
    type: 'article',
    title: '10 Questions You Should Ask Interviewers',
    description: 'Impress employers with thoughtful questions about the role',
    readTime: '4 min read',
    popular: false,
  },
  {
    id: '4',
    type: 'video',
    title: 'Handling Salary Negotiations',
    description: 'Tips for discussing compensation confidently',
    readTime: '20 min watch',
    popular: true,
  },
];

export const behavioralQuestions: BehavioralQuestion[] = [
  {
    question: 'Tell me about yourself',
    tips: [
      'Keep it professional and relevant to the role',
      'Structure: Present → Past → Future',
      'Highlight key achievements and skills',
      'Keep it under 2 minutes',
    ],
    example:
      'I\'m currently a frontend engineer with 5 years of experience building scalable web applications. In my previous role at TechCorp, I led a team of 4 developers and increased page load speed by 40%. I\'m now looking for opportunities to expand my leadership skills while continuing to work with modern technologies like React and Next.js.',
  },
  {
    question: 'What are your greatest strengths?',
    tips: [
      'Choose 2-3 strengths relevant to the job',
      'Provide specific examples',
      'Show how your strengths benefit the team',
      'Be genuine and confident',
    ],
    example:
      'One of my greatest strengths is problem-solving. For example, when our application faced performance issues affecting thousands of users, I analyzed the codebase, identified bottlenecks, and implemented optimizations that improved load times by 60%. I also excel at collaboration—I believe the best solutions come from diverse perspectives.',
  },
  {
    question: 'Describe a challenging situation and how you overcame it',
    tips: [
      'Use the STAR method',
      'Choose a relevant professional example',
      'Focus on your actions and decisions',
      'End with the positive outcome',
    ],
    example:
      'In my last project, we had a tight deadline and discovered a critical security vulnerability two days before launch (Situation). As the lead developer, I needed to fix it without delaying the launch (Task). I quickly assembled a small team, we worked through the weekend implementing a patch and comprehensive tests (Action). We launched on time with zero security issues and received praise from the client (Result).',
  },
];

export const interviewTips: InterviewTip[] = [
  {
    title: 'Research the Company',
    description: 'Understand their products, values, and recent news. Show genuine interest.',
    icon: 'navigate',
  },
  {
    title: 'Prepare Your Stories',
    description: 'Have 5-7 STAR stories ready that showcase different skills and situations.',
    icon: 'book',
  },
  {
    title: 'Practice Out Loud',
    description: 'Rehearse your answers verbally, not just in your head. Record yourself if possible.',
    icon: 'chatbubbles',
  },
  {
    title: 'Ask Smart Questions',
    description: 'Prepare 3-5 thoughtful questions about the role, team, and company.',
    icon: 'bulb',
  },
  {
    title: 'Plan Your Logistics',
    description: 'Test your tech setup for video calls. Arrive 10 minutes early for in-person interviews.',
    icon: 'time',
  },
  {
    title: 'Follow Up',
    description: 'Send a thank-you email within 24 hours. Reiterate your interest and key points.',
    icon: 'checkmark-circle',
  },
];

// Skills Assessment Types
export interface Skill {
  id: string;
  name: string;
  icon: string;
  description: string;
  questions: number;
  duration: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const skills: Skill[] = [
  {
    id: 'react',
    name: 'React',
    icon: '⚛️',
    description: 'Test your knowledge of React fundamentals',
    questions: 10,
    duration: '15 min',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    icon: '📘',
    description: 'Assess your TypeScript skills',
    questions: 10,
    duration: '15 min',
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    icon: '🟢',
    description: 'Evaluate your backend knowledge',
    questions: 10,
    duration: '15 min',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    icon: '🟨',
    description: 'Test core JavaScript concepts',
    questions: 10,
    duration: '15 min',
  },
];

export const assessmentQuestions: Record<string, AssessmentQuestion[]> = {
  react: [
    {
      id: '1',
      question: 'What is the purpose of useEffect hook in React?',
      options: [
        'To manage component state',
        'To perform side effects in function components',
        'To create context',
        'To optimize performance',
      ],
      correctAnswer: 1,
      explanation:
        'useEffect is used to perform side effects in function components, such as data fetching, subscriptions, or manually changing the DOM.',
    },
    {
      id: '2',
      question: 'Which method is used to update state in a class component?',
      options: ['updateState()', 'setState()', 'changeState()', 'modifyState()'],
      correctAnswer: 1,
      explanation: 'setState() is the method used to update state in React class components.',
    },
    {
      id: '3',
      question: 'What is JSX?',
      options: [
        'A programming language',
        'A syntax extension for JavaScript',
        'A CSS framework',
        'A testing library',
      ],
      correctAnswer: 1,
      explanation:
        'JSX is a syntax extension for JavaScript that allows you to write HTML-like code in your JavaScript files.',
    },
  ],
  typescript: [
    {
      id: '1',
      question: 'What is TypeScript?',
      options: [
        'A JavaScript runtime',
        'A superset of JavaScript with static typing',
        'A CSS preprocessor',
        'A testing framework',
      ],
      correctAnswer: 1,
      explanation:
        'TypeScript is a superset of JavaScript that adds static typing and other features to help catch errors during development.',
    },
    {
      id: '2',
      question: 'Which keyword is used to define an interface in TypeScript?',
      options: ['class', 'type', 'interface', 'define'],
      correctAnswer: 2,
      explanation:
        "The 'interface' keyword is used to define an interface in TypeScript, which describes the shape of an object.",
    },
  ],
  nodejs: [
    {
      id: '1',
      question: 'What is Node.js primarily used for?',
      options: [
        'Frontend development',
        'Server-side JavaScript execution',
        'Mobile app development',
        'Database management',
      ],
      correctAnswer: 1,
      explanation: 'Node.js is a JavaScript runtime built on Chrome\'s V8 engine for server-side execution.',
    },
  ],
  javascript: [
    {
      id: '1',
      question: 'What does "const" keyword do in JavaScript?',
      options: [
        'Creates a variable that can be reassigned',
        'Creates a constant reference',
        'Creates a global variable',
        'Creates a function',
      ],
      correctAnswer: 1,
      explanation: 'The const keyword creates a constant reference that cannot be reassigned.',
    },
  ],
};
