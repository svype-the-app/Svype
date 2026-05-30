/**
 * Central registry of TanStack Query keys.
 *
 * Every `useQuery`/`prefetchQuery`/`invalidateQueries` call in the app should
 * reference a key from here rather than inlining a string array, so that:
 *   - prefetch (on login / startup) and the screen that reads the data agree
 *     on the exact same key (otherwise the screen gets a cache miss);
 *   - invalidation after a mutation targets the right cache entry.
 *
 * Keys are `as const` so they're treated as readonly tuples by the type system.
 */
export const queryKeys = {
  auth: {
    /** Current authenticated user (`authApi.getMe()` → /auth/me/). Shared by
     *  the jobseeker profile, company profile and company dashboard header. */
    me: () => ['auth', 'me'] as const,
  },
  applications: {
    /** Jobseeker's own applications (`applicationsApi.getApplications()`). */
    list: () => ['applications', 'list'] as const,
    /** Applicants for one of the company's jobs. */
    applicants: (jobId: number) => ['applications', 'applicants', jobId] as const,
    /** A specific AI shortlist run's applicants. */
    shortlistRun: (jobId: number, runId: number) =>
      ['applications', 'shortlist-run', jobId, runId] as const,
    /** Applicants the company has accepted/shortlisted. */
    accepted: () => ['applications', 'accepted'] as const,
  },
  jobs: {
    /** The jobseeker swipe deck (`jobsApi.getSwipeJobs()`). */
    swipe: () => ['jobs', 'swipe'] as const,
    /** The company's own job postings (`jobsApi.getMyJobs()`). */
    myJobs: () => ['jobs', 'my'] as const,
  },
  notifications: {
    /** Jobseeker notification feed (`notificationsApi.getNotifications()`). */
    list: () => ['notifications', 'list'] as const,
  },
} as const;
