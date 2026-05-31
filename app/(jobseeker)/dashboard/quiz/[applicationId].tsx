import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Colors } from '@/constants/theme'
import { invalidateCache } from '@/lib/query-client'
import {
  applicationsApi,
  type Answer,
  type ApplyQuiz,
  type QuizSubmitResponse,
} from '@/services/api'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const QUIZ_DURATION_SECONDS = 600

type AnswerMap = Record<number, { selected_option?: number; text_answer?: string }>

// Dashboard copy of the quiz-taking screen. Differs from the swipe-flow version
// in that it (1) fetches the quiz by applicationId rather than reading it from
// route params, (2) supports a result-only mode for already-completed quizzes
// (via a `score` param), and (3) returns to the Quiz History screen on finish.
export default function DashboardQuizScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ applicationId?: string; jobTitle?: string; score?: string }>()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const insets = useSafeAreaInsets()

  const applicationId = useMemo(() => Number(params.applicationId), [params.applicationId])
  const jobTitle = (params.jobTitle as string) || 'Quiz'
  // When present, this quiz was already completed — show a result-only view.
  const completedScore = params.score != null ? Number(params.score) : null
  const isCompletedMode = completedScore != null && !Number.isNaN(completedScore)

  const [quiz, setQuiz] = useState<ApplyQuiz | null>(null)
  const [quizLoading, setQuizLoading] = useState(true)
  const [quizError, setQuizError] = useState<string | null>(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<QuizSubmitResponse | null>(null)
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION_SECONDS)
  const submittedRef = useRef(false)

  const questions = quiz?.questions ?? []
  const totalQuestions = questions.length

  // Fetch the quiz for this application (needed both to take a pending quiz and
  // to show the passing score on a completed one).
  const loadQuiz = useCallback(async () => {
    if (!applicationId || Number.isNaN(applicationId)) {
      setQuizLoading(false)
      setQuizError('Missing application.')
      return
    }
    setQuizLoading(true)
    setQuizError(null)
    try {
      const data = await applicationsApi.getApplicationQuiz(applicationId)
      setQuiz(data)
    } catch (err: any) {
      setQuizError(err?.message || 'Could not load the quiz.')
    } finally {
      setQuizLoading(false)
    }
  }, [applicationId])

  useEffect(() => {
    loadQuiz()
  }, [loadQuiz])

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current || !quiz) return
    submittedRef.current = true
    setIsSubmitting(true)

    const payload: Answer[] = questions.map((q) => {
      const entry = answers[q.id] || {}
      return {
        question_id: q.id,
        ...(q.question_type === 'multiple-choice'
          ? { selected_option: entry.selected_option }
          : { text_answer: entry.text_answer || '' }),
      }
    })

    try {
      const res = await applicationsApi.submitQuiz(applicationId, payload)
      setResult(res)
      // Quiz completed — refresh both the dashboard applications list and the
      // quiz history so the entry moves to "completed" with its score.
      invalidateCache.applications()
      invalidateCache.quizHistory()
    } catch (err: any) {
      submittedRef.current = false
      Alert.alert('Submission Failed', err?.message ?? 'Could not submit the quiz.')
    } finally {
      setIsSubmitting(false)
    }
  }, [answers, applicationId, questions, quiz])

  // Countdown timer (taking mode only).
  useEffect(() => {
    if (isCompletedMode || result || isSubmitting || !quiz) return
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [isCompletedMode, result, isSubmitting, quiz, handleSubmit])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const r = s % 60
    return `${m}:${r.toString().padStart(2, '0')}`
  }

  const setMcqAnswer = (qId: number, option: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: { selected_option: option } }))
  }
  const setTextAnswer = (qId: number, text: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: { text_answer: text } }))
  }

  const goToHistory = () => router.replace('/(jobseeker)/dashboard/quiz-history' as any)

  // ── Loading the quiz ──────────────────────────────────────────────────────
  if (quizLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    )
  }

  if (quizError || !quiz) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>Quiz unavailable</Text>
          <Text style={[styles.errorSubtitle, { color: colors.mutedForeground }]}>
            {quizError || 'Missing or invalid quiz data.'}
          </Text>
          <Button onPress={goToHistory} style={{ marginTop: 16 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Back to Quiz History</Text>
          </Button>
        </View>
      </View>
    )
  }

  // ── RESULT SCREEN (just submitted, or result-only for a completed quiz) ────
  const showResult = result || isCompletedMode
  if (showResult) {
    const score = result ? result.score : (completedScore as number)
    const passingScore = result ? result.passing_score : quiz.passing_score
    const passed = score >= passingScore
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.resultContent}>
          <View style={styles.resultHeader}>
            <View
              style={[
                styles.resultIconWrap,
                { backgroundColor: passed ? '#10b9811A' : '#ef44441A' },
              ]}
            >
              <Ionicons
                name={passed ? 'checkmark-circle' : 'close-circle'}
                size={48}
                color={passed ? '#10b981' : '#ef4444'}
              />
            </View>
            <Text style={[styles.scoreBig, { color: colors.foreground }]}>{score}%</Text>
            <Text style={[styles.passedLabel, { color: passed ? '#10b981' : '#ef4444' }]}>
              {passed ? 'Passed ✓' : 'Not passed'}
            </Text>
            <Text style={[styles.passingHint, { color: colors.mutedForeground }]}>
              Passing score was {passingScore}%
            </Text>
          </View>

          {!!result?.cover_letter && (
            <Card style={[styles.coverCard, { backgroundColor: colors.card }]}>
              <CardContent>
                <Text style={[styles.feedbackTitle, { color: colors.foreground }]}>Your Cover Letter</Text>
                <Text style={[styles.coverText, { color: colors.foreground }]}>{result.cover_letter}</Text>
              </CardContent>
            </Card>
          )}

          {!!result && result.feedback.length > 0 && (
            <Card style={[styles.coverCard, { backgroundColor: colors.card }]}>
              <CardContent>
                <Text style={[styles.feedbackTitle, { color: colors.foreground }]}>
                  AI Feedback on Text Answers
                </Text>
                {result.feedback.map((f) => (
                  <Text key={f.question_id} style={[styles.feedbackItem, { color: colors.mutedForeground }]}>
                    • {f.feedback}
                  </Text>
                ))}
              </CardContent>
            </Card>
          )}

          <Button onPress={goToHistory} style={[styles.doneButton, { backgroundColor: colors.primary }]}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Back to Quiz History</Text>
          </Button>
        </ScrollView>
      </View>
    )
  }

  // ── QUIZ TAKING SCREEN ─────────────────────────────────────────────────────
  const currentQ = questions[currentIndex]
  if (!currentQ) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.center}>
          <Text style={[styles.errorSubtitle, { color: colors.mutedForeground }]}>This quiz has no questions.</Text>
          <Button onPress={goToHistory} style={{ marginTop: 16 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Back to Quiz History</Text>
          </Button>
        </View>
      </View>
    )
  }
  const currentAnswer = answers[currentQ.id] || {}
  const answeredCurrent =
    currentQ.question_type === 'multiple-choice'
      ? typeof currentAnswer.selected_option === 'number'
      : !!(currentAnswer.text_answer && currentAnswer.text_answer.trim().length > 0)

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={goToHistory} disabled={isSubmitting} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {jobTitle}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            Question {currentIndex + 1} of {totalQuestions}
          </Text>
        </View>
        <View style={styles.timer}>
          <Ionicons name="time-outline" size={16} color={timeLeft < 60 ? '#ef4444' : colors.foreground} />
          <Text style={[styles.timerText, { color: timeLeft < 60 ? '#ef4444' : colors.foreground }]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Card style={[styles.questionCard, { backgroundColor: colors.card }]}>
          <CardContent>
            <Text style={[styles.questionText, { color: colors.foreground }]}>{currentQ.question}</Text>
            <Text style={[styles.pointsText, { color: colors.mutedForeground }]}>{currentQ.points} points</Text>

            {currentQ.question_type === 'multiple-choice' ? (
              <View style={{ marginTop: 16 }}>
                {currentQ.options.map((opt, idx) => {
                  const selected = currentAnswer.selected_option === idx
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setMcqAnswer(currentQ.id, idx)}
                      style={[
                        styles.optionRow,
                        {
                          borderColor: selected ? colors.primary : colors.border,
                          backgroundColor: selected ? colors.primary + '15' : 'transparent',
                        },
                      ]}
                    >
                      <View style={[styles.radioOuter, { borderColor: selected ? colors.primary : colors.border }]}>
                        {selected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                      </View>
                      <Text style={[styles.optionLabel, { color: colors.foreground }]}>{opt}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            ) : (
              <TextInput
                value={currentAnswer.text_answer || ''}
                onChangeText={(t) => setTextAnswer(currentQ.id, t)}
                placeholder="Type your answer here..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                style={[
                  styles.textAnswer,
                  { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
                ]}
              />
            )}
          </CardContent>
        </Card>

        <View style={styles.navRow}>
          <Button
            variant="outline"
            disabled={currentIndex === 0 || isSubmitting}
            onPress={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            style={styles.navButton}
          >
            <Text style={{ color: colors.foreground }}>Previous</Text>
          </Button>

          {currentIndex === totalQuestions - 1 ? (
            <Button
              onPress={handleSubmit}
              disabled={!answeredCurrent || isSubmitting}
              style={[styles.navButton, { backgroundColor: colors.primary }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700' }}>Submit Quiz</Text>
              )}
            </Button>
          ) : (
            <Button
              onPress={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
              disabled={!answeredCurrent || isSubmitting}
              style={[styles.navButton, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Next</Text>
            </Button>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  errorTitle: { fontSize: 20, fontWeight: '700' },
  errorSubtitle: { fontSize: 14, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: { fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  progressBar: { height: 4, width: '100%' },
  progressFill: { height: '100%' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  questionCard: { marginBottom: 16 },
  questionText: { fontSize: 18, fontWeight: '700', lineHeight: 25 },
  pointsText: { fontSize: 12, marginTop: 4 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 2,
    borderRadius: 12,
    marginBottom: 10,
  },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  optionLabel: { flex: 1, fontSize: 14 },
  textAnswer: {
    minHeight: 100,
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginTop: 16,
  },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  navButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resultContent: { padding: 20, paddingBottom: 40 },
  resultHeader: { alignItems: 'center', marginBottom: 24, marginTop: 16 },
  resultIconWrap: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  scoreBig: { fontSize: 56, fontWeight: '800', letterSpacing: -1 },
  passedLabel: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  passingHint: { fontSize: 13, marginTop: 8 },
  coverCard: { marginBottom: 12 },
  coverText: { fontSize: 13, lineHeight: 19, marginTop: 12 },
  feedbackTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  feedbackItem: { fontSize: 13, lineHeight: 19, marginBottom: 4 },
  doneButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
})
