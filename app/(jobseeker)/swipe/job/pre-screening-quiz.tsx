import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ThemedModal, type ThemedAlertConfig } from '@/components/ui/themed-modal'
import { Colors } from '@/constants/theme'
import { invalidateCache } from '@/lib/query-client'
import {
  applicationsApi,
  type Answer,
  type ApplyQuiz,
  type QuizSubmitResponse,
  type SkillMatch,
} from '@/services/api'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
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

export default function PreScreeningQuizScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    applicationId?: string
    jobTitle?: string
    quizData?: string
    skillMatch?: string
  }>()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const insets = useSafeAreaInsets()

  const applicationId = useMemo(() => Number(params.applicationId), [params.applicationId])
  const jobTitle = (params.jobTitle as string) || 'Pre-Screening Quiz'

  const quiz: ApplyQuiz | null = useMemo(() => {
    if (!params.quizData) return null
    try {
      return JSON.parse(String(params.quizData)) as ApplyQuiz
    } catch {
      return null
    }
  }, [params.quizData])

  const skillMatch: SkillMatch | null = useMemo(() => {
    if (!params.skillMatch) return null
    try {
      return JSON.parse(String(params.skillMatch)) as SkillMatch
    } catch {
      return null
    }
  }, [params.skillMatch])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<QuizSubmitResponse | null>(null)
  const [coverLetterExpanded, setCoverLetterExpanded] = useState(false)
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION_SECONDS)
  const [alertConfig, setAlertConfig] = useState<ThemedAlertConfig | null>(null)
  const submittedRef = useRef(false)

  const questions = quiz?.questions ?? []
  const totalQuestions = questions.length

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
      // Quiz result may change the application's status — refresh the dashboard.
      invalidateCache.applications()
    } catch (err: any) {
      submittedRef.current = false
      setAlertConfig({
        title: 'Submission Failed',
        message: err?.message ?? 'Could not submit the quiz.',
        buttons: [{ label: 'OK' }],
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [answers, applicationId, questions, quiz])

  // Countdown timer
  useEffect(() => {
    if (result || isSubmitting || !quiz) return
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
  }, [result, isSubmitting, quiz, handleSubmit])

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

  // ── Bad params or no quiz ─────────────────────────────────────────────────
  if (!quiz || !applicationId || Number.isNaN(applicationId)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>Quiz unavailable</Text>
          <Text style={[styles.errorSubtitle, { color: colors.mutedForeground }]}>
            Missing or invalid quiz data.
          </Text>
          <Button onPress={() => router.replace('/(jobseeker)/swipe' as any)} style={{ marginTop: 16 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Back to Swipe</Text>
          </Button>
        </View>
      </View>
    )
  }

  // ── RESULT SCREEN ────────────────────────────────────────────────────────
  if (result) {
    const passed = result.passed
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
            <Text style={[styles.scoreBig, { color: colors.foreground }]}>{result.score}%</Text>
            <Text style={[styles.passedLabel, { color: passed ? '#10b981' : '#ef4444' }]}>
              {passed ? 'Passed ✓' : 'Not passed'}
            </Text>
            <Text style={[styles.passingHint, { color: colors.mutedForeground }]}>
              Passing score was {result.passing_score}%
            </Text>
          </View>

          {skillMatch && !skillMatch.matched && (
            <View style={[styles.warningBanner, { backgroundColor: '#fbbf241A', borderColor: '#fbbf24' }]}>
              <Text style={[styles.warningText, { color: '#92400e' }]}>⚠️ {skillMatch.message}</Text>
            </View>
          )}

          {!!result.cover_letter && (
            <Card style={[styles.coverCard, { backgroundColor: colors.card }]}>
              <CardContent>
                <TouchableOpacity
                  onPress={() => setCoverLetterExpanded((v) => !v)}
                  style={styles.coverToggle}
                >
                  <Ionicons
                    name={coverLetterExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.foreground}
                  />
                  <Text style={[styles.coverToggleText, { color: colors.foreground }]}>
                    Your Cover Letter
                  </Text>
                </TouchableOpacity>
                {coverLetterExpanded && (
                  <Text style={[styles.coverText, { color: colors.foreground }]}>
                    {result.cover_letter}
                  </Text>
                )}
              </CardContent>
            </Card>
          )}

          {result.feedback.length > 0 && (
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

          <Button
            onPress={() => router.replace('/(jobseeker)/swipe' as any)}
            style={[styles.doneButton, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Done</Text>
          </Button>
        </ScrollView>
      </View>
    )
  }

  // ── QUIZ TAKING SCREEN ───────────────────────────────────────────────────
  const currentQ = questions[currentIndex]
  const currentAnswer = answers[currentQ.id] || {}
  const answeredCurrent =
    currentQ.question_type === 'multiple-choice'
      ? typeof currentAnswer.selected_option === 'number'
      : !!(currentAnswer.text_answer && currentAnswer.text_answer.trim().length > 0)

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} disabled={isSubmitting} hitSlop={8}>
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
        {skillMatch && !skillMatch.matched && (
          <View style={[styles.warningBanner, { backgroundColor: '#fbbf241A', borderColor: '#fbbf24' }]}>
            <Text style={[styles.warningText, { color: '#92400e' }]}>⚠️ {skillMatch.message}</Text>
          </View>
        )}

        <Card style={[styles.questionCard, { backgroundColor: colors.card }]}>
          <CardContent>
            <Text style={[styles.questionText, { color: colors.foreground }]}>
              {currentQ.question}
            </Text>
            <Text style={[styles.pointsText, { color: colors.mutedForeground }]}>
              {currentQ.points} points
            </Text>

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
                      <View
                        style={[
                          styles.radioOuter,
                          { borderColor: selected ? colors.primary : colors.border },
                        ]}
                      >
                        {selected && (
                          <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                        )}
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
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
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

      <ThemedModal
        visible={!!alertConfig}
        title={alertConfig?.title ?? ''}
        message={alertConfig?.message ?? ''}
        buttons={alertConfig?.buttons ?? []}
        onRequestClose={() => setAlertConfig(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: { fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  progressBar: { height: 4, width: '100%' },
  progressFill: { height: '100%' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  warningBanner: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  warningText: { fontSize: 13, fontWeight: '600' },
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
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: { padding: 20, paddingBottom: 40 },
  resultHeader: { alignItems: 'center', marginBottom: 24, marginTop: 16 },
  resultIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreBig: { fontSize: 56, fontWeight: '800', letterSpacing: -1 },
  passedLabel: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  passingHint: { fontSize: 13, marginTop: 8 },
  coverCard: { marginBottom: 12 },
  coverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  coverToggleText: { fontSize: 15, fontWeight: '700' },
  coverText: { fontSize: 13, lineHeight: 19, marginTop: 12 },
  feedbackTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  feedbackItem: { fontSize: 13, lineHeight: 19, marginBottom: 4 },
  doneButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
})
