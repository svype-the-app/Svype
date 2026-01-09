import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const mockQuiz: Question[] = [
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

export default function PreScreeningQuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(mockQuiz.length).fill(null));
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer
  useEffect(() => {
    if (showResult) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResult]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (selectedAnswer !== null) {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = selectedAnswer;
      setAnswers(newAnswers);
    }

    if (currentQuestion < mockQuiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(answers[currentQuestion + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowResult(true);
    setIsSubmitting(false);
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === mockQuiz[index].correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: mockQuiz.length,
      percentage: Math.round((correct / mockQuiz.length) * 100)
    };
  };

  const score = showResult ? calculateScore() : null;
  const currentQ = mockQuiz[currentQuestion];
  const progress = ((currentQuestion + 1) / mockQuiz.length) * 100;

  if (showResult && score) {
    const passed = score.percentage >= 60;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView 
          contentContainerStyle={styles.resultContainer}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.resultCard}>
            <CardContent>
              {/* Result Header */}
              <View style={styles.resultHeader}>
                <View style={[
                  styles.resultIcon,
                  { backgroundColor: passed ? '#10b981' + '1A' : '#ef4444' + '1A' }
                ]}>
                  <Ionicons 
                    name={passed ? "checkmark-circle" : "close-circle"} 
                    size={40} 
                    color={passed ? "#10b981" : "#ef4444"} 
                  />
                </View>
                <Text style={[styles.resultTitle, { color: colors.cardForeground }]}>
                  {passed ? "Quiz Completed!" : "Quiz Submitted"}
                </Text>
                <Text style={[styles.resultSubtitle, { color: colors.mutedForeground }]}>
                  {passed 
                    ? "Great job! You've passed the pre-screening quiz." 
                    : "Thank you for completing the quiz. The employer will review your application."}
                </Text>
              </View>

              {/* Score Card */}
              <Card style={[styles.scoreCard, { backgroundColor: colors.muted + '80' }]}>
                <CardContent>
                  <View style={styles.scoreHeader}>
                    <Text style={[styles.scoreLabel, { color: colors.cardForeground }]}>
                      Your Score
                    </Text>
                    <Badge 
                      variant={passed ? "default" : "secondary"}
                      style={styles.scoreBadge}
                    >
                      <Text style={styles.scorePercentage}>{score.percentage}%</Text>
                    </Badge>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${score.percentage}%`,
                          backgroundColor: passed ? colors.primary : colors.mutedForeground 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.scoreText, { color: colors.mutedForeground }]}>
                    {score.correct} out of {score.total} questions correct
                  </Text>
                </CardContent>
              </Card>

              {/* Questions Review */}
              <View style={styles.reviewSection}>
                <ScrollView style={styles.reviewScroll}>
                  {mockQuiz.map((question, index) => {
                    const userAnswer = answers[index];
                    const isCorrect = userAnswer === question.correctAnswer;
                    
                    return (
                      <Card key={question.id} style={styles.reviewCard}>
                        <CardContent>
                          <View style={styles.reviewContent}>
                            <View style={[
                              styles.reviewIcon,
                              { backgroundColor: isCorrect ? '#10b981' + '1A' : '#ef4444' + '1A' }
                            ]}>
                              <Ionicons 
                                name={isCorrect ? "checkmark-circle" : "close-circle"} 
                                size={20} 
                                color={isCorrect ? "#10b981" : "#ef4444"} 
                              />
                            </View>
                            <View style={styles.reviewText}>
                              <Text style={[styles.reviewQuestion, { color: colors.cardForeground }]}>
                                Question {index + 1}: {question.question}
                              </Text>
                              <Text style={[styles.reviewAnswer, { color: colors.mutedForeground }]}>
                                Your answer: {userAnswer !== null ? question.options[userAnswer] : "Not answered"}
                              </Text>
                              {!isCorrect && (
                                <Text style={[styles.correctAnswer, { color: '#10b981' }]}>
                                  Correct answer: {question.options[question.correctAnswer]}
                                </Text>
                              )}
                              <Text style={[styles.explanation, { color: colors.mutedForeground }]}>
                                {question.explanation}
                              </Text>
                            </View>
                          </View>
                        </CardContent>
                      </Card>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Actions */}
              <View style={styles.resultActions}>
                <Button
                  variant="outline"
                  onPress={() => router.push('/(jobseeker)/dashboard')}
                  style={styles.resultButton}
                >
                  <Text style={[styles.resultButtonText, { color: colors.primary }]}>
                    View Applications
                  </Text>
                </Button>
                <Button
                  onPress={() => router.push('/(jobseeker)/swipe')}
                  style={styles.resultButton}
                >
                  <Text style={styles.resultButtonTextPrimary}>
                    Continue Swiping
                  </Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              disabled={isSubmitting}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color={colors.cardForeground} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.headerTitle, { color: colors.cardForeground }]}>
                Pre-Screening Quiz
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                Question {currentQuestion + 1} of {mockQuiz.length}
              </Text>
            </View>
          </View>
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={16} color={colors.mutedForeground} />
            <Text style={[
              styles.timerText, 
              { color: timeLeft < 60 ? '#ef4444' : colors.cardForeground }
            ]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress}%`, backgroundColor: colors.primary }
            ]} 
          />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.quizCard}>
          <CardContent>
            {/* Question */}
            <View style={styles.questionSection}>
              <Badge variant="outline" style={styles.questionBadge}>
                <Text style={styles.questionBadgeText}>Question {currentQuestion + 1}</Text>
              </Badge>
              <Text style={[styles.questionText, { color: colors.cardForeground }]}>
                {currentQ.question}
              </Text>
              <Text style={[styles.questionHint, { color: colors.mutedForeground }]}>
                Select one answer
              </Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {currentQ.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedAnswer(index)}
                  style={[
                    styles.optionButton,
                    {
                      borderColor: selectedAnswer === index ? colors.primary : colors.border,
                      backgroundColor: selectedAnswer === index ? colors.primary + '0D' : 'transparent'
                    }
                  ]}
                >
                  <View style={[
                    styles.radioButton,
                    {
                      borderColor: selectedAnswer === index ? colors.primary : colors.border,
                      backgroundColor: selectedAnswer === index ? colors.primary : 'transparent'
                    }
                  ]}>
                    {selectedAnswer === index && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <Label style={[styles.optionLabel, { color: colors.cardForeground }]}>
                    {option}
                  </Label>
                </TouchableOpacity>
              ))}
            </View>

            {/* Warning for unanswered */}
            {selectedAnswer === null && (
              <View style={[styles.warningBox, { backgroundColor: '#fbbf24' + '1A' }]}>
                <Ionicons name="alert-circle-outline" size={20} color="#fbbf24" />
                <Text style={[styles.warningText, { color: '#92400e' }]}>
                  Please select an answer before proceeding to the next question.
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <View style={styles.navigation}>
          <Button
            variant="outline"
            onPress={handlePrevious}
            disabled={currentQuestion === 0 || isSubmitting}
            style={styles.navButton}
          >
            <Ionicons name="arrow-back" size={16} color={colors.primary} />
            <Text style={[styles.navButtonText, { color: colors.primary }]}>
              Previous
            </Text>
          </Button>

          <View style={styles.dots}>
            {mockQuiz.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentQuestion
                      ? colors.primary
                      : answers[index] !== null
                      ? colors.primary + '80'
                      : colors.mutedForeground + '33',
                    width: index === currentQuestion ? 16 : 8
                  }
                ]}
              />
            ))}
          </View>

          {currentQuestion === mockQuiz.length - 1 ? (
            <Button
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.navButton}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </Text>
              <Ionicons name="trophy-outline" size={16} color="#fff" />
            </Button>
          ) : (
            <Button
              onPress={handleNext}
              disabled={selectedAnswer === null || isSubmitting}
              style={styles.navButton}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </Button>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  quizCard: {
    marginBottom: 24,
  },
  questionSection: {
    marginBottom: 24,
  },
  questionBadge: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  questionBadgeText: {
    fontSize: 12,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 30,
  },
  questionHint: {
    fontSize: 13,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  resultContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  resultCard: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  scoreCard: {
    marginBottom: 24,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoreBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  scorePercentage: {
    fontSize: 16,
    fontWeight: '700',
  },
  scoreText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  reviewSection: {
    marginBottom: 24,
    maxHeight: 400,
  },
  reviewScroll: {
    gap: 12,
  },
  reviewCard: {
    marginBottom: 12,
  },
  reviewContent: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewText: {
    flex: 1,
    gap: 6,
  },
  reviewQuestion: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  reviewAnswer: {
    fontSize: 13,
  },
  correctAnswer: {
    fontSize: 13,
  },
  explanation: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  resultButton: {
    flex: 1,
    paddingVertical: 14,
  },
  resultButtonText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultButtonTextPrimary: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
