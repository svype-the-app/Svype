import { Card, CardContent } from '@/components/ui/card';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Colors } from '@/constants/theme';
import { queryKeys } from '@/lib/query-keys';
import { applicationsApi } from '@/services/api';
import type { AcceptedApplicant } from '@/services/applications';
import { formatRelativeTime } from '@/utils/time';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
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
const EMPTY_ACCEPTED: AcceptedApplicant[] = [];

export default function AcceptedApplicantsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const acceptedQuery = useQuery({
    queryKey: queryKeys.applications.accepted(),
    queryFn: applicationsApi.getAcceptedApplicants,
  });
  const applicants = acceptedQuery.data ?? EMPTY_ACCEPTED;
  const hasData = acceptedQuery.data !== undefined;
  // Spinner only when there's nothing cached to show yet.
  const loading = !hasData && (acceptedQuery.isPending || acceptedQuery.isFetching);
  // Error state only when the fetch failed AND there's no cached data.
  const loadError = !hasData && acceptedQuery.isError && !acceptedQuery.isFetching;
  // Inline pull-to-refresh indicator while revalidating cached data.
  const refreshing = hasData && acceptedQuery.isFetching;

  return (
    <Screen>
      <ScreenHeader
        title="Accepted Applicants"
        onBack={() => router.push('/(company)/dashboard' as any)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => acceptedQuery.refetch()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
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
            <TouchableOpacity onPress={() => acceptedQuery.refetch()} style={[styles.retryBtn, { borderColor: colors.border }]}>
              <Text style={[styles.retryText, { color: colors.foreground }]}>Retry</Text>
            </TouchableOpacity>
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
                      <View style={styles.infoHeader}>
                        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                          {item.applicant_name || item.applicant_email}
                        </Text>
                        <Text style={[styles.cardTimestamp, { color: colors.mutedForeground }]}>
                          {formatRelativeTime(item.accepted_at)}
                        </Text>
                      </View>
                      <Text style={[styles.jobTitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {item.job_title}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 10, paddingBottom: 32 },
  centered: { alignItems: 'center', paddingVertical: 64, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  retryText: { fontSize: 14, fontWeight: '600' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  card: { marginBottom: 0 },
  cardContent: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 20, fontWeight: '700' },
  info: { flex: 1 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  name: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 4 },
  jobTitle: { fontSize: 13, marginBottom: 2 },
  cardTimestamp: { fontSize: 11 },
  actionHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
