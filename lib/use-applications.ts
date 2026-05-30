import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { applicationsApi, type Application } from '@/services/api';
import { queryKeys } from './query-keys';

// Stable empty reference so consumers don't see a new array identity each render
// while the query has no data yet.
const EMPTY: Application[] = [];

/**
 * Jobseeker applications, backed by TanStack Query.
 *
 * Drop-in replacement for the old `ApplicationsProvider` context — the public
 * shape (`applications`, `initialLoading`, `loadError`, `refreshing`, `refresh`,
 * `invalidate`) is unchanged, so existing callers don't need to. Being a plain
 * hook (no provider) it can be called from any screen under the root
 * QueryClient and they all share one cache entry.
 */
export function useApplications() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.applications.list(),
    queryFn: applicationsApi.getApplications,
  });

  const hasData = query.data !== undefined;
  const { refetch } = query;

  // Memoized so they're stable identities — safe to use as effect dependencies
  // (e.g. inside useFocusEffect) without causing re-subscribe/refetch loops.
  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.applications.list() });
  }, [queryClient]);

  return {
    applications: query.data ?? EMPTY,
    /** First load with nothing cached to show yet (also a retry after a cold error). */
    initialLoading: !hasData && (query.isPending || query.isFetching),
    /** Errored with no cached data to fall back on. */
    loadError: !hasData && query.isError && !query.isFetching,
    /** Background revalidation over already-visible data (pull-to-refresh). */
    refreshing: hasData && query.isFetching,
    /** Pull-to-refresh / error-retry. */
    refresh,
    /** Silent refetch after a new application is submitted. */
    invalidate,
  };
}
