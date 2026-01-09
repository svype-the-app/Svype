import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { Application, getApplications } from '@/lib/mock-data';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

export default function ApplicationDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams();
  const [application, setApplication] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'notes'>('overview');

  useEffect(() => {
    const appId = params.id as string;
    const apps = getApplications();
    const found = apps.find((app) => app.id === appId);
    if (found) {
      setApplication(found);
    }
  }, [params.id]);

  if (!application) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
            Application not found
          </Text>
          <Button variant="outline" onPress={() => router.back()} style={styles.backButtonNotFound}>
            <Text>Go Back</Text>
          </Button>
        </View>
      </View>
    );
  }

  const { job, applicationStatus, applied_at } = application;

  const formatSalary = (min: number, max: number) => {
    return `£${(min / 1000).toFixed(0)}k - £${(max / 1000).toFixed(0)}k`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return '#3b82f6';
      case 'SHORTLISTED':
        return '#a855f7';
      case 'INTERVIEW':
        return '#f59e0b';
      case 'REJECTED':
        return '#ef4444';
      default:
        return colors.muted;
    }
  };

  const timeline = [
    { status: 'APPLIED', date: applied_at, description: 'Application submitted' },
    ...(applicationStatus === 'SHORTLISTED' || applicationStatus === 'INTERVIEW'
      ? [
          {
            status: 'SHORTLISTED',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Shortlisted for review',
          },
        ]
      : []),
    ...(applicationStatus === 'INTERVIEW'
      ? [
          {
            status: 'INTERVIEW',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Interview scheduled',
          },
        ]
      : []),
    ...(applicationStatus === 'REJECTED'
      ? [
          {
            status: 'REJECTED',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Application not selected',
          },
        ]
      : []),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Application Details
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              Track your progress
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Job Card */}
        <Card>
          <CardContent style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <Avatar
                size={64}
                style={{
                  backgroundColor: colors.primary,
                  borderWidth: 2,
                  borderColor: colors.border,
                }}
              >
                <AvatarFallback>
                  <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                    {job.company.charAt(0)}
                  </Text>
                </AvatarFallback>
              </Avatar>
              <View style={styles.jobInfo}>
                <Text style={[styles.jobTitle, { color: colors.foreground }]}>{job.title}</Text>
                <Text style={[styles.companyName, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {job.company}
                </Text>
              </View>
              <Badge
                style={{ backgroundColor: getStatusColor(applicationStatus) + '20' }}
                textStyle={{ color: getStatusColor(applicationStatus) }}
              >
                <Text>{applicationStatus}</Text>
              </Badge>
            </View>
            <View style={styles.badgesRow}>
              <Badge variant="outline">
                <Ionicons name="location-outline" size={12} color={colors.foreground} />
                <Text>{job.location}</Text>
              </Badge>
              <Badge variant="outline">
                <Ionicons name="briefcase-outline" size={12} color={colors.foreground} />
                <Text>{job.type}</Text>
              </Badge>
              <Badge variant="outline">
                <Ionicons name="cash-outline" size={12} color={colors.foreground} />
                <Text>{formatSalary(job.salary_min, job.salary_max)}</Text>
              </Badge>
            </View>
          </CardContent>
        </Card>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.muted }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'overview' && [styles.activeTab, { backgroundColor: colors.background }],
            ]}
            onPress={() => setActiveTab('overview')}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.foreground },
                activeTab === 'overview' && styles.activeTabText,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'timeline' && [styles.activeTab, { backgroundColor: colors.background }],
            ]}
            onPress={() => setActiveTab('timeline')}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.foreground },
                activeTab === 'timeline' && styles.activeTabText,
              ]}
            >
              Timeline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'notes' && [styles.activeTab, { backgroundColor: colors.background }],
            ]}
            onPress={() => setActiveTab('notes')}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.foreground },
                activeTab === 'notes' && styles.activeTabText,
              ]}
            >
              Notes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <Card>
              <CardContent style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Application Information
                </Text>
                <View style={styles.infoRows}>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                      Applied On
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]}>
                      {formatDate(applied_at)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Status</Text>
                    <Badge
                      style={{ backgroundColor: getStatusColor(applicationStatus) + '20' }}
                      textStyle={{ color: getStatusColor(applicationStatus) }}
                    >
                      <Text>{applicationStatus}</Text>
                    </Badge>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                      Application ID
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: 'monospace' }]}>
                      {application.id}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card>
              <CardContent style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Job Description
                </Text>
                <Text style={[styles.description, { color: colors.mutedForeground }]}>
                  {job.description}
                </Text>
              </CardContent>
            </Card>

            <Card>
              <CardContent style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Requirements</Text>
                <View style={styles.requirements}>
                  {job.requirements.map((req, index) => (
                    <View key={index} style={styles.requirementItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      <Text style={[styles.requirementText, { color: colors.mutedForeground }]}>
                        {req}
                      </Text>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {activeTab === 'timeline' && (
          <View style={styles.tabContent}>
            <Card>
              <CardContent style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Application Timeline
                </Text>
                <View style={styles.timeline}>
                  {timeline.map((item, index) => (
                    <View key={index} style={styles.timelineItem}>
                      <View style={styles.timelineLeft}>
                        <View
                          style={[
                            styles.timelineIcon,
                            { backgroundColor: getStatusColor(item.status) + '20' },
                          ]}
                        >
                          {item.status === 'APPLIED' && (
                            <Ionicons name="document-text" size={20} color={getStatusColor(item.status)} />
                          )}
                          {item.status === 'SHORTLISTED' && (
                            <Ionicons name="trending-up" size={20} color={getStatusColor(item.status)} />
                          )}
                          {item.status === 'INTERVIEW' && (
                            <Ionicons name="calendar" size={20} color={getStatusColor(item.status)} />
                          )}
                          {item.status === 'REJECTED' && (
                            <Ionicons name="close-circle" size={20} color={getStatusColor(item.status)} />
                          )}
                        </View>
                        {index < timeline.length - 1 && (
                          <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                        )}
                      </View>
                      <View style={styles.timelineRight}>
                        <Text style={[styles.timelineTitle, { color: colors.foreground }]}>
                          {item.description}
                        </Text>
                        <View style={styles.timelineDate}>
                          <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
                          <Text style={[styles.timelineText, { color: colors.mutedForeground }]}>
                            {formatDate(item.date)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>

            {applicationStatus === 'INTERVIEW' && (
              <Card style={[styles.interviewCard, { borderColor: '#f59e0b40' }]}>
                <CardContent style={styles.section}>
                  <View style={styles.interviewContent}>
                    <Ionicons name="calendar" size={20} color="#f59e0b" />
                    <View style={styles.interviewText}>
                      <Text style={[styles.interviewTitle, { color: colors.foreground }]}>
                        Upcoming Interview
                      </Text>
                      <Text style={[styles.interviewDate, { color: colors.mutedForeground }]}>
                        Scheduled for January 5, 2026 at 2:00 PM
                      </Text>
                      <Button style={styles.interviewButton}>
                        <Text style={{ color: colors.primaryForeground }}>View Interview Details</Text>
                        <Ionicons name="open-outline" size={16} color={colors.primaryForeground} />
                      </Button>
                    </View>
                  </View>
                </CardContent>
              </Card>
            )}
          </View>
        )}

        {activeTab === 'notes' && (
          <View style={styles.tabContent}>
            <Card>
              <CardContent style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Application Notes
                </Text>
                <View style={styles.notes}>
                  <View style={[styles.noteItem, { backgroundColor: colors.muted }]}>
                    <View style={styles.noteHeader}>
                      <Ionicons name="chatbox-outline" size={16} color={colors.mutedForeground} />
                      <Text style={[styles.noteTitle, { color: colors.foreground }]}>
                        Initial Submission
                      </Text>
                    </View>
                    <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
                      Submitted application with updated CV highlighting React and TypeScript experience
                    </Text>
                    <Text style={[styles.noteDate, { color: colors.mutedForeground }]}>
                      {formatDate(applied_at)}
                    </Text>
                  </View>
                  <Button variant="outline" style={styles.addNoteButton}>
                    <Ionicons name="add-circle-outline" size={16} color={colors.foreground} />
                    <Text style={{ color: colors.foreground }}>Add Note</Text>
                  </Button>
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Actions */}
        <Card>
          <CardContent style={styles.actionsCard}>
            <View style={styles.actions}>
              <Button
                variant="outline"
                style={styles.actionButton}
                onPress={() => router.push(`/(jobseeker)/job/${job.id}` as any)}
              >
                <Ionicons name="document-text-outline" size={16} color={colors.foreground} />
                <Text style={{ color: colors.foreground }}>View Job</Text>
              </Button>
              <Button variant="outline" style={styles.actionButton}>
                <Ionicons name="chatbox-outline" size={16} color={colors.foreground} />
                <Text style={{ color: colors.foreground }}>Contact</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 16,
    marginBottom: 16,
  },
  backButtonNotFound: {
    marginTop: 8,
  },
  jobCard: {
    padding: 20,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '500',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTab: {},
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '700',
  },
  tabContent: {
    gap: 12,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRows: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  requirements: {
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
    flex: 1,
  },
  timeline: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineLeft: {
    alignItems: 'center',
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 8,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 8,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineText: {
    fontSize: 12,
  },
  interviewCard: {
    borderWidth: 1,
  },
  interviewContent: {
    flexDirection: 'row',
    gap: 12,
  },
  interviewText: {
    flex: 1,
    gap: 8,
  },
  interviewTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  interviewDate: {
    fontSize: 12,
  },
  interviewButton: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'flex-start',
  },
  notes: {
    gap: 12,
  },
  noteItem: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
  },
  noteDate: {
    fontSize: 11,
  },
  addNoteButton: {
    flexDirection: 'row',
    gap: 8,
  },
  actionsCard: {
    padding: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
});
