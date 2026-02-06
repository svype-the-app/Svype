import { useState, useRef } from 'react'
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Colors } from '@/constants/theme'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getAIShortlistedCandidates, AIShortlistedCandidate } from '@/lib/mock-ai-shortlisted-applicants'
import * as Haptics from 'expo-haptics'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SWIPE_THRESHOLD = 80

export default function AIShortlistScreen() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const [candidates, setCandidates] = useState<AIShortlistedCandidate[]>(getAIShortlistedCandidates())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [pan] = useState(new Animated.ValueXY())
  const scrollViewRef = useRef<ScrollView>(null)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
      },
      onPanResponderMove: (_, { dx }) => {
        pan.x.setValue(dx)
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx > SWIPE_THRESHOLD) {
          handleShortlist()
        } else if (dx < -SWIPE_THRESHOLD) {
          handleReject()
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start()
        }
      },
    })
  ).current

  const handleShortlist = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    Animated.timing(pan.x, {
      toValue: SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setCurrentIndex((prev) => prev + 1)
      pan.setValue({ x: 0, y: 0 })
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false })
      }
    })
  }

  const handleReject = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    Animated.timing(pan.x, {
      toValue: -SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setCurrentIndex((prev) => prev + 1)
      pan.setValue({ x: 0, y: 0 })
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false })
      }
    })
  }

  if (candidates.length === 0 || currentIndex >= candidates.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Shortlist</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              0 remaining
            </Text>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <Card style={{ width: '100%', maxWidth: 320 }}>
            <CardContent style={styles.emptyContent}>
              <Ionicons name="checkmark-circle" size={64} color={colors.primary} style={{ marginBottom: 16 }} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All Reviewed!</Text>
              <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
                You've reviewed all candidates. Check back later for new applications.
              </Text>
            </CardContent>
          </Card>
        </View>
      </SafeAreaView>
    )
  }

  const currentCandidate = candidates[currentIndex]
  const animatedCardStyle = {
    transform: [
      {
        translateX: pan.x,
      },
    ],
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Shortlist</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            {candidates.length - currentIndex} remaining
          </Text>
        </View>
      </View>

      {/* Swipe Card Container */}
      <View style={[styles.cardContainer, { backgroundColor: colors.background }]} {...panResponder.panHandlers}>
        <Animated.View style={[animatedCardStyle, { width: '100%', height: '100%' }]}>
          <Card style={[styles.applicantCard, { backgroundColor: colors.card }]}>
            <CardContent style={styles.cardContent}>
              <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={true}
                bounces={true}
                scrollEnabled={true}
              >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                  <Avatar size={96} style={{ marginBottom: 12, borderWidth: 3, borderColor: colors.primary }}>
                    <AvatarFallback
                      style={{
                        backgroundColor: colors.primary,
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 40, fontWeight: '700', color: '#fff' }}>
                        {currentCandidate.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </Text>
                    </AvatarFallback>
                  </Avatar>
                  <Text style={[styles.applicantName, { color: colors.cardForeground }]}>
                    {currentCandidate.name}
                  </Text>
                  <Text style={[styles.applicantEmail, { color: colors.mutedForeground }]}>
                    {currentCandidate.email}
                  </Text>
                </View>

                {/* AI Recommendation Section */}
                <View
                  style={[
                    styles.appliedForSection,
                    {
                      backgroundColor: colors.primary + '15',
                      borderColor: colors.primary + '30',
                    },
                  ]}
                >
                  <View style={styles.recHeaderRow}>
                    <Ionicons name="sparkles" size={16} color={colors.primary} />
                    <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AI Assessment</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.appliedForTitle, { color: colors.cardForeground, flex: 1 }]}>
                      {currentCandidate.matchScore}% Match
                    </Text>
                    <Badge style={{ backgroundColor: '#8b5cf6', paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
                        {currentCandidate.aiInsights.recommendation === 'strong-match'
                          ? 'Strong Match'
                          : currentCandidate.aiInsights.recommendation === 'potential-match'
                            ? 'Potential Match'
                            : 'Weak Match'}
                      </Text>
                    </Badge>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: colors.border, marginTop: 8 }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${currentCandidate.matchScore}%`,
                          backgroundColor: currentCandidate.aiInsights.recommendation === 'strong-match'
                            ? '#16a34a'
                            : currentCandidate.aiInsights.recommendation === 'potential-match'
                              ? '#ca8a04'
                              : '#dc2626',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Ionicons name="location-outline" size={20} color={colors.mutedForeground} />
                    <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                      {currentCandidate.location}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="briefcase-outline" size={20} color={colors.mutedForeground} />
                    <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                      {currentCandidate.experience} experience
                    </Text>
                  </View>
                </View>

                {/* Skills */}
                <View style={styles.skillsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>Skills</Text>
                  <View style={styles.skillsContainer}>
                    {currentCandidate.skills.map((skill, index) => (
                      <Badge
                        key={index}
                        style={{
                          backgroundColor: colors.secondary,
                          marginBottom: 8,
                          marginRight: 8,
                        }}
                      >
                        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{skill}</Text>
                      </Badge>
                    ))}
                  </View>
                </View>

                {/* AI Insights */}
                <View style={styles.bioSection}>
                  <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>AI Insights</Text>
                  <View style={styles.insightGroup}>
                    <Text style={[styles.insightSubtitle, { color: '#16a34a' }]}>✓ Strengths</Text>
                    {currentCandidate.aiInsights.strengths.map((strength, index) => (
                      <Text key={index} style={[styles.insightText, { color: colors.mutedForeground }]}>
                        • {strength}
                      </Text>
                    ))}
                  </View>

                  {currentCandidate.aiInsights.concerns.length > 0 && (
                    <View style={{ ...styles.insightGroup, marginTop: 12 }}>
                      <Text style={[styles.insightSubtitle, { color: '#ca8a04' }]}>⚠ Considerations</Text>
                      {currentCandidate.aiInsights.concerns.map((concern, index) => (
                        <Text key={index} style={[styles.insightText, { color: colors.mutedForeground }]}>
                          • {concern}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>

                {/* Swipe Hint */}
                <Text style={[styles.swipeHint, { color: colors.mutedForeground }]}>
                  ← Reject • Swipe • Shortlist →
                </Text>
              </ScrollView>
            </CardContent>
          </Card>

          {/* Overlay Colors on Swipe */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#10b981',
                opacity: pan.x.interpolate({
                  inputRange: [0, SCREEN_WIDTH * 0.3],
                  outputRange: [0, 0.5],
                  extrapolate: 'clamp',
                }),
                borderRadius: 16,
                pointerEvents: 'none',
              },
            ]}
          />

          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#ef4444',
                opacity: pan.x.interpolate({
                  inputRange: [-SCREEN_WIDTH * 0.3, 0],
                  outputRange: [0.5, 0],
                  extrapolate: 'clamp',
                }),
                borderRadius: 16,
                pointerEvents: 'none',
              },
            ]}
          />
        </Animated.View>
      </View>

      {/* Action Buttons at Bottom */}
      <View style={[styles.actionButtonsContainer, { borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.actionButton, { borderColor: '#ef4444', borderWidth: 2 }]} 
          onPress={handleReject}
        >
          <Ionicons name="close" size={24} color="#ef4444" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#10b981' }]}
          onPress={handleShortlist}
        >
          <Ionicons name="checkmark" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
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
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  applicantCard: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    padding: 0,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  applicantName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  applicantEmail: {
    fontSize: 14,
  },
  appliedForSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  recHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  appliedForTitle: {
    fontSize: 16,
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
  infoGrid: {
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  skillsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bioSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  insightGroup: {
    gap: 6,
  },
  insightSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 18,
  },
  swipeHint: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 20,
    marginHorizontal: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyContent: {
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
})
