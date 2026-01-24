import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Skill {
  id: string;
  name: string;
  icon: string;
  description: string;
  questions: number;
  duration: string;
}

export default function SkillsAssessmentScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);

  const skills: Skill[] = [
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

  const assessments: Record<string, Question[]> = {
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
  };

  const currentAssessment = selectedSkill ? assessments[selectedSkill] || [] : [];
  const currentQuestion = currentAssessment[currentQuestionIndex];

  const handleSkillSelect = (skillId: string) => {
    setSelectedSkill(skillId);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowExplanation(false);
    setAssessmentComplete(false);
  };

  const handleAnswerSelect = (answerIndex: string) => {
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = parseInt(selectedAnswer) === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentAssessment.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setAssessmentComplete(true);
    }
  };

  const getScorePercentage = () => {
    return Math.round((score / currentAssessment.length) * 100);
  };

  const getScoreLevel = () => {
    const percentage = getScorePercentage();
    if (percentage >= 80)
      return {
        level: 'Expert',
        color: colors.primary,
        badge: { backgroundColor: colors.primary + '20', color: colors.primary },
      };
    if (percentage >= 60)
      return {
        level: 'Intermediate',
        color: '#3b82f6',
        badge: { backgroundColor: '#3b82f620', color: '#3b82f6' },
      };
    return {
      level: 'Beginner',
      color: '#f59e0b',
      badge: { backgroundColor: '#f59e0b20', color: '#f59e0b' },
    };
  };

  // Skill Selection Screen
  if (!selectedSkill) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.background, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                Skills Assessment
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                Test your knowledge
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Card */}
          <Card style={[styles.infoCard, { backgroundColor: colors.primary + '10' }]}>
            <CardContent style={styles.infoCardContent}>
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: colors.primary + '30' },
                ]}
              >
                <Ionicons name="checkmark-circle-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoTitle, { color: colors.cardForeground }]}>
                  Validate Your Skills
                </Text>
                <Text style={[styles.infoDescription, { color: colors.mutedForeground }]}>
                  Take quick assessments to showcase your expertise and stand out to employers.
                </Text>
              </View>
            </CardContent>
          </Card>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Choose a Skill to Assess
          </Text>

          {/* Skills Grid */}
          <View style={styles.skillsGrid}>
            {skills.map((skill) => (
              <TouchableOpacity
                key={skill.id}
                onPress={() => handleSkillSelect(skill.id)}
                activeOpacity={0.7}
              >
                <Card style={styles.skillCard}>
                  <CardContent style={styles.skillCardContent}>
                    <Text style={styles.skillIcon}>{skill.icon}</Text>
                    <Text style={[styles.skillName, { color: colors.cardForeground }]}>
                      {skill.name}
                    </Text>
                    <Text style={[styles.skillDescription, { color: colors.mutedForeground }]}>
                      {skill.description}
                    </Text>
                    <View style={styles.skillMeta}>
                      <Text style={[styles.skillMetaText, { color: colors.mutedForeground }]}>
                        📝 {skill.questions} questions
                      </Text>
                      <Text style={[styles.skillMetaText, { color: colors.mutedForeground }]}>
                        ⏱️ {skill.duration}
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          {/* Benefits Card */}
          <Card style={styles.benefitsCard}>
            <CardContent style={styles.benefitsContent}>
              <Text style={[styles.benefitsTitle, { color: colors.cardForeground }]}>
                Benefits of Skills Assessment
              </Text>
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.benefitTitle, { color: colors.foreground }]}>
                      Showcase Your Expertise
                    </Text>
                    <Text style={[styles.benefitDescription, { color: colors.mutedForeground }]}>
                      Add verified skill badges to your profile
                    </Text>
                  </View>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.benefitTitle, { color: colors.foreground }]}>
                      Stand Out to Employers
                    </Text>
                    <Text style={[styles.benefitDescription, { color: colors.mutedForeground }]}>
                      Increase your visibility in job searches
                    </Text>
                  </View>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.benefitTitle, { color: colors.foreground }]}>
                      Identify Growth Areas
                    </Text>
                    <Text style={[styles.benefitDescription, { color: colors.mutedForeground }]}>
                      Get personalized recommendations
                    </Text>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>
        </ScrollView>
      </View>
    );
  }

  // Assessment Complete Screen
  if (assessmentComplete) {
    const scoreLevel = getScoreLevel();
    const percentage = getScorePercentage();

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.background, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedSkill(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Assessment Complete
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.resultContent}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.resultCard}>
            <CardContent style={styles.resultCardContent}>
              <View style={[styles.awardIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="trophy" size={40} color={colors.primaryForeground} />
              </View>

              <Text style={[styles.congratsTitle, { color: colors.cardForeground }]}>
                Congratulations!
              </Text>
              <Text style={[styles.congratsSubtitle, { color: colors.mutedForeground }]}>
                You've completed the {skills.find((s) => s.id === selectedSkill)?.name} assessment
              </Text>

              <View style={styles.scoreDisplay}>
                <Text style={[styles.scorePercentage, { color: colors.primary }]}>
                  {percentage}%
                </Text>
                <View
                  style={[
                    styles.scoreBadge,
                    { backgroundColor: scoreLevel.badge.backgroundColor },
                  ]}
                >
                  <Text style={[styles.scoreBadgeText, { color: scoreLevel.badge.color }]}>
                    {scoreLevel.level} Level
                  </Text>
                </View>
              </View>

              <View style={[styles.scoreDetails, { backgroundColor: colors.muted + '80' }]}>
                <Text style={[styles.scoreDetailsLabel, { color: colors.mutedForeground }]}>
                  Your Score
                </Text>
                <Text style={[styles.scoreDetailsValue, { color: colors.foreground }]}>
                  {score} / {currentAssessment.length}
                </Text>
                <Progress value={percentage} style={styles.scoreProgress} />
              </View>

              <View style={[styles.badgeNotification, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name="trending-up" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.badgeNotificationTitle, { color: colors.foreground }]}>
                    Badge Added
                  </Text>
                  <Text
                    style={[styles.badgeNotificationText, { color: colors.mutedForeground }]}
                  >
                    Your skill badge is now visible on your profile
                  </Text>
                </View>
              </View>

              <View style={styles.resultActions}>
                <Button
                  variant="outline"
                  onPress={() => setSelectedSkill(null)}
                  style={styles.actionButton}
                >
                  Take Another
                </Button>
                <Button
                  onPress={() => router.push('/(jobseeker)/profile')}
                  style={styles.actionButton}
                >
                  View Profile
                </Button>
              </View>
            </CardContent>
          </Card>
        </ScrollView>
      </View>
    );
  }

  // Question Screen
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.questionHeader}>
          <View style={styles.questionHeaderLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedSkill(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                {skills.find((s) => s.id === selectedSkill)?.name} Assessment
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                Question {currentQuestionIndex + 1} of {currentAssessment.length}
              </Text>
            </View>
          </View>
          <View style={[styles.scoreBadgeSmall, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.scoreBadgeSmallText, { color: colors.foreground }]}>
              Score: {score}/{currentAssessment.length}
            </Text>
          </View>
        </View>
        <Progress
          value={((currentQuestionIndex + 1) / currentAssessment.length) * 100}
          style={styles.progressBar}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.questionContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.questionCard}>
          <CardContent style={styles.questionCardContent}>
            <Text style={[styles.questionText, { color: colors.cardForeground }]}>
              {currentQuestion.question}
            </Text>

            <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect} disabled={showExplanation}>
              <View style={styles.optionsList}>
                {currentQuestion.options.map((option, index) => {
                  const isCorrect = index === currentQuestion.correctAnswer;
                  const isSelected = parseInt(selectedAnswer || '-1') === index;
                  const showCorrect = showExplanation && isCorrect;
                  const showIncorrect = showExplanation && isSelected && !isCorrect;

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => !showExplanation && handleAnswerSelect(index.toString())}
                      activeOpacity={0.7}
                      disabled={showExplanation}
                      style={[
                        styles.optionItem,
                        { borderColor: colors.border },
                        isSelected && !showExplanation && {
                          borderColor: colors.primary,
                          backgroundColor: colors.primary + '10',
                        },
                        showCorrect && {
                          borderColor: '#22c55e',
                          backgroundColor: '#22c55e10',
                        },
                        showIncorrect && {
                          borderColor: '#ef4444',
                          backgroundColor: '#ef444410',
                        },
                      ]}
                    >
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} disabled={showExplanation} />
                      <Label style={[styles.optionLabel, { color: colors.foreground }]}>
                        {option}
                      </Label>
                      {showCorrect && (
                        <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </RadioGroup>

            {showExplanation && (
              <View style={[styles.explanation, { backgroundColor: colors.muted + '80' }]}>
                <Text style={[styles.explanationLabel, { color: colors.foreground }]}>
                  Explanation:
                </Text>
                <Text style={[styles.explanationText, { color: colors.mutedForeground }]}>
                  {currentQuestion.explanation}
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {!showExplanation ? (
          <Button
            size="lg"
            onPress={handleSubmitAnswer}
            disabled={selectedAnswer === null}
            style={styles.submitButton}
          >
            Submit Answer
          </Button>
        ) : (
          <Button size="lg" onPress={handleNextQuestion} style={styles.submitButton}>
            {currentQuestionIndex < currentAssessment.length - 1
              ? 'Next Question'
              : 'Finish Assessment'}
          </Button>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoCardContent: {
    padding: 20,
    flexDirection: 'row',
    gap: 16,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  skillsGrid: {
    gap: 16,
    marginBottom: 20,
  },
  skillCard: {
    marginBottom: 0,
  },
  skillCardContent: {
    padding: 20,
  },
  skillIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  skillName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  skillDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  skillMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  skillMetaText: {
    fontSize: 14,
  },
  benefitsCard: {
    marginBottom: 20,
  },
  benefitsContent: {
    padding: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    gap: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
  },
  resultContent: {
    padding: 16,
    paddingBottom: 100,
    justifyContent: 'center',
    minHeight: '100%',
  },
  resultCard: {
    marginBottom: 0,
  },
  resultCardContent: {
    padding: 32,
    alignItems: 'center',
  },
  awardIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  congratsSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  scoreDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scorePercentage: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  scoreBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreDetails: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  scoreDetailsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreDetailsValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  scoreProgress: {
    height: 8,
  },
  badgeNotification: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  badgeNotificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  badgeNotificationText: {
    fontSize: 14,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  scoreBadgeSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreBadgeSmallText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    marginTop: 12,
  },
  questionContent: {
    padding: 16,
    paddingBottom: 100,
  },
  questionCard: {
    marginBottom: 16,
  },
  questionCardContent: {
    padding: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
    lineHeight: 28,
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
  },
  explanation: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
  },
  explanationLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 16,
  },
});
