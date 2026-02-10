import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Colors } from '@/constants/theme'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface InterviewQuestion {
  question: string
  score: number
  duration: string
  analysis: {
    clarity: number
    confidence: number
    relevance: number
  }
  transcript: string
  insights: string[]
}

const mockData = {
  candidate: {
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    avatar: '',
    position: 'Senior Frontend Developer',
  },
  overallScore: 87,
  reliability: 92,
  completedAt: '2024-01-15T14:30:00',
  duration: '45 minutes',
  aiAnalysis: {
    eyeMovement: {
      score: 88,
      naturalLooking: 94,
      screenReading: 12,
      distraction: 6,
    },
    responseTiming: {
      averageThinkTime: '3.2s',
      consistency: 89,
      pausePatterns: 'Natural',
    },
    confidenceScore: 85,
    behavioralPatterns: {
      enthusiasm: 92,
      authenticity: 87,
      professionalism: 94,
    },
  },
  questions: [
    {
      question: 'Tell me about your experience with React and how you\'ve used it in recent projects.',
      score: 92,
      duration: '4:32',
      analysis: {
        clarity: 95,
        confidence: 90,
        relevance: 91,
      },
      transcript:
        "I\'ve been working with React for over 5 years now. In my current role at TechCorp, I lead a team building a customer portal that serves over 100,000 users...",
      insights: [
        'Strong technical depth and specific examples',
        'Demonstrated leadership experience',
        'Good articulation of complex concepts',
      ],
    },
    {
      question: 'How do you approach debugging a complex issue in production?',
      score: 85,
      duration: '3:45',
      analysis: {
        clarity: 88,
        confidence: 82,
        relevance: 85,
      },
      transcript:
        "My approach is systematic. First, I try to reproduce the issue locally. If that\'s not possible, I check our monitoring tools...",
      insights: [
        'Methodical problem-solving approach',
        'Familiarity with industry-standard tools',
        'Slight hesitation initially, then strong recovery',
      ],
    },
  ] as InterviewQuestion[],
  strengths: [
    'Excellent technical knowledge and depth',
    'Strong communication and clarity',
    'Demonstrates leadership qualities',
    'Authentic and engaged responses',
    'Good problem-solving methodology',
  ],
  concerns: ['Slightly lower confidence on debugging question', 'Could provide more specific metrics in examples'],
  recommendation: {
    decision: 'strong-recommend',
    reasoning:
      'Candidate demonstrates strong technical expertise, excellent communication skills, and leadership potential. Recommend advancing to final round.',
  },
}

export default function InterviewResultsScreen() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const [activeTab, setActiveTab] = useState<'overview' | 'behavioral' | 'questions' | 'recommendation'>('overview')

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#15803d'
    if (score >= 70) return '#ca8a04'
    return '#dc2626'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return '#dcfce7'
    if (score >= 70) return '#fef3c7'
    return '#fee2e2'
  }

  const ProgressBar = ({ value, color }: { value: number; color?: string }) => (
    <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
      <View
        style={[styles.progressFill, { width: `${value}%`, backgroundColor: color || colors.primary }]}
      />
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitleText, { color: colors.foreground }]}>AI Interview Analysis</Text>
            <Badge style={{ backgroundColor: '#f3e8ff', marginLeft: 8 }}>
              <Ionicons name="sparkles" size={12} color="#7c3aed" style={{ marginRight: 4 }} />
              <Text style={{ color: '#7c3aed', fontSize: 10, fontWeight: '600' }}>AI</Text>
            </Badge>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>{mockData.candidate.position}</Text>
        </View>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download-outline" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Candidate Info */}
        <Card style={{ borderColor: colors.border, borderWidth: 1 }}>
          <CardContent style={styles.candidateInfo}>
            <Avatar size={56}>
              <AvatarFallback
                style={{ backgroundColor: colors.primary, width: 56, height: 56, borderRadius: 28 }}
              >
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>
                  {mockData.candidate.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </Text>
              </AvatarFallback>
            </Avatar>
            <View style={styles.candidateDetails}>
              <Text style={[styles.candidateName, { color: colors.foreground }]}>{mockData.candidate.name}</Text>
              <Text style={[styles.candidateEmail, { color: colors.mutedForeground }]}>{mockData.candidate.email}</Text>
              <View style={styles.candidateMeta}>
                <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
                <Text style={[styles.candidateMetaText, { color: colors.mutedForeground }]}>{mockData.duration}</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Overall Scores */}
        <View style={styles.scoresRow}>
          <Card style={{ borderColor: colors.border, borderWidth: 1, marginBottom: 16 }}>
            <CardContent style={styles.scoreContent}>
              <View style={styles.scoreHeader}>
                <Text style={[styles.scoreTitle, { color: colors.foreground }]}>Overall Performance</Text>
                <Badge
                  style={{
                    backgroundColor: getScoreBgColor(mockData.overallScore),
                  }}
                >
                  <Text
                    style={{
                      color: getScoreColor(mockData.overallScore),
                      fontSize: 11,
                      fontWeight: '600',
                    }}
                  >
                    {mockData.overallScore >= 85 ? 'Excellent' : mockData.overallScore >= 70 ? 'Good' : 'Fair'}
                  </Text>
                </Badge>
              </View>
              <View style={styles.scoreValueContainer}>
                <Text style={[styles.scoreValue, { color: getScoreColor(mockData.overallScore) }]}>
                  {mockData.overallScore}
                </Text>
                <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>out of 100</Text>
              </View>
              <ProgressBar value={mockData.overallScore} color={getScoreColor(mockData.overallScore)} />
            </CardContent>
          </Card>

          <Card style={{ borderColor: colors.border, borderWidth: 1 }}>
            <CardContent style={styles.scoreContent}>
              <View style={styles.scoreHeader}>
                <Text style={[styles.scoreTitle, { color: colors.foreground }]}>Response Reliability</Text>
                <Badge variant="outline" style={{ borderColor: colors.border }}>
                  <Ionicons name="target" size={12} color={colors.mutedForeground} style={{ marginRight: 4 }} />
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '600' }}>AI Verified</Text>
                </Badge>
              </View>
              <View style={styles.scoreValueContainer}>
                <Text style={[styles.scoreValue, { color: '#3b82f6' }]}>{mockData.reliability}%</Text>
                <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>authenticity score</Text>
              </View>
              <ProgressBar value={mockData.reliability} color="#3b82f6" />
              <Text style={[styles.reliabilityNote, { color: colors.mutedForeground }]}>
                Based on eye movement, timing patterns, and behavioral analysis
              </Text>
            </CardContent>
          </Card>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              { borderBottomColor: colors.border },
              activeTab === 'overview' && [styles.tabActive, { borderBottomColor: colors.primary }],
            ]}
            onPress={() => setActiveTab('overview')}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.mutedForeground },
                activeTab === 'overview' && { color: colors.foreground, fontWeight: '600' },
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              { borderBottomColor: colors.border },
              activeTab === 'behavioral' && [styles.tabActive, { borderBottomColor: colors.primary }],
            ]}
            onPress={() => setActiveTab('behavioral')}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.mutedForeground },
                activeTab === 'behavioral' && { color: colors.foreground, fontWeight: '600' },
              ]}
            >
              Behavioral
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              { borderBottomColor: colors.border },
              activeTab === 'questions' && [styles.tabActive, { borderBottomColor: colors.primary }],
            ]}
            onPress={() => setActiveTab('questions')}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.mutedForeground },
                activeTab === 'questions' && { color: colors.foreground, fontWeight: '600' },
              ]}
            >
              Questions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              { borderBottomColor: colors.border },
              activeTab === 'recommendation' && [styles.tabActive, { borderBottomColor: colors.primary }],
            ]}
            onPress={() => setActiveTab('recommendation')}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.mutedForeground },
                activeTab === 'recommendation' && { color: colors.foreground, fontWeight: '600' },
              ]}
            >
              Recommendation
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content - Overview */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <Card style={{ borderColor: colors.border, borderWidth: 1, marginBottom: 16 }}>
              <CardContent style={styles.cardContent}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="eye-outline" size={20} color={colors.foreground} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Eye Movement Analysis</Text>
                </View>
                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <Text style={[styles.metricLabel, { color: colors.foreground }]}>Natural Looking</Text>
                    <Text style={[styles.metricValue, { color: colors.foreground }]}>
                      {mockData.aiAnalysis.eyeMovement.naturalLooking}%
                    </Text>
                  </View>
                  <ProgressBar value={mockData.aiAnalysis.eyeMovement.naturalLooking} />
                </View>
                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <Text style={[styles.metricLabel, { color: colors.foreground }]}>Screen Reading</Text>
                    <Text style={[styles.metricValue, { color: colors.foreground }]}>
                      {mockData.aiAnalysis.eyeMovement.screenReading}%
                    </Text>
                  </View>
                  <ProgressBar value={mockData.aiAnalysis.eyeMovement.screenReading} />
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Tab Content - Behavioral */}
        {activeTab === 'behavioral' && (
          <View style={styles.tabContent}>
            <Card style={{ backgroundColor: '#dcfce7', borderColor: '#86efac', borderWidth: 1, marginBottom: 16 }}>
              <CardContent style={styles.cardContent}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="checkmark-circle" size={20} color="#15803d" />
                  <Text style={[styles.sectionTitle, { color: '#15803d' }]}>Identified Strengths</Text>
                </View>
                {mockData.strengths.map((strength, index) => (
                  <Text key={index} style={[styles.listItem, { color: '#166534' }]}>
                    • {strength}
                  </Text>
                ))}
              </CardContent>
            </Card>
          </View>
        )}

        {/* Tab Content - Questions */}
        {activeTab === 'questions' && (
          <View style={styles.tabContent}>
            {mockData.questions.map((q, index) => (
              <Card key={index} style={{ borderColor: colors.border, borderWidth: 1, marginBottom: 16 }}>
                <CardContent style={styles.cardContent}>
                  <View style={styles.questionHeader}>
                    <Badge variant="outline" style={{ borderColor: colors.border, marginRight: 8 }}>
                      <Text style={{ color: colors.foreground, fontSize: 11 }}>Q{index + 1}</Text>
                    </Badge>
                    <Badge style={{ backgroundColor: getScoreBgColor(q.score) }}>
                      <Text style={{ color: getScoreColor(q.score), fontSize: 11, fontWeight: '600' }}>
                        {q.score}/100
                      </Text>
                    </Badge>
                  </View>
                  <Text style={[styles.questionText, { color: colors.foreground }]}>{q.question}</Text>
                  <Text style={[styles.questionDuration, { color: colors.mutedForeground }]}>
                    Duration: {q.duration}
                  </Text>
                </CardContent>
              </Card>
            ))}
          </View>
        )}

        {/* Tab Content - Recommendation */}
        {activeTab === 'recommendation' && (
          <View style={styles.tabContent}>
            <Card style={{ backgroundColor: '#dcfce7', borderColor: '#86efac', borderWidth: 2, marginBottom: 16 }}>
              <CardContent style={styles.recommendationContent}>
                <View style={styles.recommendationIcon}>
                  <Ionicons name="checkmark-circle" size={32} color="#fff" />
                </View>
                <View style={styles.recommendationText}>
                  <Text style={styles.recommendationTitle}>Strong Recommendation</Text>
                  <Text style={styles.recommendationReason}>{mockData.recommendation.reasoning}</Text>
                </View>
              </CardContent>
            </Card>
            <Button style={styles.primaryActionButton}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Advance to Next Round</Text>
            </Button>
          </View>
        )}
      </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  exportButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  candidateInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  candidateDetails: {
    flex: 1,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  candidateEmail: {
    fontSize: 13,
    marginBottom: 8,
  },
  candidateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  candidateMetaText: {
    fontSize: 12,
  },
  scoresRow: {
    marginTop: 16,
  },
  scoreContent: {
    gap: 16,
    padding: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreValueContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  reliabilityNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
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
  tabs: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    alignItems: 'center',
  },
  tabActive: {},
  tabText: {
    fontSize: 13,
  },
  tabContent: {
    marginTop: 16,
  },
  cardContent: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  metricItem: {
    gap: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 13,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  listItem: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  questionDuration: {
    fontSize: 12,
    marginBottom: 12,
  },
  recommendationContent: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationText: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#15803d',
  },
  recommendationReason: {
    fontSize: 13,
    lineHeight: 20,
    color: '#166534',
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
