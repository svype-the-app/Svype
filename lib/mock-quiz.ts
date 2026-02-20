export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const mockPreScreeningQuiz: QuizQuestion[] = [
  {
    id: 1,
    question: "What is React primarily used for?",
    options: [
      "Building backend APIs",
      "Building user interfaces",
      "Database management",
      "Server configuration"
    ],
    correctAnswer: 1,
    explanation: "React is a JavaScript library for building user interfaces, particularly for single-page applications."
  },
  {
    id: 2,
    question: "Which hook is used for side effects in React?",
    options: [
      "useState",
      "useContext",
      "useEffect",
      "useCallback"
    ],
    correctAnswer: 2,
    explanation: "useEffect is the hook used to handle side effects like data fetching, subscriptions, and manually changing the DOM."
  },
  {
    id: 3,
    question: "What does JSX stand for?",
    options: [
      "JavaScript XML",
      "JavaScript Extension",
      "Java Syntax Extension",
      "JavaScript Express"
    ],
    correctAnswer: 0,
    explanation: "JSX stands for JavaScript XML. It allows us to write HTML-like syntax in JavaScript."
  },
  {
    id: 4,
    question: "What is the virtual DOM?",
    options: [
      "A backup of the real DOM",
      "A lightweight copy of the real DOM",
      "A database for DOM elements",
      "A CSS framework"
    ],
    correctAnswer: 1,
    explanation: "The virtual DOM is a lightweight copy of the actual DOM that React uses to optimize updates and improve performance."
  },
  {
    id: 5,
    question: "Which method is used to update state in a functional component?",
    options: [
      "this.setState()",
      "setState()",
      "The setter function from useState",
      "updateState()"
    ],
    correctAnswer: 2,
    explanation: "In functional components, we use the setter function returned by the useState hook to update state."
  }
];
