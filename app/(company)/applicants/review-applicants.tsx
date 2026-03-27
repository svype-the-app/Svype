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
  Modal,
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
const SWIPE_THRESHOLD = 120
const FLICK_VELOCITY_THRESHOLD = 0.45

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
  const [showUndoModal, setShowUndoModal] = useState(false)
  const [undoTimer, setUndoTimer] = useState(5)
  const [undoApplicant, setUndoApplicant] = useState<Applicant | null>(null)
  const [undoActionType, setUndoActionType] = useState<'approve' | 'reject' | null>(null)
  const [showSectionHint, setShowSectionHint] = useState(true)
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressAnim = useRef(new Animated.Value(0)).current
  const [scrollOffset, setScrollOffset] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [isCardNavigating, setIsCardNavigating] = useState(false)
  const navigationUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const finalizeSwipeAction = () => {
    const action = undoActionType

    if (action === 'approve' || action === 'reject') {
      const indexToRemove = currentIndex
      setApplicants((prevApplicants) => {
        const nextApplicants = prevApplicants.filter((_, idx) => idx !== indexToRemove)
        setCurrentIndex((prevIndex) => {
          if (nextApplicants.length === 0) return 0
          return Math.min(prevIndex, nextApplicants.length - 1)
        })
        return nextApplicants
      })
    }

    setShowUndoModal(false)
    setUndoApplicant(null)
    setUndoActionType(null)
    pan.setValue({ x: 0, y: 0 })

    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false })
    }
  }

  useEffect(() => {
    // Load applicants from mock data
    const data = getApplicantsByJob(jobTitle)
    setApplicants(data)
  }, [jobTitle])

  useEffect(() => {
    if (showUndoModal) {
      setUndoTimer(5)
      progressAnim.setValue(0)
      
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start()

      undoTimerRef.current = setInterval(() => {
        setUndoTimer((prev) => {
          if (prev <= 1) {
            clearInterval(undoTimerRef.current!)
            finalizeSwipeAction()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (undoTimerRef.current) clearInterval(undoTimerRef.current)
      }
    }
  }, [showUndoModal, progressAnim, undoActionType])

  useEffect(() => {
    return () => {
      if (navigationUnlockTimerRef.current) {
        clearTimeout(navigationUnlockTimerRef.current)
      }
    }
  }, [])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // Don't claim gesture immediately
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        // Claim when movement is primarily horizontal but keep vertical scroll natural
        const isHorizontalSwipe = Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2
        return isHorizontalSwipe && !isScrolling && !isCardNavigating
      },
      onPanResponderGrant: () => {
        setIsScrolling(false) // Disable scrolling once we've detected a swipe
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: (_, { dx }) => {
        // Only apply horizontal movement
        pan.x.setValue(dx)
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        pan.flattenOffset();

        const isQuickRightFlick = vx > FLICK_VELOCITY_THRESHOLD && dx > 35
        const isQuickLeftFlick = vx < -FLICK_VELOCITY_THRESHOLD && dx < -35
        const isRightSwipe = dx > SWIPE_THRESHOLD || isQuickRightFlick
        const isLeftSwipe = dx < -SWIPE_THRESHOLD || isQuickLeftFlick
        
        if (isRightSwipe) {
          // Right swipe - APPROVE
          handleApprove()
        } else if (isLeftSwipe) {
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
      onPanResponderTerminate: () => {
        // Reset if gesture is interrupted
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 5,
        }).start()
      },
    })
  ).current

  const handleApprove = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    // Show undo modal instead of immediately moving to next
    const approvedApplicant = applicants[currentIndex]
    setUndoApplicant(approvedApplicant)
    setUndoActionType('approve')
    setShowUndoModal(true)
    
    Animated.timing(pan.x, {
      toValue: SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      // This will only actually move to next if undo timer expires
      // Otherwise user can click undo to restore
    })
  }

  const handleUndoApprove = () => {
    if (undoTimerRef.current) clearInterval(undoTimerRef.current)
    setShowUndoModal(false)
    setUndoApplicant(null)
    setUndoActionType(null)
    // Reset card position
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      friction: 5,
    }).start()
  }

  const handleConfirmApprove = () => {
    if (undoTimerRef.current) clearInterval(undoTimerRef.current)
    finalizeSwipeAction()
  }

  const animateCardNavigation = (direction: 'next' | 'previous') => {
    if (isCardNavigating) return

    setIsCardNavigating(true)
    if (navigationUnlockTimerRef.current) clearTimeout(navigationUnlockTimerRef.current)
    navigationUnlockTimerRef.current = setTimeout(() => {
      setIsCardNavigating(false)
    }, 800)

    const outgoingX = direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH
    const incomingX = direction === 'next' ? SCREEN_WIDTH : -SCREEN_WIDTH

    Animated.timing(pan.x, {
      toValue: outgoingX,
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      setCurrentIndex((prev) =>
        direction === 'next'
          ? Math.min(applicants.length - 1, prev + 1)
          : Math.max(0, prev - 1)
      )

      pan.setValue({ x: incomingX, y: 0 })
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false })
      }

      requestAnimationFrame(() => {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 7,
          tension: 70,
        }).start(() => {
          if (navigationUnlockTimerRef.current) {
            clearTimeout(navigationUnlockTimerRef.current)
            navigationUnlockTimerRef.current = null
          }
          setIsCardNavigating(false)
        })
      })
    })
  }

  const handlePreviousApplicant = async () => {
    if (showUndoModal || isCardNavigating || currentIndex <= 0) return
    await Haptics.selectionAsync()
    animateCardNavigation('previous')
  }

  const handleNextApplicant = async () => {
    if (showUndoModal || isCardNavigating || currentIndex >= applicants.length - 1) return
    await Haptics.selectionAsync()
    animateCardNavigation('next')
  }

  const handleReject = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    const rejectedApplicant = applicants[currentIndex]
    setUndoApplicant(rejectedApplicant)
    setUndoActionType('reject')
    setShowUndoModal(true)

    Animated.timing(pan.x, {
      toValue: -SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      // Wait for undo timer confirmation
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
            {applicants.length} remaining
          </Text>
        </View>
      </View>

      {showSectionHint && (
        <View style={[styles.sectionHint, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '33' }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.sectionHintText, { color: colors.primary }]}>
            Swipe right to accept • left to reject • use Previous/Next buttons to browse
          </Text>
          <TouchableOpacity onPress={() => setShowSectionHint(false)} style={styles.sectionHintClose}>
            <Ionicons name="close" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Swipe Card Container */}
      <View style={[styles.cardContainer, { backgroundColor: colors.background }]}>
        <Animated.View 
          style={[animatedCardStyle, { width: '100%', height: '100%' }]}
          {...panResponder.panHandlers}
        >
          <Card style={[styles.applicantCard, { backgroundColor: colors.card }]}>
            <CardContent style={styles.cardContent}>
              <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={true}
                bounces={true}
                scrollEnabled={true}
                onScrollBeginDrag={() => setIsScrolling(true)}
                onScrollEndDrag={() => setIsScrolling(false)}
                onMomentumScrollEnd={() => setIsScrolling(false)}
                onScroll={(e) => setScrollOffset(e.nativeEvent.contentOffset.y)}
                scrollEventThrottle={16}
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
                opacity: isCardNavigating
                  ? 0
                  : pan.x.interpolate({
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
                opacity: isCardNavigating
                  ? 0
                  : pan.x.interpolate({
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
          style={[
            styles.actionButton,
            styles.navButton,
            (currentIndex <= 0 || showUndoModal) && styles.navButtonDisabled,
          ]}
          onPress={handlePreviousApplicant}
          disabled={currentIndex <= 0 || showUndoModal || isCardNavigating}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={currentIndex <= 0 || showUndoModal ? '#9ca3af' : '#fff'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.filterButton]}
          onPress={() => {
            // AI Filter logic to be implemented
          }}
        >
          <View style={styles.filterIconWrap}>
            <Ionicons name="funnel" size={24} color="#fff" />
            <View style={styles.filterSparkleBadge}>
              <Ionicons name="sparkles" size={12} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.navButton,
            (currentIndex >= applicants.length - 1 || showUndoModal) && styles.navButtonDisabled,
          ]}
          onPress={handleNextApplicant}
          disabled={currentIndex >= applicants.length - 1 || showUndoModal || isCardNavigating}
        >
          <Ionicons
            name="chevron-forward"
            size={28}
            color={
              currentIndex >= applicants.length - 1 || showUndoModal
                ? '#9ca3af'
                : '#fff'
            }
          />
        </TouchableOpacity>
      </View>

      {/* Undo Modal */}
      <Modal
        visible={showUndoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleUndoApprove}
      >
        <View style={styles.undoModalOverlay}>
          <Card style={[styles.undoCard, { backgroundColor: colors.card }]}>
            <CardContent style={styles.undoCardContent}>
              <Text style={[styles.undoTitle, { color: colors.foreground }]}>
                {undoActionType === 'reject' ? 'Applicant Rejected!' : 'Interview Selected!'}
              </Text>
              <Text style={[styles.undoDescription, { color: colors.mutedForeground }]}>
                {undoApplicant?.name}{' '}
                {undoActionType === 'reject' ? 'marked as rejected' : 'selected for interview'}
              </Text>

              {/* Circle Progress Timer */}
              <View style={styles.timerContainer}>
                <Animated.View
                  style={[
                    styles.timerRing,
                    {
                      transform: [
                        {
                          rotate: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.timerRingInner,
                      { borderColor: undoActionType === 'reject' ? '#ef4444' : colors.primary },
                    ]}
                  />
                </Animated.View>
                <View style={[styles.timerCenter, { backgroundColor: colors.card }]}>
                  <Text style={styles.timerText}>{undoTimer}s</Text>
                </View>
              </View>

              <View style={styles.undoButtonsRow}>
                <Button
                  onPress={handleUndoApprove}
                  style={[styles.undoActionButton, { backgroundColor: colors.muted }]}
                >
                  <Text style={[styles.undoActionText, { color: colors.mutedForeground }]}>Undo</Text>
                </Button>
                <Button
                  onPress={handleConfirmApprove}
                  style={[
                    styles.undoActionButton,
                    { backgroundColor: undoActionType === 'reject' ? '#ef4444' : colors.primary },
                  ]}
                >
                  <Text style={[styles.undoActionText, { color: '#fff' }]}>
                    {undoActionType === 'reject' ? 'Reject' : 'Confirm'}
                  </Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        </View>
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
  sectionHint: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHintText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  sectionHintClose: {
    padding: 2,
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
  navButton: {
    backgroundColor: '#334155',
  },
  navButtonDisabled: {
    backgroundColor: '#e5e7eb',
    shadowOpacity: 0,
    elevation: 0,
  },
  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    shadowOpacity: 0,
    elevation: 0,
  },
  filterButton: {
    backgroundColor: '#8b5cf6',
    borderWidth: 0,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  filterIconWrap: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSparkleBadge: {
    position: 'absolute',
    top: -7,
    right: -9,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#c084fc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
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
  undoModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 24,
  },
  undoCard: {
    width: '100%',
    maxWidth: 320,
  },
  undoCardContent: {
    alignItems: 'center',
    gap: 16,
  },
  undoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  undoDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  timerContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  timerRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerRingInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderStyle: 'solid',
  },
  timerCenter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  timerText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  undoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 8,
  },
  undoActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoActionText: {
    fontSize: 14,
    fontWeight: '600',
  },})