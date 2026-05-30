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
  // Surface every query failure in the Metro/console logs with its key + error,
  // so a network/auth/timeout problem isn't silently swallowed into an empty
  // screen. Safe to remove once things are confirmed working.
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error('[react-query] failed:', JSON.stringify(query.queryKey), error);
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
export function prefetchForUser(
  user: User | null | undefined,
  options: { force?: boolean } = {}
): Promise<unknown> {
  if (!user) return Promise.resolve();
  const { force = false } = options;

  const warm = (queryKey: readonly unknown[], queryFn: () => Promise<unknown>) =>
    force
      ? queryClient.fetchQuery({ queryKey, queryFn, staleTime: 0 }).catch(() => {})
      : queryClient.prefetchQuery({ queryKey, queryFn });

  const tasks: Promise<unknown>[] = [warm(queryKeys.auth.me(), authApi.getMe)];

  if (user.user_type === 'company') {
    tasks.push(warm(queryKeys.jobs.myJobs(), jobsApi.getMyJobs));
    tasks.push(warm(queryKeys.applications.accepted(), applicationsApi.getAcceptedApplicants));
  } else {
    tasks.push(warm(queryKeys.applications.list(), applicationsApi.getApplications));
    tasks.push(warm(queryKeys.jobs.swipe(), jobsApi.getSwipeJobs));
    tasks.push(warm(queryKeys.notifications.list(), notificationsApi.getNotifications));
  }

  return Promise.allSettled(tasks);
}
