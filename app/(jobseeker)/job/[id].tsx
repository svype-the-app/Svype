import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { getAvailableJobs, type Job } from '@/lib/mock-data';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [job, setJob] = useState<Job | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const jobs = getAvailableJobs();
    const foundJob = jobs.find((j: Job) => j.id === id);
    if (foundJob) {
      setJob(foundJob);
    }

    // Check if saved (simplified for React Native without AsyncStorage)
    setIsSaved(false);
    
    // Check if already applied (simplified)
    setHasApplied(false);
  }, [id]);

  const handleApply = () => {
    if (!job) return;
    // TODO: Implement actual job application logic
    setHasApplied(true);
    Alert.alert(
      'Application Submitted! 🎉',
      `Your application for ${job.title} has been sent.`
    );
  };

  const handleSave = () => {
    if (!job) return;
    
    setIsSaved(!isSaved);
    Alert.alert(
      isSaved ? 'Job Removed' : 'Job Saved',
      isSaved ? 'Job removed from saved' : 'Job saved for later'
    );
  };

  const handleShare = async () => {
    if (!job) return;
    
    try {
      await Share.share({
        message: `Check out this ${job.title} position at ${job.company}`,
        title: job.title
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share job');
    }
  };

  const formatSalary = (min: number, max: number) => {
    return `£${(min / 1000).toFixed(0)}k - £${(max / 1000).toFixed(0)}k`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!job) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
          Job not found
        </Text>
        <Button variant="outline" onPress={() => router.back()}>
          <Text style={[styles.errorButtonText, { color: colors.primary }]}>
            Go Back
          </Text>
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.cardForeground} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
              <Ionicons name="share-outline" size={20} color={colors.cardForeground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
              <Ionicons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color={isSaved ? colors.primary : colors.cardForeground} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Company Header */}
          <Card style={styles.card}>
            <CardContent>
              <View style={styles.companyHeader}>
                <Avatar size={64}>
                  <AvatarFallback 
                    style={{ ...styles.avatarFallback, backgroundColor: colors.primary }}
                  >
                    <Text style={styles.avatarText}>{job.company.charAt(0)}</Text>
                  </AvatarFallback>
                </Avatar>
                <View style={styles.companyInfo}>
                  <Text style={[styles.jobTitle, { color: colors.cardForeground }]}>
                    {job.title}
                  </Text>
                  <Text style={[styles.companyName, { color: colors.mutedForeground }]}>
                    {job.company}
                  </Text>
                  <View style={styles.jobBadges}>
                    <Badge variant="outline" style={styles.badge}>
                      <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                        {job.location}
                      </Text>
                    </Badge>
                    <Badge variant="outline" style={styles.badge}>
                      <Ionicons name="briefcase-outline" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                        {job.type}
                      </Text>
                    </Badge>
                    <Badge variant="outline" style={styles.badge}>
                      <Ionicons name="cash-outline" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                        {formatSalary(job.salary_min, job.salary_max)}
                      </Text>
                    </Badge>
                    <Badge variant="outline" style={styles.badge}>
                      <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                        Posted {formatDate(job.posted_at)}
                      </Text>
                    </Badge>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* About the Role */}
          <Card style={styles.card}>
            <CardContent>
              <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
                About the Role
              </Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                {job.description}
              </Text>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card style={styles.card}>
            <CardContent>
              <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
                Requirements
              </Text>
              <View style={styles.requirementsList}>
                {job.requirements.map((req, index) => (
                  <View key={index} style={styles.requirementItem}>
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

          {/* Company Info */}
          <Card style={styles.card}>
            <CardContent>
              <View style={styles.companyInfoHeader}>
                <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
                  About {job.company}
                </Text>
                <TouchableOpacity 
                  onPress={() => router.push(`/(jobseeker)/job/company/${job.company.toLowerCase().replace(/\s+/g, '-')}`)}
                >
                  <View style={styles.viewProfileButton}>
                    <Text style={[styles.viewProfileText, { color: colors.primary }]}>
                      View Profile
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.companyDetails}>
                <Ionicons 
                  name="business-outline" 
                  size={20} 
                  color={colors.mutedForeground} 
                  style={styles.companyIcon}
                />
                <View style={styles.companyDetailsText}>
                  <Text style={[styles.companyDescription, { color: colors.mutedForeground }]}>
                    {job.company} is a leading company in the technology sector, known for innovation and employee satisfaction.
                  </Text>
                  <View style={styles.companyBadges}>
                    <Badge variant="secondary" style={styles.companyBadge}>
                      <Text style={styles.companyBadgeText}>100-500 employees</Text>
                    </Badge>
                    <Badge variant="secondary" style={styles.companyBadge}>
                      <Text style={styles.companyBadgeText}>Tech Industry</Text>
                    </Badge>
                    <Badge variant="secondary" style={styles.companyBadge}>
                      <Text style={styles.companyBadgeText}>Founded 2015</Text>
                    </Badge>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Similar Jobs */}
          <Card style={styles.card}>
            <CardContent>
              <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
                Similar Opportunities
              </Text>
              <View style={styles.similarJobs}>
                {getAvailableJobs().filter((j: Job) => j.id !== job.id).slice(0, 3).map((similarJob: Job) => (
                  <TouchableOpacity
                    key={similarJob.id}
                    onPress={() => router.push(`/(jobseeker)/job/${similarJob.id}`)}
                  >
                    <View style={[styles.similarJobCard, { borderColor: colors.border }]}>
                      <View style={styles.similarJobContent}>
                        <View style={styles.similarJobInfo}>
                          <Text style={[styles.similarJobTitle, { color: colors.cardForeground }]}>
                            {similarJob.title}
                          </Text>
                          <Text style={[styles.similarJobCompany, { color: colors.mutedForeground }]}>
                            {similarJob.company}
                          </Text>
                        </View>
                        <Badge variant="outline" style={styles.similarJobBadge}>
                          <Text style={[styles.similarJobSalary, { color: colors.mutedForeground }]}>
                            {formatSalary(similarJob.salary_min, similarJob.salary_max)}
                          </Text>
                        </Badge>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { 
        backgroundColor: colors.card + 'F2',
        borderTopColor: colors.border 
      }]}>
        <View style={styles.bottomBarContent}>
          {hasApplied ? (
            <Button disabled style={styles.applyButton}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.appliedButtonText}>Applied</Text>
            </Button>
          ) : (
            <Button onPress={handleApply} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Apply Now</Text>
            </Button>
          )}
          <Button variant="outline" onPress={handleSave} style={styles.saveButton}>
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color={colors.primary} 
            />
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  errorButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  companyHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  companyInfo: {
    flex: 1,
    gap: 8,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
  },
  jobBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 11,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  requirementsList: {
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    gap: 12,
  },
  requirementIcon: {
    marginTop: 2,
  },
  requirementText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  companyInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewProfileText: {
    fontSize: 13,
    fontWeight: '600',
  },
  companyDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  companyIcon: {
    marginTop: 2,
  },
  companyDetailsText: {
    flex: 1,
    gap: 12,
  },
  companyDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  companyBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  companyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  companyBadgeText: {
    fontSize: 12,
  },
  similarJobs: {
    gap: 8,
  },
  similarJobCard: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  similarJobContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  similarJobInfo: {
    flex: 1,
  },
  similarJobTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  similarJobCompany: {
    fontSize: 13,
  },
  similarJobBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  similarJobSalary: {
    fontSize: 11,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  bottomBarContent: {
    flexDirection: 'row',
    gap: 12,
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appliedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
});
