import { useState } from 'react'
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

interface Question {
  id: string
  type: 'multiple-choice' | 'text'
  question: string
  options?: string[]
  correctAnswer?: number
  points: number
}

export default function AddQuizQuestionsScreen() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const [questions, setQuestions] = useState<Question[]>([])
  const [typeModal, setTypeModal] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: Date.now().toString(),
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 10,
  })

  const questionTypes: Array<'multiple-choice' | 'text'> = ['multiple-choice', 'text']

  const handleAddQuestion = () => {
    if (!currentQuestion.question.trim()) {
      Alert.alert('Missing Question', 'Please enter a question text')
      return
    }

    if (currentQuestion.type === 'multiple-choice') {
      const filledOptions = (currentQuestion.options || []).filter((opt) => opt.trim())
      if (filledOptions.length < 2) {
        Alert.alert('Insufficient Options', 'Please provide at least 2 answer options')
        return
      }
    }

    setQuestions([...questions, { ...currentQuestion, id: Date.now().toString() }])
    setCurrentQuestion({
      id: Date.now().toString(),
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 10,
    })
  }

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])]
    newOptions[index] = value
    setCurrentQuestion({ ...currentQuestion, options: newOptions })
  }

  const handleSave = () => {
    if (questions.length === 0) {
      Alert.alert('No Questions', 'Please add at least one question to the quiz')
      return
    }
    Alert.alert('Success', `Quiz saved with ${questions.length} question(s)`, [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ])
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Quiz Questions</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            Create a custom pre-screening quiz
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Info Banner */}
          <Card
            style={[
              styles.infoBanner,
              { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' },
            ]}
          >
            <View style={styles.infoBannerContent}>
              <Ionicons name="help-circle" size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.infoBannerTitle, { color: colors.foreground }]}>
                  Quiz Best Practices
                </Text>
                <Text style={[styles.infoBannerText, { color: colors.mutedForeground }]}>
                  • Keep questions relevant to the job{'\n'}
                  • Aim for 5-10 questions{'\n'}
                  • Mix difficulty levels{'\n'}
                  • Set passing score at 60-70%
                </Text>
              </View>
            </View>
          </Card>

          {/* Question Builder */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>
                Create New Question
              </Text>
            </View>
            <View style={styles.cardContent}>
              {/* Question Type Selector */}
              <View style={styles.fieldGroup}>
                <Label>Question Type</Label>
                <TouchableOpacity
                  onPress={() => setTypeModal(true)}
                  style={[styles.selectButton, { borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.foreground, fontSize: 14 }}>
                    {currentQuestion.type === 'multiple-choice' ? 'Multiple Choice' : 'Text Answer'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              {/* Question Text */}
              <View style={styles.fieldGroup}>
                <Label>Question</Label>
                <Textarea
                  placeholder="Enter your question..."
                  value={currentQuestion.question}
                  onChangeText={(text) => setCurrentQuestion({ ...currentQuestion, question: text })}
                  style={[styles.textarea, { borderColor: colors.border, color: colors.foreground }]}
                  placeholderTextColor={colors.mutedForeground}
                  numberOfLines={3}
                />
              </View>

              {/* Multiple Choice Options */}
              {currentQuestion.type === 'multiple-choice' && (
                <View style={styles.fieldGroup}>
                  <Label>Answer Options</Label>
                  <View style={styles.optionsContainer}>
                    {currentQuestion.options?.map((option, index) => (
                      <View key={index} style={styles.optionRow}>
                        <TouchableOpacity
                          onPress={() =>
                            setCurrentQuestion({ ...currentQuestion, correctAnswer: index })
                          }
                          style={[
                            styles.radioButton,
                            {
                              borderColor: colors.border,
                              backgroundColor:
                                currentQuestion.correctAnswer === index
                                  ? colors.primary
                                  : 'transparent',
                            },
                          ]}
                        >
                          {currentQuestion.correctAnswer === index && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </TouchableOpacity>
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChangeText={(text) => handleOptionChange(index, text)}
                          style={[styles.optionInput, { borderColor: colors.border, color: colors.foreground }]}
                          placeholderTextColor={colors.mutedForeground}
                        />
                        {currentQuestion.correctAnswer === index && (
                          <Text style={[styles.correctLabel, { color: colors.primary }]}>
                            Correct
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                  <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                    Tap the circle to mark the correct answer
                  </Text>
                </View>
              )}

              {/* Points */}
              <View style={styles.fieldGroup}>
                <Label>Points</Label>
                <Input
                  placeholder="10"
                  value={currentQuestion.points.toString()}
                  onChangeText={(text) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      points: parseInt(text) || 10,
                    })
                  }
                  keyboardType="number-pad"
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              {/* Add Question Button */}
              <Button
                onPress={handleAddQuestion}
                style={[styles.addButton, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>
                  Add Question to Quiz
                </Text>
              </Button>
            </View>
          </Card>

          {/* Questions List */}
          {questions.length > 0 && (
            <Card style={styles.card}>
              <View style={styles.questionsHeader}>
                <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>
                  Quiz Questions
                </Text>
                <View
                  style={[
                    styles.pointsBadge,
                    { backgroundColor: colors.secondary },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                    Total: {totalPoints} pts
                  </Text>
                </View>
              </View>

              <View style={styles.questionsList}>
                {questions.map((q, index) => (
                  <View
                    key={q.id}
                    style={[
                      styles.questionCard,
                      { backgroundColor: colors.secondary },
                    ]}
                  >
                    <View style={styles.questionCardContent}>
                      <View
                        style={[
                          styles.numberBadge,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text
                          style={[
                            styles.questionText,
                            { color: colors.foreground },
                          ]}
                        >
                          {q.question}
                        </Text>
                        {q.type === 'multiple-choice' && q.options && (
                          <View style={styles.optionsList}>
                            {q.options.map((opt, i) => (
                              <Text
                                key={i}
                                style={[
                                  styles.optionListItem,
                                  {
                                    color:
                                      i === q.correctAnswer
                                        ? colors.primary
                                        : colors.mutedForeground,
                                    fontWeight:
                                      i === q.correctAnswer ? '600' : '400',
                                  },
                                ]}
                              >
                                {i + 1}. {opt}{' '}
                                {i === q.correctAnswer ? '✓' : ''}
                              </Text>
                            ))}
                          </View>
                        )}
                        <Text
                          style={[
                            styles.pointsText,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {q.points} points
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveQuestion(q.id)}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Save Buttons */}
          {questions.length > 0 && (
            <View style={styles.buttonRow}>
              <Button
                onPress={() => router.back()}
                style={[styles.button, { borderColor: colors.border, borderWidth: 1 }]}
              >
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>Cancel</Text>
              </Button>
              <Button
                onPress={handleSave}
                style={[styles.button, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="save" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>
                  Save Quiz ({questions.length})
                </Text>
              </Button>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Question Type Modal */}
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
                  setCurrentQuestion({ ...currentQuestion, type: item })
                  setTypeModal(false)
                }}
                style={[
                  styles.modalItem,
                  {
                    backgroundColor:
                      currentQuestion.type === item ? colors.primary + '10' : 'transparent',
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.modalItemText, { color: colors.foreground }]}>
                  {item === 'multiple-choice' ? 'Multiple Choice' : 'Text Answer'}
                </Text>
                {currentQuestion.type === item && (
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
    marginTop: 8,
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
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
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
