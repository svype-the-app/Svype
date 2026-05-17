import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useChatUnread } from '@/lib/chat-unread-context';
import { useApplications } from '@/lib/applications-context';
import { aiChatApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { setHasUnreadAiMsg } = useChatUnread();
  const { applications, initialLoading, loadError, refreshing, refresh } = useApplications();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'closed'>('all');

  // Trigger the AI welcome message exactly once per app session — runs only
  // on initial mount, not on every Dashboard focus.
  useEffect(() => {
    (async () => {
      try {
        const result = await aiChatApi.careerStart();
        if (!result.already_started && result.new_message) {
          setHasUnreadAiMsg(true);
        }
      } catch {
        // Non-critical — silently ignore if AI welcome fails
      }
    })();
  }, [setHasUnreadAiMsg]);

  const ACTIVE_STATUSES = ['applied', 'shortlisted', 'interview', 'offered'];
  const CLOSED_STATUSES = ['rejected', 'withdrawn'];

  const formatSalary = (min: number, max: number) => {
    return `£${(min / 1000).toFixed(0)}k - £${(max / 1000).toFixed(0)}k`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return '#3b82f6';
      case 'shortlisted':
        return '#a855f7';
      case 'interview':
        return '#f59e0b';
      case 'offered':
        return '#22c55e';
      case 'rejected':
      case 'withdrawn':
        return '#ef4444';
      default:
        return colors.muted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return 'time-outline';
      case 'shortlisted':
        return 'trending-up-outline';
      case 'interview':
        return 'calendar-outline';
      case 'offered':
        return 'checkmark-circle-outline';
      case 'rejected':
      case 'withdrawn':
        return 'close-circle-outline';
      default:
        return 'briefcase-outline';
    }
  };

  const activeApps = applications.filter((app) => ACTIVE_STATUSES.includes(app.status.toLowerCase()));
  const closedApps = applications.filter((app) => CLOSED_STATUSES.includes(app.status.toLowerCase()));

  const filteredApplications =
    activeTab === 'active'
      ? activeApps
      : activeTab === 'closed'
      ? closedApps
      : applications;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>Applications</Text>
            <Button
              variant="outline"
              onPress={() => router.push('/(jobseeker)/swipe')}
              style={styles.findJobsButton}
            >
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={[styles.findJobsText, { color: colors.foreground }]}>Find Jobs</Text>
            </Button>
          </View>

          {/* Stats Overview */}
          {applications.length > 0 && (
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {applications.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#22c55e20' }]}>
                <Text style={[styles.statValue, { color: '#22c55e' }]}>{activeApps.length}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#3b82f620' }]}>
                <Text style={[styles.statValue, { color: '#3b82f6' }]}>{closedApps.length}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Closed</Text>
              </View>
            </View>
          )}

          {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.muted }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'all' && [styles.activeTab, { backgroundColor: colors.background }],
            ]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.foreground },
                activeTab === 'all' && styles.activeTabText,
              ]}
            >
              All ({applications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'active' && [styles.activeTab, { backgroundColor: colors.background }],
            ]}
            onPress={() => setActiveTab('active')}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.foreground },
                activeTab === 'active' && styles.activeTabText,
              ]}
            >
              Active ({activeApps.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'closed' && [styles.activeTab, { backgroundColor: colors.background }],
            ]}
            onPress={() => setActiveTab('closed')}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.foreground },
                activeTab === 'closed' && styles.activeTabText,
              ]}
            >
              Closed ({closedApps.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Applications List */}
        <View style={styles.listContainer}>
          {initialLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : loadError ? (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-offline-outline" size={64} color={colors.mutedForeground} />
              <Text style={[styles.emptyStateTitle, { color: colors.foreground }]}>
                Failed to Load Applications
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
                Couldn't connect to the server. Check your connection and try again.
              </Text>
              <Button
                onPress={refresh}
                style={styles.emptyButton}
              >
                Retry
              </Button>
            </View>
          ) : filteredApplications.length > 0 ? (
            filteredApplications.map((app) => (
              <TouchableOpacity
                key={app.id}
                onPress={() => router.push(`/(jobseeker)/dashboard/${app.id}` as any)}
              >
                <Card style={styles.applicationCard}>
                  <CardContent style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <Text style={[styles.jobTitle, { color: colors.cardForeground }]}>
                          {app.job.title}
                        </Text>
                        <Text style={[styles.companyName, { color: colors.mutedForeground }]}>
                          {app.job.company_name}
                        </Text>
                      </View>
                      <Badge
                        style={{
                          backgroundColor: getStatusColor(app.status) + '20',
                        }}
                        textStyle={{ color: getStatusColor(app.status) }}
                      >
                        <Ionicons
                          name={getStatusIcon(app.status) as any}
                          size={12}
                          color={getStatusColor(app.status)}
                        />
                        <Text>{app.status.toUpperCase()}</Text>
                      </Badge>
                    </View>

                    <Text
                      style={[styles.jobDescription, { color: colors.mutedForeground }]}
                      numberOfLines={2}
                    >
                      {app.job.description || 'No description available'}
                    </Text>

                    <View style={styles.badgesRow}>
                      <Badge variant="outline">
                        <Ionicons name="briefcase-outline" size={12} color={colors.foreground} />
                        <Text>{app.job.job_type}</Text>
                      </Badge>
                      {typeof app.job.salary_min === 'number' && typeof app.job.salary_max === 'number' && (
                        <Badge variant="outline">
                          <Ionicons name="cash-outline" size={12} color={colors.foreground} />
                          <Text>{formatSalary(app.job.salary_min, app.job.salary_max)}</Text>
                        </Badge>
                      )}
                    </View>

                    <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                      <View style={styles.footerItem}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color={colors.mutedForeground}
                        />
                        <Text
                          style={[styles.footerText, { color: colors.mutedForeground }]}
                          numberOfLines={1}
                        >
                          {app.job.location}
                        </Text>
                      </View>
                      <View style={styles.footerItem}>
                        <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
                        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                          Applied {formatDate(app.applied_at)}
                        </Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={64} color={colors.mutedForeground} />
              <Text style={[styles.emptyStateTitle, { color: colors.foreground }]}>
                No applications yet
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
                Start swiping to find your dream job
              </Text>
              <Button onPress={() => router.push('/(jobseeker)/swipe')} style={styles.emptyButton}>
                Find Jobs
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  findJobsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  findJobsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 4,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTab: {},
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  loader: {
    marginTop: 32,
  },
  applicationCard: {
    marginBottom: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '500',
  },
  jobDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 120,
  },
});
