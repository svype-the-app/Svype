import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { applicationsApi } from '@/services/api';
import type { AcceptedApplicantMessage } from '@/services/applications';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AcceptedChatScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const appId = Number(applicationId);

  const [messages, setMessages] = useState<AcceptedApplicantMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await applicationsApi.getApplicationMessages(appId);
      setMessages(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Poll every 10 seconds while screen is focused
  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(fetchMessages, 10000);
      return () => clearInterval(interval);
    }, [fetchMessages])
  );

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Company Message</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="hourglass-outline" size={64} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Waiting for company response</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            The company will send you details about next steps here.
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, index) => {
            const showDate =
              index === 0 ||
              formatDate(msg.sent_at) !== formatDate(messages[index - 1].sent_at);
            return (
              <View key={msg.id}>
                {showDate && (
                  <Text style={[styles.dateSeparator, { color: colors.mutedForeground }]}>
                    {formatDate(msg.sent_at)}
                  </Text>
                )}
                <View style={styles.messageRow}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="business" size={16} color={colors.primary} />
                  </View>
                  <Card style={[styles.messageBubble, { backgroundColor: colors.card }]}>
                    <CardContent style={styles.bubbleContent}>
                      <Text style={[styles.senderLabel, { color: colors.primary }]}>Company</Text>
                      <Text style={[styles.messageText, { color: colors.foreground }]}>{msg.content}</Text>
                      <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                        {formatTime(msg.sent_at)}
                      </Text>
                    </CardContent>
                  </Card>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  messagesContent: { padding: 16, gap: 4, paddingBottom: 24 },
  dateSeparator: { textAlign: 'center', fontSize: 11, fontWeight: '600', marginVertical: 12 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  messageBubble: { flex: 1, maxWidth: '85%' },
  bubbleContent: { padding: 12 },
  senderLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  messageText: { fontSize: 14, lineHeight: 20 },
  timeText: { fontSize: 10, marginTop: 4, textAlign: 'right' },
});
