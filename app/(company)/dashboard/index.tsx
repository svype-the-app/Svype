import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authApi, jobsApi, type Job } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CompanyDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [companyName, setCompanyName] = useState('Company');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [me, myJobs] = await Promise.all([
          authApi.getMe(),
          jobsApi.getMyJobs(),
        ]);

        setCompanyName(me.company?.name || 'Company');
        setJobs(myJobs);
      } catch (error) {
        console.error('Failed to load company dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  const formatPostedDate = (postedAt: string) => {
    const posted = new Date(postedAt);
    const now = new Date();
    const diffMs = now.getTime() - posted.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
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
            style={[styles.actionButton, { borderColor: '#a855f7' }]}
            onPress={() => router.push('/(company)/applicants/ai-shortlist')}
          >
            <Ionicons name="sparkles" size={20} color="#a855f7" style={styles.actionIcon} />
            <Text style={[styles.actionButtonTextOutline, { color: '#a855f7' }]}>AI Shortlist History</Text>
          </Button>

          <Button
            variant="outline"
            style={[styles.actionButton, { borderColor: '#3b82f6' }]}
            onPress={() => router.push('/(company)/applicants/interview-results/1')}
          >
            <Ionicons name="document-text-outline" size={20} color="#3b82f6" style={styles.actionIcon} />
            <Text style={[styles.actionButtonTextOutline, { color: '#3b82f6' }]}>PreScreening Results</Text>
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
                          Posted {formatPostedDate(job.posted_at)}
                        </Text>
                      </View>
                    </View>
                    <Button
                      variant="outline"
                      style={styles.viewDetailsButton}
                      onPress={() => router.push(`/(company)/posts/${job.id}`)}
                    >
                      <Text style={[styles.viewDetailsText, { color: colors.foreground }]}> 
                        View Details
                      </Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
});

