import { Card, CardContent } from '@/components/ui/card';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Colors } from '@/constants/theme';
import { applicationsApi } from '@/services/api';
import type { AcceptedApplicantMessage } from '@/services/applications';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

// A chat message plus optimistic-send bookkeeping. `_status`/`_tempId` are only
// present on messages the user just sent and that haven't been confirmed by the
// server yet (or failed); confirmed/server messages have neither.
type ChatMessage = AcceptedApplicantMessage & {
  _status?: 'sending' | 'sent' | 'failed';
  _tempId?: string;
};

export default function CompanyChatScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const appId = Number(applicationId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await applicationsApi.getApplicationMessages(appId);
      // Merge: keep any still-sending/failed optimistic messages (not yet on the
      // server) so a background poll doesn't make them disappear mid-send.
      setMessages((prev) => {
        const pending = prev.filter((m) => m._status === 'sending' || m._status === 'failed');
        return [...data, ...pending];
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(fetchMessages, 10_000);
      return () => clearInterval(interval);
    }, [fetchMessages])
  );

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  // Fire the network call for one optimistic message; flips it to 'sent' (with
  // the real server row) or 'failed'.
  const deliver = useCallback((tempId: string, content: string) => {
    applicationsApi
      .sendApplicationMessage(appId, content)
      .then((real) => {
        setMessages((prev) =>
          prev.map((m) => (m._tempId === tempId ? { ...real, _status: 'sent', _tempId: tempId } : m)),
        );
      })
      .catch(() => {
        setMessages((prev) =>
          prev.map((m) => (m._tempId === tempId ? { ...m, _status: 'failed' } : m)),
        );
      });
  }, [appId]);

  const handleSend = () => {
    const content = input.trim();
    if (!content) return;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    // Show the message immediately with a 'sending' indicator; don't block input.
    const optimistic: ChatMessage = {
      id: -Date.now(),
      content,
      sent_at: new Date().toISOString(),
      _status: 'sending',
      _tempId: tempId,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    deliver(tempId, content);
  };

  // Re-send a message whose delivery failed (tap the alert icon).
  const retrySend = (msg: ChatMessage) => {
    if (!msg._tempId) return;
    setMessages((prev) =>
      prev.map((m) => (m._tempId === msg._tempId ? { ...m, _status: 'sending' } : m)),
    );
    deliver(msg._tempId, msg.content);
  };

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
    <Screen>
      <ScreenHeader title="Message Applicant" onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 && (
              <View style={styles.emptyHint}>
                <Ionicons name="chatbubble-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Send your first message to the applicant.
                </Text>
              </View>
            )}
            {messages.map((msg, index) => {
              const showDate =
                index === 0 ||
                formatDate(msg.sent_at) !== formatDate(messages[index - 1].sent_at);
              return (
                <View key={msg._tempId ?? String(msg.id)}>
                  {showDate && (
                    <Text style={[styles.dateSeparator, { color: colors.mutedForeground }]}>
                      {formatDate(msg.sent_at)}
                    </Text>
                  )}
                  <View style={styles.msgRow}>
                    <Card style={[styles.bubble, { backgroundColor: colors.primary }]}>
                      <CardContent style={styles.bubbleContent}>
                        <Text style={styles.bubbleText}>{msg.content}</Text>
                        <View style={styles.bubbleFooter}>
                          <Text style={styles.bubbleTime}>{formatTime(msg.sent_at)}</Text>
                          {msg._status === 'sending' ? (
                            <ActivityIndicator size="small" color="rgba(255,255,255,0.85)" />
                          ) : msg._status === 'sent' ? (
                            <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.85)" />
                          ) : msg._status === 'failed' ? (
                            <TouchableOpacity onPress={() => retrySend(msg)} hitSlop={6}>
                              <Ionicons name="alert-circle" size={14} color="#fecaca" />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </CardContent>
                    </Card>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Input row */}
        <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
            placeholder="Type a message…"
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.muted }]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messagesContent: { padding: 16, gap: 4, paddingBottom: 12 },
  emptyHint: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  dateSeparator: { textAlign: 'center', fontSize: 11, fontWeight: '600', marginVertical: 12 },
  msgRow: { alignItems: 'flex-end', marginBottom: 8 },
  bubble: { maxWidth: '80%' },
  bubbleContent: { padding: 10 },
  bubbleText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  bubbleTime: { color: 'rgba(255,255,255,0.7)', fontSize: 10, textAlign: 'right' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
});
