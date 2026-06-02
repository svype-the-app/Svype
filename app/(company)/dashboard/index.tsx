import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemedModal, type ThemedAlertConfig } from '@/components/ui/themed-modal';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { queryKeys } from '@/lib/query-keys';
import { authApi, jobsApi, type Job } from '@/services/api';
import { formatRelativeTime } from '@/utils/time';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

// Stable empty reference for the no-data-yet render.
const EMPTY_JOBS: Job[] = [];
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CompanyDashboard() {
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: queryKeys.auth.me(), queryFn: authApi.getMe });
  const myJobsQuery = useQuery({ queryKey: queryKeys.jobs.myJobs(), queryFn: jobsApi.getMyJobs });

  const companyName = meQuery.data?.company?.name || 'Company';
  const jobs = myJobsQuery.data ?? EMPTY_JOBS;
  const hasJobs = myJobsQuery.data !== undefined;
  // Spinner only when there's no cached job list to show yet.
  const loading = !hasJobs && (myJobsQuery.isPending || myJobsQuery.isFetching);
  // Error state only when the fetch failed AND there's no cached data.
  const loadError = !hasJobs && myJobsQuery.isError && !myJobsQuery.isFetching;

  const [selectedJobForActions, setSelectedJobForActions] = useState<Job | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [alertConfig, setAlertConfig] = useState<ThemedAlertConfig | null>(null);

  // Refresh on tab focus and tab re-press (preserves the old behaviour).
  // refetch identities are stable, so these subscribe once.
  const refetchMe = meQuery.refetch;
  const refetchMyJobs = myJobsQuery.refetch;
  const refetchDashboard = useCallback(() => {
    refetchMe();
    refetchMyJobs();
  }, [refetchMe, refetchMyJobs]);

  useFocusEffect(refetchDashboard);

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('tabPress', () => {
      refetchDashboard();
    });

    return unsubscribe;
  }, [navigation, refetchDashboard]);

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((job) => job.status === 'active').length;
    const totalApplicants = jobs.reduce(
      (sum, job) => sum + (job.applicants_count ?? 0),
      0
    );

    return {
      activeJobs,
      totalApplicants,
      viewsThisWeek: 0,
      hiredThisMonth: 0,
    };
  }, [jobs]);

  const deleteMutation = useMutation({
    mutationFn: (jobId: number) => jobsApi.deleteJob(jobId),
    onSuccess: () => {
      setShowDeleteConfirm(false);
      setShowActionsModal(false);
      setSelectedJobForActions(null);
      // Re-fetch the job list so the deleted posting drops off.
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.myJobs() });
    },
    onError: (error: any) => {
      setAlertConfig({
        title: 'Delete Failed',
        message: error?.message || 'Could not delete this job.',
        buttons: [{ label: 'OK' }],
      });
    },
  });
  const deleting = deleteMutation.isPending;

  const handleDeleteJob = useCallback(
    (jobId: number) => {
      deleteMutation.mutate(jobId);
    },
    [deleteMutation]
  );

  const openJobActions = useCallback(
    (job: Job) => {
      setSelectedJobForActions(job);
      setShowActionsModal(true);
    },
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.companyName, { color: colors.foreground }]}>{companyName}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>Company Dashboard</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, { borderColor: colors.border, borderWidth: 2 }]}>
            <CardContent style={styles.statCardContent}>
              <View style={styles.statCardInner}>
                <View style={[styles.statIcon, { backgroundColor: colors.primary + '1A' }]}>
                  <Ionicons name="briefcase" size={24} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.activeJobs}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active Jobs</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card style={[styles.statCard, { borderColor: colors.border, borderWidth: 2 }]}>
            <CardContent style={styles.statCardContent}>
              <View style={styles.statCardInner}>
                <View style={[styles.statIcon, { backgroundColor: '#3b82f61A' }]}>
                  <Ionicons name="people" size={24} color="#3b82f6" />
                </View>
                <View>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.totalApplicants}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Applicants</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card style={[styles.statCard, { borderColor: colors.border, borderWidth: 2 }]}>
            <CardContent style={styles.statCardContent}>
              <View style={styles.statCardInner}>
                <View style={[styles.statIcon, { backgroundColor: '#a855f71A' }]}>
                  <Ionicons name="eye" size={24} color="#a855f7" />
                </View>
                <View>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.viewsThisWeek}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Views</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card style={[styles.statCard, { borderColor: colors.border, borderWidth: 2 }]}>
            <CardContent style={styles.statCardContent}>
              <View style={styles.statCardInner}>
                <View style={[styles.statIcon, { backgroundColor: '#22c55e1A' }]}>
                  <Ionicons name="trending-up" size={24} color="#22c55e" />
                </View>
                <View>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.hiredThisMonth}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Hired</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            variant="outline"
            style={[styles.actionButton, { borderColor: '#3b82f6' }]}
            onPress={() => router.push('/(company)/dashboard/compatibility-history')}
          >
            <Ionicons name="analytics-outline" size={20} color="#3b82f6" style={styles.actionIcon} />
            <Text style={[styles.actionButtonTextOutline, { color: '#3b82f6' }]}>AI Compatibility History</Text>
          </Button>

          <Button
            variant="outline"
            style={[styles.actionButton, { borderColor: '#22c55e' }]}
            onPress={() => router.push('/(company)/dashboard/accepted-applicants')}
          >
            <Ionicons name="people-outline" size={20} color="#22c55e" style={styles.actionIcon} />
            <Text style={[styles.actionButtonTextOutline, { color: '#22c55e' }]}>Accepted Applicants</Text>
          </Button>
        </View>

        <View style={styles.jobsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Job Postings</Text>
          <View style={styles.tabContent}>
            {loading ? (
              <View style={styles.centeredState}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>Loading jobs...</Text>
              </View>
            ) : loadError ? (
              <View style={styles.centeredState}>
                <Ionicons name="cloud-offline-outline" size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyStateTitle, { color: colors.foreground }]}>Failed to Load</Text>
                <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>Check your connection and try again.</Text>
                <TouchableOpacity onPress={() => refetchDashboard()} style={[styles.retryBtn, { borderColor: colors.border }]}>
                  <Text style={[styles.retryText, { color: colors.foreground }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : jobs.length === 0 ? (
              <View style={styles.centeredState}>
                <Text style={[styles.emptyStateTitle, { color: colors.foreground }]}>No job postings yet</Text>
                <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>Create your first job post to see it here.</Text>
              </View>
            ) : jobs.map((job) => (
              <Card
                key={job.id}
                style={[styles.jobCard, { borderColor: colors.border, borderWidth: 2 }]}
              >
                <CardContent style={styles.jobCardContent}>
                  <View style={styles.jobCardMain}>
                    <View style={styles.jobInfo}>
                      <View style={styles.jobTitleRow}>
                        <Text style={[styles.jobTitle, { color: colors.foreground }]} numberOfLines={1}>
                          {job.title}
                        </Text>
                        <Badge
                          variant={job.status === 'active' ? 'default' : 'secondary'}
                          style={styles.jobStatusBadge}
                        >
                          <Text
                            style={{
                              ...styles.statusText,
                              color: job.status === 'active' ? '#fff' : colors.mutedForeground,
                            }}
                          >
                            {job.status}
                          </Text>
                        </Badge>
                      </View>
                      <View style={styles.jobMeta}>
                        <View style={styles.jobMetaItem}>
                          <Ionicons
                            name="people-outline"
                            size={14}
                            color={colors.mutedForeground}
                          />
                          <Text style={[styles.jobMetaText, { color: colors.mutedForeground }]}>
                            {job.applicants_count ?? 0} applicants
                          </Text>
                        </View>
                        <Text style={[styles.jobMetaText, { color: colors.mutedForeground }]}> 
                          Posted {formatRelativeTime(job.posted_at)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.jobCardFooter}>
                      <Button
                        variant="outline"
                        style={styles.viewDetailsButton}
                        onPress={() =>
                          router.push({
                            pathname: '/(company)/dashboard/job_detail',
                            params: { id: String(job.id) },
                          })
                        }
                      >
                        <Text style={[styles.viewDetailsText, { color: colors.foreground }]}> 
                          View Details
                        </Text>
                      </Button>
                      <TouchableOpacity
                        onPress={() => openJobActions(job)}
                        style={[styles.jobActionsButton, { borderColor: colors.border }]}
                      >
                        <Ionicons name="ellipsis-vertical" size={18} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Actions Modal */}
      <Modal
        visible={showActionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionsModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          onPress={() => setShowActionsModal(false)}
        >
          <View style={[styles.actionsContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.actionsTitle, { color: colors.foreground }]}>
              Job Actions
            </Text>

            {/* Edit Action */}
            <TouchableOpacity
              style={[styles.actionItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setShowActionsModal(false);
                if (selectedJobForActions) {
                  router.push({
                    pathname: '/(company)/dashboard/edit_job',
                    params: { id: String(selectedJobForActions.id) },
                  });
                }
              }}
            >
              <Ionicons name="pencil" size={18} color={colors.foreground} />
              <Text style={[styles.actionItemText, { color: colors.foreground }]}>
                Edit Job
              </Text>
            </TouchableOpacity>

            {/* Delete Action */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                // Close actions modal first — only one RN Modal can be visible
                // at a time on iOS, so we defer opening the confirm modal until
                // the dismiss animation finishes.
                setShowActionsModal(false);
                setTimeout(() => setShowDeleteConfirm(true), 250);
              }}
            >
              <Ionicons name="trash" size={18} color={colors.destructive} />
              <Text style={[styles.actionItemText, { color: colors.destructive }]}>
                Delete Job
              </Text>
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.secondary }]}
              onPress={() => setShowActionsModal(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.foreground }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          onPress={() => !deleting && setShowDeleteConfirm(false)}
        >
          <View style={[styles.confirmContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.confirmIcon, { backgroundColor: colors.destructive + '1A' }]}>
              <Ionicons name="trash" size={32} color={colors.destructive} />
            </View>

            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>
              Delete Job?
            </Text>

            <Text style={[styles.confirmMessage, { color: colors.mutedForeground }]}>
              Are you sure you want to delete this job? This action cannot be undone.
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                disabled={deleting}
                style={[
                  styles.confirmButton,
                  styles.confirmCancelButton,
                  { borderColor: colors.border, opacity: deleting ? 0.5 : 1 }
                ]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={[styles.confirmCancelButtonText, { color: colors.foreground }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={deleting}
                style={[
                  styles.confirmButton,
                  styles.confirmDeleteButton,
                  { backgroundColor: colors.destructive, opacity: deleting ? 0.6 : 1 }
                ]}
                onPress={() => {
                  if (selectedJobForActions) {
                    handleDeleteJob(selectedJobForActions.id);
                  }
                }}
              >
                {deleting ? (
                  <ActivityIndicator color={colors.destructiveForeground} size="small" />
                ) : (
                  <View style={styles.deleteButtonContent}>
                    <Ionicons name="trash" size={16} color={colors.destructiveForeground} />
                    <Text style={[styles.confirmDeleteButtonText, { color: colors.destructiveForeground }]}>
                      Delete
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <ThemedModal
        visible={!!alertConfig}
        title={alertConfig?.title ?? ''}
        message={alertConfig?.message ?? ''}
        buttons={alertConfig?.buttons ?? []}
        onRequestClose={() => setAlertConfig(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
  },
  statCardContent: {
    padding: 16,
  },
  statCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextOutline: {
    fontSize: 14,
    fontWeight: '600',
  },
  jobsSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  tabContent: {
    gap: 12,
  },
  jobCard: {
    overflow: 'hidden',
  },
  jobCardContent: {
    padding: 12,
  },
  jobCardMain: {
    flexDirection: 'column',
    gap: 12,
  },
  jobInfo: {
    flex: 1,
    minWidth: 0,
  },
  jobTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  jobStatusBadge: {
    alignSelf: 'flex-start',
  },
  jobActionsButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobMetaText: {
    fontSize: 12,
  },
  viewDetailsButton: {
    alignSelf: 'flex-start',
  },
  viewDetailsText: {
    fontSize: 12,
  },
  centeredState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateText: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  retryText: { fontSize: 14, fontWeight: '600' },
  jobCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    borderRadius: 16,
    padding: 16,
    width: '80%',
    maxWidth: 280,
    gap: 12,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  actionItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Delete Confirmation Modal Styles
  confirmContainer: {
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 16,
  },
  confirmIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  confirmMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  confirmCancelButton: {
    borderWidth: 1,
  },
  confirmCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmDeleteButton: {},
  confirmDeleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

