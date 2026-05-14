import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useChatUnread } from '@/lib/chat-unread-context';
import { aiOnboardingApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface Message {
  id: number;
  type: 'bot' | 'user';
  content: string;
}

export default function AIChatScreen() {
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scrollViewRef = useRef<ScrollView>(null);
  const { setHasUnreadAiMsg } = useChatUnread();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [totalFields, setTotalFields] = useState(1);
  const [completedFields, setCompletedFields] = useState(0);
  const [isLoadingStart, setIsLoadingStart] = useState(true);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const progress = Math.max(0, Math.min(100, (completedFields / Math.max(totalFields, 1)) * 100));

  // Clear nav badge as soon as this tab is opened.
  useEffect(() => {
    setHasUnreadAiMsg(false);
  }, []);

  // Scroll to bottom whenever the keyboard shows (Android pan mode doesn't
  // auto-scroll the ScrollView content, so we do it manually).
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => sub.remove();
  }, []);

  const toUiMessages = (
    apiMessages: { role: 'user' | 'assistant'; content: string }[],
  ): Message[] =>
    apiMessages.map((m, index) => ({
      id: index,
      type: m.role === 'assistant' ? 'bot' : 'user',
      content: m.content,
    }));

  useEffect(() => {
    const init = async () => {
      setIsLoadingStart(true);
      try {
        const start = await aiOnboardingApi.startSession();
        setSessionId(start.session_id);
        setMessages(toUiMessages(start.messages));
        setTotalFields(start.total_fields);
        setCompletedFields(start.completed_fields);

        if (start.is_complete && start.next_route) {
          setTimeout(() => router.replace(start.next_route as any), 1200);
          return;
        }

        // cv_incomplete entry: silently send a trigger message so the AI
        // explains what is still needed and resumes collection naturally.
        if (reason === 'cv_incomplete' && start.session_id) {
          try {
            const triggerResult = await aiOnboardingApi.sendMessage(
              start.session_id,
              'I tried to generate my CV',
            );
            // Only show the bot reply — do NOT render the user trigger bubble
            setMessages((prev) => [
              ...prev,
              { id: prev.length, type: 'bot', content: triggerResult.reply },
            ]);
            setTotalFields(triggerResult.total_fields);
            setCompletedFields(triggerResult.completed_fields);
            if (triggerResult.next_route) {
              if (triggerResult.is_complete) {
                setTimeout(() => router.replace(triggerResult.next_route as any), 1300);
              } else {
                setTimeout(() => router.push(triggerResult.next_route as any), 1300);
              }
            }
          } catch {
            // Non-fatal — user can still chat normally
          }
        }

        // github_connected entry: silently trigger so AI confirms imported skills
        if (reason === 'github_connected' && start.session_id) {
          try {
            const triggerResult = await aiOnboardingApi.sendMessage(
              start.session_id,
              '__github_connected__',
            );
            // Only show the bot reply — do NOT render the user trigger bubble
            setMessages((prev) => [
              ...prev,
              { id: prev.length, type: 'bot', content: triggerResult.reply },
            ]);
            setTotalFields(triggerResult.total_fields);
            setCompletedFields(triggerResult.completed_fields);
          } catch {
            // Non-fatal — user can still chat normally
          }
        }
      } catch (error: any) {
        setMessages([
          {
            id: 0,
            type: 'bot',
            content: error?.message || 'Unable to start AI session right now. Please try again.',
          },
        ]);
      } finally {
        setIsLoadingStart(false);
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  const handleSend = async (answer?: string) => {
    const userAnswer = answer || input.trim();
    if (!userAnswer || !sessionId || isLoadingStart) return;

    const userMessage: Message = { id: messages.length, type: 'user', content: userAnswer };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await aiOnboardingApi.sendMessage(sessionId, userAnswer);
      setMessages((prev) => [...prev, { id: prev.length, type: 'bot', content: result.reply }]);
      setTotalFields(result.total_fields);
      setCompletedFields(result.completed_fields);

      if (result.next_route) {
        if (result.is_complete) {
          setTimeout(() => router.replace(result.next_route as any), 1300);
        } else {
          // Mid-session navigation (e.g. GitHub connect) — push so user can return
          setTimeout(() => router.push(result.next_route as any), 1300);
        }
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length,
          type: 'bot',
          content: error?.message || 'I could not process that. Please try a short answer again.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <View style={styles.botInfo}>
              <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="chatbubble-ellipses" size={20} color={colors.background} />
              </View>
              <View>
                <Text style={[styles.botName, { color: colors.foreground }]}>AI Career Assistant</Text>
                <Text style={[styles.botStatus, { color: colors.mutedForeground }]}>Building your profile</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressInfo}>
                <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                  {completedFields} of {totalFields} profile fields collected
                </Text>
                <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                  {Math.round(progress)}%
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                <View
                  style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress}%` }]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[styles.messageRow, message.type === 'user' && styles.messageRowReverse]}
            >
              <View
                style={[
                  styles.avatar,
                  message.type === 'bot'
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.muted },
                ]}
              >
                <Ionicons
                  name={message.type === 'bot' ? 'chatbubble-ellipses' : 'person'}
                  size={16}
                  color={message.type === 'bot' ? colors.background : colors.foreground}
                />
              </View>
              <View
                style={[
                  styles.messageBubble,
                  message.type === 'bot'
                    ? { backgroundColor: colors.muted }
                    : { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    { color: message.type === 'bot' ? colors.foreground : colors.background },
                  ]}
                >
                  {message.content}
                </Text>
              </View>
            </View>
          ))}

          {isTyping && (
            <View style={styles.messageRow}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="chatbubble-ellipses" size={16} color={colors.background} />
              </View>
              <View style={[styles.messageBubble, { backgroundColor: colors.muted }]}>
                <View style={styles.typingIndicator}>
                  <TypingDot delay={0} color={colors.mutedForeground} />
                  <TypingDot delay={150} color={colors.mutedForeground} />
                  <TypingDot delay={300} color={colors.mutedForeground} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => handleSend()}
              placeholder={isLoadingStart ? 'Starting AI session...' : 'Write a short answer...'}
              placeholderTextColor={colors.mutedForeground}
              editable={!isTyping && !isLoadingStart}
              style={[
                styles.textInput,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground },
              ]}
            />
            <Pressable
              onPress={() => handleSend()}
              disabled={!input.trim() || isTyping || isLoadingStart}
              style={[
                styles.sendButton,
                { backgroundColor: !input.trim() || isTyping || isLoadingStart ? colors.muted : colors.primary },
              ]}
            >
              <Ionicons name="send" size={18} color={colors.background} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}


function TypingDot({ delay, color }: { delay: number; color: string }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, opacity]);

  return <Animated.View style={[styles.typingDot, { backgroundColor: color, opacity }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: { maxWidth: 672, width: '100%', alignSelf: 'center', gap: 12 },
  botInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  botAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  botName: { fontSize: 16, fontWeight: '600' },
  botStatus: { fontSize: 12 },
  progressContainer: { gap: 8 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 12 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 32, maxWidth: 672, width: '100%', alignSelf: 'center' },
  messageRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  messageRowReverse: { flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  messageBubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  messageText: { fontSize: 14, lineHeight: 20 },
  typingIndicator: { flexDirection: 'row', gap: 4 },
  typingDot: { width: 8, height: 8, borderRadius: 4 },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 20,
    borderTopWidth: 1,
  },
  inputRow: { flexDirection: 'row', gap: 8, maxWidth: 672, width: '100%', alignSelf: 'center' },
  textInput: { flex: 1, height: 44, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, fontSize: 14 },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});
