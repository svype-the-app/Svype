import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  type: string;
  salary_min: number;
  salary_max: number;
  requirements?: string[];
}

// Mock jobs data
const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Full-Stack Developer',
    company: 'Tech Corp',
    location: 'London, UK',
    type: 'Full-time • Remote',
    salary_min: 60000,
    salary_max: 80000,
    description:
      'We are looking for an experienced full-stack developer to join our growing team.',
    requirements: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', '5+ years experience'],
  },
  {
    id: '2',
    title: 'Frontend Developer',
    company: 'StartupXYZ',
    location: 'Manchester, UK',
    type: 'Full-time • Hybrid',
    salary_min: 45000,
    salary_max: 60000,
    description: 'Join our innovative startup as a frontend developer.',
    requirements: ['React', 'CSS', 'JavaScript', 'Git', '3+ years experience'],
  },
  {
    id: '3',
    title: 'Backend Engineer',
    company: 'Cloud Services Ltd',
    location: 'Remote',
    type: 'Full-time • Remote',
    salary_min: 55000,
    salary_max: 75000,
    description: 'Build scalable backend systems for our cloud platform.',
    requirements: ['Python', 'AWS', 'Docker', 'Kubernetes', '4+ years experience'],
  },
  {
    id: '4',
    title: 'UI/UX Designer',
    company: 'Design Studio',
    location: 'Birmingham, UK',
    type: 'Full-time • Hybrid',
    salary_min: 40000,
    salary_max: 55000,
    description: 'Create beautiful and intuitive user experiences.',
    requirements: ['Figma', 'UI Design', 'Prototyping', '3+ years experience'],
  },
];

export default function SavedJobsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading saved jobs (mock: first 3 jobs are saved)
    setTimeout(() => {
      setSavedJobs(mockJobs.slice(0, 3));
      setLoading(false);
    }, 500);
  }, []);

  const handleRemove = (jobId: string) => {
    Alert.alert('Remove Job', 'Remove this job from saved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setSavedJobs((prev) => prev.filter((job) => job.id !== jobId));
          Alert.alert('Removed', 'Job removed from saved');
        },
      },
    ]);
  };

  const formatSalary = (min: number, max: number) => {
    return `£${(min / 1000).toFixed(0)}k - £${(max / 1000).toFixed(0)}k`;
  };

  const JobCard = ({ job }: { job: Job }) => {
    const translateX = useRef(new Animated.Value(0)).current;

    const handleGestureEvent = Animated.event([{ nativeEvent: { translationX: translateX } }], {
      useNativeDriver: true,
    });

    const handleStateChange = useCallback(
      ({ nativeEvent }: any) => {
        if (nativeEvent.state === State.END) {
          if (nativeEvent.translationX < -100) {
            // Swiped left enough - show delete option
            Animated.spring(translateX, {
              toValue: -80,
              useNativeDriver: true,
            }).start();
          } else {
            // Snap back
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        }
      },
      [translateX]
    );

    return (
      <View style={styles.jobCardWrapper}>
        {/* Delete button underneath */}
        <TouchableOpacity 
          style={[styles.deleteButton, { backgroundColor: colors.destructive }]}
          onPress={() => handleRemove(job.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={24} color={colors.destructiveForeground} />
          <Text style={[styles.deleteButtonText, { color: colors.destructiveForeground }]}>
            Delete
          </Text>
        </TouchableOpacity>

        {/* Swipeable card */}
        <PanGestureHandler
          onGestureEvent={handleGestureEvent}
          onHandlerStateChange={handleStateChange}
        >
          <Animated.View
            style={[
              styles.animatedCard,
              {
                transform: [{ translateX }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => router.push(`/(jobseeker)/job/${job.id}`)}
              activeOpacity={0.9}
            >
              <Card style={styles.jobCard}>
                <CardContent style={styles.jobCardContent}>
                  <View style={styles.jobHeader}>
                    <View style={styles.jobInfo}>
                      <Text
                        style={[styles.jobTitle, { color: colors.cardForeground }]}
                        numberOfLines={1}
                      >
                        {job.title}
                      </Text>
                      <Text
                        style={[styles.jobCompany, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        {job.company}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteIconButton}
                      onPress={() => handleRemove(job.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={[styles.jobDescription, { color: colors.mutedForeground }]}
                    numberOfLines={2}
                  >
                    {job.description}
                  </Text>

                  <View style={styles.badgesContainer}>
                    <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="briefcase-outline" size={12} color={colors.foreground} />
                      <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>
                        {job.type}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="cash-outline" size={12} color={colors.foreground} />
                      <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>
                        {formatSalary(job.salary_min, job.salary_max)}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="location-outline" size={12} color={colors.foreground} />
                      <Text
                        style={[styles.badgeText, { color: colors.secondaryForeground }]}
                        numberOfLines={1}
                      >
                        {job.location}
                      </Text>
                    </View>
                  </View>

                  <Button
                    variant="outline"
                    onPress={() => router.push(`/(jobseeker)/job/${job.id}`)}
                    style={styles.viewButton}
                  >
                    <Text style={[styles.viewButtonText, { color: colors.foreground }]}>
                      View Details
                    </Text>
                    <Ionicons name="open-outline" size={16} color={colors.foreground} />
                  </Button>
                </CardContent>
              </Card>
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
        <Ionicons name="bookmark-outline" size={48} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Saved Jobs</Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
        Start saving jobs you're interested in to view them here
      </Text>
      <Button
        onPress={() => router.push('/(jobseeker)/swipe')}
        style={styles.emptyButton}
      >
        Find Jobs
      </Button>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.background, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="bookmark" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>Saved Jobs</Text>
              <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                {savedJobs.length} jobs saved
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Loading saved jobs...
            </Text>
          </View>
        ) : savedJobs.length > 0 ? (
          <FlatList
            data={savedJobs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <JobCard job={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  jobCardWrapper: {
    marginBottom: 16,
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    gap: 4,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  animatedCard: {
    backgroundColor: 'transparent',
  },
  jobCard: {
    marginBottom: 0,
  },
  jobCardContent: {
    padding: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  jobInfo: {
    flex: 1,
    minWidth: 0,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteIconButton: {
    padding: 4,
  },
  jobDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
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
    paddingHorizontal: 32,
  },
});
