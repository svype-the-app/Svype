import { Card, CardContent } from '@/components/ui/card';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Colors } from '@/constants/theme';
import { queryKeys } from '@/lib/query-keys';
import { applicationsApi } from '@/services/api';
import type { Application } from '@/services/types';
import { formatRelativeTime } from '@/utils/time';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
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

// Stable empty reference for the no-data-yet render.
const EMPTY_APPS: Application[] = [];

// Pending = quiz not yet taken (no score and no completion timestamp).
function isPending(app: Application): boolean {
  return app.quiz_score == null && app.quiz_completed_at == null;
}

// A pending quiz whose 24h window has elapsed.
function isExpired(app: Application): boolean {
  return (
    isPending(app) &&
    !!app.quiz_expires_at &&
    new Date(app.quiz_expires_at).getTime() <= Date.now()
  );
}

// "Expires in 8h" / "Expires in 12m" for a pending quiz with a deadline.
function expiryLabel(app: Application): string | null {
  if (!isPending(app) || !app.quiz_expires_at) return null;
  const ms = new Date(app.quiz_expires_at).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `Expires in ${hours}h`;
  const mins = Math.max(1, Math.floor(ms / 60_000));
  return `Expires in ${mins}m`;
}

export default function QuizHistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Re-render periodically so "Expires in Xh" ticks down and a quiz that has
  // just expired flips to non-tappable without a manual refresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Separate cache key from the dashboard's applications list, but the same
  // /applications/ source (filtered client-side). Cache-first + persisted.
  const query = useQuery({
    queryKey: queryKeys.applications.quizHistory(),
    queryFn: applicationsApi.getApplications,
  });
  const apps = query.data ?? EMPTY_APPS;
  const hasData = query.data !== undefined;
  const loading = !hasData && (query.isPending || query.isFetching);
  const loadError = !hasData && query.isError && !query.isFetching;
  const refreshing = hasData && query.isFetching;

  // Quiz-gated applications only. Pending first, then completed; each group
  // newest-first by applied_at.
  const quizApps = apps
    .filter((a) => a.job?.has_questions)
    .slice()
    .sort((a, b) => {
      const ap = isPending(a) ? 0 : 1;
      const bp = isPending(b) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
    });

  const openQuiz = (app: Application) => {
    if (isExpired(app)) return; // expired quizzes are non-tappable
    const pending = isPending(app);
    router.push({
      pathname: '/(jobseeker)/dashboard/quiz/[applicationId]',
      params: {
        applicationId: String(app.id),
        jobTitle: app.job?.title ?? 'Quiz',
        // `score` present → result-only view for a completed quiz.
        ...(pending ? {} : { score: String(app.quiz_score) }),
      },
    } as any);
  };

  return (
    <Screen>
      <ScreenHeader title="Quizzes" onBack={() => router.push('/(jobseeker)/dashboard' as any)} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => query.refetch()} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : loadError ? (
          <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Failed to Load</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Check your connection and try again.</Text>
            <TouchableOpacity onPress={() => query.refetch()} style={[styles.retryBtn, { borderColor: colors.border }]}>
              <Text style={[styles.retryText, { color: colors.foreground }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : quizApps.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="help-circle-outline" size={64} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No quizzes yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              When you apply to a job that requires a quiz, it will appear here.
            </Text>
          </View>
        ) : (
          quizApps.map((app) => {
            const pending = isPending(app);
            const expired = isExpired(app);
            const expLabel = expiryLabel(app);
            return (
              <TouchableOpacity
                key={app.id}
                onPress={() => openQuiz(app)}
                activeOpacity={expired ? 1 : 0.8}
                disabled={expired}
              >
                <Card
                  style={[
                    styles.card,
                    expired
                      ? { borderColor: colors.destructive, borderWidth: 2, opacity: 0.85 }
                      : pending
                      ? { borderColor: colors.primary, borderWidth: 2 }
                      : { opacity: 0.7 },
                  ]}
                >
                  <CardContent style={styles.cardContent}>
                    <View style={styles.cardTop}>
                      <View style={styles.cardInfo}>
                        <Text style={[styles.jobTitle, { color: colors.foreground }]} numberOfLines={1}>
                          {app.job?.title}
                        </Text>
                        {app.job?.company_name ? (
                          <Text style={[styles.companyName, { color: colors.mutedForeground }]} numberOfLines={1}>
                            {app.job.company_name}
                          </Text>
                        ) : null}
                      </View>
                      {expired ? (
                        <View style={[styles.pill, { backgroundColor: colors.destructive }]}>
                          <Ionicons name="alert-circle" size={14} color="#fff" />
                          <Text style={styles.pillText}>Expired</Text>
                        </View>
                      ) : pending ? (
                        <View style={[styles.pill, { backgroundColor: colors.primary }]}>
                          <Ionicons name="create-outline" size={14} color="#fff" />
                          <Text style={styles.pillText}>Take Quiz</Text>
                        </View>
                      ) : (
                        <View style={[styles.pill, { backgroundColor: colors.muted }]}>
                          <Text style={[styles.pillText, { color: colors.mutedForeground }]}>Score: {app.quiz_score}%</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                        Applied {formatRelativeTime(app.applied_at)}
                      </Text>
                      {expired ? (
                        <Text style={[styles.viewText, { color: colors.destructive }]}>Application cancelled</Text>
                      ) : pending && expLabel ? (
                        <Text style={[styles.viewText, { color: colors.primary }]}>{expLabel}</Text>
                      ) : (
                        <View style={styles.viewRow}>
                          <Text style={[styles.viewText, { color: colors.primary }]}>
                            {pending ? 'Start' : 'View result'}
                          </Text>
                          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                        </View>
                      )}
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },
  centered: { alignItems: 'center', paddingVertical: 64, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  retryText: { fontSize: 14, fontWeight: '600' },
  card: { marginBottom: 0 },
  cardContent: { padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  cardInfo: { flex: 1 },
  jobTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  companyName: { fontSize: 13 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 12 },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: { fontSize: 13, fontWeight: '600' },
});
