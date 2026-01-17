import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const SWIPE_VELOCITY_THRESHOLD = 500; // px/s

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
  const jobsRef = useRef<Job[]>(jobs);
  
  // Reanimated shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDetailsOpen = useSharedValue(false);

  // Sync refs and shared values
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  useEffect(() => {
    isDetailsOpen.value = showDetails;
  }, [showDetails, isDetailsOpen]);

  // Handler functions to be called from worklet
  const handleSwipeRight = useCallback(() => {
    if (jobsRef.current.length > 0) {
      const currentJob = jobsRef.current[0];
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setAppliedJob(currentJob);
      setShowAppliedDialog(true);
      setJobs(prevJobs => prevJobs.slice(1));
      
      // Reset position after React updates
      setTimeout(() => {
        translateX.value = 0;
        translateY.value = 0;
      }, 0);
    }
  }, [translateX, translateY]);

  const handleSwipeLeft = useCallback(() => {
    if (jobsRef.current.length > 0) {
      const currentJob = jobsRef.current[0];
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLastDiscarded(currentJob);
      setShowUndo(true);
      
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
      undoTimerRef.current = setTimeout(() => {
        setShowUndo(false);
        setLastDiscarded(null);
        undoTimerRef.current = null;
      }, 5000);
      
      setJobs(prevJobs => prevJobs.slice(1));
      
      // Reset position after React updates
      setTimeout(() => {
        translateX.value = 0;
        translateY.value = 0;
      }, 0);
    }
  }, [translateX, translateY]);

  const handleOpenDetails = useCallback(() => {
    setShowDetails(true);
  }, []);

  // Create pan gesture using modern Gesture API
  const panGesture = Gesture.Pan()
    .enabled(!showDetails)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const absX = Math.abs(event.translationX);
      const absY = Math.abs(event.translationY);
      const velX = Math.abs(event.velocityX);
      const velY = Math.abs(event.velocityY);

      // Check for upward swipe to open details
      if (event.translationY < -SWIPE_THRESHOLD && velY > velX) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        runOnJS(handleOpenDetails)();
      }
      // Check for right swipe (apply)
      else if (
        (event.translationX > SWIPE_THRESHOLD || event.velocityX > SWIPE_VELOCITY_THRESHOLD) &&
        absX > absY
      ) {
        translateX.value = withTiming(SCREEN_WIDTH + 100, { duration: 250 }, (finished) => {
          if (finished) {
            runOnJS(handleSwipeRight)();
          }
        });
      }
      // Check for left swipe (discard)
      else if (
        (event.translationX < -SWIPE_THRESHOLD || event.velocityX < -SWIPE_VELOCITY_THRESHOLD) &&
        absX > absY
      ) {
        translateX.value = withTiming(-SCREEN_WIDTH - 100, { duration: 250 }, (finished) => {
          if (finished) {
            runOnJS(handleSwipeLeft)();
          }
        });
      }
      // Return to center
      else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
      }
    });

  // Animated styles for the card
  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-10, 0, 10],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  // Animated styles for right overlay (apply)
  const rightOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );

    return { opacity };
  });

  // Animated styles for left overlay (discard)
  const leftOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );

    return { opacity };
  });

  // Animated styles for next card (stack effect)
  const nextCardStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0.95, 1],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0.5, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const handleApply = () => {
    if (jobsRef.current.length > 0) {
      translateX.value = withTiming(SCREEN_WIDTH + 100, { duration: 250 }, (finished) => {
        if (finished) {
          runOnJS(handleSwipeRight)();
        }
      });
    }
    setShowDetails(false);
  };

  const handleDiscard = () => {
    if (jobsRef.current.length > 0) {
      translateX.value = withTiming(-SCREEN_WIDTH - 100, { duration: 250 }, (finished) => {
        if (finished) {
          runOnJS(handleSwipeLeft)();
        }
      });
    }
    setShowDetails(false);
  };

  const handleUndo = () => {
    if (lastDiscarded) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const currentJob = jobs[0];
  const nextJob = jobs.length > 1 ? jobs[1] : null;

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
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
        {/* Next Card (Stack Preview) */}
        {nextJob && (
          <Animated.View
            style={[
              styles.card,
              styles.nextCard,
              nextCardStyle,
            ]}
          >
            <Card style={styles.jobCard}>
              <CardContent style={styles.cardContent}>
                <View style={styles.jobHeader}>
                  <Text style={[styles.jobTitle, { color: colors.foreground }]}>
                    {nextJob.title}
                  </Text>
                  <Text style={[styles.jobCompany, { color: colors.mutedForeground }]}>
                    {nextJob.company}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Animated.View>
        )}

        {/* Current Card */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.card,
              cardAnimatedStyle,
            ]}
          >
            {/* Swipe Right Overlay */}
            <Animated.View
              style={[
                styles.overlayRight,
                { backgroundColor: '#10b981' + '33' },
                rightOverlayStyle,
              ]}
              pointerEvents="none"
            >
              <View style={[styles.overlayIcon, { backgroundColor: '#10b981' }]}>
                <Ionicons name="checkmark" size={48} color="#fff" />
              </View>
            </Animated.View>

            {/* Swipe Left Overlay */}
            <Animated.View
              style={[
                styles.overlayLeft,
                { backgroundColor: '#ef4444' + '33' },
                leftOverlayStyle,
              ]}
              pointerEvents="none"
            >
              <View style={[styles.overlayIcon, { backgroundColor: '#ef4444' }]}>
                <Ionicons name="close" size={48} color="#fff" />
              </View>
            </Animated.View>

            <Card style={styles.jobCard}>
              <CardContent style={styles.cardContent}>
                <ScrollView 
                  style={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {/* Swipe Hint */}
                  <View style={styles.swipeHintContainer}>
                    <Ionicons name="chevron-up" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.swipeHint, { color: colors.mutedForeground }]}>
                      Swipe up for details
                    </Text>
                  </View>

                  {/* Job Header */}
                  <View style={styles.jobHeader}>
                    <Text style={[styles.jobTitle, { color: colors.foreground }]} numberOfLines={2}>
                      {currentJob.title}
                    </Text>
                    <View style={styles.companyRow}>
                      <Ionicons name="business" size={14} color={colors.primary} />
                      <Text style={[styles.jobCompany, { color: colors.primary }]}>
                        {currentJob.company}
                      </Text>
                    </View>
                  </View>

                  {/* Salary Highlight */}
                  <View style={[styles.salaryBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                    <Ionicons name="cash-outline" size={18} color={colors.primary} />
                    <Text style={[styles.salaryText, { color: colors.primary }]}>
                      {formatSalary(currentJob.salary_min, currentJob.salary_max)}
                    </Text>
                    <Text style={[styles.salaryLabel, { color: colors.primary }]}>
                      per year
                    </Text>
                  </View>

                  {/* Job Info Grid */}
                  <View style={styles.jobInfoGrid}>
                    <View style={styles.infoCard}>
                      <Ionicons name="location-outline" size={18} color={colors.primary} />
                      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Location</Text>
                      <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>
                        {currentJob.location}
                      </Text>
                    </View>
                    <View style={styles.infoCard}>
                      <Ionicons name="time-outline" size={18} color={colors.primary} />
                      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Type</Text>
                      <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>
                        {currentJob.type}
                      </Text>
                    </View>
                  </View>

                  {/* Posted Date */}
                  <View style={styles.postedRow}>
                    <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.postedText, { color: colors.mutedForeground }]}>
                      Posted {formatDate(currentJob.posted_at)}
                    </Text>
                  </View>

                  {/* Description */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="document-text-outline" size={16} color={colors.foreground} />
                      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                        About
                      </Text>
                    </View>
                    <Text
                      style={[styles.description, { color: colors.mutedForeground }]}
                      numberOfLines={4}
                    >
                      {currentJob.description}
                    </Text>
                  </View>

                  {/* Requirements */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={colors.foreground} />
                      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                        Skills
                      </Text>
                    </View>
                    <View style={styles.requirementsContainer}>
                      {currentJob.requirements.slice(0, 5).map((req, index) => (
                        <View
                          key={index}
                          style={[styles.requirementBadge, {
                            backgroundColor: colors.primary + '10',
                            borderColor: colors.primary + '30',
                          }]}
                        >
                          <Text style={[styles.requirementText, { color: colors.primary }]}>
                            {req}
                          </Text>
                        </View>
                      ))}
                      {currentJob.requirements.length > 5 && (
                        <View style={[styles.requirementBadge, {
                          backgroundColor: colors.muted,
                          borderColor: colors.border,
                        }]}>
                          <Text style={[styles.requirementText, { color: colors.foreground }]}>
                            +{currentJob.requirements.length - 5}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </ScrollView>

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
        </GestureDetector>

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
    </GestureHandlerRootView>
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
  nextCard: {
    zIndex: 0,
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
    padding: 16,
  },
  scrollContent: {
    flex: 1,
    marginBottom: 70,
  },
  swipeHintContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  swipeHint: {
    fontSize: 10,
    fontWeight: '500',
  },
  jobHeader: {
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jobCompany: {
    fontSize: 15,
    fontWeight: '600',
  },
  salaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  salaryText: {
    fontSize: 18,
    fontWeight: '700',
  },
  salaryLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  jobInfoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    gap: 3,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  postedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
    justifyContent: 'center',
  },
  postedText: {
    fontSize: 11,
    fontWeight: '500',
  },
  section: {
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
  requirementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  requirementBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  requirementText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  actionButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
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
