import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { applicationsApi } from '@/services/api';
import type { AcceptedApplicant } from '@/services/applications';
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

export default function AcceptedApplicantsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [applicants, setApplicants] = useState<AcceptedApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await applicationsApi.getAcceptedApplicants();
      setApplicants(data);
    } catch {
      // ignore
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Accepted Applicants</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : applicants.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="people-outline" size={64} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No accepted applicants yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Applicants you shortlist will appear here.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {applicants.length} accepted
            </Text>
            {applicants.map((item) => (
              <TouchableOpacity
                key={item.application_id}
                onPress={() => router.push(`/(company)/applicants/chat/${item.application_id}` as any)}
                activeOpacity={0.8}
              >
                <Card style={styles.card}>
                  <CardContent style={styles.cardContent}>
                    <View style={[styles.avatar, { backgroundColor: '#22c55e20' }]}>
                      <Text style={[styles.avatarText, { color: '#22c55e' }]}>
                        {(item.applicant_name || '?')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.info}>
                      <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                        {item.applicant_name || item.applicant_email}
                      </Text>
                      <Text style={[styles.jobTitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {item.job_title}
                      </Text>
                      <Text style={[styles.date, { color: colors.mutedForeground }]}>
                        Accepted {formatDate(item.accepted_at)}
                      </Text>
                    </View>
                    <View style={styles.actionHint}>
                      <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 32 },
  centered: { alignItems: 'center', paddingVertical: 64, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  card: { marginBottom: 0 },
  cardContent: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 20, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  jobTitle: { fontSize: 13, marginBottom: 2 },
  date: { fontSize: 11 },
  actionHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
