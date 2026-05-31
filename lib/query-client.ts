import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryCache, QueryClient } from '@tanstack/react-query';

import {
  applicationsApi,
  authApi,
  jobsApi,
  notificationsApi,
  type User,
} from '@/services/api';
import { queryKeys } from './query-keys';

// 2 minutes: data is considered fresh for this long, so a screen that mounts
// within the window renders straight from cache with no network round-trip.
export const STALE_TIME = 2 * 60 * 1000;
// 24 hours: how long an unused query stays in (and is persisted to) the cache.
// Long enough that yesterday's data is still there for an offline launch.
export const GC_TIME = 24 * 60 * 60 * 1000;

/**
 * The single QueryClient for the whole app.
 *
 * Exported (not created inside a component) so it can be reached from outside
 * React — specifically the auth handlers that prefetch data on login and on
 * startup, before any screen has mounted.
 */
export const queryClient = new QueryClient({
  // Surface query failures in the Metro/console logs (as a warning, not a red
  // error — these are usually transient timeouts revalidating over cached data,
  // not crashes). Helpful for spotting connectivity issues; harmless to keep.
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      console.warn('[react-query] query failed:', JSON.stringify(query.queryKey), error?.message ?? error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      retry: 1,
      // React Native has no window-focus event wired into TanStack by default;
      // screens that want fresh-on-focus refetch explicitly. Leaving this off
      // keeps locally-mutated decks (swipe / applicants) from resetting under
      // the user when the app returns to the foreground.
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Persists the cache to AsyncStorage so screens load instantly — even offline —
 * across full app restarts. Wired into <PersistQueryClientProvider> in the root
 * layout. `maxAge` matches GC_TIME so a restored entry isn't discarded as too old.
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'SVYPE_QUERY_CACHE',
  throttleTime: 1000,
});

/**
 * Wipe every cached query — both the in-memory cache and the persisted
 * AsyncStorage snapshot. Call on logout so the next account starts from a
 * clean slate (no previous user's applications / jobs / profile lingering),
 * and on login as a safety net so each user always gets freshly-fetched data.
 *
 * The in-memory `clear()` is synchronous, so a screen still mounted at logout
 * stops showing the old data immediately; removing the persisted snapshot
 * means an app restart can't restore it either.
 */
export function clearCachedData(): void {
  const count = queryClient.getQueryCache().getAll().length;
  // Temporary: confirms in the Metro logs that the clear actually ran (and how
  // much it dropped) on each logout/login. Remove once verified.
  console.log(`[cache] clearCachedData() — removing ${count} cached queries`);
  queryClient.clear();
  // removeClient() may return void or a Promise depending on the persister;
  // wrap so we can swallow any rejection without blocking.
  Promise.resolve(asyncStoragePersister.removeClient()).catch(() => {});
}

/**
 * Targeted cache invalidations — call these from a mutation's success handler
 * so the affected screen refetches fresh data (cache-first: it keeps showing
 * the old data until the new arrives, no spinner flash). Centralised here so
 * the query keys stay in one place.
 */
export const invalidateCache = {
  /** Jobseeker applications (dashboard + accepted-jobs view). */
  applications: () => queryClient.invalidateQueries({ queryKey: queryKeys.applications.list() }),
  /** Jobseeker job-compatibility history. */
  jobseekerCompatibility: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.jobs.compatibilityHistory() }),
  /** Company applicant-compatibility history. */
  companyCompatibility: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.applications.compatibilityHistory() }),
  /** Company accepted/shortlisted applicants. */
  acceptedApplicants: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.applications.accepted() }),
  /** Current user (`/auth/me/`) — profile / company-profile screens. */
  me: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() }),
  /** Company's own job postings (company dashboard). */
  myJobs: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobs.myJobs() }),
  /** Jobseeker notification feed (drives the dashboard unread badge). */
  notifications: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() }),
  /** Jobseeker quiz history (applications to quiz-gated jobs). */
  quizHistory: () => queryClient.invalidateQueries({ queryKey: queryKeys.applications.quizHistory() }),
};

/**
 * Warm the cache for the screens a user is about to land on, in parallel, so
 * the data is ready before they tap any tab. Called right after login resolves
 * and on app startup when a saved session is restored.
 *
 * By default each prefetch honours `staleTime` (a no-op if the data is already
 * fresh) — right for app startup, where warm cache should be reused.
 *
 * Pass `{ force: true }` on LOGIN: it bypasses `staleTime` and always hits the
 * database, so a freshly signed-in account can never read a previous account's
 * still-"fresh" cache entry. Neither mode rejects, so one failing/offline
 * request won't block the others.
 */
export async function prefetchForUser(
  user: User | null | undefined,
  options: { force?: boolean } = {}
): Promise<void> {
  if (!user) return;
  const { force = false } = options;

  const warm = (queryKey: readonly unknown[], queryFn: () => Promise<unknown>) =>
    force
      ? queryClient.fetchQuery({ queryKey, queryFn, staleTime: 0 }).catch(() => {})
      : queryClient.prefetchQuery({ queryKey, queryFn });

  // Two-phase priority load:
  //   Phase 1 — the main tab screens the user lands on first.
  //   Phase 2 — secondary screens behind dashboard buttons (compatibility
  //             history, accepted lists). Deferred (awaited after phase 1) so
  //             they don't pile onto the initial launch burst.
  // If the user opens a phase-2 screen before it's warmed, that screen's own
  // useQuery fetches it immediately — active observers take priority over a
  // background prefetch (and dedupe with it) — so the tapped screen never waits
  // on this queue; the prefetch just resumes for the rest.
  if (user.user_type === 'company') {
    await Promise.allSettled([
      warm(queryKeys.auth.me(), authApi.getMe),               // profile + dashboard header
      warm(queryKeys.jobs.myJobs(), jobsApi.getMyJobs),       // dashboard + applicants picker
    ]);
    await Promise.allSettled([
      warm(queryKeys.applications.accepted(), applicationsApi.getAcceptedApplicants),
      warm(queryKeys.applications.compatibilityHistory(), () => applicationsApi.getCompatibilityHistory()),
    ]);
  } else {
    await Promise.allSettled([
      warm(queryKeys.auth.me(), authApi.getMe),                              // profile
      warm(queryKeys.applications.list(), applicationsApi.getApplications),  // dashboard + accepted-jobs
      warm(queryKeys.jobs.swipe(), jobsApi.getSwipeJobs),                    // swipe deck
      warm(queryKeys.notifications.list(), notificationsApi.getNotifications), // dashboard badge
    ]);
    await Promise.allSettled([
      warm(queryKeys.jobs.compatibilityHistory(), jobsApi.getCompatibilityHistory),
    ]);
  }
}
