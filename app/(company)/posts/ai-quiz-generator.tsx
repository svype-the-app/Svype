import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Colors } from '@/constants/theme'
import { getPostJobDraft } from '@/lib/post-job-draft'
import { setPostJobQuizDraft, type QuizQuestionDraft } from '@/lib/post-job-quiz-draft'
import {
  aiQuizApi,
  type AIQuizDifficulty,
  type AIQuizGeneratedQuestion,
  type AIQuizQuestionTypesOption,
} from '@/services/api'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
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
import { SafeAreaView } from 'react-native-safe-area-context'

const NUM_MIN = 5
const NUM_MAX = 20
const TIME_MIN = 5
const TIME_MAX = 60

const QUESTION_TYPE_OPTIONS: { label: string; value: AIQuizQuestionTypesOption }[] = [
  { label: 'Multiple Choice', value: 'multiple-choice' },
  { label: 'Text Answers', value: 'text' },
  { label: 'Mixed', value: 'mixed' },
]

const DIFFICULTY_OPTIONS: { label: string; value: AIQuizDifficulty }[] = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
  { label: 'Mixed', value: 'mixed' },
]

type EditableQuestion = AIQuizGeneratedQuestion

function clampInt(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

export default function AIQuizGeneratorScreen() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const [step, setStep] = useState<'form' | 'review'>('form')
  const [loading, setLoading] = useState(false)

  // Form state
  const [numQuestions, setNumQuestions] = useState(10)
  const [timeLimit, setTimeLimit] = useState(15)
  const [questionTypes, setQuestionTypes] = useState<AIQuizQuestionTypesOption>('multiple-choice')
  const [difficulty, setDifficulty] = useState<AIQuizDifficulty>('medium')

  // Review state
  const [quizTitle, setQuizTitle] = useState('')
  const [passingScore, setPassingScore] = useState(70)
  const [questions, setQuestions] = useState<EditableQuestion[]>([])

  const handleGenerate = async () => {
    const draft = getPostJobDraft()
    const title = draft.formData.title.trim()
    const description = draft.formData.description.trim()

    if (!title || !description) {
      Alert.alert(
        'Job Details Required',
        'Please fill in your job title and description before generating a quiz.'
      )
      return
    }

    setLoading(true)
    try {
      const result = await aiQuizApi.generate({
        job_title: title,
        job_description: description,
        requirements: draft.requirements.filter((r) => r.trim().length > 0),
        num_questions: numQuestions,
        time_limit_minutes: timeLimit,
        question_types: questionTypes,
        difficulty,
      })
      setQuizTitle(result.title)
      setPassingScore(result.passing_score)
      setQuestions(result.questions)
      setStep('review')
    } catch (error: any) {
      Alert.alert('Generation Failed', error?.message ?? 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const updateQuestionField = <K extends keyof EditableQuestion>(
    index: number,
    key: K,
    value: EditableQuestion[K]
  ) => {
    setQuestions((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [key]: value }
      return next
    })
  }

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions((prev) => {
      const next = [...prev]
      const opts = [...next[qIndex].options]
      opts[optIndex] = value
      next[qIndex] = { ...next[qIndex], options: opts }
      return next
    })
  }

  const setCorrectOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev]
      next[qIndex] = { ...next[qIndex], correct_option_index: optIndex }
      return next
    })
  }

  const handleConfirm = () => {
    const mapped: QuizQuestionDraft[] = questions.map((q) => ({
      id: Math.random().toString(36).slice(2),
      type: q.type,
      question: q.question.trim(),
      options: q.type === 'multiple-choice' ? q.options.map((o) => o.trim()) : [],
      correctAnswer: q.correct_option_index ?? 0,
      points: q.points,
    }))
    setPostJobQuizDraft({ questions: mapped, confirmed: true })
    router.back()
  }

  const reviewSummary = useMemo(() => {
    return `${questions.length} questions · ${timeLimit} min`
  }, [questions.length, timeLimit])

  // ─── FORM STEP ────────────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Generate Quiz with AI</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Number of questions */}
            <View style={styles.fieldGroup}>
              <Label>Number of Questions</Label>
              <Stepper
                value={numQuestions}
                onChange={(v) => setNumQuestions(clampInt(v, NUM_MIN, NUM_MAX))}
                min={NUM_MIN}
                max={NUM_MAX}
                colors={colors}
              />
              <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
                Between {NUM_MIN} and {NUM_MAX}
              </Text>
            </View>

            {/* Time limit */}
            <View style={styles.fieldGroup}>
              <Label>Time Limit (minutes)</Label>
              <Stepper
                value={timeLimit}
                onChange={(v) => setTimeLimit(clampInt(v, TIME_MIN, TIME_MAX))}
                min={TIME_MIN}
                max={TIME_MAX}
                colors={colors}
              />
              <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
                Between {TIME_MIN} and {TIME_MAX} minutes
              </Text>
            </View>

            {/* Question Types */}
            <View style={styles.fieldGroup}>
              <Label>Question Types</Label>
              <View style={styles.pillRow}>
                {QUESTION_TYPE_OPTIONS.map((opt) => {
                  const selected = questionTypes === opt.value
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setQuestionTypes(opt.value)}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: selected ? colors.primary : colors.secondary,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: selected ? '#fff' : colors.foreground,
                          fontWeight: '600',
                          fontSize: 13,
                        }}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* Difficulty */}
            <View style={styles.fieldGroup}>
              <Label>Difficulty Level</Label>
              <View style={styles.pillRow}>
                {DIFFICULTY_OPTIONS.map((opt) => {
                  const selected = difficulty === opt.value
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setDifficulty(opt.value)}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: selected ? colors.primary : colors.secondary,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: selected ? '#fff' : colors.foreground,
                          fontWeight: '600',
                          fontSize: 13,
                        }}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </Card>

          {/* Info box */}
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: colors.primary + '15',
                borderColor: colors.primary + '30',
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
              style={{ marginRight: 8, marginTop: 1 }}
            />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              The quiz will be tailored to the job you&apos;re posting. Make sure your job title
              and description are filled in first.
            </Text>
          </View>

          {/* Generate button */}
          <Button
            onPress={handleGenerate}
            disabled={loading}
            style={[
              styles.generateButton,
              { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 },
            ]}
          >
            {loading ? (
              <View style={styles.buttonInner}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.generateButtonText}>Generating...</Text>
              </View>
            ) : (
              <View style={styles.buttonInner}>
                <Ionicons name="sparkles" size={18} color="#fff" />
                <Text style={styles.generateButtonText}>Generate Quiz</Text>
              </View>
            )}
          </Button>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ─── REVIEW STEP ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setStep('form')} hitSlop={8}>
          <Ionicons name="chevron-back" size={28} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Review Quiz</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Summary card */}
        <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.fieldGroup}>
            <Label>Quiz Title</Label>
            <Input value={quizTitle} onChangeText={setQuizTitle} placeholder="e.g. Frontend Engineer Pre-Screening" />
          </View>

          <View style={styles.fieldGroup}>
            <Label>Passing Score (%)</Label>
            <Input
              value={String(passingScore)}
              onChangeText={(t) => setPassingScore(clampInt(parseInt(t, 10), 0, 100))}
              keyboardType="number-pad"
            />
          </View>

          <Text style={[styles.summaryRow, { color: colors.mutedForeground }]}>{reviewSummary}</Text>
        </Card>

        {/* Question list */}
        {questions.map((q, qIndex) => {
          const isMCQ = q.type === 'multiple-choice'
          const typeChipBg = isMCQ ? '#3b82f6' + '20' : '#7c3aed' + '20'
          const typeChipColor = isMCQ ? '#3b82f6' : '#7c3aed'
          return (
            <Card
              key={qIndex}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.qHeader}>
                <View style={[styles.qBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.qBadgeText}>Q{qIndex + 1}</Text>
                </View>
                <View style={[styles.typeChip, { backgroundColor: typeChipBg }]}>
                  <Text style={[styles.typeChipText, { color: typeChipColor }]}>
                    {isMCQ ? 'Multiple Choice' : 'Text'}
                  </Text>
                </View>
              </View>

              <TextInput
                value={q.question}
                onChangeText={(t) => updateQuestionField(qIndex, 'question', t)}
                multiline
                placeholder="Question text"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.questionInput,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              />

              {isMCQ && (
                <View style={{ marginTop: 8 }}>
                  {q.options.map((opt, optIndex) => {
                    const isCorrect = q.correct_option_index === optIndex
                    return (
                      <View key={optIndex} style={styles.optionRow}>
                        <TouchableOpacity
                          onPress={() => setCorrectOption(qIndex, optIndex)}
                          style={[
                            styles.radioOuter,
                            { borderColor: isCorrect ? colors.primary : colors.border },
                          ]}
                          hitSlop={6}
                        >
                          {isCorrect && (
                            <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                          )}
                        </TouchableOpacity>
                        <TextInput
                          value={opt}
                          onChangeText={(t) => updateOption(qIndex, optIndex, t)}
                          placeholder={`Option ${optIndex + 1}`}
                          placeholderTextColor={colors.mutedForeground}
                          style={[
                            styles.optionInput,
                            {
                              color: colors.foreground,
                              borderColor: colors.border,
                              backgroundColor: colors.background,
                            },
                          ]}
                        />
                      </View>
                    )
                  })}
                </View>
              )}

              <View style={styles.pointsRow}>
                <Label style={{ marginBottom: 0, marginRight: 8 }}>Points:</Label>
                <TextInput
                  value={String(q.points)}
                  onChangeText={(t) =>
                    updateQuestionField(qIndex, 'points', clampInt(parseInt(t, 10), 1, 100))
                  }
                  keyboardType="number-pad"
                  style={[
                    styles.pointsInput,
                    {
                      color: colors.foreground,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                />
              </View>

              {q.explanation ? (
                <Text style={[styles.explanationText, { color: colors.mutedForeground }]}>
                  {q.explanation}
                </Text>
              ) : null}
            </Card>
          )
        })}
      </ScrollView>

      {/* Sticky bottom bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: 16,
          },
        ]}
      >
        <Button
          variant="outline"
          onPress={() => setStep('form')}
          style={[styles.regenerateButton, { borderColor: colors.primary }]}
          textStyle={{ color: colors.primary }}
        >
          Regenerate
        </Button>
        <Button
          onPress={handleConfirm}
          style={[styles.confirmButton, { backgroundColor: colors.primary }]}
        >
          <View style={styles.buttonInner}>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.generateButtonText}>Confirm Quiz</Text>
          </View>
        </Button>
      </View>
    </SafeAreaView>
  )
}

// ─── Stepper sub-component ──────────────────────────────────────────────────
function Stepper({
  value,
  onChange,
  min,
  max,
  colors,
}: {
  value: number
  onChange: (next: number) => void
  min: number
  max: number
  colors: ReturnType<typeof Colors.light extends infer T ? () => T : never> | typeof Colors.light
}) {
  return (
    <View style={styles.stepperRow}>
      <TouchableOpacity
        onPress={() => onChange(value - 1)}
        disabled={value <= min}
        style={[
          styles.stepperButton,
          {
            borderColor: colors.border,
            opacity: value <= min ? 0.4 : 1,
          },
        ]}
      >
        <Ionicons name="remove" size={18} color={colors.foreground} />
      </TouchableOpacity>
      <Input
        value={String(value)}
        onChangeText={(t) => {
          const parsed = parseInt(t, 10)
          if (!Number.isNaN(parsed)) onChange(parsed)
        }}
        keyboardType="number-pad"
        style={styles.stepperInput}
      />
      <TouchableOpacity
        onPress={() => onChange(value + 1)}
        disabled={value >= max}
        style={[
          styles.stepperButton,
          {
            borderColor: colors.border,
            opacity: value >= max ? 0.4 : 1,
          },
        ]}
      >
        <Ionicons name="add" size={18} color={colors.foreground} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldHint: {
    fontSize: 12,
    marginTop: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperInput: {
    flex: 1,
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  generateButton: {
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  // Review styles
  summaryRow: {
    fontSize: 13,
    marginTop: 4,
  },
  qHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  qBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  questionInput: {
    minHeight: 60,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  pointsInput: {
    width: 64,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  explanationText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  regenerateButton: {
    flex: 0.4,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  confirmButton: {
    flex: 0.55,
    paddingVertical: 14,
    borderRadius: 12,
  },
})
