import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Colors } from '@/constants/theme'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship'

export default function PostJobScreen() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const [requirements, setRequirements] = useState<string[]>(['React', 'TypeScript'])
  const [newRequirement, setNewRequirement] = useState('')
  const [enablePreScreening, setEnablePreScreening] = useState(false)
  const [enableAIInterview, setEnableAIInterview] = useState(false)
  const [employmentTypeModal, setEmploymentTypeModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    type: 'Full-time' as EmploymentType,
    salaryMin: '',
    salaryMax: '',
    description: '',
  })

  const employmentTypes: EmploymentType[] = ['Full-time', 'Part-time', 'Contract', 'Internship']

  const addRequirement = () => {
    if (newRequirement.trim() && !requirements.includes(newRequirement.trim())) {
      setRequirements([...requirements, newRequirement.trim()])
      setNewRequirement('')
    }
  }

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (
      !formData.title ||
      !formData.location ||
      !formData.salaryMin ||
      !formData.salaryMax ||
      !formData.description
    ) {
      Alert.alert('Missing Information', 'Please fill in all required fields')
      return
    }

    Alert.alert('Success', 'Job posted successfully!', [
      {
        text: 'OK',
        onPress: () => router.push('/(company)/dashboard' as any),
      },
    ])
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Post a New Job</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Basic Information */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Job Details</Text>
            </View>
            <View style={styles.cardContent}>
              {/* Job Title */}
              <View style={styles.fieldGroup}>
                <Label>Job Title</Label>
                <Input
                  placeholder="e.g. Senior Frontend Engineer"
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              {/* Location & Employment Type */}
              <View style={styles.twoColumnRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Label>Location</Label>
                  <Input
                    placeholder="London"
                    value={formData.location}
                    onChangeText={(text) => setFormData({ ...formData, location: text })}
                    style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1, marginLeft: 12 }]}>
                  <Label>Employment Type</Label>
                  <Pressable
                    onPress={() => setEmploymentTypeModal(true)}
                    style={[styles.input, { borderColor: colors.border, justifyContent: 'center' }]}
                  >
                    <View style={styles.selectRow}>
                      <Text style={{ color: colors.foreground, fontSize: 14 }}>
                        {formData.type}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
                    </View>
                  </Pressable>
                </View>
              </View>

              {/* Salary Range */}
              <View style={styles.twoColumnRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Label>Minimum Salary (£)</Label>
                  <Input
                    placeholder="40000"
                    value={formData.salaryMin}
                    onChangeText={(text) => setFormData({ ...formData, salaryMin: text })}
                    keyboardType="number-pad"
                    style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1, marginLeft: 12 }]}>
                  <Label>Maximum Salary (£)</Label>
                  <Input
                    placeholder="60000"
                    value={formData.salaryMax}
                    onChangeText={(text) => setFormData({ ...formData, salaryMax: text })}
                    keyboardType="number-pad"
                    style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>

              {/* Job Description */}
              <View style={styles.fieldGroup}>
                <Label>Job Description</Label>
                <Textarea
                  placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  style={[styles.textarea, { borderColor: colors.border, color: colors.foreground }]}
                  placeholderTextColor={colors.mutedForeground}
                  numberOfLines={6}
                />
              </View>
            </View>
          </Card>

          {/* Requirements */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Requirements</Text>
            </View>
            <View style={styles.cardContent}>
              {/* Add Requirement */}
              <View style={styles.requirementInputRow}>
                <Input
                  placeholder="Add a requirement (e.g. 5+ years experience)"
                  value={newRequirement}
                  onChangeText={setNewRequirement}
                  style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.foreground }]}
                  placeholderTextColor={colors.mutedForeground}
                />
                <TouchableOpacity
                  onPress={addRequirement}
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Requirements List */}
              <View style={styles.badgesContainer}>
                {requirements.map((req, index) => (
                  <View
                    key={index}
                    style={[
                      styles.badge,
                      { backgroundColor: colors.secondary },
                    ]}
                  >
                    <View style={styles.badgeContent}>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                        {req}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeRequirement(index)}
                        style={{ marginLeft: 6 }}
                      >
                        <Ionicons name="close" size={14} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Card>

          {/* Pre-Screening Options */}
          <Card style={styles.card}>
            <View style={styles.cardHeaderWithBadge}>
              <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Pre-Screening</Text>
              <View style={[styles.aiBadge, { backgroundColor: colors.secondary }]}>
                <Ionicons name="sparkles" size={12} color={colors.mutedForeground} />
                <Text style={[styles.badgeText, { color: colors.mutedForeground, marginLeft: 4 }]}>
                  AI Powered
                </Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              {/* Pre-Screening Quiz Toggle */}
              <View style={styles.toggleSection}>
                <View style={{ flex: 1 }}>
                  <View style={styles.toggleLabel}>
                    <Label>Enable Pre-Screening Quiz</Label>
                    <Ionicons name="help-circle" size={16} color={colors.mutedForeground} />
                  </View>
                  <Text style={[styles.toggleDescription, { color: colors.mutedForeground }]}>
                    Candidates will answer questions before their application is reviewed
                  </Text>
                </View>
                <Switch checked={enablePreScreening} onCheckedChange={setEnablePreScreening} />
              </View>

              {enablePreScreening && (
                <View style={[styles.expandedSection, { borderLeftColor: colors.primary }]}>
                  <Button
                    onPress={() => router.push('posts/add-quiz-qs' as any)}
                    style={styles.subButton}
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 6 }}>
                      Add Quiz Questions
                    </Text>
                  </Button>
                  <Text style={[styles.expandedText, { color: colors.mutedForeground }]}>
                    Create custom questions to assess candidates' skills and knowledge
                  </Text>
                </View>
              )}

              {/* AI Interview Toggle */}
              <View style={[styles.toggleSection, enablePreScreening && { marginTop: 20 }]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.toggleLabel}>
                    <Label>Enable AI Interview Analysis</Label>
                    <View style={[styles.premiumBadge, { backgroundColor: colors.secondary }]}>
                      <Text
                        style={[styles.badgeText, { color: colors.mutedForeground, fontSize: 11 }]}
                      >
                        Premium
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.toggleDescription, { color: colors.mutedForeground }]}>
                    AI will conduct video interviews and analyze candidate responses
                  </Text>
                </View>
                <Switch checked={enableAIInterview} onCheckedChange={setEnableAIInterview} />
              </View>

              {enableAIInterview && (
                <View style={[styles.expandedSection, { borderLeftColor: colors.primary }]}>
                  <View
                    style={[
                      styles.aiFeatureBox,
                      { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' },
                    ]}
                  >
                    <Text style={[styles.aiFeatureTitle, { color: colors.cardForeground }]}>
                      AI Interview Features:
                    </Text>
                    <Text style={[styles.aiFeatureItem, { color: colors.mutedForeground }]}>
                      • Eye movement tracking
                    </Text>
                    <Text style={[styles.aiFeatureItem, { color: colors.mutedForeground }]}>
                      • Response timing analysis
                    </Text>
                    <Text style={[styles.aiFeatureItem, { color: colors.mutedForeground }]}>
                      • Confidence scoring
                    </Text>
                    <Text style={[styles.aiFeatureItem, { color: colors.mutedForeground }]}>
                      • Behavioral pattern detection
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Card>

          {/* Submit Buttons */}
          <View style={styles.buttonRow}>
            <Button
              onPress={() => router.back()}
              style={[styles.submitButton, { backgroundColor: colors.muted }]}
            >
              <Text style={{ color: colors.mutedForeground, fontWeight: '600' }}>Cancel</Text>
            </Button>
            <Button
              onPress={handleSubmit}
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Post Job</Text>
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Employment Type Modal */}
      <Modal
        visible={employmentTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setEmploymentTypeModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Select Employment Type
            </Text>
            <TouchableOpacity onPress={() => setEmploymentTypeModal(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={employmentTypes}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setFormData({ ...formData, type: item })
                  setEmploymentTypeModal(false)
                }}
                style={[
                  styles.modalItem,
                  {
                    backgroundColor:
                      formData.type === item ? colors.primary + '10' : 'transparent',
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.modalItemText, { color: colors.foreground }]}>{item}</Text>
                {formData.type === item && (
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  twoColumnRow: {
    flexDirection: 'row',
  },
  selectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  requirementInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addButton: {
    width: 48,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  aiBadge: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  cardHeaderWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  expandedSection: {
    paddingLeft: 16,
    borderLeftWidth: 2,
    marginTop: 12,
    gap: 12,
  },
  subButton: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  expandedText: {
    fontSize: 12,
    lineHeight: 16,
  },
  premiumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiFeatureBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  aiFeatureTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  aiFeatureItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
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
