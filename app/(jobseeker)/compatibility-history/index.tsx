import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { jobsApi, type CompatibilityHistoryItem } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

function scoreColor(score: number) {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export default function CompatibilityHistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [history, setHistory] = useState<CompatibilityHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await jobsApi.getCompatibilityHistory();
      setHistory(data);
    } catch (err: any) {
      setError(err?.message || 'Could not load history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Compatibility History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Failed to Load</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{error}</Text>
            <TouchableOpacity onPress={() => load()} style={[styles.retryBtn, { borderColor: colors.border }]}>
              <Text style={[styles.retryText, { color: colors.foreground }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="analytics-outline" size={64} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No checks yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              When you view a job's compatibility, it will appear here.
            </Text>
          </View>
        ) : (
          history.map((item) => {
            const c = scoreColor(item.overall_score);
            return (
              <TouchableOpacity
                key={item.job_id}
                onPress={() =>
                  router.push({
                    pathname: '/(jobseeker)/job/compatibility',
                    params: { jobId: String(item.job_id) },
                  } as any)
                }
                activeOpacity={0.8}
              >
                <Card style={styles.card}>
                  <CardContent style={styles.cardContent}>
                    <View style={styles.cardTop}>
                      <View style={styles.cardInfo}>
                        <Text style={[styles.jobTitle, { color: colors.foreground }]} numberOfLines={1}>
                          {item.job_title}
                        </Text>
                        {item.company_name ? (
                          <Text style={[styles.companyName, { color: colors.mutedForeground }]} numberOfLines={1}>
                            {item.company_name}
                          </Text>
                        ) : null}
                        <View style={styles.metaRow}>
                          {item.job_location ? (
                            <View style={styles.metaItem}>
                              <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
                              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.job_location}</Text>
                            </View>
                          ) : null}
                          {item.job_type ? (
                            <View style={styles.metaItem}>
                              <Ionicons name="briefcase-outline" size={12} color={colors.mutedForeground} />
                              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.job_type}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                      <View style={styles.scoreWrap}>
                        <Text style={[styles.scoreText, { color: c }]}>{item.overall_score}%</Text>
                        <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Match</Text>
                      </View>
                    </View>

                    <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.barFill, { backgroundColor: c, width: `${item.overall_score}%` }]} />
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                        Checked {formatDate(item.computed_at)}
                      </Text>
                      <View style={styles.viewRow}>
                        <Text style={[styles.viewText, { color: colors.primary }]}>View details</Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                      </View>
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
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
  companyName: { fontSize: 13, marginBottom: 6 },
  metaRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12 },
  scoreWrap: { alignItems: 'center', minWidth: 56 },
  scoreText: { fontSize: 24, fontWeight: '800' },
  scoreLabel: { fontSize: 11, marginTop: 2 },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  barFill: { height: '100%', borderRadius: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 12 },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: { fontSize: 13, fontWeight: '600' },
});
