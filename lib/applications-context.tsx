import { Application, applicationsApi } from '@/services/api';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface ApplicationsContextValue {
  applications: Application[];
  /** True only during the very first fetch (no data yet). */
  initialLoading: boolean;
  /** True when the initial fetch failed and we have no data to show. */
  loadError: boolean;
  /** True while a pull-to-refresh is in progress. */
  refreshing: boolean;
  /** Trigger a pull-to-refresh (shows spinner). Also used for the error Retry. */
  refresh: () => void;
  /** Silent background refetch — no visible spinner. Call after a new apply. */
  invalidate: () => void;
}

const ApplicationsContext = createContext<ApplicationsContextValue>({
  applications: [],
  initialLoading: true,
  loadError: false,
  refreshing: false,
  refresh: () => {},
  invalidate: () => {},
});

export function ApplicationsProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Stays false until at least one successful fetch completes.
  const hasFetchedRef = useRef(false);

  const doFetch = useCallback(async () => {
    try {
      const apps = await applicationsApi.getApplications();
      setApplications(apps);
      setLoadError(false);
      hasFetchedRef.current = true;
    } catch {
      // Initial load failure — show error state (no data to fall back on).
      if (!hasFetchedRef.current) {
        setLoadError(true);
      }
      // Pull-to-refresh / silent failure — keep existing data as-is.
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Pre-load the moment the jobseeker section mounts.
  useEffect(() => {
    doFetch();
  }, [doFetch]);

  const refresh = useCallback(() => {
    if (!hasFetchedRef.current) {
      // Retrying after initial load failure — show full-screen spinner again.
      setInitialLoading(true);
      setLoadError(false);
    } else {
      // Normal pull-to-refresh — keep list visible, show indicator at top.
      setRefreshing(true);
    }
    doFetch();
  }, [doFetch]);

  const invalidate = useCallback(() => {
    // Fire silently — no loading indicator; just update the cached list.
    doFetch();
  }, [doFetch]);

  return (
    <ApplicationsContext.Provider
      value={{ applications, initialLoading, loadError, refreshing, refresh, invalidate }}
    >
      {children}
    </ApplicationsContext.Provider>
  );
}

export function useApplications() {
  return useContext(ApplicationsContext);
}
