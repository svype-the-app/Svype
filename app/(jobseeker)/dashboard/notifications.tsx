import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { notificationsApi } from '@/services/api';
import type { Notification } from '@/services/types';
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

function iconForType(type: string) {
  switch (type) {
    case 'application_accepted': return { name: 'checkmark-circle' as const, color: '#22c55e' };
    case 'application_rejected': return { name: 'close-circle' as const, color: '#ef4444' };
    case 'employer_message': return { name: 'chatbubble-ellipses' as const, color: '#3b82f6' };
    default: return { name: 'notifications' as const, color: '#8b5cf6' };
  }
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
      const unread = data.filter((n) => !n.is_read);
      await Promise.all(unread.map((n) => notificationsApi.markAsRead(n.id).catch(() => {})));
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
    const diffMins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  const handleTap = (notif: Notification) => {
    if (
      (notif.type === 'application_accepted' || notif.type === 'employer_message') &&
      notif.related_object_id
    ) {
      router.push(`/(jobseeker)/dashboard/accepted-chat/${notif.related_object_id}` as any);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.push('/(jobseeker)/dashboard' as any)} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications</Text>
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
                          {formatDate(notif.created_at)}
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
  scrollContent: { padding: 16, gap: 10, paddingBottom: 32 },
  centered: { alignItems: 'center', paddingVertical: 64, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
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
