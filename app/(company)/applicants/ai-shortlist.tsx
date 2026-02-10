import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Colors } from '@/constants/theme'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface Candidate {
  id: string
  name: string
  email: string
  appliedDate: string
  matchScore: number
  avatar?: string
  experience: string
  location: string
  skills: string[]
  aiInsights: {
    strengths: string[]
    concerns: string[]
    recommendation: 'strong-match' | 'potential-match' | 'weak-match'
  }
  status: 'pending' | 'shortlisted' | 'rejected'
}

const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    appliedDate: '2024-01-15',
    matchScore: 94,
    experience: '5 years',
    location: 'San Francisco, CA',
    skills: ['React', 'TypeScript', 'Node.js', 'System Design'],
    aiInsights: {
      strengths: [
        'Strong React expertise with 5+ years experience',
        'Excellent problem-solving in previous roles',
        'Leadership experience managing teams of 3-5',
      ],
      concerns: ['Limited experience with Vue.js mentioned in requirements'],
      recommendation: 'strong-match',
    },
    status: 'pending',
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'm.chen@email.com',
    appliedDate: '2024-01-14',
    matchScore: 88,
    experience: '4 years',
    location: 'Austin, TX',
    skills: ['React', 'Python', 'AWS', 'Docker'],
    aiInsights: {
      strengths: [
        'Solid full-stack background',
        'Strong cloud infrastructure knowledge',
        'Quick learner based on career progression',
      ],
      concerns: ['Less experience than preferred for senior role', 'No TypeScript mentioned in resume'],
      recommendation: 'potential-match',
    },
    status: 'pending',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@email.com',
    appliedDate: '2024-01-13',
    matchScore: 92,
    experience: '6 years',
    location: 'New York, NY',
    skills: ['React', 'TypeScript', 'GraphQL', 'Testing'],
    aiInsights: {
      strengths: [
        'Extensive testing and quality assurance experience',
        'Strong technical writing and documentation',
        'Open source contributor',
      ],
      concerns: [],
      recommendation: 'strong-match',
    },
    status: 'shortlisted',
  },
  {
    id: '4',
    name: 'David Park',
    email: 'd.park@email.com',
    appliedDate: '2024-01-12',
    matchScore: 76,
    experience: '2 years',
    location: 'Seattle, WA',
    skills: ['JavaScript', 'React', 'CSS', 'Figma'],
    aiInsights: {
      strengths: ['Strong design sensibility', 'Good communication skills'],
      concerns: [
        'Limited professional experience',
        'Missing several required technical skills',
        'No backend experience',
      ],
      recommendation: 'weak-match',
    },
    status: 'pending',
  },
]

export default function AIShortlistScreen() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const [candidates, setCandidates] = useState(mockCandidates)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const handleSelectCandidate = (id: string) => {
    if (selectedCandidates.includes(id)) {
      setSelectedCandidates(selectedCandidates.filter((c) => c !== id))
    } else {
      setSelectedCandidates([...selectedCandidates, id])
    }
  }

  const handleBulkShortlist = () => {
    setCandidates(
      candidates.map((c) => (selectedCandidates.includes(c.id) ? { ...c, status: 'shortlisted' as const } : c))
    )
    setSelectedCandidates([])
    Alert.alert('Success', `${selectedCandidates.length} candidates shortlisted`)
  }

  const handleBulkReject = () => {
    setCandidates(
      candidates.map((c) => (selectedCandidates.includes(c.id) ? { ...c, status: 'rejected' as const } : c))
    )
    setSelectedCandidates([])
    Alert.alert('Success', `${selectedCandidates.length} candidates rejected`)
  }

  const handleIndividualAction = (id: string, status: 'shortlisted' | 'rejected') => {
    setCandidates(candidates.map((c) => (c.id === id ? { ...c, status } : c)))
  }

  const filteredCandidates = candidates.filter((c) => {
    if (filterStatus === 'all') return true
    return c.status === filterStatus
  })

  const sortedCandidates = [...filteredCandidates].sort((a, b) => b.matchScore - a.matchScore)

  const getRecommendationBadge = (rec: string) => {
    if (rec === 'strong-match') return { label: 'Strong Match', bg: '#dcfce7', color: '#15803d' }
    if (rec === 'potential-match') return { label: 'Potential Match', bg: '#fef3c7', color: '#92400e' }
    return { label: 'Weak Match', bg: '#fee2e2', color: '#991b1b' }
  }

  const getMatchScoreColor = (rec: string) => {
    if (rec === 'strong-match') return '#15803d'
    if (rec === 'potential-match') return '#92400e'
    return '#991b1b'
  }

  const strongMatches = candidates.filter((c) => c.aiInsights.recommendation === 'strong-match').length
  const potentialMatches = candidates.filter((c) => c.aiInsights.recommendation === 'potential-match').length
  const avgScore = Math.round(candidates.reduce((sum, c) => sum + c.matchScore, 0) / candidates.length)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Shortlist</Text>
            <Badge style={{ backgroundColor: colors.primary, marginLeft: 8 }}>
              <Ionicons name="sparkles" size={12} color="#fff" style={{ marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>AI</Text>
            </Badge>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>Senior Frontend Developer</Text>
        </View>
        <Badge variant="outline" style={{ marginLeft: 8 }}>
          <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>{candidates.length}</Text>
        </Badge>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Filters & Actions */}
        <Card style={[styles.filterCard, { borderColor: colors.border, borderWidth: 1 }]}>
          <CardContent style={styles.filterContent}>
            <View style={styles.filterRow}>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    { borderColor: colors.border },
                    filterStatus === 'all' && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setFilterStatus('all')}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      { color: filterStatus === 'all' ? '#fff' : colors.foreground },
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    { borderColor: colors.border },
                    filterStatus === 'pending' && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setFilterStatus('pending')}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      { color: filterStatus === 'pending' ? '#fff' : colors.foreground },
                    ]}
                  >
                    Pending
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    { borderColor: colors.border },
                    filterStatus === 'shortlisted' && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setFilterStatus('shortlisted')}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      { color: filterStatus === 'shortlisted' ? '#fff' : colors.foreground },
                    ]}
                  >
                    Shortlisted
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {selectedCandidates.length > 0 && (
              <View style={styles.bulkActions}>
                <Badge variant="secondary" style={{ marginRight: 8 }}>
                  <Text style={{ color: colors.foreground, fontSize: 12 }}>{selectedCandidates.length} selected</Text>
                </Badge>
                <Button style={styles.bulkActionButton} onPress={handleBulkShortlist}>
                  <Ionicons name="person-add" size={16} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.bulkActionText}>Shortlist</Text>
                </Button>
                <Button
                  variant="outline"
                  style={[styles.bulkActionButton, { borderColor: '#ef4444' }]}
                  onPress={handleBulkReject}
                >
                  <Ionicons name="person-remove" size={16} color="#ef4444" style={{ marginRight: 4 }} />
                  <Text style={[styles.bulkActionText, { color: '#ef4444' }]}>Reject</Text>
                </Button>
              </View>
            )}
          </CardContent>
        </Card>

        {/* AI Insights Summary */}
        <Card
          style={[
            styles.summaryCard,
            { backgroundColor: '#f3e8ff', borderColor: '#c084fc', borderWidth: 2 },
          ]}
        >
          <CardContent style={styles.summaryContent}>
            <View style={styles.summaryHeader}>
              <Ionicons name="sparkles" size={20} color="#7c3aed" />
              <Text style={[styles.summaryTitle, { color: '#581c87' }]}>AI Analysis Summary</Text>
            </View>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#581c87' }]}>{strongMatches}</Text>
                <Text style={[styles.summaryLabel, { color: '#7c3aed' }]}>Strong Matches</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#581c87' }]}>{potentialMatches}</Text>
                <Text style={[styles.summaryLabel, { color: '#7c3aed' }]}>Potential Matches</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#581c87' }]}>{avgScore}%</Text>
                <Text style={[styles.summaryLabel, { color: '#7c3aed' }]}>Avg Match Score</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Candidates List */}
        {sortedCandidates.map((candidate) => {
          const badge = getRecommendationBadge(candidate.aiInsights.recommendation)
          const scoreColor = getMatchScoreColor(candidate.aiInsights.recommendation)

          return (
            <Card key={candidate.id} style={[styles.candidateCard, { borderColor: colors.border, borderWidth: 1 }]}>
              <CardContent style={styles.candidateContent}>
                {/* Header */}
                <View style={styles.candidateHeader}>
                  <Checkbox
                    checked={selectedCandidates.includes(candidate.id)}
                    onCheckedChange={() => handleSelectCandidate(candidate.id)}
                  />
                  <Avatar size={48} style={{ marginLeft: 12 }}>
                    <AvatarFallback
                      style={{
                        backgroundColor: colors.primary,
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>
                        {candidate.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </Text>
                    </AvatarFallback>
                  </Avatar>
                  <View style={styles.candidateInfo}>
                    <Text style={[styles.candidateName, { color: colors.foreground }]}>{candidate.name}</Text>
                    <Text style={[styles.candidateEmail, { color: colors.mutedForeground }]}>{candidate.email}</Text>
                    <Text style={[styles.candidateMeta, { color: colors.mutedForeground }]}>
                      {candidate.experience} • {candidate.location}
                    </Text>
                  </View>
                  {candidate.status === 'shortlisted' && (
                    <Badge style={{ backgroundColor: '#dcfce7', position: 'absolute', top: 0, right: 0 }}>
                      <Ionicons name="checkmark-circle" size={12} color="#15803d" style={{ marginRight: 4 }} />
                      <Text style={{ color: '#15803d', fontSize: 10, fontWeight: '600' }}>Shortlisted</Text>
                    </Badge>
                  )}
                  {candidate.status === 'rejected' && (
                    <Badge style={{ backgroundColor: '#fee2e2', position: 'absolute', top: 0, right: 0 }}>
                      <Ionicons name="close-circle" size={12} color="#991b1b" style={{ marginRight: 4 }} />
                      <Text style={{ color: '#991b1b', fontSize: 10, fontWeight: '600' }}>Rejected</Text>
                    </Badge>
                  )}
                  {candidate.status === 'pending' && (
                    <Badge
                      variant="outline"
                      style={{ position: 'absolute', top: 0, right: 0, borderColor: colors.border }}
                    >
                      <Ionicons name="time" size={12} color={colors.mutedForeground} style={{ marginRight: 4 }} />
                      <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '600' }}>Pending</Text>
                    </Badge>
                  )}
                </View>

                {/* Match Score */}
                <View style={styles.matchScoreSection}>
                  <View style={styles.matchScoreHeader}>
                    <View style={styles.matchScoreLeft}>
                      <Ionicons name="star" size={16} color="#fbbf24" />
                      <Text style={[styles.matchScoreLabel, { color: colors.foreground }]}>AI Match Score</Text>
                      <Badge style={{ backgroundColor: badge.bg, marginLeft: 8 }}>
                        <Text style={{ color: badge.color, fontSize: 10, fontWeight: '600' }}>{badge.label}</Text>
                      </Badge>
                    </View>
                    <Text style={[styles.matchScoreValue, { color: scoreColor }]}>{candidate.matchScore}%</Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                    <View style={[styles.progressFill, { width: `${candidate.matchScore}%`, backgroundColor: scoreColor }]} />
                  </View>
                </View>

                {/* Skills */}
                <View style={styles.skillsSection}>
                  <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Skills</Text>
                  <View style={styles.skillsContainer}>
                    {candidate.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" style={{ marginRight: 6, marginBottom: 6 }}>
                        <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{skill}</Text>
                      </Badge>
                    ))}
                  </View>
                </View>

                {/* AI Insights */}
                <View style={[styles.insightsSection, { backgroundColor: colors.muted }]}>
                  <View style={styles.insightColumn}>
                    <Text style={[styles.insightTitle, { color: '#15803d' }]}>✓ Strengths</Text>
                    {candidate.aiInsights.strengths.map((strength, index) => (
                      <Text key={index} style={[styles.insightText, { color: colors.mutedForeground }]}>
                        • {strength}
                      </Text>
                    ))}
                  </View>
                  {candidate.aiInsights.concerns.length > 0 && (
                    <View style={styles.insightColumn}>
                      <Text style={[styles.insightTitle, { color: '#ca8a04' }]}>⚠ Considerations</Text>
                      {candidate.aiInsights.concerns.map((concern, index) => (
                        <Text key={index} style={[styles.insightText, { color: colors.mutedForeground }]}>
                          • {concern}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>

                {/* Actions */}
                {candidate.status === 'pending' && (
                  <View style={styles.actionsSection}>
                    <Button
                      style={styles.actionButtonPrimary}
                      onPress={() => handleIndividualAction(candidate.id, 'shortlisted')}
                    >
                      <Ionicons name="person-add" size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.actionButtonPrimaryText}>Shortlist</Text>
                    </Button>
                    <Button variant="outline" style={styles.actionButtonSecondary}>
                      <Ionicons name="mail" size={16} color={colors.foreground} style={{ marginRight: 6 }} />
                      <Text style={[styles.actionButtonSecondaryText, { color: colors.foreground }]}>Message</Text>
                    </Button>
                    <Button
                      variant="outline"
                      style={[styles.actionButtonSecondary, { borderColor: '#ef4444' }]}
                      onPress={() => handleIndividualAction(candidate.id, 'rejected')}
                    >
                      <Ionicons name="person-remove" size={16} color="#ef4444" />
                    </Button>
                  </View>
                )}
              </CardContent>
            </Card>
          )
        })}
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
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  filterCard: {
    overflow: 'hidden',
  },
  filterContent: {
    padding: 16,
    gap: 12,
  },
  filterRow: {
    gap: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bulkActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    overflow: 'hidden',
  },
  summaryContent: {
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  candidateCard: {
    overflow: 'hidden',
  },
  candidateContent: {
    padding: 16,
    gap: 16,
  },
  candidateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  candidateInfo: {
    flex: 1,
    marginLeft: 12,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  candidateEmail: {
    fontSize: 12,
    marginBottom: 4,
  },
  candidateMeta: {
    fontSize: 11,
  },
  matchScoreSection: {
    gap: 8,
  },
  matchScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchScoreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  matchScoreLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  matchScoreValue: {
    fontSize: 22,
    fontWeight: '700',
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
  skillsSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  insightsSection: {
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  insightColumn: {
    gap: 6,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 11,
    lineHeight: 16,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  actionButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
})
