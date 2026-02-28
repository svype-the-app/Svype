import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { assessmentQuestions, AssessmentQuestion, Skill, skills } from '@/lib/mock-ai-tools';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

type Question = AssessmentQuestion;

const ProgressBar = ({ value, height = 8 }: { value: number; height?: number }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={[
        {
          height,
          backgroundColor: colors.muted,
          borderRadius: height / 2,
          overflow: 'hidden',
        },
      ]}
    >
      <View
        style={{
          width: `${value}%`,
          height: '100%',
          backgroundColor: colors.primary,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
};

export default function SkillsAssessmentScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);

  const assessments = assessmentQuestions;

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

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showExplanation) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
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
      return { level: 'Expert', color: '#15803d', bgColor: '#dcfce7', borderColor: '#86efac' };
    if (percentage >= 60)
      return { level: 'Intermediate', color: '#1d4ed8', bgColor: '#dbeafe', borderColor: '#93c5fd' };
    return { level: 'Beginner', color: '#ca8a04', bgColor: '#fef3c7', borderColor: '#fde047' };
  };

  // Skill Selection Screen
  if (!selectedSkill) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>Skills Assessment</Text>
              <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                Test your knowledge
              </Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Card style={[styles.heroCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
            <CardContent style={styles.heroCardContent}>
              <View style={[styles.heroIcon, { backgroundColor: colors.primary + '30' }]}>
                <Ionicons name="analytics-outline" size={28} color={colors.primary} />
              </View>
              <View style={styles.heroText}>
                <Text style={[styles.heroTitle, { color: colors.foreground }]}>
                  Validate Your Skills
                </Text>
                <Text style={[styles.heroDescription, { color: colors.mutedForeground }]}>
                  Take quick assessments to showcase your expertise and stand out to employers.
                </Text>
              </View>
            </CardContent>
          </Card>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Choose a Skill to Assess
          </Text>

          <View style={styles.skillsGrid}>
            {skills.map((skill) => (
              <TouchableOpacity
                key={skill.id}
                onPress={() => handleSkillSelect(skill.id)}
                style={styles.skillCardWrapper}
              >
                <Card style={[styles.skillCard, { borderColor: colors.border }]}>
                  <CardContent style={styles.skillCardContent}>
                    <Text style={styles.skillIcon}>{skill.icon}</Text>
                    <Text style={[styles.skillName, { color: colors.foreground }]}>{skill.name}</Text>
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

          <Card style={{ borderWidth: 2, borderColor: colors.border }}>
            <CardContent style={styles.benefitsCard}>
              <Text style={[styles.benefitsTitle, { color: colors.foreground }]}>
                Benefits of Skills Assessment
              </Text>
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <View style={styles.benefitText}>
                    <Text style={[styles.benefitLabel, { color: colors.foreground }]}>
                      Showcase Your Expertise
                    </Text>
                    <Text style={[styles.benefitDescription, { color: colors.mutedForeground }]}>
                      Add verified skill badges to your profile
                    </Text>
                  </View>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <View style={styles.benefitText}>
                    <Text style={[styles.benefitLabel, { color: colors.foreground }]}>
                      Stand Out to Employers
                    </Text>
                    <Text style={[styles.benefitDescription, { color: colors.mutedForeground }]}>
                      Increase your visibility in job searches
                    </Text>
                  </View>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <View style={styles.benefitText}>
                    <Text style={[styles.benefitLabel, { color: colors.foreground }]}>
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
      </SafeAreaView>
    );
  }

  // Assessment Complete Screen
  if (assessmentComplete) {
    const scoreLevel = getScoreLevel();
    const percentage = getScorePercentage();
    const selectedSkillData = skills.find((s) => s.id === selectedSkill);

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => setSelectedSkill(null)} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Assessment Complete</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.resultsContent}>
          <Card style={[styles.resultsCard, { borderWidth: 2, borderColor: colors.border }]}>
            <CardContent style={styles.resultsCardContent}>
              <View style={[styles.trophyContainer, { backgroundColor: colors.primary }]}>
                <Ionicons name="trophy" size={48} color="#fff" />
              </View>

              <Text style={[styles.congratsTitle, { color: colors.foreground }]}>Congratulations!</Text>
              <Text style={[styles.congratsText, { color: colors.mutedForeground }]}>
                You\'ve completed the {selectedSkillData?.name} assessment
              </Text>

              <View style={styles.scoreDisplay}>
                <Text style={[styles.percentageText, { color: colors.primary }]}>{percentage}%</Text>
                <Badge
                  style={{
                    backgroundColor: scoreLevel.bgColor,
                    borderColor: scoreLevel.borderColor,
                    borderWidth: 1,
                  }}
                >
                  <Text style={{ color: scoreLevel.color, fontWeight: '600' }}>
                    {scoreLevel.level} Level
                  </Text>
                </Badge>
              </View>

              <View style={[styles.scoreBreakdown, { backgroundColor: colors.muted + '80' }]}>
                <Text style={[styles.scoreBreakdownLabel, { color: colors.mutedForeground }]}>
                  Your Score
                </Text>
                <Text style={[styles.scoreBreakdownValue, { color: colors.foreground }]}>
                  {score} / {currentAssessment.length}
                </Text>
                <ProgressBar value={percentage} height={8} />
              </View>

              <View style={[styles.badgeNotice, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="trending-up" size={20} color={colors.primary} />
                <View style={styles.badgeNoticeText}>
                  <Text style={[styles.badgeNoticeTitle, { color: colors.foreground }]}>
                    Badge Added
                  </Text>
                  <Text style={[styles.badgeNoticeDescription, { color: colors.mutedForeground }]}>
                    Your skill badge is now visible on your profile
                  </Text>
                </View>
              </View>

              <View style={styles.resultsButtons}>
                <Button
                  variant="outline"
                  onPress={() => setSelectedSkill(null)}
                  style={styles.resultButton}
                >
                  Take Another
                </Button>
                <Button
                  onPress={() => router.push('/(jobseeker)/profile')}
                  style={styles.resultButton}
                >
                  View Profile
                </Button>
              </View>
            </CardContent>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Question Screen
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.questionHeader}>
          <View style={styles.questionHeaderLeft}>
            <TouchableOpacity onPress={() => setSelectedSkill(null)} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.foreground} />
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
          <Badge variant="secondary">
            <Text style={{ fontWeight: '600' }}>
              Score: {score}/{currentAssessment.length}
            </Text>
          </Badge>
        </View>
        <View style={styles.progressContainer}>
          <ProgressBar
            value={((currentQuestionIndex + 1) / currentAssessment.length) * 100}
            height={8}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.questionCard, { borderWidth: 2, borderColor: colors.border }]}>
          <CardContent style={styles.questionCardContent}>
            <Text style={[styles.questionText, { color: colors.foreground }]}>
              {currentQuestion.question}
            </Text>

            <View style={styles.optionsList}>
              {currentQuestion.options.map((option, index) => {
                const isCorrect = index === currentQuestion.correctAnswer;
                const isSelected = selectedAnswer === index;
                const showCorrect = showExplanation && isCorrect;
                const showIncorrect = showExplanation && isSelected && !isCorrect;

                let borderColor = colors.border;
                let backgroundColor = colors.background;

                if (showCorrect) {
                  borderColor = '#22c55e';
                  backgroundColor = '#dcfce7';
                } else if (showIncorrect) {
                  borderColor = '#ef4444';
                  backgroundColor = '#fee2e2';
                } else if (isSelected) {
                  borderColor = colors.primary;
                  backgroundColor = colors.primary + '15';
                }

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleAnswerSelect(index)}
                    disabled={showExplanation}
                    style={[
                      styles.optionItem,
                      {
                        borderColor,
                        backgroundColor,
                        borderWidth: 2,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.radioButton,
                        {
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                        },
                      ]}
                    >
                      {isSelected && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={[styles.optionText, { color: colors.foreground, flex: 1 }]}>
                      {option}
                    </Text>
                    {showCorrect && (
                      <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {showExplanation && (
              <View style={[styles.explanationBox, { backgroundColor: colors.muted + '80' }]}>
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
            style={styles.actionButton}
          >
            Submit Answer
          </Button>
        ) : (
          <Button size="lg" onPress={handleNextQuestion} style={styles.actionButton}>
            {currentQuestionIndex < currentAssessment.length - 1 ? 'Next Question' : 'Finish Assessment'}
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
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
    gap: 16,
  },
  heroCard: {
    borderWidth: 2,
  },
  heroCardContent: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  skillsGrid: {
    gap: 16,
  },
  skillCardWrapper: {
    width: '100%',
  },
  skillCard: {
    borderWidth: 2,
  },
  skillCardContent: {
    gap: 12,
  },
  skillIcon: {
    fontSize: 48,
  },
  skillName: {
    fontSize: 20,
    fontWeight: '700',
  },
  skillDescription: {
    fontSize: 14,
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
    gap: 12,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  benefitText: {
    flex: 1,
  },
  benefitLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
  },
  resultsContent: {
    padding: 16,
    justifyContent: 'center',
  },
  resultsCard: {
    width: '100%',
  },
  resultsCardContent: {
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  trophyContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  congratsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  scoreDisplay: {
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  percentageText: {
    fontSize: 48,
    fontWeight: '700',
  },
  scoreBreakdown: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  scoreBreakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreBreakdownValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  badgeNotice: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  badgeNoticeText: {
    flex: 1,
  },
  badgeNoticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  badgeNoticeDescription: {
    fontSize: 14,
  },
  resultsButtons: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  resultButton: {
    flex: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  progressContainer: {
    marginTop: 12,
  },
  questionCard: {
    width: '100%',
  },
  questionCardContent: {
    gap: 24,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
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
  optionText: {
    fontSize: 16,
  },
  explanationBox: {
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    width: '100%',
  },
});
