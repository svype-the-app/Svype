export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const initialChatMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content:
      "Hello! I'm your AI Career Coach. I'm here to help you discover your ideal career path, refine your goals, and find jobs that truly match your aspirations. How can I assist you today?",
    timestamp: new Date(Date.now() - 5000),
  },
];

export const aiChatResponses = [
  "That's a great question! Based on your interests in web development and UI/UX design, I'd recommend focusing on roles that combine technical skills with creative problem-solving. Have you considered positions like Frontend Developer or Product Designer?",
  "I can see you're passionate about making an impact. Jobs that align with your values tend to lead to greater job satisfaction. What aspects of a role are most important to you - the company culture, the projects, or the growth opportunities?",
  "Your career goals are clear and ambitious! To get there, I'd suggest building skills in React, TypeScript, and modern design systems. Would you like me to help you find jobs that match these requirements?",
  "That's an excellent point! Work-life balance is crucial for long-term career success. I'll keep that in mind when suggesting opportunities. Are there specific work arrangements you prefer, like remote work or flexible hours?",
  'I understand. Let me help you explore that further. What excites you most about this career direction? Understanding your motivations will help me provide better recommendations.',
];

export const quickPrompts = [
  'Help me define my career goals',
  'What jobs match my skills?',
  'How can I improve my resume?',
  'Tips for job interviews',
];
