import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Colors } from '@/constants/theme'
import { Applicant, getApplicantsByJob } from '@/lib/mock-data'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, { dx, dy }) => {
        pan.flattenOffset();
        
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
            friction: 5,
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
  
  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  })

  const animatedCardStyle = {
    transform: [
      { translateX: pan.x },
      { rotate },
    ],
    opacity: pan.x.interpolate({
      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    }),
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
                  ← Swipe to Reject or Approve →
                </Text>
              </ScrollView>
            </CardContent>
          </Card>

          {/* Swipe Overlays - Approve (Right) */}
          <Animated.View
            style={[
              styles.swipeOverlay,
              {
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                opacity: pan.x.interpolate({
                  inputRange: [0, SWIPE_THRESHOLD],
                  outputRange: [0, 1],
                  extrapolate: 'clamp',
                }),
              },
            ]}
            pointerEvents="none"
          >
            <View style={[styles.swipeIcon, { backgroundColor: '#10b981', transform: [{ rotate: '12deg' }] }]}>
              <Ionicons name="checkmark" size={48} color="#fff" />
            </View>
          </Animated.View>

          {/* Swipe Overlays - Reject (Left) */}
          <Animated.View
            style={[
              styles.swipeOverlay,
              {
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                opacity: pan.x.interpolate({
                  inputRange: [-SWIPE_THRESHOLD, 0],
                  outputRange: [1, 0],
                  extrapolate: 'clamp',
                }),
              },
            ]}
            pointerEvents="none"
          >
            <View style={[styles.swipeIcon, { backgroundColor: '#ef4444', transform: [{ rotate: '-12deg' }] }]}>
              <Ionicons name="close" size={48} color="#fff" />
            </View>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Action Buttons at Bottom */}
      <View style={[styles.actionButtonsContainer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]} 
          onPress={handleReject}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.detailsButton, { borderColor: colors.border }]}
          onPress={() => {
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollTo({ y: 0, animated: true });
            }
          }}
        >
          <Ionicons name="document-text-outline" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={handleApprove}
        >
          <Ionicons name="checkmark" size={28} color="#fff" />
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 16,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    shadowOpacity: 0,
    elevation: 0,
  },
  swipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
