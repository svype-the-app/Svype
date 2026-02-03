import { useState, useRef, useEffect } from 'react'
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  useColorScheme,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors } from '@/constants/theme'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getApplicantsByJob, Applicant } from '@/lib/mock-data'
import * as Haptics from 'expo-haptics'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SWIPE_THRESHOLD = 80

export default function ReviewApplicantsScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const jobTitle = (params.jobTitle as string) || 'Senior Frontend Engineer'
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const [currentIndex, setCurrentIndex] = useState(0)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [pan] = useState(new Animated.ValueXY())
  const scrollViewRef = useRef<ScrollView>(null)

  useEffect(() => {
    // Load applicants from mock data
    const data = getApplicantsByJob(jobTitle)
    setApplicants(data)
  }, [jobTitle])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only activate on significant horizontal movement
        return Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
      },
      onPanResponderMove: (_, { dx }) => {
        // Only horizontal movement
        pan.x.setValue(dx)
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx > SWIPE_THRESHOLD) {
          // Right swipe - APPROVE
          handleApprove()
        } else if (dx < -SWIPE_THRESHOLD) {
          // Left swipe - REJECT
          handleReject()
        } else {
          // Reset to center
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start()
        }
      },
    })
  ).current

  const handleApprove = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    Animated.timing(pan.x, {
      toValue: SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      // Move to next applicant
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
      // Remove applicant from list and move to next
      setApplicants((prevApplicants) => prevApplicants.filter((_, idx) => idx !== currentIndex))
      pan.setValue({ x: 0, y: 0 })
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false })
      }
    })
  }

  if (applicants.length === 0 || currentIndex >= applicants.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>{jobTitle}</Text>
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
                You've reviewed all applicants for this position. Check back later for new applications.
              </Text>
              <Button onPress={() => router.back()} style={{ marginTop: 16, width: '100%' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Back to Dashboard</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </SafeAreaView>
    )
  }

  const currentApplicant = applicants[currentIndex]
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{jobTitle}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            {applicants.length - currentIndex} remaining
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
                        {currentApplicant.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </Text>
                    </AvatarFallback>
                  </Avatar>
                  <Text style={[styles.applicantName, { color: colors.cardForeground }]}>
                    {currentApplicant.name}
                  </Text>
                  <Text style={[styles.applicantEmail, { color: colors.mutedForeground }]}>
                    {currentApplicant.email}
                  </Text>
                </View>

                {/* Applied For Section */}
                <View
                  style={[
                    styles.appliedForSection,
                    {
                      backgroundColor: colors.primary + '15',
                      borderColor: colors.primary + '30',
                    },
                  ]}
                >
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Applied for</Text>
                  <Text style={[styles.appliedForTitle, { color: colors.cardForeground }]}>{jobTitle}</Text>
                  <Text style={[styles.appliedAt, { color: colors.mutedForeground }]}>
                    {currentApplicant.appliedAt}
                  </Text>
                </View>

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Ionicons name="location-outline" size={20} color={colors.mutedForeground} />
                    <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                      {currentApplicant.location}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="briefcase-outline" size={20} color={colors.mutedForeground} />
                    <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                      {currentApplicant.experience} experience
                    </Text>
                  </View>
                </View>

                {/* Skills */}
                <View style={styles.skillsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>Skills</Text>
                  <View style={styles.skillsContainer}>
                    {currentApplicant.skills.map((skill, index) => (
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

                {/* Bio */}
                <View style={styles.bioSection}>
                  <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>About</Text>
                  <Text style={[styles.bioText, { color: colors.mutedForeground }]}>
                    {currentApplicant.bio}
                  </Text>
                </View>

                {/* Swipe Hint */}
                <Text style={[styles.swipeHint, { color: colors.mutedForeground }]}>
                  ← Reject • Swipe • Approve →
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
          style={[styles.aiButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 1.5 }]}
        >
          <Ionicons name="sparkles" size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.aiButtonText, { color: colors.primary }]}>AI</Text>
          <Ionicons name="funnel" size={16} color={colors.primary} style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#10b981' }]}
          onPress={handleApprove}
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  appliedForTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  appliedAt: {
    fontSize: 12,
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
  bioText: {
    fontSize: 14,
    lineHeight: 21,
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
  aiButton: {
    flex: 1.2,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: '700',
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
