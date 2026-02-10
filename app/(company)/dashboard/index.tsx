import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CompanyDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [activeTab, setActiveTab] = useState<'jobs' | 'applicants'>('jobs');

  const [stats] = useState({
    activeJobs: 5,
    totalApplicants: 142,
    viewsThisWeek: 387,
    hiredThisMonth: 8,
  });

  const recentJobs = [
    { id: 1, title: 'Senior Frontend Engineer', applicants: 23, status: 'active', posted: '2 days ago' },
    { id: 2, title: 'Product Designer', applicants: 18, status: 'active', posted: '1 week ago' },
    { id: 3, title: 'Backend Developer', applicants: 31, status: 'active', posted: '1 week ago' },
    { id: 4, title: 'Marketing Lead', applicants: 15, status: 'closed', posted: '2 weeks ago' },
  ];

  const recentApplicants = [
    { id: 1, name: 'Sarah Johnson', job: 'Senior Frontend Engineer', status: 'pending', applied: '2 hours ago' },
    { id: 2, name: 'Michael Chen', job: 'Product Designer', status: 'pending', applied: '5 hours ago' },
    { id: 3, name: 'Emma Wilson', job: 'Backend Developer', status: 'reviewing', applied: '1 day ago' },
    { id: 4, name: 'James Brown', job: 'Senior Frontend Engineer', status: 'pending', applied: '1 day ago' },
  ];

  const getStatusColor = (status: string) => {
    return status === 'active' ? colors.primary : colors.mutedForeground;
  };

  const getApplicantStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'reviewing':
        return { bg: '#dbeafe', text: '#1e40af' };
      default:
        return { bg: colors.muted, text: colors.mutedForeground };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.companyName, { color: colors.foreground }]}>TechCorp Inc.</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>Company Dashboard</Text>
          </View>
          <View style={styles.headerRight}>
            <Button
              variant="outline"
              style={styles.postsButton}
              onPress={() => router.push('/(company)/posts')}
            >
              <Text style={styles.postsButtonText}>Posts</Text>
            </Button>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/(company)/profile/settings')}
            >
              <Ionicons name="settings-outline" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.foreground} />
            </TouchableOpacity>
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
            style={styles.actionButton}
            onPress={() => router.push('/(company)/posts/post-job')}
          >
            <Ionicons name="add" size={20} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>Post New Job</Text>
          </Button>

          <Button
            variant="outline"
            style={styles.actionButton}
            onPress={() => router.push('/(company)/applicants/review-applicants')}
          >
            <Ionicons name="people-outline" size={20} color={colors.foreground} style={styles.actionIcon} />
            <Text style={[styles.actionButtonTextOutline, { color: colors.foreground }]}>Review Applicants</Text>
          </Button>

          <Button
            variant="outline"
            style={[styles.actionButton, { borderColor: '#a855f7' }]}
            onPress={() => router.push('/(company)/applicants/ai-shortlist')}
          >
            <Ionicons name="sparkles" size={20} color="#a855f7" style={styles.actionIcon} />
            <Text style={[styles.actionButtonTextOutline, { color: '#a855f7' }]}>AI Shortlist</Text>
          </Button>

          <Button
            variant="outline"
            style={[styles.actionButton, { borderColor: '#3b82f6' }]}
            onPress={() => router.push('/(company)/applicants/interview-results/1')}
          >
            <Ionicons name="document-text-outline" size={20} color="#3b82f6" style={styles.actionIcon} />
            <Text style={[styles.actionButtonTextOutline, { color: '#3b82f6' }]}>Interview Results</Text>
          </Button>

          <Button
            variant="outline"
            style={styles.actionButton}
            onPress={() => router.push('/(company)/posts')}
          >
            <Ionicons name="create-outline" size={20} color={colors.foreground} style={styles.actionIcon} />
            <Text style={[styles.actionButtonTextOutline, { color: colors.foreground }]}>Create Post</Text>
          </Button>
        </View>

        {/* Tabs Section */}
        <View style={styles.tabs}>
          <View style={styles.tabsList}>
            <TouchableOpacity
              style={[
                styles.tabTrigger,
                activeTab === 'jobs' && { ...styles.tabTriggerActive, backgroundColor: colors.primary }
              ]}
              onPress={() => setActiveTab('jobs')}
            >
              <Text style={[
                styles.tabTriggerText,
                { color: activeTab === 'jobs' ? '#fff' : colors.foreground }
              ]}>Job Postings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabTrigger,
                activeTab === 'applicants' && { ...styles.tabTriggerActive, backgroundColor: colors.primary }
              ]}
              onPress={() => setActiveTab('applicants')}
            >
              <Text style={[
                styles.tabTriggerText,
                { color: activeTab === 'applicants' ? '#fff' : colors.foreground }
              ]}>Recent Applicants</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'jobs' && (
            <View style={styles.tabContent}>
              {recentJobs.map((job) => (
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
                              {job.applicants} applicants
                            </Text>
                          </View>
                          <Text style={[styles.jobMetaText, { color: colors.mutedForeground }]}>
                            Posted {job.posted}
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
          )}

          {activeTab === 'applicants' && (
            <View style={styles.tabContent}>
              {recentApplicants.map((applicant) => (
                <Card
                  key={applicant.id}
                  style={[styles.applicantCard, { borderColor: colors.border, borderWidth: 2 }]}
                >
                  <CardContent style={styles.applicantCardContent}>
                    <View style={styles.applicantCardMain}>
                      <View style={styles.applicantInfo}>
                        <View style={styles.applicantTitleRow}>
                          <Text style={[styles.applicantName, { color: colors.foreground }]}>
                            {applicant.name}
                          </Text>
                          <Badge
                            variant="outline"
                            style={{
                              ...styles.applicantStatusBadge,
                              backgroundColor: getApplicantStatusColor(applicant.status).bg,
                            }}
                          >
                            <Text
                              style={{
                                ...styles.applicantStatusText,
                                color: getApplicantStatusColor(applicant.status).text,
                              }}
                            >
                              {applicant.status}
                            </Text>
                          </Badge>
                        </View>
                        <Text style={[styles.applicantJob, { color: colors.mutedForeground }]} numberOfLines={1}>
                          Applied for: {applicant.job}
                        </Text>
                        <Text style={[styles.applicantTime, { color: colors.mutedForeground }]}>
                          {applicant.applied}
                        </Text>
                      </View>
                      <Button
                        style={styles.reviewButton}
                        onPress={() =>
                          router.push('/(company)/applicants/review-applicants')
                        }
                      >
                        <Text style={styles.reviewButtonText}>Review</Text>
                      </Button>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          )}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postsButton: {
    paddingHorizontal: 16,
    height: 60,
    minWidth: 80,
  },
  postsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  tabs: {
    gap: 16,
  },
  tabsList: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabTrigger: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTriggerActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabTriggerText: {
    fontSize: 14,
    fontWeight: '600',
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
  applicantCard: {
    overflow: 'hidden',
  },
  applicantCardContent: {
    padding: 12,
  },
  applicantCardMain: {
    flexDirection: 'column',
    gap: 12,
  },
  applicantInfo: {
    flex: 1,
    minWidth: 0,
  },
  applicantTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  applicantName: {
    fontSize: 14,
    fontWeight: '600',
  },
  applicantStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  applicantStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  applicantJob: {
    fontSize: 12,
    marginBottom: 4,
  },
  applicantTime: {
    fontSize: 10,
  },
  reviewButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    height: 60,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

