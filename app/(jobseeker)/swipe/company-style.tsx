import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Colors } from '@/constants/theme'
import { useApplications } from '@/lib/applications-context'
import { applicationsApi, Job as ApiJob, jobsApi } from '@/services/api'
import { formatRelativeTime } from '@/utils/time'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SWIPE_THRESHOLD = 120
const FLICK_VELOCITY_THRESHOLD = 0.45
const BUFFER_SIZE = 25

type SwipeJob = {
  id: number
  title: string
  company: string
  location: string
  type: string
  salary_min: number
  salary_max: number
  posted_at: string
  description: string
  requirements: string[]
}

function formatJobType(jobType: string): string {
  if (!jobType) return 'Not specified'
  return jobType
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-')
}

function mapApiJobToSwipeJob(job: ApiJob): SwipeJob {
  const rawJob = job as ApiJob & {
    company?: string | { name?: string }
    company_name?: string
  }

  const companyName =
    rawJob.company_name ||
    (typeof rawJob.company === 'string' ? rawJob.company : rawJob.company?.name) ||
    'Unknown Company'

  const requirements = Array.isArray(rawJob.requirements)
    ? rawJob.requirements
        .filter((req): req is string => typeof req === 'string')
        .map((req) => req.trim())
        .filter(Boolean)
    : []

  return {
    id: rawJob.id,
    title: rawJob.title || 'Untitled Role',
    company: companyName,
    location: rawJob.location || 'Location not specified',
    type: formatJobType(rawJob.job_type || ''),
    salary_min: rawJob.salary_min ?? 0,
    salary_max: rawJob.salary_max ?? 0,
    posted_at: rawJob.posted_at || new Date().toISOString(),
    description: rawJob.description || 'No description provided yet.',
    requirements,
  }
}

// Reject sync used to be a fire-and-forget call with an empty .catch.
// Now that the swipe deck excludes jobs with a SwipeAction (bug #14),
// missing that POST means the rejected job comes back on the next deck
// fetch. Retry once after a 1s delay to survive transient network blips,
// then log if it still fails so it's visible in dev logs / error tracking.
const syncRejectInBackground = async (jobId: number): Promise<void> => {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await jobsApi.swipe(jobId, 'dislike')
      return
    } catch (err) {
      if (attempt === 2) {
        console.warn(`[swipe-sync] failed to sync reject for job ${jobId}:`, err)
        return
      }
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
}

export default function JobSeekerCompanyStyleSwipeScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { invalidate: invalidateApplications } = useApplications()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [jobs, setJobs] = useState<SwipeJob[]>([])
  // bufferedJobs is derived synchronously from `jobs` + `currentIndex` so the
  // render after a swipe-approve uses the up-to-date list immediately (the
  // previous useState+useEffect version showed a stale card for one render).
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pan] = useState(new Animated.ValueXY())
  const scrollViewRef = useRef<ScrollView>(null)
  const [showUndoModal, setShowUndoModal] = useState(false)
  const [undoTimer, setUndoTimer] = useState(5)
  const [undoJob, setUndoJob] = useState<SwipeJob | null>(null)
  const [undoActionType, setUndoActionType] = useState<'approve' | 'reject' | null>(null)
  const [showSectionHint, setShowSectionHint] = useState(true)
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressAnim = useRef(new Animated.Value(0)).current
  const [isScrolling, setIsScrolling] = useState(false)
  // Holdover from the prev/next nav buttons (removed in 218081f). Kept as a
  // permanent `false` so the existing gates / disabled-checks / opacity
  // styles that reference it still compile. Safe to delete entirely along
  // with its remaining references the next time this file gets touched.
  const [isCardNavigating] = useState(false)
  const navigationUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  // Tracks whether the 2.5s minimum spinner has elapsed
  const [minDelayDone, setMinDelayDone] = useState(false)

  const slideAnim = useRef(new Animated.Value(0)).current

  const triggerSlideIn = (fromRight = true) => {
    slideAnim.setValue(fromRight ? SCREEN_WIDTH : -SCREEN_WIDTH)
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: false,
      friction: 8,
      tension: 100,
    }).start()
  }

  // The panResponder is built once via useRef, so its release handler would
  // otherwise close over first-render versions of handleApprove/handleReject
  // (which captured jobs=[] before the load effect ran, so its !approvedJob
  // guard always tripped → card stuck mid-swipe). These refs are re-pointed
  // to the latest handlers on every render so the panResponder always calls
  // the current versions.
  const approveRef = useRef<() => void>(() => {})
  const rejectRef = useRef<() => void>(() => {})

  // Same stale-closure problem applies to the panResponder's gate function,
  // which reads isScrolling / isCardNavigating / isApplying. Those values
  // are captured at first render (all false) and never see updates. This
  // ref holds the latest values and is re-pointed every render below.
  const gateRef = useRef({ isScrolling: false, isCardNavigating: false, isApplying: false })

  const loadSwipeJobs = async () => {
    setLoading(true)
    setMinDelayDone(false)
    setLoadError(null)

    // Minimum 2.5 s spinner — pure UX, runs in parallel with the API call
    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, 2500))

    try {
      const [apiJobs] = await Promise.all([
        jobsApi.getSwipeJobs(),
        minDelay,
      ])
      const mappedJobs = apiJobs.map(mapApiJobToSwipeJob)
      setJobs(mappedJobs)
      setCurrentIndex(0)
    } catch (error: any) {
      await minDelay  // always honour the minimum delay, even on error
      setLoadError(error?.message || 'Could not load jobs. Please try again.')
    } finally {
      setMinDelayDone(true)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSwipeJobs()
  }, [])

  const { bufferedJobs, bufferStartIndex } = useMemo(() => {
    const start = Math.max(0, currentIndex - BUFFER_SIZE)
    const end = Math.min(jobs.length, currentIndex + BUFFER_SIZE + 1)
    return {
      bufferStartIndex: start,
      bufferedJobs: jobs.slice(start, end),
    }
  }, [jobs, currentIndex])

  // Reject path only — approve no longer routes through the undo modal.
  const finalizeSwipeAction = () => {
    const action = undoActionType
    const indexToRemove = currentIndex
    const swipedJob = jobs[indexToRemove]

    if (action === 'reject' && swipedJob) {
      setJobs((prevJobs) => {
        const nextJobs = prevJobs.filter((_, idx) => idx !== indexToRemove)
        setCurrentIndex((prevIndex) => {
          if (nextJobs.length === 0) return 0
          return Math.min(prevIndex, nextJobs.length - 1)
        })
        return nextJobs
      })
      syncRejectInBackground(swipedJob.id)
    }

    setShowUndoModal(false)
    setUndoJob(null)
    setUndoActionType(null)
    pan.setValue({ x: 0, y: 0 })
    triggerSlideIn(true)

    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false })
    }
  }

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
      if (undoTimerRef.current) {
        clearInterval(undoTimerRef.current)
      }
    }
  }, [])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        const flags = gateRef.current
        const isHorizontalSwipe = Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2
        return isHorizontalSwipe && !flags.isScrolling && !flags.isCardNavigating && !flags.isApplying
      },
      onPanResponderGrant: () => {
        slideAnim.stopAnimation()
        slideAnim.setValue(0)
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
          approveRef.current()
        } else if (isLeftSwipe) {
          rejectRef.current()
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
    if (isApplying) return
    const indexToRemove = currentIndex
    const approvedJob = jobs[indexToRemove]
    if (!approvedJob) return

    setIsApplying(true)
    // Fire haptics non-blocking — awaiting on iOS can stall the animation start.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})

    // Defensive: stop any in-flight animation on pan.x and rebase the value
    // so the timing starts from a clean state, regardless of whether we got
    // here from a finger gesture or a button tap.
    pan.x.stopAnimation((currentX) => {
      pan.x.setValue(currentX)

      // Animate the swiped card off-screen. The card must remain in the list
      // during the animation so pan.x drives the swiped card (not the next
      // one underneath). Only on completion do we mutate the list + reset pan.
      Animated.timing(pan.x, {
        toValue: SCREEN_WIDTH * 1.2,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        // Reset pan FIRST so the next card renders centered, then mutate list.
        pan.setValue({ x: 0, y: 0 })
        setJobs((prevJobs) => {
          const nextJobs = prevJobs.filter((_, idx) => idx !== indexToRemove)
          setCurrentIndex((prevIndex) => {
            if (nextJobs.length === 0) return 0
            return Math.min(prevIndex, nextJobs.length - 1)
          })
          return nextJobs
        })
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: false })
        }
        triggerSlideIn(true)
        // Release the gate as soon as the card is gone, NOT when the network
        // call resolves. The apply request continues in the background; the
        // success/failure alert will fire whenever it fires.
        setIsApplying(false)
      })
    })

    // Fire the apply call in parallel with the animation. Result is processed
    // when both the animation and the network call have finished.
    try {
      const result = await applicationsApi.apply(approvedJob.id)
      // Silently refresh the applications cache so the Dashboard reflects
      // the new application without any visible loading on that screen.
      invalidateApplications()
      if (result.requires_quiz && result.quiz) {
        router.push({
          pathname: '/(jobseeker)/swipe/job/pre-screening-quiz',
          params: {
            applicationId: String(result.application_id),
            jobTitle: approvedJob.title,
            quizData: JSON.stringify(result.quiz),
            skillMatch: JSON.stringify(result.skill_match),
          },
        } as any)
      }
      // Silent success: the green-overlay-during-swipe + card-fly-off is
      // enough confirmation. Cover letter info, when present, will live in
      // the Applications tab — no blocking modal interrupts the swipe flow.
    } catch (err: any) {
      const msg = String(err?.message || '')
      // 'Already applied' is silently swallowed (bug #14 will filter these
      // server-side; defensive guard for now). Real failures still surface.
      if (msg.toLowerCase().includes('already applied')) return
      Alert.alert('Apply Failed', msg || 'Could not submit application.')
    }
  }

  const handleUndoAction = () => {
    if (undoTimerRef.current) clearInterval(undoTimerRef.current)
    setShowUndoModal(false)
    setUndoJob(null)
    setUndoActionType(null)

    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      friction: 5,
    }).start()
  }

  const handleConfirmAction = () => {
    if (undoTimerRef.current) clearInterval(undoTimerRef.current)
    finalizeSwipeAction()
  }

  const handleReject = async () => {
    const rejectedJob = jobs[currentIndex]
    if (!rejectedJob) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})

    setUndoJob(rejectedJob)
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

  const handleGoToPrev = () => {
    if (currentIndex <= 0 || jobs.length === 0) return
    Haptics.selectionAsync().catch(() => {})
    pan.setValue({ x: 0, y: 0 })
    scrollViewRef.current?.scrollTo({ y: 0, animated: false })
    setCurrentIndex((prev) => prev - 1)
    triggerSlideIn(false)
  }

  const handleGoToNext = () => {
    if (currentIndex >= jobs.length - 1 || jobs.length === 0) return
    Haptics.selectionAsync().catch(() => {})
    pan.setValue({ x: 0, y: 0 })
    scrollViewRef.current?.scrollTo({ y: 0, animated: false })
    setCurrentIndex((prev) => prev + 1)
    triggerSlideIn(true)
  }

  // Keep the panResponder's call-points + gate flags pointed at the latest
  // values. Runs after every render so the once-built panResponder never
  // invokes a stale closure that captured the first-render state.
  useEffect(() => {
    approveRef.current = handleApprove
    rejectRef.current = handleReject
    gateRef.current = { isScrolling, isCardNavigating, isApplying }
  })

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified'
    if (!min && max) return `Up to £${Math.round(max / 1000)}k`
    if (min && !max) return `From £${Math.round(min / 1000)}k`
    return `£${Math.round((min || 0) / 1000)}k - £${Math.round((max || 0) / 1000)}k`
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ marginLeft: 4, flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Recommended Jobs</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyDescription, { color: colors.mutedForeground, marginTop: 16 }]}>
            Finding your best matches…
          </Text>
        </View>
      </View>
    )
  }

  if (loadError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ marginLeft: 4, flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Recommended Jobs</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Card style={{ width: '100%', maxWidth: 320 }}>
            <CardContent style={styles.emptyContent}>
              <Ionicons name="cloud-offline-outline" size={56} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Failed to Load Jobs</Text>
              <Text style={[styles.emptyDescription, { color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 }]}>
                Couldn&apos;t connect to the server. Check your connection and try again.
              </Text>
              <Button onPress={loadSwipeJobs} style={{ width: '100%' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </View>
    )
  }

  if (jobs.length === 0 || currentIndex >= jobs.length) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
        <View style={[styles.header, { borderBottomColor: colors.border }]}> 
          <View style={{ marginLeft: 4, flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Recommended Jobs</Text>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <Card style={{ width: '100%', maxWidth: 320 }}>
            <CardContent style={styles.emptyContent}>
              <Ionicons name="checkmark-circle" size={64} color={colors.primary} style={{ marginBottom: 16 }} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All Jobs Reviewed!</Text>
              <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>You've reviewed all available jobs. Check back later for new opportunities.</Text>
              <Button onPress={() => { setLoading(true); setLoadError(null); jobsApi.getSwipeJobs().then((apiJobs) => { setJobs(apiJobs.map(mapApiJobToSwipeJob)); setCurrentIndex(0) }).catch((error: any) => setLoadError(error?.message || 'Could not load jobs. Please try again.')).finally(() => setLoading(false)) }} style={{ marginTop: 16, width: '100%' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Reload Jobs</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </View>
    )
  }

  const currentJob = bufferedJobs[currentIndex - bufferStartIndex]

  if (!currentJob) {
    return null
  }

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

  const companyInitials = (currentJob.company || 'Unknown Company')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'UC'

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <View style={{ marginLeft: 4, flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Recommended Jobs</Text>
        </View>
      </View>

      {showSectionHint && (
        <View style={[styles.sectionHint, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '33' }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.sectionHintText, { color: colors.primary }]}>Swipe right to accept • left to reject • use Previous/Next buttons to browse</Text>
          <TouchableOpacity onPress={() => setShowSectionHint(false)} style={styles.sectionHintClose}>
            <Ionicons name="close" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.cardContainer, { backgroundColor: colors.background }]}>
        <Animated.View
          style={{ width: '100%', height: '100%', transform: [{ translateX: slideAnim }] }}
          pointerEvents="box-none"
        >
        <Animated.View style={[animatedCardStyle, { width: '100%', height: '100%' }]} {...panResponder.panHandlers}>
          <Card style={[styles.jobCard, { backgroundColor: colors.card }]}> 
            <CardContent style={styles.cardContent}>
              <View style={styles.cardTimestampWrapper} pointerEvents="none">
                <Text style={[styles.cardTimestamp, { color: colors.mutedForeground }]}>
                  {formatRelativeTime(currentJob.posted_at)}
                </Text>
              </View>
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
                      <Text style={{ fontSize: 34, fontWeight: '700', color: '#fff' }}>{companyInitials}</Text>
                    </AvatarFallback>
                  </Avatar>
                  <Text style={[styles.applicantName, { color: colors.cardForeground }]}>{currentJob.title}</Text>
                  <Text style={[styles.applicantEmail, { color: colors.mutedForeground }]}>{currentJob.company}</Text>
                </View>

                <View
                  style={[
                    styles.appliedForSection,
                    {
                      backgroundColor: colors.primary + '15',
                      borderColor: colors.primary + '30',
                    },
                  ]}
                >
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Employment</Text>
                  <Text style={[styles.appliedForTitle, { color: colors.cardForeground }]}>{currentJob.type}</Text>
                  <Text style={[styles.appliedAt, { color: colors.mutedForeground }]}>Posted {formatRelativeTime(currentJob.posted_at)}</Text>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Ionicons name="location-outline" size={20} color={colors.mutedForeground} />
                    <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{currentJob.location}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="cash-outline" size={20} color={colors.mutedForeground} />
                    <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{formatSalary(currentJob.salary_min, currentJob.salary_max)}</Text>
                  </View>
                </View>

                <View style={styles.skillsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>Requirements</Text>
                  <View style={styles.skillsContainer}>
                    {currentJob.requirements.map((requirement, index) => (
                      <Badge
                        key={`${currentJob.id}-req-${index}`}
                        style={{
                          backgroundColor: colors.secondary,
                          marginBottom: 8,
                          marginRight: 8,
                        }}
                      >
                        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{requirement}</Text>
                      </Badge>
                    ))}
                  </View>
                </View>

                <View style={styles.bioSection}>
                  <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>Job Description</Text>
                  <Text style={[styles.bioText, { color: colors.mutedForeground }]}>{currentJob.description}</Text>
                </View>

                <Text style={[styles.swipeHint, { color: colors.mutedForeground }]}>← Swipe to Reject or Accept →</Text>
              </ScrollView>
            </CardContent>
          </Card>

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
        </Animated.View>
      </View>

      <View style={[styles.actionButtonsContainer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
        {(() => {
          const noJobs = jobs.length === 0
          const navDisabled = noJobs || showUndoModal || isCardNavigating || isApplying
          const prevDisabled = navDisabled || currentIndex <= 0
          const nextDisabled = navDisabled || currentIndex >= jobs.length - 1
          return (
            <>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.navButton,
                  prevDisabled && styles.navButtonDisabled,
                ]}
                onPress={handleGoToPrev}
                disabled={prevDisabled}
              >
                <Ionicons name="chevron-back" size={28} color={prevDisabled ? '#9ca3af' : '#fff'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.aiMatchButton}
                onPress={() => {
                  if (!currentJob) return
                  router.push(
                    `/(jobseeker)/swipe/job/compatibility?jobId=${currentJob.id}` as any
                  )
                }}
              >
                <Ionicons name="funnel" size={26} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.navButton,
                  nextDisabled && styles.navButtonDisabled,
                ]}
                onPress={handleGoToNext}
                disabled={nextDisabled}
              >
                <Ionicons name="chevron-forward" size={28} color={nextDisabled ? '#9ca3af' : '#fff'} />
              </TouchableOpacity>
            </>
          )
        })()}
      </View>

      <Modal visible={showUndoModal} transparent={true} animationType="fade" onRequestClose={handleUndoAction}>
        <View style={styles.undoModalOverlay}>
          <Card style={[styles.undoCard, { backgroundColor: colors.card }]}> 
            <CardContent style={styles.undoCardContent}>
              <Text style={[styles.undoTitle, { color: colors.foreground }]}>
                Job Rejected!
              </Text>
              <Text style={[styles.undoDescription, { color: colors.mutedForeground }]}> 
                {undoJob?.title} at {undoJob?.company} marked as rejected
              </Text>

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
                <Button onPress={handleUndoAction} style={[styles.undoActionButton, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.undoActionText, { color: colors.mutedForeground }]}>Undo</Text>
                </Button>
                <Button
                  onPress={handleConfirmAction}
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

    </View>
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
  jobCard: {
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
    textAlign: 'center',
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
  cardTimestampWrapper: { position: 'absolute', top: 12, right: 12, zIndex: 10 },
  cardTimestamp: { fontSize: 11 },
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
  navButton: {
    backgroundColor: '#334155',
  },
  navButtonDisabled: {
    backgroundColor: '#e5e7eb',
    shadowOpacity: 0,
    elevation: 0,
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  actionButtonDisabled: {
    backgroundColor: '#e5e7eb',
    shadowOpacity: 0,
    elevation: 0,
  },
  aiMatchButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
  },
})
