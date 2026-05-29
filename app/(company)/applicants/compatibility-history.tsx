import { Card, CardContent } from '@/components/ui/card';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Colors } from '@/constants/theme';
import { applicationsApi, type ApplicantCompatibilityHistoryItem } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function scoreColor(score: number) {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function scoreLabel(score: number) {
  if (score >= 75) return 'Strong';
  if (score >= 50) return 'Potential';
  return 'Weak';
}

export default function ApplicantCompatibilityHistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [history, setHistory] = useState<ApplicantCompatibilityHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<ApplicantCompatibilityHistoryItem | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await applicationsApi.getCompatibilityHistory();
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

  const report = selectedItem?.report;

  return (
    <Screen>
      <ScreenHeader
        title="AI Compatibility History"
        onBack={() => router.push('/(company)/dashboard' as any)}
      />

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
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No analyses yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              When you run an AI compatibility check on an applicant, it will appear here.
            </Text>
          </View>
        ) : (
          history.map((item) => {
            const c = scoreColor(item.overall_score);
            const label = scoreLabel(item.overall_score);
            return (
              <TouchableOpacity
                key={item.application_id}
                onPress={() => setSelectedItem(item)}
                activeOpacity={0.8}
              >
                <Card style={styles.card}>
                  <CardContent style={styles.cardContent}>
                    <View style={styles.cardTop}>
                      <View style={styles.cardInfo}>
                        <Text style={[styles.applicantName, { color: colors.foreground }]} numberOfLines={1}>
                          {item.applicant_name || item.applicant_email}
                        </Text>
                        <Text style={[styles.jobTitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {item.job_title}
                        </Text>
                      </View>
                      <View style={styles.scoreWrap}>
                        <Text style={[styles.scoreText, { color: c }]}>{item.overall_score}%</Text>
                        <View style={[styles.labelBadge, { backgroundColor: c + '20' }]}>
                          <Text style={[styles.labelText, { color: c }]}>{label}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.barFill, { backgroundColor: c, width: `${item.overall_score}%` }]} />
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                        Analysed {formatDate(item.computed_at)}
                      </Text>
                      <View style={styles.viewRow}>
                        <Text style={[styles.viewText, { color: colors.primary }]}>View report</Text>
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

      {/* Report Detail Modal */}
      <Modal
        visible={!!selectedItem}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setSelectedItem(null)} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>
              {selectedItem?.applicant_name || selectedItem?.applicant_email}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {selectedItem && report ? (
              <>
                <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
                  {selectedItem.job_title}
                </Text>

                {/* Score */}
                <View style={[styles.scoreCard, { backgroundColor: scoreColor(selectedItem.overall_score) + '15', borderColor: scoreColor(selectedItem.overall_score) + '40' }]}>
                  <Text style={[styles.bigScore, { color: scoreColor(selectedItem.overall_score) }]}>
                    {selectedItem.overall_score}%
                  </Text>
                  <Text style={[styles.bigScoreLabel, { color: colors.mutedForeground }]}>Overall Match</Text>
                </View>

                {/* Breakdown */}
                <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>BREAKDOWN</Text>
                {[
                  { label: 'Skills Match', value: report.skills_match },
                  { label: 'Experience', value: report.experience_match },
                  { label: 'Role Fit', value: report.role_fit },
                ].map(({ label, value }) => {
                  if (value == null) return null;
                  const c = scoreColor(value);
                  return (
                    <View key={label} style={styles.breakdownRow}>
                      <View style={styles.breakdownLabelRow}>
                        <Text style={[styles.breakdownLabel, { color: colors.foreground }]}>{label}</Text>
                        <Text style={[styles.breakdownValue, { color: c }]}>{value}%</Text>
                      </View>
                      <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                        <View style={[styles.barFill, { backgroundColor: c, width: `${value}%` }]} />
                      </View>
                    </View>
                  );
                })}

                {/* Strengths */}
                {report.strengths?.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>STRENGTHS</Text>
                    {report.strengths.map((s, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={[styles.bulletText, { color: colors.foreground }]}>{s}</Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Gaps */}
                {report.gaps?.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>GAPS</Text>
                    {report.gaps.map((g, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <Ionicons name="warning" size={16} color="#f59e0b" />
                        <Text style={[styles.bulletText, { color: colors.foreground }]}>{g}</Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Verdict */}
                {report.verdict ? (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>VERDICT</Text>
                    <Text style={[styles.verdictText, { color: colors.foreground }]}>&ldquo;{report.verdict}&rdquo;</Text>
                  </>
                ) : null}

                {/* Personality */}
                {report.personality_analysis?.summary ? (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PERSONALITY INSIGHTS</Text>
                    <Text style={[styles.bodyText, { color: colors.foreground }]}>{report.personality_analysis.summary}</Text>
                    {report.personality_analysis.workplace_fit ? (
                      <Text style={[styles.bodyText, { color: colors.mutedForeground, marginTop: 6 }]}>
                        {report.personality_analysis.workplace_fit}
                      </Text>
                    ) : null}
                  </>
                ) : null}

                {/* Quiz */}
                {report.quiz_analysis?.assessment ? (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>QUIZ ASSESSMENT</Text>
                    <Text style={[styles.bodyText, { color: colors.foreground }]}>{report.quiz_analysis.assessment}</Text>
                  </>
                ) : null}

                <Text style={[styles.dateText, { color: colors.mutedForeground, textAlign: 'center', marginTop: 16 }]}>
                  Analysed {formatDate(selectedItem.computed_at)}
                </Text>
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
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
  applicantName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  jobTitle: { fontSize: 13 },
  scoreWrap: { alignItems: 'center', gap: 4 },
  scoreText: { fontSize: 22, fontWeight: '800' },
  labelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  labelText: { fontSize: 11, fontWeight: '700' },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  barFill: { height: '100%', borderRadius: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 12 },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: { fontSize: 13, fontWeight: '600' },
  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  modalContent: { padding: 20, paddingBottom: 40, gap: 12 },
  modalSubtitle: { fontSize: 14, marginBottom: 4 },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  bigScore: { fontSize: 48, fontWeight: '900' },
  bigScoreLabel: { fontSize: 13, marginTop: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 8 },
  breakdownRow: { marginBottom: 8 },
  breakdownLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  breakdownLabel: { fontSize: 14, fontWeight: '500' },
  breakdownValue: { fontSize: 13, fontWeight: '700' },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 4 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20 },
  verdictText: { fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  bodyText: { fontSize: 14, lineHeight: 22 },
});
