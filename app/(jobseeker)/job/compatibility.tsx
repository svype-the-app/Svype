import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { applicationsApi, jobsApi, type CompatibilityScore, type Job } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const RING_SIZE = 140;
const RING_STROKE = 8;
const ANIM_MS = 1000;

function scoreColor(score: number): string {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

// ─────────────────────────────────────────────────────────────────────────────
// CircularRing — animated ring built from two rotating half-arcs (no SVG)
// ─────────────────────────────────────────────────────────────────────────────
type RingProps = { progress: number; color: string; trackColor: string };

function CircularRing({ progress, color, trackColor }: RingProps) {
  const half = RING_SIZE / 2;
  const animated = useSharedValue(0);

  useEffect(() => {
    animated.value = withTiming(progress, {
      duration: ANIM_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animated]);

  // Half 1: covers 0–50%. Rotates 0° → 180° as progress goes 0 → 50.
  const rightArcStyle = useAnimatedStyle(() => {
    const angle = Math.min(animated.value, 50) / 50 * 180;
    return { transform: [{ rotate: `${angle}deg` }] };
  });

  // Half 2: covers 50–100%. Hidden until progress > 50, then rotates 0° → 180°.
  const leftArcStyle = useAnimatedStyle(() => {
    const over = Math.max(0, animated.value - 50);
    const angle = (over / 50) * 180;
    return {
      opacity: animated.value > 50 ? 1 : 0,
      transform: [{ rotate: `${angle}deg` }],
    };
  });

  const arcBase = {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: half,
    borderWidth: RING_STROKE,
    borderTopColor: color,
    borderRightColor: color,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  };

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE }}>
      {/* Track ring */}
      <View
        style={{
          position: 'absolute',
          width: RING_SIZE,
          height: RING_SIZE,
          borderRadius: half,
          borderWidth: RING_STROKE,
          borderColor: trackColor,
        }}
      />

      {/* RIGHT half clipping container — top half visible, rotates the arc */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: half,
          width: half,
          height: RING_SIZE,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: -half,
              top: 0,
              transformOrigin: `${half}px ${half}px`,
            },
            rightArcStyle,
          ]}
        >
          <View style={arcBase} />
        </Animated.View>
      </View>

      {/* LEFT half clipping container — visible only after 50% */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: half,
          height: RING_SIZE,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              right: -half,
              top: 0,
              transformOrigin: `${half}px ${half}px`,
              transform: [{ rotate: '180deg' }],
            },
            leftArcStyle,
          ]}
        >
          <View style={arcBase} />
        </Animated.View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedCounter — counts 0 → value over 1s in sync with the ring
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedCounter({ value, color }: { value: number; color: string }) {
  const animated = useSharedValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    animated.value = withTiming(value, {
      duration: ANIM_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, animated]);

  useAnimatedReaction(
    () => Math.round(animated.value),
    (current, previous) => {
      if (current !== previous) runOnJS(setDisplay)(current);
    }
  );

  return <Text style={[styles.ringScore, { color }]}>{display}%</Text>;
}

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedBar — horizontal progress bar that animates 0 → percent on mount
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedBar({ percent, color, trackColor }: { percent: number; color: string; trackColor: string }) {
  const animated = useSharedValue(0);

  useEffect(() => {
    animated.value = withTiming(percent, {
      duration: ANIM_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [percent, animated]);

  const widthStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(100, animated.value))}%`,
  }));

  return (
    <View style={[styles.barTrack, { backgroundColor: trackColor }]}>
      <Animated.View style={[styles.barFill, { backgroundColor: color }, widthStyle]} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function CompatibilityScreen() {
  const { jobId: jobIdParam } = useLocalSearchParams<{ jobId?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const jobId = useMemo(() => {
    const n = Number(jobIdParam);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [jobIdParam]);

  const [score, setScore] = useState<CompatibilityScore | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!jobId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const startedAt = Date.now();
    try {
      const [s, j] = await Promise.all([
        jobsApi.getCompatibility(jobId),
        jobsApi.getJob(jobId).catch(() => null),
      ]);
      // Guarantee the "Analysing..." screen is visible for at least 2s, even
      // when the response comes back from cache in <100 ms.
      const elapsed = Date.now() - startedAt;
      const MIN_LOADING_MS = 2000;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }
      setScore(s);
      setJob(j);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      Alert.alert(
        'Error',
        err?.message || 'Could not load compatibility score.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
          { text: 'Retry', onPress: load },
        ]
      );
    }
  }, [jobId, router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApply = async () => {
    if (!jobId || applying) return;
    setApplying(true);
    try {
      // Use the real apply pipeline (cover letter + quiz check) — same as
      // a right-swipe from the swipe screen.
      const result = await applicationsApi.apply(jobId);

      if (result.requires_quiz && result.quiz) {
        // Quiz path — route directly to the pre-screening quiz.
        router.replace({
          pathname: '/(jobseeker)/job/pre-screening-quiz',
          params: {
            applicationId: String(result.application_id),
            jobTitle: job?.title ?? 'Pre-Screening Quiz',
            quizData: JSON.stringify(result.quiz),
            skillMatch: JSON.stringify(result.skill_match),
          },
        } as any);
        return;
      }

      // No-quiz path — submitted popup.
      const coverNote = result.cover_letter
        ? "\n\nWe've prepared a cover letter for you — you can see it in your Applications."
        : '';
      Alert.alert(
        'Application Submitted',
        `Your application for ${job?.title ?? 'this role'} has been sent.${coverNote}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.toLowerCase().includes('already applied')) {
        Alert.alert('Already Applied', 'You have already applied to this job.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Apply Failed', msg || 'Could not submit application.');
      }
    } finally {
      setApplying(false);
    }
  };

  const handleSave = async () => {
    if (!jobId || saving || saved) return;
    setSaving(true);
    try {
      await jobsApi.saveJob(jobId);
      setSaved(true);
      Alert.alert('Saved', 'Job added to your saved list.');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('unique')) {
        setSaved(true);
        Alert.alert('Already Saved', 'This job is already in your saved list.');
      } else {
        Alert.alert('Error', msg || 'Could not save job.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.loadingContainer, { backgroundColor: colors.background }]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[styles.loadingBack, { top: insets.top + 8 }]}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.loadingInner}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingTitle, { color: colors.foreground }]}>
            Analysing your compatibility
          </Text>
          <Text style={[styles.loadingSubtitle, { color: colors.mutedForeground }]}>
            This usually takes a few seconds…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── MISSING DATA ─────────────────────────────────────────────────────────
  if (!score) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.loadingContainer, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingInner}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Data unavailable</Text>
          <Text style={[styles.loadingSubtitle, { color: colors.mutedForeground }]}>
            We couldn&apos;t load compatibility data for this job.
          </Text>
          <Button onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const overall = score.overall_score;
  const overallColor = scoreColor(overall);
  const trackColor = colors.border;
  const breakdownRows: { label: string; value: number }[] = [
    { label: 'Skills Match', value: score.breakdown.skills_match },
    { label: 'Experience', value: score.breakdown.experience_match },
    { label: 'Role Fit', value: score.breakdown.role_fit },
    { label: 'Location', value: score.breakdown.location_match },
    { label: 'Salary', value: score.breakdown.salary_match },
  ];

  const jobTitle = job?.title ?? 'This role';
  const companyName = job?.company_name ?? '';

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 96 + Math.max(insets.bottom, 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.jobTitle, { color: colors.foreground }]} numberOfLines={2}>
              {jobTitle}
            </Text>
            {companyName ? (
              <Text style={[styles.companyName, { color: colors.mutedForeground }]} numberOfLines={1}>
                {companyName}
              </Text>
            ) : null}
          </View>
        </View>

        {/* OVERALL SCORE */}
        <View style={styles.section}>
          <View style={styles.ringWrap}>
            <CircularRing progress={overall} color={overallColor} trackColor={trackColor} />
            <View style={styles.ringCenter} pointerEvents="none">
              <AnimatedCounter value={overall} color={overallColor} />
            </View>
          </View>
          <Text style={[styles.ringLabel, { color: colors.mutedForeground }]}>Overall Match</Text>
        </View>

        {/* BREAKDOWN */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>BREAKDOWN</Text>
          {breakdownRows.map(({ label, value }) => {
            const c = scoreColor(value);
            return (
              <View key={label} style={styles.breakdownRow}>
                <View style={styles.breakdownLabelRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.foreground }]}>{label}</Text>
                  <Text style={[styles.breakdownValue, { color: c }]}>{value}%</Text>
                </View>
                <AnimatedBar percent={value} color={c} trackColor={trackColor} />
              </View>
            );
          })}
        </View>

        {/* STRENGTHS */}
        {score.breakdown.strengths.length > 0 && (
          <View style={styles.section}>
            <View style={styles.listHeaderRow}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>YOUR STRENGTHS</Text>
            </View>
            {score.breakdown.strengths.map((s, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: '#10b981' }]}>•</Text>
                <Text style={[styles.bulletText, { color: colors.foreground }]}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* GAPS */}
        {score.breakdown.gaps.length > 0 && (
          <View style={styles.section}>
            <View style={styles.listHeaderRow}>
              <Ionicons name="warning" size={18} color="#f59e0b" />
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>GAPS TO ADDRESS</Text>
            </View>
            {score.breakdown.gaps.map((g, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: '#f59e0b' }]}>•</Text>
                <Text style={[styles.bulletText, { color: colors.foreground }]}>{g}</Text>
              </View>
            ))}
          </View>
        )}

        {/* SUMMARY */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>AI SUMMARY</Text>
          {score.summary ? (
            <Text style={[styles.summaryText, { color: colors.foreground }]}>{score.summary}</Text>
          ) : null}
          {score.breakdown.verdict ? (
            <Text style={[styles.verdictText, { color: colors.mutedForeground }]}>
              &ldquo;{score.breakdown.verdict}&rdquo;
            </Text>
          ) : null}
        </View>

        {/* Cache info — small footnote */}
        <Text style={[styles.cacheInfo, { color: colors.mutedForeground }]}>
          {score.cached ? 'Cached' : 'Just computed'} • {new Date(score.computed_at).toLocaleString()}
        </Text>
      </ScrollView>

      {/* ACTION BUTTONS */}
      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Pressable
          onPress={handleSave}
          disabled={saving || saved}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.saveBtn,
            {
              borderColor: colors.border,
              opacity: pressed || saving ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={colors.foreground}
          />
          <Text style={[styles.saveBtnText, { color: colors.foreground }]}>
            {saved ? 'Saved' : 'Save Job'}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleApply}
          disabled={applying}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.applyBtn,
            { opacity: pressed || applying ? 0.85 : 1 },
          ]}
        >
          {applying ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.applyBtnText}>Apply Now</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingBack: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    padding: 8,
  },
  loadingInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  loadingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 4,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  companyName: {
    fontSize: 16,
    marginTop: 2,
  },

  // Section spacing
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },

  // Ring
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringScore: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  ringLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Breakdown bars
  breakdownRow: {
    marginBottom: 14,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },

  // Bullets
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },

  // Summary
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  verdictText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  cacheInfo: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },

  // Action bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtn: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  applyBtn: {
    backgroundColor: '#7c3aed',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
