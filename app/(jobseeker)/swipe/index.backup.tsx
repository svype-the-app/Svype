import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary_min: number;
  salary_max: number;
  posted_at: string;
  description: string;
  requirements: string[];
}

// Mock data
const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Full-Stack Developer',
    company: 'Tech Corp',
    location: 'London, UK',
    type: 'Full-time • Remote',
    salary_min: 60000,
    salary_max: 80000,
    posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'We are looking for an experienced full-stack developer to join our growing team. You will be responsible for developing and maintaining our web applications using modern technologies.',
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
    posted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Join our innovative startup as a frontend developer. Work on cutting-edge projects and help shape our product.',
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
    posted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Build scalable backend systems for our cloud platform. Work with microservices and modern cloud technologies.',
    requirements: ['Python', 'AWS', 'Docker', 'Kubernetes', '4+ years experience'],
  },
];

export default function SwipeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [showDetails, setShowDetails] = useState(false);
  const [showAppliedDialog, setShowAppliedDialog] = useState(false);
  const [appliedJob, setAppliedJob] = useState<Job | null>(null);
  const [lastDiscarded, setLastDiscarded] = useState<Job | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Refs to track current values for PanResponder (avoid stale closures)
  const jobsRef = useRef(jobs);
  const showDetailsRef = useRef(showDetails);

  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const swipeRightOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const swipeLeftOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !showDetailsRef.current && jobsRef.current.length > 0,
      onPanResponderMove: (_, gesture) => {
        if (!showDetailsRef.current && jobsRef.current.length > 0) {
          position.setValue({ x: gesture.dx, y: gesture.dy });
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (showDetailsRef.current || jobsRef.current.length === 0) return;
        
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else if (gesture.dy < -SWIPE_THRESHOLD) {
          setShowDetails(true);
          resetPosition();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: 'left' | 'right') => {
    const currentJob = jobs[0]; // Always first card in the array
    
    if (direction === 'right') {
      setAppliedJob(currentJob);
      setShowAppliedDialog(true);
    } else {
      setLastDiscarded(currentJob);
      setShowUndo(true);
      // Clear any existing timer
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
      // Set new timer
      undoTimerRef.current = setTimeout(() => {
        setShowUndo(false);
        setLastDiscarded(null);
        undoTimerRef.current = null;
      }, 5000);
    }

    setJobs(jobs.slice(1)); // Remove first card
    position.setValue({ x: 0, y: 0 });
  };

  // Keep refs in sync with state
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  useEffect(() => {
    showDetailsRef.current = showDetails;
  }, [showDetails]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const handleApply = () => {
    forceSwipe('right');
    setShowDetails(false);
  };

  const handleDiscard = () => {
    forceSwipe('left');
    setShowDetails(false);
  };

  const handleUndo = () => {
    if (lastDiscarded) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Clear the timer when manually undoing
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
      setJobs([lastDiscarded, ...jobs]);
      setLastDiscarded(null);
      setShowUndo(false);
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

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  if (jobs.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={64} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No More Jobs
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
            You&apos;ve reviewed all available jobs. Check back later for new opportunities!
          </Text>
          <Button onPress={() => setJobs(mockJobs)}>
            Reload Jobs
          </Button>
        </View>
      </View>
    );
  }

  const currentJob = jobs[0]; // Always show first card in array

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Job Counter */}
      <View style={styles.counterContainer}>
        <View style={[styles.counterBadge, { backgroundColor: colors.muted }]}>
          <Text style={[styles.counterText, { color: colors.foreground }]}>
            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} remaining
          </Text>
        </View>
      </View>

      {/* Card Container */}
      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Swipe Right Overlay */}
          <Animated.View
            style={[
              styles.overlayRight,
              { opacity: swipeRightOpacity, backgroundColor: '#10b981' + '33' },
            ]}
          >
            <View style={[styles.overlayIcon, { backgroundColor: '#10b981' }]}>
              <Ionicons name="checkmark" size={48} color="#fff" />
            </View>
          </Animated.View>

          {/* Swipe Left Overlay */}
          <Animated.View
            style={[
              styles.overlayLeft,
              { opacity: swipeLeftOpacity, backgroundColor: '#ef4444' + '33' },
            ]}
          >
            <View style={[styles.overlayIcon, { backgroundColor: '#ef4444' }]}>
              <Ionicons name="close" size={48} color="#fff" />
            </View>
          </Animated.View>

          <Card style={styles.jobCard}>
            <CardContent style={styles.cardContent}>
              {/* Swipe Hint */}
              <Text style={[styles.swipeHint, { color: colors.mutedForeground }]}>
                ↑ Details
              </Text>

              {/* Job Header */}
              <View style={styles.jobHeader}>
                <Text style={[styles.jobTitle, { color: colors.foreground }]}>
                  {currentJob.title}
                </Text>
                <Text style={[styles.jobCompany, { color: colors.mutedForeground }]}>
                  {currentJob.company}
                </Text>
              </View>

              {/* Job Info */}
              <View style={styles.jobInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={18} color={colors.mutedForeground} />
                  <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                    {currentJob.location}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="briefcase" size={18} color={colors.mutedForeground} />
                  <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                    {currentJob.type}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="cash" size={18} color={colors.mutedForeground} />
                  <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                    {formatSalary(currentJob.salary_min, currentJob.salary_max)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={18} color={colors.mutedForeground} />
                  <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                    Posted {formatDate(currentJob.posted_at)}
                  </Text>
                </View>
              </View>

              {/* Description */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  About the role
                </Text>
                <Text
                  style={[styles.description, { color: colors.mutedForeground }]}
                  numberOfLines={6}
                >
                  {currentJob.description}
                </Text>
              </View>

              {/* Requirements */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Key Requirements
                </Text>
                <View style={styles.requirementsContainer}>
                  {currentJob.requirements.slice(0, 4).map((req, index) => (
                    <View
                      key={index}
                      style={[styles.requirementBadge, {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      }]}
                    >
                      <Text style={[styles.requirementText, { color: colors.foreground }]}>
                        {req}
                      </Text>
                    </View>
                  ))}
                  {currentJob.requirements.length > 4 && (
                    <View style={[styles.requirementBadge, {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    }]}>
                      <Text style={[styles.requirementText, { color: colors.foreground }]}>
                        +{currentJob.requirements.length - 4} more
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionButton, { borderColor: '#ef4444' + '33' }]}
                  onPress={handleDiscard}
                >
                  <Ionicons name="close" size={24} color="#ef4444" />
                </Pressable>
                <Pressable
                  style={[styles.actionButton, { borderColor: colors.border }]}
                  onPress={() => setShowDetails(true)}
                >
                  <Ionicons name="chevron-up" size={24} color={colors.foreground} />
                </Pressable>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: '#10b981', borderWidth: 0 }]}
                  onPress={handleApply}
                >
                  <Ionicons name="checkmark" size={24} color="#fff" />
                </Pressable>
              </View>
            </CardContent>
          </Card>
        </Animated.View>

        {/* Swipe Hints */}
        <Text style={[styles.swipeInstructions, { color: colors.mutedForeground }]}>
          ← Pass • ↑ Details • Apply →
        </Text>
      </View>

      {/* Undo Button */}
      {showUndo && lastDiscarded && (
        <View style={styles.undoContainer}>
          <Pressable
            style={[styles.undoButton, { backgroundColor: colors.primary }]}
            onPress={handleUndo}
          >
            <View style={styles.undoContent}>
              <Ionicons name="arrow-undo" size={16} color={colors.background} />
              <View>
                <Text style={[styles.undoLabel, { color: colors.background }]}>
                  Undo pass
                </Text>
                <Text style={[styles.undoCompany, { color: colors.background }]}>
                  {lastDiscarded.company}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      )}

      {/* Job Details Modal */}
      <Modal
        visible={showDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetails(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowDetails(false)}
        >
          <Pressable 
            style={[styles.modalContainer, { backgroundColor: colors.background }]}
            onPress={(e) => e.stopPropagation()}
          >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.modalHandle} />
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowDetails(false)}
            >
              <Ionicons name="chevron-down" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {currentJob.title}
            </Text>
            <Text style={[styles.modalCompany, { color: colors.mutedForeground }]}>
              {currentJob.company}
            </Text>

            <View style={styles.modalInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={18} color={colors.mutedForeground} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  {currentJob.location}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="briefcase" size={18} color={colors.mutedForeground} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  {currentJob.type}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="cash" size={18} color={colors.mutedForeground} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  {formatSalary(currentJob.salary_min, currentJob.salary_max)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={18} color={colors.mutedForeground} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  Posted {formatDate(currentJob.posted_at)}
                </Text>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.foreground }]}>
                About the Role
              </Text>
              <Text style={[styles.modalText, { color: colors.mutedForeground }]}>
                {currentJob.description}
              </Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.foreground }]}>
                Requirements
              </Text>
              {currentJob.requirements.map((req, index) => (
                <View key={index} style={styles.requirementItem}>
                  <Text style={{ color: colors.primary }}>•</Text>
                  <Text style={[styles.modalText, { color: colors.mutedForeground }]}>
                    {req}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button onPress={handleApply} style={styles.modalApplyButton}>
                <View style={styles.buttonContent}>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.modalApplyText}>Apply Now</Text>
                </View>
              </Button>
              <Button
                variant="outline"
                onPress={handleDiscard}
                style={styles.modalDiscardButton}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="close" size={18} color="#ef4444" />
                  <Text style={[styles.modalDiscardText, { color: '#ef4444' }]}>
                    Pass on this job
                  </Text>
                </View>
              </Button>
            </View>
          </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Applied Success Modal */}
      <Modal
        visible={showAppliedDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAppliedDialog(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.successIcon, { backgroundColor: '#10b981' + '1A' }]}>
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            </View>

            <Text style={[styles.dialogTitle, { color: colors.foreground }]}>
              Application Sent! 🎉
            </Text>
            <Text style={[styles.dialogDescription, { color: colors.mutedForeground }]}>
              Your application has been successfully submitted to
            </Text>

            {appliedJob && (
              <View style={[styles.appliedJobCard, { backgroundColor: colors.muted }]}>
                <Text style={[styles.appliedJobTitle, { color: colors.foreground }]}>
                  {appliedJob.title}
                </Text>
                <Text style={[styles.appliedJobCompany, { color: colors.mutedForeground }]}>
                  {appliedJob.company}
                </Text>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.appliedJobLocation, { color: colors.mutedForeground }]}>
                    {appliedJob.location}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.nextSteps}>
              <View style={styles.nextStepItem}>
                <Ionicons name="notifications" size={20} color={colors.primary} />
                <View style={styles.nextStepText}>
                  <Text style={[styles.nextStepTitle, { color: colors.foreground }]}>
                    We&apos;ll notify you
                  </Text>
                  <Text style={[styles.nextStepDescription, { color: colors.mutedForeground }]}>
                    When the employer views your application
                  </Text>
                </View>
              </View>
              <View style={styles.nextStepItem}>
                <Ionicons name="trending-up" size={20} color={colors.primary} />
                <View style={styles.nextStepText}>
                  <Text style={[styles.nextStepTitle, { color: colors.foreground }]}>
                    Keep swiping
                  </Text>
                  <Text style={[styles.nextStepDescription, { color: colors.mutedForeground }]}>
                    More opportunities are waiting for you
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.dialogActions}>
              <Button
                variant="outline"
                onPress={() => setShowAppliedDialog(false)}
                style={styles.dialogActionButton}
              >
                Continue Swiping
              </Button>
              <Button
                onPress={() => {
                  setShowAppliedDialog(false);
                  router.push('/(jobseeker)/dashboard' as any);
                }}
                style={styles.dialogActionButton}
              >
                View Applications
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  counterContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  counterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 110,
    paddingBottom: 100,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    height: Math.min(SCREEN_HEIGHT * 0.72, 650),
    position: 'absolute',
  },
  overlayRight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  overlayLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  overlayIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobCard: {
    flex: 1,
  },
  cardContent: {
    flex: 1,
    padding: 20,
  },
  swipeHint: {
    position: 'absolute',
    top: 16,
    right: 16,
    fontSize: 11,
  },
  jobHeader: {
    marginBottom: 20,
  },
  jobTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 32,
  },
  jobCompany: {
    fontSize: 18,
    fontWeight: '500',
  },
  jobInfo: {
    gap: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  requirementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  requirementBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  requirementText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeInstructions: {
    position: 'absolute',
    bottom: 20,
    fontSize: 13,
  },
  undoContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  undoButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  undoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  undoLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  undoCompany: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    marginBottom: 12,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalCompany: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 24,
  },
  modalInfo: {
    gap: 12,
    marginBottom: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
  },
  requirementItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  modalActions: {
    gap: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalApplyButton: {
    backgroundColor: '#10b981',
  },
  modalDiscardButton: {
    borderColor: '#ef4444' + '33',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalApplyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalDiscardText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  dialogDescription: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  appliedJobCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 4,
  },
  appliedJobTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  appliedJobCompany: {
    fontSize: 14,
    marginBottom: 8,
  },
  appliedJobLocation: {
    fontSize: 12,
  },
  nextSteps: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  nextStepItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  nextStepText: {
    flex: 1,
  },
  nextStepTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  nextStepDescription: {
    fontSize: 11,
  },
  dialogActions: {
    width: '100%',
    gap: 8,
  },
  dialogActionButton: {
    width: '100%',
  },
});
