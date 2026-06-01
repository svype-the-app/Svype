import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Colors } from '@/constants/theme'
import { invalidateCache } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import { useApplications } from '@/lib/use-applications'
import { applicationsApi, Job as ApiJob, jobsApi } from '@/services/api'
import { formatRelativeTime } from '@/utils/time'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SWIPE_THRESHOLD = 120
// Reanimated/Gesture-Handler report velocity in px/s (PanResponder used px/ms),
// so the old 0.45 px/ms flick threshold becomes 450 px/s.
const FLICK_VELOCITY_PX = 450
const SWIPE_OFF_DURATION = 260
const BUFFER_SIZE = 25
const UNDO_WINDOW_MS = 5000

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
  has_questions: boolean
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
    has_questions: Boolean(rawJob.has_questions),
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

const computeInitials = (name: string): string =>
  (name || 'Unknown Company')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'UC'

export default function JobSeekerCompanyStyleSwipeScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { invalidate: invalidateApplications } = useApplications()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [jobs, setJobs] = useState<SwipeJob[]>([])
  const scrollViewRef = useRef<ScrollView>(null)
  const [showSectionHint, setShowSectionHint] = useState(true)

  // ── Reanimated drivers (UI thread) ───────────────────────────────────────
  // translateX: live horizontal drag of the TOP card.
  // enterX: one-shot slide-in offset used when a new card (job / confirm) takes
  //         the top slot, so it glides in instead of popping.
  const translateX = useSharedValue(0)
  const enterX = useSharedValue(0)
  // undoBar: 1 → 0 width fraction for the reject snackbar's countdown bar.
  const undoBar = useSharedValue(0)

  // Dismissable toast (e.g. the "quiz lives in your dashboard" message).
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Confirmation card ─────────────────────────────────────────────────────
  // Right-swipe / Accept on a job card shows this one quick "Apply to this job?"
  // card. Confirming applies immediately (the backend generates the cover
  // letter); the user reviews the cover letter + resume later in the Dashboard.
  const [confirmJob, setConfirmJob] = useState<SwipeJob | null>(null)
  const [confirmApplying, setConfirmApplying] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  // ── Reject undo snackbar ──────────────────────────────────────────────────
  // A reject removes the card optimistically and shows a non-blocking snackbar.
  // The backend sync is deferred until the 5s window lapses, so Undo just
  // cancels the timer and re-inserts the card at its original position.
  const [undoJob, setUndoJob] = useState<SwipeJob | null>(null)
  const pendingRejectRef = useRef<{ job: SwipeJob; index: number } | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToastMessage(message)
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 6000)
  }

  // Glide a freshly-promoted top card in from the given side.
  const triggerSlideIn = (fromRight = true) => {
    enterX.value = fromRight ? SCREEN_WIDTH : -SCREEN_WIDTH
    enterX.value = withSpring(0, { damping: 20, stiffness: 150, overshootClamping: true })
  }

  // Fly the current top card off-screen in the given direction, then run the
  // follow-up on the JS thread once the animation settles.
  const animateOff = (toRight: boolean, after: () => void) => {
    translateX.value = withTiming(
      (toRight ? 1 : -1) * SCREEN_WIDTH * 1.2,
      { duration: SWIPE_OFF_DURATION },
      (finished) => {
        if (finished) runOnJS(after)()
      },
    )
  }

  // ── Swipe deck data (TanStack Query) ──────────────────────────────────
  // The deck is fetched once and cached + persisted to AsyncStorage, so the
  // screen renders instantly from cache (even offline) on subsequent opens.
  // `jobs` (above) is the mutable working copy that cards are removed from as
  // the user swipes; we seed it from the query whenever a fresh deck arrives.
  const swipeQuery = useQuery({
    queryKey: queryKeys.jobs.swipe(),
    queryFn: jobsApi.getSwipeJobs,
  })
  const hasDeckData = swipeQuery.data !== undefined
  const loading = !hasDeckData && (swipeQuery.isPending || swipeQuery.isFetching)
  const loadError = !hasDeckData && swipeQuery.isError && !swipeQuery.isFetching

  useEffect(() => {
    if (swipeQuery.data) {
      setJobs(swipeQuery.data.map(mapApiJobToSwipeJob))
      setCurrentIndex(0)
    }
  }, [swipeQuery.data])

  const { bufferedJobs, bufferStartIndex } = useMemo(() => {
    const start = Math.max(0, currentIndex - BUFFER_SIZE)
    const end = Math.min(jobs.length, currentIndex + BUFFER_SIZE + 1)
    return {
      bufferStartIndex: start,
      bufferedJobs: jobs.slice(start, end),
    }
  }, [jobs, currentIndex])

  // Flush a pending reject immediately (commit the backend sync now). Used when
  // a second reject happens before the first undo window lapses, and on unmount.
  const flushPendingReject = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }
    const pending = pendingRejectRef.current
    pendingRejectRef.current = null
    if (pending) syncRejectInBackground(pending.job.id)
  }

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      // Don't strand an un-synced reject if the screen unmounts mid-window.
      const pending = pendingRejectRef.current
      if (pending) syncRejectInBackground(pending.job.id)
    }
  }, [])

  // Fly the confirm card off to the right, then drop the job from the deck and
  // advance to the next card.
  const advanceDeckAfterApply = (jobId: number) => {
    animateOff(true, () => {
      setConfirmJob(null)
      setConfirmApplying(false)
      setConfirmError(null)
      setJobs((prevJobs) => {
        const idx = prevJobs.findIndex((j) => j.id === jobId)
        if (idx === -1) return prevJobs
        const nextJobs = prevJobs.filter((_, i) => i !== idx)
        setCurrentIndex((prevIndex) => {
          if (nextJobs.length === 0) return 0
          return Math.min(prevIndex, nextJobs.length - 1)
        })
        return nextJobs
      })
      translateX.value = 0
      scrollViewRef.current?.scrollTo({ y: 0, animated: false })
      triggerSlideIn(true)
    })
  }

  // ── Confirmation card ─────────────────────────────────────────────────────
  // Right swipe / Accept on a JOB card → fly it off, then show the confirm card.
  const handleShowConfirmation = () => {
    const job = jobs[currentIndex]
    if (!job || confirmJob) return
    Haptics.selectionAsync().catch(() => {})
    animateOff(true, () => {
      translateX.value = 0
      setConfirmApplying(false)
      setConfirmError(null)
      setConfirmJob(job)
      scrollViewRef.current?.scrollTo({ y: 0, animated: false })
      triggerSlideIn(true)
    })
  }

  // Confirm (button or right-swipe) → submit the application. The backend
  // generates the cover letter; everything else lives in the Dashboard.
  const handleConfirmApply = async () => {
    if (!confirmJob || confirmApplying) return
    const job = confirmJob
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    setConfirmApplying(true)
    setConfirmError(null)
    // Spring the card back to centre while the request is in flight.
    translateX.value = withSpring(0, { damping: 20, stiffness: 220, overshootClamping: true })

    try {
      const result = await applicationsApi.apply(job.id)
      // Refresh the dashboard; and the quiz history if this job is quiz-gated.
      invalidateApplications()
      if (job.has_questions) invalidateCache.quizHistory()
      if (result.requires_quiz) {
        showToast('This job requires a quiz. You can take it from your Dashboard → Quizzes.')
      }
      advanceDeckAfterApply(job.id)
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (msg.toLowerCase().includes('already applied')) {
        advanceDeckAfterApply(job.id)
        return
      }
      setConfirmError(msg || 'Could not submit application. Please try again.')
      setConfirmApplying(false)
    }
  }

  // Cancel (button or left-swipe) → return to the same job card, no API call.
  const handleCancelConfirmation = () => {
    if (!confirmJob || confirmApplying) return
    Haptics.selectionAsync().catch(() => {})
    animateOff(false, () => {
      setConfirmJob(null)
      setConfirmError(null)
      translateX.value = 0
      triggerSlideIn(false)
    })
  }

  // ── Reject + undo snackbar ────────────────────────────────────────────────
  const handleReject = () => {
    const rejectedJob = jobs[currentIndex]
    if (!rejectedJob) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
    const index = currentIndex
    animateOff(false, () => finalizeRejectVisual(rejectedJob, index))
  }

  const finalizeRejectVisual = (job: SwipeJob, index: number) => {
    // A new reject before the previous window lapsed → commit the old one now.
    flushPendingReject()

    setJobs((prevJobs) => {
      const nextJobs = prevJobs.filter((_, idx) => idx !== index)
      setCurrentIndex((prevIndex) => {
        if (nextJobs.length === 0) return 0
        return Math.min(prevIndex, nextJobs.length - 1)
      })
      return nextJobs
    })
    translateX.value = 0
    scrollViewRef.current?.scrollTo({ y: 0, animated: false })

    // Arm the undo window. Backend sync is deferred until it lapses.
    pendingRejectRef.current = { job, index }
    setUndoJob(job)
    undoBar.value = 1
    undoBar.value = withTiming(0, { duration: UNDO_WINDOW_MS })
    undoTimerRef.current = setTimeout(() => {
      undoTimerRef.current = null
      setUndoJob(null)
      const pending = pendingRejectRef.current
      pendingRejectRef.current = null
      if (pending) syncRejectInBackground(pending.job.id)
    }, UNDO_WINDOW_MS)
  }

  const handleUndoReject = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }
    const pending = pendingRejectRef.current
    pendingRejectRef.current = null
    setUndoJob(null)
    undoBar.value = 0
    if (!pending) return

    Haptics.selectionAsync().catch(() => {})
    // Re-insert the rejected job at its original position and return to it.
    setJobs((prevJobs) => {
      const next = [...prevJobs]
      next.splice(Math.min(pending.index, next.length), 0, pending.job)
      return next
    })
    setCurrentIndex(pending.index)
    translateX.value = 0
    scrollViewRef.current?.scrollTo({ y: 0, animated: false })
    triggerSlideIn(false)
  }

  // Route a completed swipe to the right handler for the current card mode.
  // These closures are rebuilt every render, and the Gesture object below is
  // too, so there is no stale-closure problem (the old PanResponder needed refs
  // to work around exactly this).
  const onSwipeRight = () => {
    if (confirmJob) handleConfirmApply()
    else handleShowConfirmation()
  }
  const onSwipeLeft = () => {
    if (confirmJob) handleCancelConfirmation()
    else handleReject()
  }

  const gestureEnabled = !confirmApplying

  // activeOffsetX lets a vertical drag fall through to the inner ScrollView
  // (job description) while still claiming horizontal swipes for the card.
  const panGesture = Gesture.Pan()
    .enabled(gestureEnabled)
    .activeOffsetX([-12, 12])
    .onUpdate((e) => {
      translateX.value = e.translationX
    })
    .onEnd((e) => {
      const isRight =
        e.translationX > SWIPE_THRESHOLD ||
        (e.velocityX > FLICK_VELOCITY_PX && e.translationX > 35)
      const isLeft =
        e.translationX < -SWIPE_THRESHOLD ||
        (e.velocityX < -FLICK_VELOCITY_PX && e.translationX < -35)

      if (isRight) {
        runOnJS(onSwipeRight)()
      } else if (isLeft) {
        runOnJS(onSwipeLeft)()
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 220, overshootClamping: true })
      }
    })

  // ── Animated styles ───────────────────────────────────────────────────────
  const enterStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: enterX.value }],
  }))

  const topCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-10, 0, 10],
      Extrapolation.CLAMP,
    )
    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, SCREEN_WIDTH],
      [1, 0.5],
      Extrapolation.CLAMP,
    )
    return {
      transform: [{ translateX: translateX.value }, { rotate: `${rotate}deg` }],
      opacity,
    }
  })

  // The card peeking behind scales up and fades in as the top card is dragged.
  const behindCardStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    )
    return {
      transform: [{ scale: 0.94 + 0.06 * progress }],
      opacity: 0.55 + 0.45 * progress,
    }
  })

  const approveOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }))
  const rejectOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }))
  const undoBarStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, undoBar.value)) * 100}%`,
  }))

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified'
    if (!min && max) return `Up to ₨${Math.round(max / 1000)}k`
    if (min && !max) return `From ₨${Math.round(min / 1000)}k`
    return `₨${Math.round((min || 0) / 1000)}k - ₨${Math.round((max || 0) / 1000)}k`
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
              <Button onPress={() => swipeQuery.refetch()} style={{ width: '100%' }}>
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
              <Button onPress={() => swipeQuery.refetch()} style={{ marginTop: 16, width: '100%' }}>
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

  // The card peeking behind the top one — only shown on a plain job card (not
  // while the confirm card is up).
  const nextJob = !confirmJob ? bufferedJobs[currentIndex + 1 - bufferStartIndex] : undefined

  const companyInitials = computeInitials(currentJob.company)

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ marginLeft: 4, flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Recommended Jobs</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (!currentJob || confirmJob) return
            router.push(`/(jobseeker)/swipe/job/compatibility?jobId=${currentJob.id}` as any)
          }}
          disabled={!!confirmJob}
          hitSlop={8}
          style={[styles.headerAiBtn, { borderColor: colors.border }, !!confirmJob && { opacity: 0.4 }]}
        >
          <Ionicons name="sparkles" size={18} color="#7c3aed" />
        </TouchableOpacity>
      </View>

      {showSectionHint && (
        <View style={[styles.sectionHint, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '33' }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.sectionHintText, { color: colors.primary }]}>Swipe right to apply • left to reject • manage everything in your Dashboard</Text>
          <TouchableOpacity onPress={() => setShowSectionHint(false)} style={styles.sectionHintClose}>
            <Ionicons name="close" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.cardContainer, { backgroundColor: colors.background }]}>
        <View style={styles.cardStack}>
          {/* Peek of the next card behind the top one */}
          {nextJob ? (
            <Animated.View style={[styles.cardStackLayer, behindCardStyle]} pointerEvents="none">
              <Card style={[styles.jobCard, { backgroundColor: colors.card }]}>
                <CardContent style={styles.cardContent}>
                  <View style={styles.behindCardInner}>
                    <Avatar size={72} style={{ marginBottom: 12, borderWidth: 3, borderColor: colors.primary }}>
                      <AvatarFallback
                        style={{
                          backgroundColor: colors.primary,
                          width: 72,
                          height: 72,
                          borderRadius: 36,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 26, fontWeight: '700', color: '#fff' }}>{computeInitials(nextJob.company)}</Text>
                      </AvatarFallback>
                    </Avatar>
                    <Text style={[styles.applicantName, { color: colors.cardForeground }]} numberOfLines={2}>{nextJob.title}</Text>
                    <Text style={[styles.applicantEmail, { color: colors.mutedForeground }]} numberOfLines={1}>{nextJob.company}</Text>
                    <Text style={[styles.behindCardType, { color: colors.mutedForeground }]} numberOfLines={1}>{nextJob.type}</Text>
                  </View>
                </CardContent>
              </Card>
            </Animated.View>
          ) : null}

          {/* Top card (slide-in wrapper → drag/rotate layer → gesture) */}
          <Animated.View style={[styles.cardStackLayer, enterStyle]} pointerEvents="box-none">
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[topCardStyle, { width: '100%', height: '100%' }]}>
                {confirmJob ? (
                  <Card style={[styles.jobCard, { backgroundColor: colors.card }]}>
                    <CardContent style={styles.cardContent}>
                      <View style={styles.confirmCardInner}>
                        <Text style={[styles.applicantName, { color: colors.cardForeground }]} numberOfLines={2}>
                          {confirmJob.title}
                        </Text>
                        <Text style={[styles.confirmCompany, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {confirmJob.company}
                        </Text>
                        <Text style={[styles.confirmPrompt, { color: colors.cardForeground }]}>Apply to this job?</Text>
                        <Text style={[styles.confirmNote, { color: colors.mutedForeground }]}>
                          We&apos;ll attach your resume and a tailored cover letter — review them anytime from your Dashboard.
                        </Text>
                        {confirmJob.has_questions ? (
                          <View style={styles.confirmQuizRow}>
                            <Ionicons name="help-circle" size={16} color="#f59e0b" />
                            <Text style={[styles.confirmQuizText, { color: colors.mutedForeground }]}>
                              Includes a quiz you can take from your Dashboard.
                            </Text>
                          </View>
                        ) : null}
                        {confirmError ? (
                          <Text style={styles.confirmErrorText}>{confirmError}</Text>
                        ) : null}
                        {confirmApplying ? (
                          <View style={styles.confirmApplyingRow}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={[styles.confirmApplyingText, { color: colors.mutedForeground }]}>Submitting…</Text>
                          </View>
                        ) : (
                          <View style={styles.confirmButtonsRow}>
                            <Button onPress={handleCancelConfirmation} style={[styles.confirmCardButton, { backgroundColor: colors.muted }]}>
                              <Text style={[styles.undoActionText, { color: colors.mutedForeground }]}>Cancel</Text>
                            </Button>
                            <Button onPress={handleConfirmApply} style={[styles.confirmCardButton, { backgroundColor: colors.primary }]}>
                              <Text style={[styles.undoActionText, { color: '#fff' }]}>Confirm</Text>
                            </Button>
                          </View>
                        )}
                        <Text style={[styles.confirmInstructions, { color: colors.mutedForeground }]}>
                          Swipe right to apply · Swipe left to cancel
                        </Text>
                      </View>
                    </CardContent>
                  </Card>
                ) : (
                  <Card style={[styles.jobCard, { backgroundColor: colors.card }]}>
                    <CardContent style={styles.cardContent}>
                      {currentJob.has_questions ? (
                        <View style={styles.quizBadgeWrapper} pointerEvents="none">
                          <View style={styles.quizBadge}>
                            <Ionicons name="help-circle" size={12} color="#fff" />
                            <Text style={styles.quizBadgeText}>Includes Quiz</Text>
                          </View>
                        </View>
                      ) : null}
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

                        <Text style={[styles.swipeHint, { color: colors.mutedForeground }]}>← Swipe to Reject or Apply →</Text>
                      </ScrollView>
                    </CardContent>
                  </Card>
                )}

                <Animated.View
                  style={[
                    styles.swipeOverlay,
                    { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                    approveOverlayStyle,
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
                    { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                    rejectOverlayStyle,
                  ]}
                  pointerEvents="none"
                >
                  <View style={[styles.swipeIcon, { backgroundColor: '#ef4444', transform: [{ rotate: '-12deg' }] }]}>
                    <Ionicons name="close" size={48} color="#fff" />
                  </View>
                </Animated.View>
              </Animated.View>
            </GestureDetector>
          </Animated.View>
        </View>
      </View>

      {/* Reject undo snackbar (non-blocking) */}
      {undoJob ? (
        <View style={[styles.undoSnackbarWrap, { bottom: insets.bottom + 20 }]} pointerEvents="box-none">
          <View style={[styles.undoSnackbar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.undoSnackbarTextWrap}>
              <Text style={[styles.undoSnackbarTitle, { color: colors.foreground }]} numberOfLines={1}>Job rejected</Text>
              <Text style={[styles.undoSnackbarSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                {undoJob.title}
              </Text>
            </View>
            <TouchableOpacity onPress={handleUndoReject} style={[styles.undoSnackbarBtn, { backgroundColor: colors.primary }]} hitSlop={8}>
              <Ionicons name="arrow-undo" size={16} color="#fff" />
              <Text style={styles.undoSnackbarBtnText}>Undo</Text>
            </TouchableOpacity>
            <Animated.View style={[styles.undoSnackbarBar, { backgroundColor: colors.primary }, undoBarStyle]} />
          </View>
        </View>
      ) : null}

      {/* Dismissable toast (e.g. quiz-in-dashboard message) */}
      {toastMessage ? (
        <View style={styles.toastWrap} pointerEvents="box-none">
          <View style={[styles.toast, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.toastText, { color: colors.foreground }]}>{toastMessage}</Text>
            <TouchableOpacity onPress={() => setToastMessage(null)} hitSlop={8}>
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

    </GestureHandlerRootView>
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
  cardStack: {
    flex: 1,
    width: '100%',
  },
  cardStackLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  behindCardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  behindCardType: {
    fontSize: 13,
    marginTop: 6,
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
  headerAiBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
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
  undoActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // ── Quiz badge ───────────────────────────────────────────────────────
  quizBadgeWrapper: { position: 'absolute', top: 12, left: 12, zIndex: 10 },
  quizBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  quizBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  // ── Confirmation card ─────────────────────────────────────────────────
  confirmCardInner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  confirmCompany: { fontSize: 14, textAlign: 'center', marginBottom: 8 },
  confirmPrompt: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  confirmNote: { fontSize: 14, textAlign: 'center', paddingHorizontal: 8, lineHeight: 20 },
  confirmQuizRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  confirmQuizText: { flex: 1, fontSize: 13, lineHeight: 18 },
  confirmErrorText: { color: '#ef4444', fontSize: 13, textAlign: 'center', paddingHorizontal: 8 },
  confirmApplyingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  confirmApplyingText: { fontSize: 14 },
  confirmButtonsRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  confirmCardButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  confirmInstructions: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  // ── Reject undo snackbar ─────────────────────────────────────────────
  undoSnackbarWrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 30 },
  undoSnackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    maxWidth: 440,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  undoSnackbarTextWrap: { flex: 1 },
  undoSnackbarTitle: { fontSize: 14, fontWeight: '700' },
  undoSnackbarSub: { fontSize: 12, marginTop: 2 },
  undoSnackbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  undoSnackbarBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  undoSnackbarBar: { position: 'absolute', left: 0, bottom: 0, height: 3 },
  // ── Dismissable toast ────────────────────────────────────────────────
  toastWrap: { position: 'absolute', left: 16, right: 16, bottom: 96, alignItems: 'center', zIndex: 30 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 440,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: { flex: 1, fontSize: 13, lineHeight: 18 },
})
