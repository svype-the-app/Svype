import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Colors } from '@/constants/theme';
import { getApplicationById, initializeMockData, type Application } from '@/lib/mock-data';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

export default function ApplicationDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    initializeMockData();
    const appId = params.id as string;
    const found = getApplicationById(appId);
    if (found) {
      setApplication(found);
    }
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading application...
          </Text>
        </View>
      </View>
    );
  }

  if (!application) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Application not found
          </Text>
          <Button onPress={() => router.back()} style={styles.emptyButton}>
            Go Back
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return { backgroundColor: colors.primary + '20', color: colors.primary };
      case 'SHORTLISTED':
        return { backgroundColor: '#9333EA20', color: '#9333EA' };
      case 'INTERVIEW':
        return { backgroundColor: '#F59E0B20', color: '#F59E0B' };
      case 'REJECTED':
        return { backgroundColor: colors.destructive + '20', color: colors.destructive };
      default:
        return { backgroundColor: colors.muted, color: colors.mutedForeground };
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
      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Application Details
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            Track your progress
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Job Card */}
        <Card style={[styles.jobCard, { borderColor: colors.border, borderWidth: 2 }]}>
          <CardContent style={styles.jobCardContent}>
            <View style={styles.jobCardHeader}>
              <Avatar style={styles.avatar}>
                <AvatarFallback
                  style={[styles.avatarFallback, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                    {job.company.charAt(0)}
                  </Text>
                </AvatarFallback>
              </Avatar>
              <View style={styles.jobTitleContainer}>
                <Text style={[styles.jobTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {job.title}
                </Text>
                <Text style={[styles.jobCompany, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {job.company}
                </Text>
              </View>
              <Badge
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusColor(applicationStatus).backgroundColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: getStatusColor(applicationStatus).color },
                  ]}
                >
                  {applicationStatus}
                </Text>
              </Badge>
            </View>
            <View style={styles.badgesRow}>
              <Badge variant="outline" style={styles.badge}>
                <Ionicons name="location-outline" size={14} color={colors.foreground} />
                <Text style={[styles.badgeText, { color: colors.foreground }]}>{job.location}</Text>
              </Badge>
              <Badge variant="outline" style={styles.badge}>
                <Ionicons name="briefcase-outline" size={14} color={colors.foreground} />
                <Text style={[styles.badgeText, { color: colors.foreground }]}>{job.type}</Text>
              </Badge>
              <Badge variant="outline" style={styles.badge}>
                <Ionicons name="cash-outline" size={14} color={colors.foreground} />
                <Text style={[styles.badgeText, { color: colors.foreground }]}>
                  {formatSalary(job.salary_min, job.salary_max)}
                </Text>
              </Badge>
            </View>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" style={styles.tabs}>
          <TabsList className="grid-cols-3" style={styles.tabsList}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <View style={styles.tabContent}>
              <Card style={[styles.card, { borderColor: colors.border, borderWidth: 2 }]}>
                <CardContent style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    Application Information
                  </Text>
                  <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                        Applied On
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.foreground }]}>
                        {formatDate(applied_at)}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                        Status
                      </Text>
                      <Badge
                        style={[
                          styles.statusBadgeSmall,
                          {
                            backgroundColor: getStatusColor(applicationStatus).backgroundColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeTextSmall,
                            { color: getStatusColor(applicationStatus).color },
                          ]}
                        >
                          {applicationStatus}
                        </Text>
                      </Badge>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                        Application ID
                      </Text>
                      <Text style={[styles.infoValueMono, { color: colors.foreground }]}>
                        {application.id}
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </Card>

              <Card style={[styles.card, { borderColor: colors.border, borderWidth: 2 }]}>
                <CardContent style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    Job Description
                  </Text>
                  <Text style={[styles.description, { color: colors.mutedForeground }]}>
                    {job.description}
                  </Text>
                </CardContent>
              </Card>

              <Card style={[styles.card, { borderColor: colors.border, borderWidth: 2 }]}>
                <CardContent style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>Requirements</Text>
                  <View style={styles.requirementsList}>
                    {job.requirements.map((req, index) => (
                      <View key={index} style={styles.requirementRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.primary}
                          style={styles.requirementIcon}
                        />
                        <Text style={[styles.requirementText, { color: colors.mutedForeground }]}>
                          {req}
                        </Text>
                      </View>
                    ))}
                  </View>
                </CardContent>
              </Card>
            </View>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <View style={styles.tabContent}>
              <Card style={[styles.card, { borderColor: colors.border, borderWidth: 2 }]}>
                <CardContent style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    Application Timeline
                  </Text>
                  <View style={styles.timeline}>
                    {timeline.map((item, index) => (
                      <View key={index} style={styles.timelineItem}>
                        <View style={styles.timelineIndicator}>
                          <View
                            style={[
                              styles.timelineIcon,
                              {
                                backgroundColor: getStatusColor(item.status).backgroundColor,
                              },
                            ]}
                          >
                            {item.status === 'APPLIED' && (
                              <Ionicons
                                name="document-text"
                                size={20}
                                color={getStatusColor(item.status).color}
                              />
                            )}
                            {item.status === 'SHORTLISTED' && (
                              <Ionicons
                                name="trending-up"
                                size={20}
                                color={getStatusColor(item.status).color}
                              />
                            )}
                            {item.status === 'INTERVIEW' && (
                              <Ionicons
                                name="calendar"
                                size={20}
                                color={getStatusColor(item.status).color}
                              />
                            )}
                            {item.status === 'REJECTED' && (
                              <Ionicons
                                name="close"
                                size={20}
                                color={getStatusColor(item.status).color}
                              />
                            )}
                          </View>
                          {index < timeline.length - 1 && (
                            <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                          )}
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={[styles.timelineTitle, { color: colors.foreground }]}>
                            {item.description}
                          </Text>
                          <View style={styles.timelineDate}>
                            <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
                            <Text style={[styles.timelineDateText, { color: colors.mutedForeground }]}>
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
                <Card
                  style={[
                    styles.card,
                    { borderColor: '#F59E0B40', borderWidth: 2, backgroundColor: '#F59E0B10' },
                  ]}
                >
                  <CardContent style={styles.cardContent}>
                    <View style={styles.interviewAlert}>
                      <Ionicons name="calendar" size={24} color="#F59E0B" style={styles.interviewIcon} />
                      <View style={styles.interviewContent}>
                        <Text style={[styles.interviewTitle, { color: colors.foreground }]}>
                          Upcoming Interview
                        </Text>
                        <Text style={[styles.interviewText, { color: colors.mutedForeground }]}>
                          Scheduled for January 5, 2026 at 2:00 PM
                        </Text>
                        <Button style={styles.interviewButton}>
                          <Text style={[styles.interviewButtonText, { color: colors.primaryForeground }]}>
                            View Interview Details
                          </Text>
                          <Ionicons name="open-outline" size={16} color={colors.primaryForeground} />
                        </Button>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              )}
            </View>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <View style={styles.tabContent}>
              <Card style={[styles.card, { borderColor: colors.border, borderWidth: 2 }]}>
                <CardContent style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    Application Notes
                  </Text>
                  <View style={styles.notesContainer}>
                    <View style={[styles.noteCard, { backgroundColor: colors.muted + '80' }]}>
                      <View style={styles.noteHeader}>
                        <Ionicons
                          name="chatbox-outline"
                          size={18}
                          color={colors.mutedForeground}
                          style={styles.noteIcon}
                        />
                        <View style={styles.noteContent}>
                          <Text style={[styles.noteTitle, { color: colors.foreground }]}>
                            Initial Submission
                          </Text>
                          <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
                            Submitted application with updated CV highlighting React and TypeScript
                            experience
                          </Text>
                          <Text style={[styles.noteDate, { color: colors.mutedForeground }]}>
                            {formatDate(applied_at)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Button
                      variant="outline"
                      style={styles.addNoteButton}
                      onPress={() =>
                        Alert.alert('Add Note', 'Add note feature coming soon')
                      }
                    >
                      <Ionicons name="chatbox-outline" size={18} color={colors.foreground} />
                      <Text style={[styles.addNoteText, { color: colors.foreground }]}>
                        Add Note
                      </Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            </View>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <Card style={[styles.actionsCard, { borderColor: colors.border, borderWidth: 2 }]}>
          <CardContent style={styles.actionsContent}>
            <Button
              variant="outline"
              style={styles.actionButton}
              onPress={() => router.push(`/(company)/posts/${job.id}`)}
            >
              <Ionicons name="document-text-outline" size={18} color={colors.foreground} />
              <Text style={[styles.actionButtonText, { color: colors.foreground }]}>View Job</Text>
            </Button>
            <Button
              variant="outline"
              style={styles.actionButton}
              onPress={() => Alert.alert('Contact', 'Contact feature coming soon')}
            >
              <Ionicons name="chatbox-outline" size={18} color={colors.foreground} />
              <Text style={[styles.actionButtonText, { color: colors.foreground }]}>Contact</Text>
            </Button>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  jobCard: {
    borderRadius: 12,
  },
  jobCardContent: {
    padding: 16,
  },
  jobCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
  },
  tabs: {
    gap: 16,
  },
  tabsList: {
    marginBottom: 0,
  },
  tabContent: {
    gap: 16,
    marginTop: 16,
  },
  card: {
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoContainer: {
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
    fontWeight: '600',
    textAlign: 'right',
  },
  infoValueMono: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  statusBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeTextSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  requirementsList: {
    gap: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  requirementIcon: {
    marginTop: 2,
  },
  requirementText: {
    fontSize: 14,
    flex: 1,
  },
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineIndicator: {
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
    minHeight: 40,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 24,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  timelineDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineDateText: {
    fontSize: 13,
  },
  interviewAlert: {
    flexDirection: 'row',
    gap: 12,
  },
  interviewIcon: {
    marginTop: 2,
  },
  interviewContent: {
    flex: 1,
    gap: 8,
  },
  interviewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  interviewText: {
    fontSize: 14,
  },
  interviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  interviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesContainer: {
    gap: 16,
  },
  noteCard: {
    padding: 16,
    borderRadius: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  noteIcon: {
    marginTop: 2,
  },
  noteContent: {
    flex: 1,
    gap: 6,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noteDate: {
    fontSize: 12,
    marginTop: 4,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addNoteText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionsCard: {
    borderRadius: 12,
    marginBottom: 16,
  },
  actionsContent: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
