import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Colors } from '@/constants/theme'
import {
  applicationsApi,
  type ApplicantCard,
  type Job,
  jobsApi,
} from '@/services/api'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
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
  const params = useLocalSearchParams<{ jobId?: string; jobTitle?: string }>()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const paramJobId = Number(params.jobId)
  const paramJobTitle = (params.jobTitle as string) || ''

  // When the screen is opened from the bottom tab there is no jobId param,
  // so we first show a job picker. Selecting a job populates selectedJob
  // and the rest of the screen behaves like a single-job applicant view.
  const [selectedJob, setSelectedJob] = useState<{ id: number; title: string } | null>(
    Number.isFinite(paramJobId) && paramJobId > 0
      ? { id: paramJobId, title: paramJobTitle || 'Applicants' }
      : null
  )
  const jobId = selectedJob?.id
  const jobTitle = selectedJob?.title || 'Applicants'

  // Job-picker state (used only when no job is selected)
  const [myJobs, setMyJobs] = useState<Job[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerError, setPickerError] = useState<string | null>(null)

  // Per-job applicant state — same shape as the original (mock) screen.
  const [currentIndex, setCurrentIndex] = useState(0)
  const [applicants, setApplicants] = useState<ApplicantCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pan] = useState(new Animated.ValueXY())
  const scrollViewRef = useRef<ScrollView>(null)
  const [showUndoModal, setShowUndoModal] = useState(false)
  const [undoTimer, setUndoTimer] = useState(5)
  const [undoApplicant, setUndoApplicant] = useState<ApplicantCard | null>(null)
  const [undoActionType, setUndoActionType] = useState<'approve' | 'reject' | null>(null)
  const [showSectionHint, setShowSectionHint] = useState(true)
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressAnim = useRef(new Animated.Value(0)).current
  const [isScrolling, setIsScrolling] = useState(false)
  const [isCardNavigating, setIsCardNavigating] = useState(false)
  const navigationUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cover letter modal
  const [coverModalText, setCoverModalText] = useState<string | null>(null)
  const [coverModalName, setCoverModalName] = useState<string>('')

  // Back arrow: pop route if we came in with a URL param; otherwise return
  // to the picker so the user can choose another job.
  const handleBack = () => {
    const cameViaUrl = Number.isFinite(paramJobId) && paramJobId > 0
    if (selectedJob && !cameViaUrl) {
      setSelectedJob(null)
    } else {
      router.back()
    }
  }

  const finalizeSwipeAction = () => {
    const action = undoActionType
    const target = undoApplicant

    if ((action === 'approve' || action === 'reject') && target) {
      const newStatus = action === 'approve' ? 'shortlisted' : 'rejected'
      applicationsApi.updateStatus(target.application_id, newStatus).catch(() => {
        // Keep UI consistent (already removed); user can refresh if needed.
      })
      setApplicants((prev) => prev.filter((a) => a.application_id !== target.application_id))
      setCurrentIndex((prev) => {
        const remainingLen = applicants.length - 1
        if (remainingLen <= 0) return 0
        return Math.min(prev, remainingLen - 1)
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

  // ── Load applicants for the selected job ───────────────────────────────
  useEffect(() => {
    let cancelled = false
    if (!jobId) {
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    applicationsApi
      .getApplicants(jobId)
      .then((data) => {
        if (cancelled) return
        setApplicants(data)
        setCurrentIndex(0)
      })
      .catch((err: any) => {
        if (cancelled) return
        setError(err?.message ?? 'Could not load applicants.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [jobId])

  // ── Picker mode: load the company's jobs to choose from ────────────────
  useEffect(() => {
    if (selectedJob) return
    let cancelled = false
    setPickerLoading(true)
    setPickerError(null)
    jobsApi
      .getMyJobs()
      .then((data) => {
        if (cancelled) return
        setMyJobs(data)
      })
      .catch((err: any) => {
        if (cancelled) return
        setPickerError(err?.message ?? 'Could not load your jobs.')
      })
      .finally(() => {
        if (!cancelled) setPickerLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedJob])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUndoModal, progressAnim, undoActionType])

  useEffect(() => {
    return () => {
      if (navigationUnlockTimerRef.current) {
        clearTimeout(navigationUnlockTimerRef.current)
      }
      if (undoTimerRef.current) {
        clearInterval(undoTimerRef.current)
      }
    }
  }, [])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        const isHorizontalSwipe = Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2
        return isHorizontalSwipe && !isScrolling && !isCardNavigating
      },
      onPanResponderGrant: () => {
        setIsScrolling(false)
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        })
      },
      onPanResponderMove: (_, { dx }) => {
        pan.x.setValue(dx)
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        pan.flattenOffset()

        const isQuickRightFlick = vx > FLICK_VELOCITY_THRESHOLD && dx > 35
        const isQuickLeftFlick = vx < -FLICK_VELOCITY_THRESHOLD && dx < -35
        const isRightSwipe = dx > SWIPE_THRESHOLD || isQuickRightFlick
        const isLeftSwipe = dx < -SWIPE_THRESHOLD || isQuickLeftFlick

        if (isRightSwipe) {
          handleApprove()
        } else if (isLeftSwipe) {
          handleReject()
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
          }).start()
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 5,
        }).start()
      },
    })
  ).current

  const handleApprove = async () => {
    const approvedApplicant = applicants[currentIndex]
    if (!approvedApplicant) return
    // Fire haptics non-blocking — awaiting can stall the animation start.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})

    setUndoApplicant(approvedApplicant)
    setUndoActionType('approve')
    setShowUndoModal(true)

    // Defensive: rebase pan.x from whatever state the finger gesture left it.
    pan.x.stopAnimation((currentX) => {
      pan.x.setValue(currentX)
      Animated.timing(pan.x, {
        toValue: SCREEN_WIDTH * 1.2,
        duration: 300,
        useNativeDriver: false,
      }).start()
    })
  }

  const handleUndoApprove = () => {
    if (undoTimerRef.current) clearInterval(undoTimerRef.current)
    setShowUndoModal(false)
    setUndoApplicant(null)
    setUndoActionType(null)
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
    const rejectedApplicant = applicants[currentIndex]
    if (!rejectedApplicant) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})

    setUndoApplicant(rejectedApplicant)
    setUndoActionType('reject')
    setShowUndoModal(true)

    pan.x.stopAnimation((currentX) => {
      pan.x.setValue(currentX)
      Animated.timing(pan.x, {
        toValue: -SCREEN_WIDTH * 1.2,
        duration: 300,
        useNativeDriver: false,
      }).start()
    })
  }

  const formatAppliedAt = (iso: string) => {
    try {
      const d = new Date(iso)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 0) return 'Applied today'
      if (diffDays === 1) return 'Applied yesterday'
      if (diffDays < 7) return `Applied ${diffDays} days ago`
      return `Applied ${d.toLocaleDateString()}`
    } catch {
      return iso
    }
  }

  // ── PICKER MODE ────────────────────────────────────────────────────────
  if (!selectedJob) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} hitSlop={8}>
            <Ionicons name="chevron-back" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Applicants</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              Pick a job to review
            </Text>
          </View>
        </View>

        {pickerLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.emptyDescription, { color: colors.mutedForeground, marginTop: 12 }]}>
              Loading your jobs...
            </Text>
          </View>
        ) : pickerError ? (
          <View style={styles.emptyContainer}>
            <Card style={{ width: '100%', maxWidth: 320 }}>
              <CardContent style={styles.emptyContent}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  Couldn&apos;t load jobs
                </Text>
                <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
                  {pickerError}
                </Text>
              </CardContent>
            </Card>
          </View>
        ) : myJobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Card style={{ width: '100%', maxWidth: 320 }}>
              <CardContent style={styles.emptyContent}>
                <Ionicons name="briefcase-outline" size={64} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No jobs posted yet</Text>
                <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
                  Post a job from the Post tab to start receiving applicants.
                </Text>
              </CardContent>
            </Card>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.pickerScroll}>
            {myJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                onPress={() => setSelectedJob({ id: job.id, title: job.title })}
                style={[styles.pickerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickerTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {job.title}
                  </Text>
                  <Text style={[styles.pickerSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {job.location || 'No location'} • {job.job_type}
                  </Text>
                  <Text style={[styles.pickerCount, { color: colors.primary }]}>
                    {job.applicants_count ?? 0} applicant
                    {(job.applicants_count ?? 0) === 1 ? '' : 's'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    )
  }

  // ── LOADING STATE (per-job) ────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} hitSlop={8}>
            <Ionicons name="chevron-back" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
              {jobTitle}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>Loading…</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  // ── ERROR STATE ────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} hitSlop={8}>
            <Ionicons name="chevron-back" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
              {jobTitle}
            </Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Card style={{ width: '100%', maxWidth: 320 }}>
            <CardContent style={styles.emptyContent}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Couldn&apos;t load applicants
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>{error}</Text>
            </CardContent>
          </Card>
        </View>
      </SafeAreaView>
    )
  }

  // ── EMPTY ──────────────────────────────────────────────────────────────
  if (applicants.length === 0 || currentIndex >= applicants.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} hitSlop={8}>
            <Ionicons name="chevron-back" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
              {jobTitle}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>0 remaining</Text>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <Card style={{ width: '100%', maxWidth: 320 }}>
            <CardContent style={styles.emptyContent}>
              <Ionicons name="checkmark-circle" size={64} color={colors.primary} style={{ marginBottom: 16 }} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All Reviewed!</Text>
              <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
                You&apos;ve reviewed all applicants for this position. Check back later for new applications.
              </Text>
              <Button onPress={handleBack} style={{ marginTop: 16, width: '100%' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Back</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </SafeAreaView>
    )
  }

  // ── MAIN SWIPE CARD ────────────────────────────────────────────────────
  const currentApplicant = applicants[currentIndex]
  const initials =
    (currentApplicant.applicant.full_name || '?')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'

  const experienceText =
    typeof currentApplicant.applicant.total_years_experience === 'number'
      ? `${currentApplicant.applicant.total_years_experience} year${
          currentApplicant.applicant.total_years_experience === 1 ? '' : 's'
        } experience`
      : 'Experience not specified'

  const bioText =
    currentApplicant.applicant.about ||
    currentApplicant.applicant.headline ||
    'No bio provided.'

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  })

  const animatedCardStyle = {
    transform: [{ translateX: pan.x }, { rotate }],
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
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {jobTitle}
          </Text>
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
                      <Text style={{ fontSize: 36, fontWeight: '700', color: '#fff' }}>{initials}</Text>
                    </AvatarFallback>
                  </Avatar>
                  <Text style={[styles.applicantName, { color: colors.cardForeground }]}>
                    {currentApplicant.applicant.full_name}
                  </Text>
                  {!!currentApplicant.applicant.email && (
                    <Text style={[styles.applicantEmail, { color: colors.mutedForeground }]}>
                      {currentApplicant.applicant.email}
                    </Text>
                  )}
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
                    {formatAppliedAt(currentApplicant.applied_at)}
                  </Text>
                </View>

                {/* Quiz Score badge */}
                <View style={styles.scoreRow}>
                  {currentApplicant.quiz_score !== null ? (
                    <View style={[styles.scorePill, { backgroundColor: '#7c3aed' }]}>
                      <Ionicons name="trophy" size={14} color="#fff" />
                      <Text style={styles.scorePillText}>Quiz score: {currentApplicant.quiz_score}%</Text>
                    </View>
                  ) : (
                    <View style={[styles.scorePill, { backgroundColor: colors.muted }]}>
                      <Ionicons name="help-circle-outline" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.scorePillText, { color: colors.mutedForeground }]}>No quiz</Text>
                    </View>
                  )}
                </View>

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Ionicons name="location-outline" size={20} color={colors.mutedForeground} />
                    <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                      {currentApplicant.applicant.location || 'Location not specified'}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="briefcase-outline" size={20} color={colors.mutedForeground} />
                    <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{experienceText}</Text>
                  </View>
                  {!!currentApplicant.applicant.current_job_title && (
                    <View style={styles.infoItem}>
                      <Ionicons name="person-outline" size={20} color={colors.mutedForeground} />
                      <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                        {currentApplicant.applicant.current_job_title}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Skills */}
                <View style={styles.skillsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>Skills</Text>
                  <View style={styles.skillsContainer}>
                    {(currentApplicant.applicant.skills || []).length === 0 ? (
                      <Text style={[styles.bioText, { color: colors.mutedForeground }]}>
                        No skills listed.
                      </Text>
                    ) : (
                      (currentApplicant.applicant.skills || []).map((skill, index) => (
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
                      ))
                    )}
                  </View>
                </View>

                {/* Cover Letter */}
                {!!currentApplicant.cover_letter && (
                  <View style={styles.bioSection}>
                    <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>Cover Letter</Text>
                    <Text style={[styles.bioText, { color: colors.mutedForeground }]} numberOfLines={4}>
                      {currentApplicant.cover_letter}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setCoverModalText(currentApplicant.cover_letter)
                        setCoverModalName(currentApplicant.applicant.full_name)
                      }}
                    >
                      <Text style={[styles.readMore, { color: colors.primary }]}>Read full letter →</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Bio */}
                <View style={styles.bioSection}>
                  <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>About</Text>
                  <Text style={[styles.bioText, { color: colors.mutedForeground }]}>{bioText}</Text>
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
        {(() => {
          const noApplicants = applicants.length === 0
          const disabled = noApplicants || showUndoModal || isCardNavigating
          return (
            <>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.rejectButton,
                  disabled && styles.actionButtonDisabled,
                ]}
                onPress={handleReject}
                disabled={disabled}
              >
                <Ionicons name="close" size={28} color={disabled ? '#9ca3af' : '#fff'} />
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
                  styles.approveButton,
                  disabled && styles.actionButtonDisabled,
                ]}
                onPress={handleApprove}
                disabled={disabled}
              >
                <Ionicons name="checkmark" size={28} color={disabled ? '#9ca3af' : '#fff'} />
              </TouchableOpacity>
            </>
          )
        })()}
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
                {undoApplicant?.applicant.full_name}{' '}
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

      {/* Full cover letter modal */}
      <Modal
        visible={!!coverModalText}
        transparent
        animationType="fade"
        onRequestClose={() => setCoverModalText(null)}
      >
        <View style={styles.undoModalOverlay}>
          <Card style={[styles.coverModalCard, { backgroundColor: colors.card }]}>
            <CardContent>
              <View style={styles.coverModalHeader}>
                <Text style={[styles.coverModalTitle, { color: colors.foreground }]}>
                  {coverModalName}&apos;s cover letter
                </Text>
                <TouchableOpacity onPress={() => setCoverModalText(null)} hitSlop={8}>
                  <Ionicons name="close" size={22} color={colors.foreground} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 360 }}>
                <Text style={[styles.coverModalText, { color: colors.foreground }]}>
                  {coverModalText}
                </Text>
              </ScrollView>
            </CardContent>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
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
  cardContent: { flex: 1, padding: 0 },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  applicantName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  applicantEmail: { fontSize: 14 },
  appliedForSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  appliedForTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  appliedAt: { fontSize: 12 },
  scoreRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  scorePillText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  infoGrid: { marginHorizontal: 16, marginBottom: 16, gap: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14 },
  skillsSection: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  bioSection: { marginHorizontal: 16, marginBottom: 16 },
  bioText: { fontSize: 14, lineHeight: 21 },
  readMore: { fontSize: 13, fontWeight: '700', marginTop: 6 },
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
  sectionHintText: { flex: 1, fontSize: 12, fontWeight: '500' },
  sectionHintClose: { padding: 2 },
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
  navButton: { backgroundColor: '#334155' },
  navButtonDisabled: { backgroundColor: '#e5e7eb', shadowOpacity: 0, elevation: 0 },
  rejectButton: { backgroundColor: '#ef4444' },
  approveButton: { backgroundColor: '#10b981' },
  actionButtonDisabled: { backgroundColor: '#e5e7eb', shadowOpacity: 0, elevation: 0 },
  filterButton: {
    backgroundColor: '#8b5cf6',
    borderWidth: 0,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  filterIconWrap: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
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
  emptyContent: { alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyDescription: { fontSize: 14, textAlign: 'center' },
  undoModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 24,
  },
  undoCard: { width: '100%', maxWidth: 320 },
  undoCardContent: { alignItems: 'center', gap: 16 },
  undoTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  undoDescription: { fontSize: 14, textAlign: 'center' },
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
  timerText: { fontSize: 36, fontWeight: '700', color: '#fff' },
  undoButtonsRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 8 },
  undoActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoActionText: { fontSize: 14, fontWeight: '600' },

  // Cover-letter modal
  coverModalCard: { width: '100%', maxWidth: 420 },
  coverModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  coverModalTitle: { fontSize: 16, fontWeight: '700', flex: 1, paddingRight: 8 },
  coverModalText: { fontSize: 14, lineHeight: 21 },

  // Picker
  pickerScroll: { padding: 16, gap: 12 },
  pickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  pickerTitle: { fontSize: 16, fontWeight: '700' },
  pickerSubtitle: { fontSize: 12, marginTop: 2 },
  pickerCount: { fontSize: 13, fontWeight: '700', marginTop: 6 },
})
