import { Card, CardContent } from '@/components/ui/card';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Colors } from '@/constants/theme';
import { useApplications } from '@/lib/use-applications';
import { formatRelativeTime } from '@/utils/time';
import { Ionicons } from '@expo/vector-icons';
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

export default function AcceptedJobsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Accepted applications are just the shortlisted slice of the shared
  // applications cache — so this screen is warm the moment the dashboard is,
  // and auto-refreshes whenever an application is added/withdrawn.
  const { applications, initialLoading: loading, loadError, refreshing, refresh } = useApplications();
  const accepted = applications.filter((a) => a.status === 'shortlisted');

  return (
    <Screen>
      <ScreenHeader
        title="Accepted Applications"
        onBack={() => router.push('/(jobseeker)/dashboard' as any)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
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
            <TouchableOpacity onPress={refresh} style={[styles.retryBtn, { borderColor: colors.border }]}>
              <Text style={[styles.retryText, { color: colors.foreground }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : accepted.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="checkmark-circle-outline" size={64} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No accepted applications</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              When a company accepts your application it will appear here.
            </Text>
          </View>
        ) : (
          accepted.map((app) => (
            <TouchableOpacity
              key={app.id}
              onPress={() => router.push(`/(jobseeker)/dashboard/accepted-chat/${app.id}` as any)}
              activeOpacity={0.8}
            >
              <Card style={styles.card}>
                <CardContent style={styles.cardContent}>
                  <View style={[styles.iconWrap, { backgroundColor: '#22c55e20' }]}>
                    <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                  </View>
                  <View style={styles.info}>
                    <View style={styles.infoHeader}>
                      <Text style={[styles.jobTitle, { color: colors.foreground }]} numberOfLines={1}>
                        {app.job.title}
                      </Text>
                      <Text style={[styles.cardTimestamp, { color: colors.mutedForeground }]}>
                        {formatRelativeTime(app.applied_at)}
                      </Text>
                    </View>
                    <Text style={[styles.companyName, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {app.job.company_name}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                </CardContent>
              </Card>
            </TouchableOpacity>
          ))
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
  card: { marginBottom: 0 },
  cardContent: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info: { flex: 1 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  jobTitle: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 4 },
  companyName: { fontSize: 13, marginBottom: 2 },
  cardTimestamp: { fontSize: 11 },
});
