import { useEffect, useMemo, useState } from 'react'
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Colors } from '@/constants/theme'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getPostJobQuizDraft, setPostJobQuizDraft } from '@/lib/post-job-quiz-draft'

interface Question {
  id: string
  type: 'multiple-choice' | 'text'
  question: string
  options: string[]
  correctAnswer: number
  points: number
}

const createEmptyQuestion = (): Question => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
  type: 'multiple-choice',
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  points: 10,
})

export default function AddQuizQuestionsScreen() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const [questions, setQuestions] = useState<Question[]>([createEmptyQuestion()])
  const [typeModal, setTypeModal] = useState(false)
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)
  const [isQuizConfirmed, setIsQuizConfirmed] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const questionTypes: Array<'multiple-choice' | 'text'> = ['multiple-choice', 'text']

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true)
    }

    const draft = getPostJobQuizDraft()
    if (draft.questions.length > 0) {
      setQuestions(draft.questions)
    }
    setIsQuizConfirmed(draft.confirmed)
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    setPostJobQuizDraft({
      questions,
      confirmed: isQuizConfirmed,
    })
  }, [questions, isQuizConfirmed, isHydrated])

  const validateQuestion = (question: Question): string | null => {
    if (!question.question.trim()) {
      return 'Please enter question text before adding the next question.'
    }

    if (question.type === 'multiple-choice') {
      const filledOptions = (question.options || []).filter((opt) => opt.trim())
      if (filledOptions.length < 2) {
        return 'Each multiple choice question needs at least 2 options.'
      }
    }

    return null
  }

  const updateQuestion = (id: string, patch: Partial<Question>) => {
    setIsQuizConfirmed(false)
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  }

  const handleAddAnotherQuestion = () => {
    const latest = questions[questions.length - 1]
    const validationError = validateQuestion(latest)
    if (validationError) {
      Alert.alert('Incomplete Question', validationError)
      return
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setIsQuizConfirmed(false)
    setQuestions((prev) => [...prev, createEmptyQuestion()])
  }

  const handleRemoveQuestion = (id: string) => {
    if (questions.length === 1) {
      Alert.alert('Required', 'At least one question box is required.')
      return
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setIsQuizConfirmed(false)
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const handleOptionChange = (questionId: string, index: number, value: string) => {
    setIsQuizConfirmed(false)
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q
        const newOptions = [...(q.options || ['', '', '', ''])]
        newOptions[index] = value
        return { ...q, options: newOptions }
      })
    )
  }

  const canConfirm = useMemo(() => questions.length >= 5, [questions.length])

  const handleConfirmQuiz = () => {
    if (questions.length < 5) {
      Alert.alert('Minimum Questions', 'Please add at least 5 questions to confirm this quiz.')
      return
    }

    for (let i = 0; i < questions.length; i += 1) {
      const error = validateQuestion(questions[i])
      if (error) {
        Alert.alert('Incomplete Quiz', `Question ${i + 1}: ${error}`)
        return
      }
    }

    setIsQuizConfirmed(true)
    setPostJobQuizDraft({
      questions,
      confirmed: true,
    })

    Alert.alert('Quiz Confirmed', `${questions.length} question(s) linked to this job draft.`, [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ])
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Quiz Questions</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>Minimum 5 questions required</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Card
            style={[
              styles.infoBanner,
              { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' },
            ]}
          >
            <View style={styles.infoBannerContent}>
              <Ionicons name="help-circle" size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.infoBannerTitle, { color: colors.foreground }]}>Quiz Best Practices</Text>
                <Text style={[styles.infoBannerText, { color: colors.mutedForeground }]}> 
                  • Keep questions relevant to the job{"\n"}
                  • Minimum 5 questions required{"\n"}
                  • Mix difficulty levels{"\n"}
                  • Set passing score at 60-70%
                </Text>
              </View>
            </View>
          </Card>

          <View style={styles.questionsHeader}>
            <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Quiz Questions</Text>
            <View style={[styles.pointsBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                {questions.length} questions • {totalPoints} pts
              </Text>
            </View>
          </View>

          <Text style={[styles.helperText, { color: colors.mutedForeground }]}> 
            Add another question from the latest card. Confirm appears after 5 questions.
          </Text>

          <View style={styles.questionsList}>
            {questions.map((q, index) => {
              const isLatest = index === questions.length - 1
              return (
                <Card key={q.id} style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.cardTitle, { color: colors.cardForeground, marginLeft: 10 }]}>Question {index + 1}</Text>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity onPress={() => handleRemoveQuestion(q.id)} style={styles.deleteButton}>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.fieldGroup}>
                      <Label>Question Type</Label>
                      <TouchableOpacity
                        onPress={() => {
                          setActiveQuestionId(q.id)
                          setTypeModal(true)
                        }}
                        style={[styles.selectButton, { borderColor: colors.border }]}
                      >
                        <Text style={{ color: colors.foreground, fontSize: 14 }}>
                          {q.type === 'multiple-choice' ? 'Multiple Choice' : 'Text Answer'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Label>Question</Label>
                      <Textarea
                        placeholder="Enter your question..."
                        value={q.question}
                        onChangeText={(text) => updateQuestion(q.id, { question: text })}
                        style={[styles.textarea, { borderColor: colors.border, color: colors.foreground }]}
                        placeholderTextColor={colors.mutedForeground}
                        numberOfLines={3}
                      />
                    </View>

                    {q.type === 'multiple-choice' && (
                      <View style={styles.fieldGroup}>
                        <Label>Answer Options</Label>
                        <View style={styles.optionsContainer}>
                          {(q.options || ['', '', '', '']).map((option, optIndex) => (
                            <View key={`${q.id}-${optIndex}`} style={styles.optionRow}>
                              <TouchableOpacity
                                onPress={() => updateQuestion(q.id, { correctAnswer: optIndex })}
                                style={[
                                  styles.radioButton,
                                  {
                                    borderColor: colors.border,
                                    backgroundColor: q.correctAnswer === optIndex ? colors.primary : 'transparent',
                                  },
                                ]}
                              >
                                {q.correctAnswer === optIndex && (
                                  <Ionicons name="checkmark" size={16} color="#fff" />
                                )}
                              </TouchableOpacity>
                              <Input
                                placeholder={`Option ${optIndex + 1}`}
                                value={option}
                                onChangeText={(text) => handleOptionChange(q.id, optIndex, text)}
                                style={[styles.optionInput, { borderColor: colors.border, color: colors.foreground }]}
                                placeholderTextColor={colors.mutedForeground}
                              />
                              {q.correctAnswer === optIndex && (
                                <Text style={[styles.correctLabel, { color: colors.primary }]}>Correct</Text>
                              )}
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    <View style={styles.fieldGroup}>
                      <Label>Points</Label>
                      <Input
                        placeholder="10"
                        value={String(q.points)}
                        onChangeText={(text) => updateQuestion(q.id, { points: parseInt(text, 10) || 10 })}
                        keyboardType="number-pad"
                        style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                        placeholderTextColor={colors.mutedForeground}
                      />
                    </View>

                    {isLatest && (
                      <View style={styles.buttonRow}>
                        <Button onPress={handleAddAnotherQuestion} style={[styles.button, { backgroundColor: colors.primary }]}>
                          <Ionicons name="add" size={18} color="#fff" />
                          <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>Add Another Question</Text>
                        </Button>

                        {canConfirm && (
                          <Button onPress={handleConfirmQuiz} style={[styles.button, { backgroundColor: '#2563eb' }]}>
                            <Ionicons name="checkmark-circle" size={18} color="#fff" />
                            <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>Confirm Quiz</Text>
                          </Button>
                        )}
                      </View>
                    )}
                  </View>
                </Card>
              )
            })}
          </View>

          <Button
            onPress={() => router.back()}
            style={[
              styles.cancelOnlyButton,
              { borderColor: colors.border, borderWidth: 1, backgroundColor: 'transparent' },
            ]}
          >
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>Back to Post Job</Text>
          </Button>
        </View>
      </ScrollView>

      <Modal
        visible={typeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setTypeModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Select Question Type
            </Text>
            <TouchableOpacity onPress={() => setTypeModal(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={questionTypes}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  if (activeQuestionId) {
                    updateQuestion(activeQuestionId, {
                      type: item,
                      options: item === 'multiple-choice' ? ['', '', '', ''] : [],
                      correctAnswer: 0,
                    })
                  }
                  setTypeModal(false)
                }}
                style={[
                  styles.modalItem,
                  {
                    backgroundColor:
                      questions.find((q) => q.id === activeQuestionId)?.type === item
                        ? colors.primary + '10'
                        : 'transparent',
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.modalItemText, { color: colors.foreground }]}>
                  {item === 'multiple-choice' ? 'Multiple Choice' : 'Text Answer'}
                </Text>
                {questions.find((q) => q.id === activeQuestionId)?.type === item && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
  },
  infoBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  infoBannerContent: {
    flexDirection: 'row',
  },
  infoBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  infoBannerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardContent: {
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionsContainer: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  correctLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pointsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  questionsList: {
    gap: 12,
  },
  questionCard: {
    borderRadius: 8,
    padding: 12,
  },
  questionCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  optionsList: {
    gap: 4,
    marginBottom: 6,
  },
  optionListItem: {
    fontSize: 12,
    lineHeight: 16,
  },
  pointsText: {
    fontSize: 11,
  },
  deleteButton: {
    padding: 8,
  },
  buttonRow: {
    flexDirection: 'column',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelOnlyButton: {
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
  },
})
