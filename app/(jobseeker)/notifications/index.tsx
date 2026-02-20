import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { mockNotifications, Notification } from '@/lib/mock-notifications';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setNotifications(notifications.filter(n => n.id !== id))
        }
      ]
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "application":
        return { name: "briefcase-outline" as const, color: "#3b82f6" };
      case "interview":
        return { name: "calendar-outline" as const, color: "#f59e0b" };
      case "status":
        return { name: "trending-up-outline" as const, color: "#10b981" };
      case "tip":
        return { name: "checkmark-circle-outline" as const, color: "#8b5cf6" };
      case "message":
        return { name: "chatbubble-outline" as const, color: colors.primary };
      default:
        return { name: "notifications-outline" as const, color: colors.primary };
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    }
  };

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const icon = getIcon(notification.type);

    return (
      <TouchableOpacity
        onPress={() => handleNotificationClick(notification)}
        activeOpacity={0.7}
      >
        <Card 
          style={[
            styles.notificationCard,
            !notification.read && {
              backgroundColor: colors.primary + '0D',
              borderColor: colors.primary + '33'
            }
          ]}
        >
          <CardContent>
            <View style={styles.notificationContent}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <Ionicons name={icon.name} size={20} color={icon.color} />
              </View>

              {/* Content */}
              <View style={styles.textContent}>
                <View style={styles.titleRow}>
                  <Text 
                    style={[
                      styles.notificationTitle,
                      { color: !notification.read ? colors.cardForeground : colors.mutedForeground }
                    ]}
                    numberOfLines={1}
                  >
                    {notification.title}
                  </Text>
                  {!notification.read && (
                    <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <Text style={[styles.notificationDescription, { color: colors.mutedForeground }]}>
                  {notification.description}
                </Text>
                <View style={styles.footer}>
                  <View style={styles.timeContainer}>
                    <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                      {notification.time}
                    </Text>
                  </View>
                  {notification.actionUrl && (
                    <TouchableOpacity 
                      style={styles.viewButton}
                      onPress={() => handleNotificationClick(notification)}
                    >
                      <Text style={[styles.viewButtonText, { color: colors.primary }]}>
                        View
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Delete Button */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                style={styles.deleteButton}
              >
                <Ionicons name="close" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={[styles.bellContainer, { backgroundColor: colors.primary + '1A' }]}>
              <Ionicons name="notifications" size={20} color={colors.primary} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: colors.cardForeground }]}>
                Notifications
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead} style={styles.markReadButton}>
                <Text style={[styles.markReadText, { color: colors.primary }]}>
                  Mark all read
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={20} color={colors.cardForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '1A' }]}>
              <Ionicons name="notifications-outline" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.cardForeground }]}>
              No Notifications
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              You&rsquo;re all caught up! We&rsquo;ll notify you about important updates.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bellContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markReadButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    marginBottom: 12,
  },
  notificationContent: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    marginTop: 2,
  },
  textContent: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
  },
  viewButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
