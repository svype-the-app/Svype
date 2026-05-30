import { Card, CardContent } from '@/components/ui/card';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Colors } from '@/constants/theme';
import { queryKeys } from '@/lib/query-keys';
import { notificationsApi } from '@/services/api';
import type { Notification } from '@/services/types';
import { formatRelativeTime } from '@/utils/time';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
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

function iconForType(type: string) {
  switch (type) {
    case 'application_accepted': return { name: 'checkmark-circle' as const, color: '#22c55e' };
    case 'application_rejected': return { name: 'close-circle' as const, color: '#ef4444' };
    case 'employer_message': return { name: 'chatbubble-ellipses' as const, color: '#3b82f6' };
    default: return { name: 'notifications' as const, color: '#8b5cf6' };
  }
}

// Stable empty reference for the no-data-yet render.
const EMPTY_NOTIFICATIONS: Notification[] = [];

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const notifsQuery = useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: notificationsApi.getNotifications,
  });
  const notifications = notifsQuery.data ?? EMPTY_NOTIFICATIONS;
  const hasData = notifsQuery.data !== undefined;
  // Full-screen spinner only when there's nothing cached to show yet.
  const loading = !hasData && (notifsQuery.isPending || notifsQuery.isFetching);
  // Error state only when the fetch failed AND there's no cached data.
  const loadError = !hasData && notifsQuery.isError && !notifsQuery.isFetching;
  // Inline pull-to-refresh indicator while revalidating cached data.
  const refreshing = hasData && notifsQuery.isFetching;

  // Mark everything read whenever a fresh list arrives — mirrors the old
  // load() side effect. We don't refetch afterwards, so the unread styling
  // stays for this view (matching prior behaviour); the next fetch reflects it.
  useEffect(() => {
    if (!notifsQuery.data) return;
    const unread = notifsQuery.data.filter((n) => !n.is_read);
    if (unread.length === 0) return;
    Promise.all(unread.map((n) => notificationsApi.markAsRead(n.id).catch(() => {})));
  }, [notifsQuery.data]);

  const handleTap = (notif: Notification) => {
    if (
      (notif.type === 'application_accepted' || notif.type === 'employer_message') &&
      notif.related_object_id
    ) {
      router.push(`/(jobseeker)/dashboard/accepted-chat/${notif.related_object_id}` as any);
    }
  };

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        onBack={() => router.push('/(jobseeker)/dashboard' as any)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => notifsQuery.refetch()}
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
            <TouchableOpacity onPress={() => notifsQuery.refetch()} style={[styles.retryBtn, { borderColor: colors.border }]}>
              <Text style={[styles.retryText, { color: colors.foreground }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No notifications yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              You'll see updates about your applications here.
            </Text>
          </View>
        ) : (
          notifications.map((notif) => {
            const icon = iconForType(notif.type);
            const tappable =
              (notif.type === 'application_accepted' || notif.type === 'employer_message') &&
              !!notif.related_object_id;
            return (
              <TouchableOpacity
                key={notif.id}
                onPress={() => handleTap(notif)}
                activeOpacity={tappable ? 0.7 : 1}
              >
                <Card style={[styles.card, !notif.is_read && { borderColor: colors.primary + '50', borderWidth: 1 }]}>
                  <CardContent style={styles.cardContent}>
                    <View style={[styles.iconWrap, { backgroundColor: icon.color + '20' }]}>
                      <Ionicons name={icon.name} size={22} color={icon.color} />
                    </View>
                    <View style={styles.textWrap}>
                      <Text style={[styles.title, { color: colors.foreground }]}>{notif.title}</Text>
                      <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {notif.description}
                      </Text>
                      <View style={styles.footer}>
                        <Text style={[styles.date, { color: colors.mutedForeground }]}>
                          {formatRelativeTime(notif.created_at)}
                        </Text>
                        {tappable && (
                          <View style={styles.viewRow}>
                            <Text style={[styles.viewText, { color: colors.primary }]}>
                              {notif.type === 'employer_message' ? 'View message' : 'View chat'}
                            </Text>
                            <Ionicons name="chevron-forward" size={12} color={colors.primary} />
                          </View>
                        )}
                      </View>
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
  scrollContent: { padding: 16, gap: 10, paddingBottom: 32 },
  centered: { alignItems: 'center', paddingVertical: 64, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  retryText: { fontSize: 14, fontWeight: '600' },
  card: { marginBottom: 0 },
  cardContent: { padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  textWrap: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  description: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 11 },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: { fontSize: 12, fontWeight: '600' },
});
