import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { getAvailableJobs, type Job } from '@/lib/mock-data';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Simple in-memory storage for saved jobs
let savedJobsCache: string[] = [];

const SWIPE_THRESHOLD = -80;

export default function SavedJobsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedJobs();
  }, []);

  const loadSavedJobs = async () => {
    try {
      const allJobs = getAvailableJobs();
      const saved = allJobs.filter((job) => savedJobsCache.includes(job.id));
      setSavedJobs(saved);
    } catch (error) {
      console.error('Error loading saved jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (jobId: string, jobTitle: string) => {
    Alert.alert('Remove Job', `Remove "${jobTitle}" from saved jobs?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            savedJobsCache = savedJobsCache.filter((id) => id !== jobId);
            loadSavedJobs();
          } catch (error) {
            console.error('Error removing job:', error);
          }
        },
      },
    ]);
  };

  const formatSalary = (min: number, max: number) => {
    return `£${(min / 1000).toFixed(0)}k - £${(max / 1000).toFixed(0)}k`;
  };

  const JobCard = ({ job }: { job: Job }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const [swiped, setSwiped] = useState(false);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dx < 0) {
            translateX.setValue(Math.max(gestureState.dx, SWIPE_THRESHOLD));
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < SWIPE_THRESHOLD) {
            Animated.spring(translateX, {
              toValue: SWIPE_THRESHOLD,
              useNativeDriver: true,
            }).start();
            setSwiped(true);
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
            setSwiped(false);
          }
        },
      })
    ).current;

    const resetSwipe = useCallback(() => {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      setSwiped(false);
    }, [translateX]);

    return (
      <View style={styles.jobCardContainer}>
        {/* Delete button background */}
        <View style={[styles.deleteBackground, { backgroundColor: '#ef4444' }]}>
          <Ionicons name="trash" size={24} color="#fff" />
        </View>

        {/* Swipeable card */}
        <Animated.View
          style={[styles.swipeableCard, { transform: [{ translateX }] }]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            onPress={() => {
              if (swiped) {
                resetSwipe();
              } else {
                router.push(`/(jobseeker)/swipe/job/${job.id}` as any);
              }
            }}
            activeOpacity={0.7}
          >
            <Card style={[styles.jobCard, { borderColor: colors.border }]}>
              <CardContent style={styles.jobCardContent}>
                <View style={styles.jobCardHeader}>
                  <View style={styles.jobCardHeaderText}>
                    <Text style={[styles.jobTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {job.title}
                    </Text>
                    <Text style={[styles.jobCompany, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {job.company}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemove(job.id, job.title)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.jobDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {job.description}
                </Text>

                <View style={styles.badgesContainer}>
                  <Badge variant="outline" style={styles.badge}>
                    <View style={styles.badgeContent}>
                      <Ionicons name="briefcase-outline" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                        {job.type}
                      </Text>
                    </View>
                  </Badge>
                  <Badge variant="outline" style={styles.badge}>
                    <View style={styles.badgeContent}>
                      <Ionicons name="cash-outline" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                        {formatSalary(job.salary_min, job.salary_max)}
                      </Text>
                    </View>
                  </Badge>
                  <Badge variant="outline" style={styles.badge}>
                    <View style={styles.badgeContent}>
                      <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.badgeText, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {job.location}
                      </Text>
                    </View>
                  </Badge>
                </View>

                <Button
                  variant="outline"
                  onPress={() => router.push(`/(jobseeker)/swipe/job/${job.id}` as any)}
                  style={styles.viewDetailsButton}
                >
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>View Details</Text>
                    <Ionicons name="open-outline" size={16} color={colors.primary} />
                  </View>
                </Button>
              </CardContent>
            </Card>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.muted }]}>
        <Ionicons name="bookmark-outline" size={48} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Saved Jobs</Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
        Start swiping to save jobs you're interested in
      </Text>
      <Button onPress={() => router.push('/(jobseeker)/swipe')} style={styles.emptyButton}>
        Start Swiping
      </Button>
    </View>
  );

  const LoadingSkeleton = () => (
    <Card style={[styles.skeletonCard, { borderColor: colors.border }]}>
      <CardContent style={styles.jobCardContent}>
        <View style={[styles.skeletonTitle, { backgroundColor: colors.muted }]} />
        <View style={[styles.skeletonSubtitle, { backgroundColor: colors.muted }]} />
        <View style={[styles.skeletonDescription, { backgroundColor: colors.muted }]} />
        <View style={styles.skeletonBadges}>
          <View style={[styles.skeletonBadge, { backgroundColor: colors.muted }]} />
          <View style={[styles.skeletonBadge, { backgroundColor: colors.muted }]} />
          <View style={[styles.skeletonBadge, { backgroundColor: colors.muted }]} />
        </View>
      </CardContent>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.headerBack}
        >
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="bookmark" size={24} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Saved Jobs</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              {savedJobs.length} jobs saved
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <>
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
          </>
        ) : savedJobs.length > 0 ? (
          savedJobs.map((job) => <JobCard key={job.id} job={job} />)
        ) : (
          <EmptyState />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBack: {
    paddingRight: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  jobCardContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  swipeableCard: {
    width: '100%',
  },
  jobCard: {
    borderWidth: 2,
  },
  jobCardContent: {
    gap: 12,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  jobCardHeaderText: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  jobDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
  },
  viewDetailsButton: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    minWidth: 160,
  },
  skeletonCard: {
    borderWidth: 2,
    marginBottom: 12,
  },
  skeletonTitle: {
    height: 20,
    width: '60%',
    borderRadius: 4,
  },
  skeletonSubtitle: {
    height: 16,
    width: '40%',
    borderRadius: 4,
  },
  skeletonDescription: {
    height: 40,
    width: '100%',
    borderRadius: 4,
  },
  skeletonBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  skeletonBadge: {
    height: 24,
    width: 80,
    borderRadius: 12,
  },
});
