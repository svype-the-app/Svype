import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors } from '@/constants/theme'
import { invalidateCache, queryClient } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import { useApplications } from '@/lib/use-applications'
import { applicationsApi, Job as ApiJob, jobsApi, profileApi } from '@/services/api'
import { formatRelativeTime } from '@/utils/time'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  has_questions: boolean
}

// ── Draft cover-letter AsyncStorage cache (key per job, 24h TTL) ───────────
const DRAFT_COVER_LETTER_PREFIX = 'draft_cover_letter_'
const DRAFT_COVER_LETTER_TTL_MS = 24 * 60 * 60 * 1000
const COVER_LETTER_INTRO_KEY = 'cover_letter_intro_seen'

const draftKey = (jobId: number) => `${DRAFT_COVER_LETTER_PREFIX}${jobId}`

/** Return the cached draft if present and < 24h old, else null (and evict if stale). */
async function readLocalDraft(jobId: number): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(draftKey(jobId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { content?: string; generated_at?: number }
    if (
      typeof parsed?.content === 'string' &&
      typeof parsed?.generated_at === 'number' &&
      Date.now() - parsed.generated_at < DRAFT_COVER_LETTER_TTL_MS
    ) {
      return parsed.content
    }
    // Expired or malformed — drop it.
    await AsyncStorage.removeItem(draftKey(jobId))
    return null
  } catch {
    return null
  }
}

async function writeLocalDraft(jobId: number, content: string): Promise<void> {
  try {
    await AsyncStorage.setItem(
      draftKey(jobId),
      JSON.stringify({ content, generated_at: Date.now() }),
    )
  } catch {
    // Non-critical — the draft just won't be cached locally.
  }
}

async function clearLocalDraft(jobId: number): Promise<void> {
  try {
    await AsyncStorage.removeItem(draftKey(jobId))
  } catch {
    // ignore
  }
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
  const [pan] = useState(new Animated.ValueXY())
  const scrollViewRef = useRef<ScrollView>(null)
  const [showUndoModal, setShowUndoModal] = useState(false)
  const [undoTimer, setUndoTimer] = useState(5)
  const [undoJob, setUndoJob] = useState<SwipeJob | null>(null)
  const [undoActionType, setUndoActionType] = useState<'approve' | 'reject' | null>(null)
  const [showSectionHint, setShowSectionHint] = useState(true)
  // Resume/CV gate (P4): null = unknown (still loading), true/false once fetched.
  // When false, right-swiping a job surfaces the CV-missing banner instead of
  // generating a cover letter.
  const [hasResume, setHasResume] = useState<boolean | null>(null)
  const [showCvMissingHint, setShowCvMissingHint] = useState(false)
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressAnim = useRef(new Animated.Value(0)).current
  const [isScrolling, setIsScrolling] = useState(false)
  // Holdover from the prev/next nav buttons (removed in 218081f). Kept as a
  // permanent `false` so the existing gates / disabled-checks / opacity
  // styles that reference it still compile. Safe to delete entirely along
  // with its remaining references the next time this file gets touched.
  const [isCardNavigating] = useState(false)
  const navigationUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Cover-letter card flow (Feature 2) ───────────────────────────────────
  // When set, the swipe card shows the editable cover letter for this job
  // instead of the job details. The deck position is unchanged until the user
  // swipes right (apply) on the cover-letter card.
  const [coverLetterJob, setCoverLetterJob] = useState<SwipeJob | null>(null)
  const [coverLetterText, setCoverLetterText] = useState('')
  const [coverLetterLoading, setCoverLetterLoading] = useState(false)
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null)
  const [showCoverLetterIntro, setShowCoverLetterIntro] = useState(false)
  // Optimistic-submission failure (Change 3). When the background apply call
  // fails we stash the job + edited cover letter + the deck slot it came from,
  // and surface a themed retry/cancel popup.
  const [failedSubmission, setFailedSubmission] = useState<{
    job: SwipeJob
    coverLetter: string
    originalIndex: number
  } | null>(null)
  // Pull-to-refresh / header-refresh in-flight flag (Change 4).
  const [isRefreshing, setIsRefreshing] = useState(false)
  // Jobs the user has applied to stay in the deck with an "APPLIED" overlay
  // instead of being removed (Fix 6).
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set())
  // Dismissable toast (e.g. the "quiz lives in your dashboard" message).
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Guards the request token so a stale cover-letter fetch can't overwrite a
  // newer one (or a card the user already swiped away from).
  const coverLetterReqRef = useRef(0)

  // ── Confirmation card (Change 2) — shown between right-swipe and cover letter.
  const [confirmJob, setConfirmJob] = useState<SwipeJob | null>(null)
  const [confirmTimer, setConfirmTimer] = useState(5)
  const confirmTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const confirmProgressAnim = useRef(new Animated.Value(0)).current

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToastMessage(message)
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 6000)
  }

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
  // Re-pointed to the latest handlePullToRefresh so the once-built panResponder
  // can trigger a refresh on an intentional downward pull (Change 4).
  const refreshRef = useRef<() => void>(() => {})

  // Same stale-closure problem applies to the panResponder's gate function,
  // which reads isScrolling / isCardNavigating / isApplying. Those values
  // are captured at first render (all false) and never see updates. This
  // ref holds the latest values and is re-pointed every render below.
  const gateRef = useRef({
    isScrolling: false,
    isCardNavigating: false,
    isApplying: false,
    // True only on the plain job deck (no cover-letter / confirm / undo card,
    // not already refreshing) — when the downward pull-to-refresh is allowed.
    canPullRefresh: false,
    // True when the card currently in view has already been applied to (Fix 6)
    // — swiping is blocked on it.
    isCurrentApplied: false,
  })

  // Refresh the resume/CV gate whenever the swipe tab regains focus, so a CV
  // uploaded from the profile screen is reflected here (P4). Clears a stale
  // CV-missing banner once a resume exists.
  useFocusEffect(
    useCallback(() => {
      let active = true
      profileApi
        .getResumes()
        .then((rs) => {
          if (!active) return
          const present = Array.isArray(rs) && rs.length > 0
          setHasResume(present)
          if (present) setShowCvMissingHint(false)
        })
        .catch(() => {
          if (active) setHasResume(null)
        })
      return () => {
        active = false
      }
    }, [])
  )

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
  // Full-screen spinner only when there's no cached deck to show yet (also
  // covers the retry-after-error path, which is fetching with no data).
  const loading = !hasDeckData && (swipeQuery.isPending || swipeQuery.isFetching)
  // Error screen only when the request failed, there's no cached deck, and
  // we're not already retrying.
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
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
      if (confirmTimerRef.current) {
        clearInterval(confirmTimerRef.current)
      }
    }
  }, [])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        const flags = gateRef.current
        if (flags.isScrolling || flags.isCardNavigating || flags.isApplying) return false
        if (flags.isCurrentApplied) return false
        const isHorizontalSwipe = Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2
        // Intentional downward pull (only on the job deck) → pull-to-refresh.
        const isDownwardPull = flags.canPullRefresh && dy > 60 && Math.abs(dy) > Math.abs(dx) * 1.5
        return isHorizontalSwipe || isDownwardPull
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
      onPanResponderRelease: (_, { dx, dy, vx }) => {
        pan.flattenOffset()

        // Pull-to-refresh: an intentional downward drag on the job deck.
        const flags = gateRef.current
        if (flags.canPullRefresh && dy > 80 && Math.abs(dy) > Math.abs(dx) * 1.5) {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
          }).start()
          refreshRef.current()
          return
        }

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

  // Show the editable cover-letter card for a job and load its draft. Invoked
  // after the user confirms on the confirmation card (Change 2). The deck is NOT
  // mutated here; that happens only after a right-swipe (apply) on this card.
  const startCoverLetterFlow = (job: SwipeJob) => {
    if (!job || coverLetterJob) return
    Haptics.selectionAsync().catch(() => {})

    // Reset pan so the cover-letter card slides in centered.
    pan.setValue({ x: 0, y: 0 })
    setCoverLetterError(null)
    setCoverLetterText('')
    setCoverLetterLoading(true)
    setCoverLetterJob(job)
    scrollViewRef.current?.scrollTo({ y: 0, animated: false })
    triggerSlideIn(true)

    // First-time intro popup (once per device).
    AsyncStorage.getItem(COVER_LETTER_INTRO_KEY)
      .then((seen) => {
        if (!seen) setShowCoverLetterIntro(true)
      })
      .catch(() => {})

    // Load the cover letter: AsyncStorage draft → backend draft → generate.
    const token = ++coverLetterReqRef.current
    ;(async () => {
      let content = ''
      try {
        const local = await readLocalDraft(job.id)
        if (local != null) {
          content = local
        } else {
          try {
            const draft = await applicationsApi.getDraftCoverLetter(job.id)
            content = draft.cover_letter
          } catch {
            const gen = await applicationsApi.generateCoverLetter(job.id)
            content = gen.cover_letter
          }
          await writeLocalDraft(job.id, content)
        }
      } catch {
        // Generation failed — let the user write their own from scratch.
        content = ''
      }
      // Ignore a stale fetch (user swiped away / started a newer one).
      if (coverLetterReqRef.current !== token) return
      setCoverLetterText(content)
      setCoverLetterLoading(false)
    })()
  }

  const dismissCoverLetterIntro = () => {
    setShowCoverLetterIntro(false)
    AsyncStorage.setItem(COVER_LETTER_INTRO_KEY, 'true').catch(() => {})
  }

  // Mark the applied job so it stays in the deck behind an "APPLIED" overlay
  // (instead of being removed), reset the cover-letter card state, and advance
  // to the next card (Fix 6).
  const advanceDeckAfterApply = (jobId: number) => {
    setAppliedJobIds((prev) => new Set(prev).add(jobId))
    pan.setValue({ x: 0, y: 0 })
    setCoverLetterJob(null)
    setCoverLetterText('')
    setCoverLetterError(null)
    setShowCoverLetterIntro(false)
    setCurrentIndex((prev) => {
      const current = jobs[prev]
      if (!current || current.id !== jobId) return prev
      return Math.min(prev + 1, jobs.length - 1)
    })
    scrollViewRef.current?.scrollTo({ y: 0, animated: false })
    triggerSlideIn(true)
  }

  // Submit (or retry) an application in the background — fire-and-forget. The
  // deck has already advanced optimistically by the time this runs; we only
  // reconcile the cache on success, or raise the retry popup on failure
  // (Change 3).
  const submitApplicationInBackground = (
    job: SwipeJob,
    coverLetter: string,
    originalIndex: number,
  ) => {
    void (async () => {
      try {
        const result = await applicationsApi.apply(job.id, coverLetter)
        // Keep the card marked applied (idempotent — also covers a successful retry).
        setAppliedJobIds((prev) => new Set(prev).add(job.id))
        // Refresh the dashboard; and the quiz history if this job is quiz-gated.
        invalidateApplications()
        if (job.has_questions) invalidateCache.quizHistory()
        await clearLocalDraft(job.id)
        // Quiz-gated job: do NOT navigate to the quiz — point the user to the
        // dashboard instead (Feature 1a).
        if (result.requires_quiz) {
          showToast('This job requires a quiz. You can access it from your Dashboard → Quizzes.')
        }
      } catch (err: any) {
        console.error('[apply] error:', err)
        const msg = String(err?.message || err?.errors?.message || err?.errors?.error || '')
        const lower = msg.toLowerCase()
        // "Already applied" is effectively success — clear the draft, no popup.
        if (lower.includes('already applied')) {
          await clearLocalDraft(job.id)
          return
        }
        // Failure — revert the optimistic APPLIED mark so the card is usable again.
        setAppliedJobIds((prev) => {
          const next = new Set(prev)
          next.delete(job.id)
          return next
        })
        // No resume on file: retrying won't help, so show a helpful toast
        // instead of the generic retry popup.
        if (err?.errors?.error === 'no_resume' || lower.includes('no_resume')) {
          showToast('Upload a resume from your Profile before applying.')
          return
        }
        // Real failure — surface the themed retry/cancel popup.
        setFailedSubmission({ job, coverLetter, originalIndex })
      }
    })()
  }

  // Right swipe on the COVER-LETTER card → optimistically advance the deck and
  // submit in the background (Change 3). The card exit animation + deck advance
  // run immediately; the API call is fire-and-forget.
  const handleCoverLetterApply = () => {
    if (coverLetterLoading || !coverLetterJob) return
    const job = coverLetterJob
    const coverLetter = coverLetterText
    const originalIndex = currentIndex
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    // Optimistic: fly the card off + drop the job from the deck now.
    advanceDeckAfterApply(job.id)
    // Fire-and-forget the actual submission.
    submitApplicationInBackground(job, coverLetter, originalIndex)
  }

  // "Try Again" on the failure popup → re-fire the same submission in the
  // background (it'll re-raise the popup if it fails again).
  const handleRetryFailedSubmission = () => {
    const fs = failedSubmission
    setFailedSubmission(null)
    if (!fs) return
    submitApplicationInBackground(fs.job, fs.coverLetter, fs.originalIndex)
  }

  // "Cancel" on the failure popup → restore the job card into the deck at the
  // slot it came from so the user can try again later.
  const handleCancelFailedSubmission = () => {
    const fs = failedSubmission
    setFailedSubmission(null)
    if (!fs) return
    setJobs((prevJobs) => {
      if (prevJobs.some((j) => j.id === fs.job.id)) return prevJobs
      const idx = Math.max(0, Math.min(fs.originalIndex, prevJobs.length))
      const nextJobs = [...prevJobs.slice(0, idx), fs.job, ...prevJobs.slice(idx)]
      setCurrentIndex(idx)
      return nextJobs
    })
    pan.setValue({ x: 0, y: 0 })
    triggerSlideIn(false)
  }

  // Left swipe on the COVER-LETTER card → return to the same job card.
  const handleCoverLetterBack = () => {
    Haptics.selectionAsync().catch(() => {})
    coverLetterReqRef.current++ // cancel any in-flight cover-letter fetch
    Animated.timing(pan.x, {
      toValue: -SCREEN_WIDTH * 1.2,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 })
      setCoverLetterJob(null)
      setCoverLetterText('')
      setCoverLetterLoading(false)
      setCoverLetterError(null)
      setShowCoverLetterIntro(false)
      scrollViewRef.current?.scrollTo({ y: 0, animated: false })
      triggerSlideIn(false) // job card slides back in from the left
    })
  }

  // ── Confirmation card (Change 2) ──────────────────────────────────────────
  const clearConfirmTimer = () => {
    if (confirmTimerRef.current) {
      clearInterval(confirmTimerRef.current)
      confirmTimerRef.current = null
    }
    confirmProgressAnim.stopAnimation()
  }

  // Right swipe on a JOB card → show the confirmation card (no API call yet).
  const handleShowConfirmation = () => {
    const job = jobs[currentIndex]
    if (!job || confirmJob || coverLetterJob) return
    // CV gate (P4): without a resume on file, don't even start the cover-letter
    // flow — surface the CV-missing instruction banner and snap the card back.
    if (hasResume === false) {
      setShowCvMissingHint(true)
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 5 }).start()
      return
    }
    Haptics.selectionAsync().catch(() => {})
    pan.setValue({ x: 0, y: 0 })
    setConfirmJob(job)
    scrollViewRef.current?.scrollTo({ y: 0, animated: false })
    triggerSlideIn(true)
  }

  // Confirm (button / right-swipe / 5s timeout) → start the cover-letter flow.
  const handleConfirmApply = () => {
    if (!confirmJob) return
    clearConfirmTimer()
    const job = confirmJob
    setConfirmJob(null)
    startCoverLetterFlow(job)
  }

  // Cancel (button / left-swipe) → return to the same job card, no API call.
  const handleCancelConfirmation = () => {
    clearConfirmTimer()
    Haptics.selectionAsync().catch(() => {})
    Animated.timing(pan.x, {
      toValue: -SCREEN_WIDTH * 1.2,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 })
      setConfirmJob(null)
      triggerSlideIn(false)
    })
  }

  // 5-second confirmation countdown; auto-confirms when it reaches 0.
  useEffect(() => {
    if (!confirmJob) return
    const job = confirmJob
    setConfirmTimer(5)
    confirmProgressAnim.setValue(0)
    Animated.timing(confirmProgressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start()
    confirmTimerRef.current = setInterval(() => {
      setConfirmTimer((prev) => {
        if (prev <= 1) {
          if (confirmTimerRef.current) {
            clearInterval(confirmTimerRef.current)
            confirmTimerRef.current = null
          }
          setConfirmJob(null)
          startCoverLetterFlow(job)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (confirmTimerRef.current) {
        clearInterval(confirmTimerRef.current)
        confirmTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmJob, confirmProgressAnim])

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

  // Pull-to-refresh / header-refresh → force a fresh batch from the backend
  // (bypasses the TanStack cache) and reset the deck to the top (Change 4).
  const handlePullToRefresh = async () => {
    if (isRefreshing) return
    Haptics.selectionAsync().catch(() => {})
    setIsRefreshing(true)
    try {
      const response = await jobsApi.refreshSwipeJobs()
      if (!response || response.length === 0) {
        showToast('All recommended jobs have been loaded. Check back later for new listings.')
      } else {
        setJobs(response.map(mapApiJobToSwipeJob))
        setCurrentIndex(0)
        pan.setValue({ x: 0, y: 0 })
        scrollViewRef.current?.scrollTo({ y: 0, animated: false })
        // Keep the persisted deck cache in sync with the fresh batch.
        queryClient.setQueryData(queryKeys.jobs.swipe(), response)
      }
    } catch {
      showToast('Failed to reload jobs. Check your connection.')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Keep the panResponder's call-points + gate flags pointed at the latest
  // values. Runs after every render so the once-built panResponder never
  // invokes a stale closure that captured the first-render state.
  useEffect(() => {
    if (coverLetterJob) {
      approveRef.current = handleCoverLetterApply
      rejectRef.current = handleCoverLetterBack
    } else if (confirmJob) {
      approveRef.current = handleConfirmApply
      rejectRef.current = handleCancelConfirmation
    } else {
      approveRef.current = handleShowConfirmation
      rejectRef.current = handleReject
    }
    refreshRef.current = handlePullToRefresh
    // `isApplying` here gates the panResponder: block swipes while the cover
    // letter is still loading (submission is now fire-and-forget, so it no
    // longer blocks swipes). `canPullRefresh` enables the downward
    // pull-to-refresh gesture only on the plain job deck.
    gateRef.current = {
      isScrolling,
      isCardNavigating,
      isApplying: coverLetterLoading,
      canPullRefresh:
        !coverLetterJob && !confirmJob && !showUndoModal && !failedSubmission && !isRefreshing,
      isCurrentApplied: !!(jobs[currentIndex] && appliedJobIds.has(jobs[currentIndex].id)),
    }
  })

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
        {/* Manual refresh — hidden while a cover-letter / confirmation card is up. */}
        {coverLetterJob === null && confirmJob === null && (
          <TouchableOpacity
            onPress={handlePullToRefresh}
            disabled={isRefreshing}
            hitSlop={8}
            style={[styles.headerRefreshBtn, isRefreshing && { opacity: 0.4 }]}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={colors.mutedForeground} />
            ) : (
              <Ionicons name="refresh-outline" size={22} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Instruction banners (Change 2). The swipe hint and the first-time
          cover-letter intro share one identical banner style and live in this
          single inline stack below the header (NOT absolute overlays), so when
          both are visible they sit one above the other with a 4px gap. */}
      {(showSectionHint || showCvMissingHint || (coverLetterJob && showCoverLetterIntro)) && (
        <View style={styles.hintStack}>
          {showSectionHint && (
            <View style={[styles.hintBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '33' }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={[styles.sectionHintText, { color: colors.primary }]}>Swipe right to accept • left to reject • use Previous/Next buttons to browse</Text>
              <TouchableOpacity onPress={() => setShowSectionHint(false)} style={styles.sectionHintClose}>
                <Ionicons name="close" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          {showCvMissingHint && (
            <View style={[styles.hintBanner, { backgroundColor: colors.destructive + '12', borderColor: colors.destructive + '33' }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.destructive} />
              <Text style={[styles.sectionHintText, { color: colors.destructive }]}>Upload a CV from your profile before applying to jobs.</Text>
              <TouchableOpacity onPress={() => setShowCvMissingHint(false)} style={styles.sectionHintClose}>
                <Ionicons name="close" size={16} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          )}
          {coverLetterJob && showCoverLetterIntro && (
            <View style={[styles.hintBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '33' }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={[styles.sectionHintText, { color: colors.primary }]}>You can edit this cover letter before applying. Swipe right to apply, swipe left to go back.</Text>
              <TouchableOpacity onPress={dismissCoverLetterIntro} style={styles.sectionHintClose}>
                <Ionicons name="close" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Reloading indicator while a refresh is in flight (Change 4). */}
      {isRefreshing && (
        <View style={styles.refreshRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.refreshText, { color: colors.mutedForeground }]}>Reloading jobs…</Text>
        </View>
      )}

      <View style={[styles.cardContainer, { backgroundColor: colors.background }]}>
        <Animated.View
          style={{ width: '100%', height: '100%', transform: [{ translateX: slideAnim }] }}
          pointerEvents="box-none"
        >
        <Animated.View style={[animatedCardStyle, { width: '100%', height: '100%' }]} {...panResponder.panHandlers}>
          {confirmJob ? (
          <Card style={[styles.jobCard, { backgroundColor: colors.card }]}>
            <CardContent style={styles.cardContent}>
              <View style={styles.confirmCardInner}>
                <Text style={[styles.applicantName, { color: colors.cardForeground }]} numberOfLines={2}>
                  {confirmJob.title}
                </Text>
                <Text style={[styles.coverLetterCompany, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {confirmJob.company}
                </Text>
                <Text style={[styles.confirmPrompt, { color: colors.cardForeground }]}>Apply to this job?</Text>
                <Text style={[styles.confirmNote, { color: colors.mutedForeground }]}>
                  We&apos;ll prepare a tailored cover letter you can review and edit before applying.
                </Text>
                <View style={styles.timerContainer}>
                  <Animated.View
                    style={[
                      styles.timerRing,
                      {
                        transform: [
                          {
                            rotate: confirmProgressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={[styles.timerRingInner, { borderColor: colors.primary }]} />
                  </Animated.View>
                  <View style={[styles.timerCenter, { backgroundColor: colors.card }]}>
                    <Text style={[styles.timerText, { color: colors.primary }]}>{confirmTimer}s</Text>
                  </View>
                </View>
                <View style={styles.confirmButtonsRow}>
                  <Button onPress={handleCancelConfirmation} style={[styles.confirmCardButton, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.undoActionText, { color: colors.mutedForeground }]}>Cancel</Text>
                  </Button>
                  <Button onPress={handleConfirmApply} style={[styles.confirmCardButton, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.undoActionText, { color: '#fff' }]}>Confirm</Text>
                  </Button>
                </View>
                <Text style={[styles.coverLetterInstructions, { color: colors.mutedForeground }]}>
                  Swipe right to confirm · Swipe left to cancel
                </Text>
              </View>
            </CardContent>
          </Card>
          ) : coverLetterJob ? (
          <Card style={[styles.jobCard, { backgroundColor: colors.card }]}>
            <CardContent style={styles.cardContent}>
              <View style={styles.coverLetterCardInner}>
                <Text style={[styles.applicantName, { color: colors.cardForeground }]} numberOfLines={2}>
                  {coverLetterJob.title}
                </Text>
                <Text style={[styles.coverLetterCompany, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {coverLetterJob.company}
                </Text>
                <Text style={[styles.coverLetterLabel, { color: colors.mutedForeground }]}>
                  YOUR COVER LETTER (EDITABLE)
                </Text>
                {coverLetterLoading ? (
                  <View style={styles.coverLetterLoadingWrap}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={[styles.coverLetterLoadingText, { color: colors.mutedForeground }]}>
                      Preparing your cover letter…
                    </Text>
                  </View>
                ) : (
                  <TextInput
                    value={coverLetterText}
                    onChangeText={setCoverLetterText}
                    multiline
                    placeholder="Write your cover letter…"
                    placeholderTextColor={colors.mutedForeground}
                    style={[
                      styles.coverLetterInput,
                      { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
                    ]}
                  />
                )}
                {coverLetterError ? (
                  <Text style={styles.coverLetterErrorText}>{coverLetterError}</Text>
                ) : null}
                <Text style={[styles.coverLetterInstructions, { color: colors.mutedForeground }]}>
                  Swipe right to apply · Swipe left to go back
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
            {appliedJobIds.has(currentJob.id) && (
              <View style={styles.appliedOverlay}>
                {currentJob.has_questions ? (
                  <>
                    <Ionicons name="help-circle" size={44} color="#fff" />
                    <Text style={styles.appliedQuizText}>Take quiz{'\n'}from dashboard</Text>
                  </>
                ) : (
                  <Text style={styles.appliedOverlayText}>APPLIED</Text>
                )}
              </View>
            )}
          </Card>
          )}

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
          const navDisabled =
            noJobs || showUndoModal || isCardNavigating || coverLetterJob !== null || confirmJob !== null
          const prevDisabled = navDisabled || currentIndex <= 0
          const nextDisabled = navDisabled || currentIndex >= jobs.length - 1
          // Applied cards can't be re-applied (Fix 6) — disable the match action.
          const isCurrentCardApplied = !!(jobs[currentIndex] && appliedJobIds.has(jobs[currentIndex].id))
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
                style={[styles.aiMatchButton, (coverLetterJob || confirmJob || isCurrentCardApplied) && { opacity: 0.5 }]}
                disabled={!!coverLetterJob || !!confirmJob || isCurrentCardApplied}
                onPress={() => {
                  if (!currentJob || coverLetterJob || confirmJob || isCurrentCardApplied) return
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

      {/* Optimistic-submission failure popup (Change 3) — themed Modal + Card,
          same visual pattern as the undo modal (no native alerts). */}
      <Modal
        visible={!!failedSubmission}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelFailedSubmission}
      >
        <View style={styles.undoModalOverlay}>
          <Card style={[styles.undoCard, { backgroundColor: colors.card }]}>
            <CardContent style={styles.undoCardContent}>
              <Text style={[styles.undoTitle, { color: colors.foreground }]}>Application Failed</Text>
              <Text style={[styles.undoDescription, { color: colors.mutedForeground }]}>
                We couldn&apos;t submit your application for {failedSubmission?.job.title}. Would you like to try again?
              </Text>
              <View style={styles.undoButtonsRow}>
                <Button onPress={handleCancelFailedSubmission} style={[styles.undoActionButton, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.undoActionText, { color: colors.mutedForeground }]}>Cancel</Text>
                </Button>
                <Button onPress={handleRetryFailedSubmission} style={[styles.undoActionButton, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.undoActionText, { color: '#fff' }]}>Try Again</Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        </View>
      </Modal>

      {/* Dismissable toast (e.g. quiz-in-dashboard message, Feature 1a) */}
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
  appliedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  appliedOverlayText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  appliedQuizText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 28,
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
  sectionHintText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  sectionHintClose: {
    padding: 2,
  },
  // Inline stack holding the swipe hint + cover-letter intro banners (Change 2).
  // The wrapper owns the outer margins + the 4px inter-banner gap so each
  // `hintBanner` is purely the (margin-free) sectionHint visual.
  hintStack: {
    marginTop: 12,
    marginBottom: 4,
    gap: 4,
  },
  hintBanner: {
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Header manual-refresh button (Change 4).
  headerRefreshBtn: {
    padding: 4,
    marginRight: 4,
  },
  // "Reloading jobs…" indicator row shown during a refresh (Change 4).
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '500',
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
  // ── Quiz badge (Feature 1a) ──────────────────────────────────────────
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
  // ── Cover-letter card (Feature 2b) ───────────────────────────────────
  coverLetterCardInner: { flex: 1, paddingTop: 24, paddingHorizontal: 16, paddingBottom: 16 },
  coverLetterCompany: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  coverLetterLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  coverLetterLoadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  coverLetterLoadingText: { fontSize: 13 },
  coverLetterInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  coverLetterErrorText: { color: '#ef4444', fontSize: 13, marginBottom: 8 },
  coverLetterInstructions: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  // ── Confirmation card (Change 2) ──────────────────────────────────────
  confirmCardInner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  confirmPrompt: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  confirmNote: { fontSize: 14, textAlign: 'center', paddingHorizontal: 8, lineHeight: 20 },
  confirmButtonsRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  confirmCardButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  // ── Dismissable toast (Feature 1a) ───────────────────────────────────
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
