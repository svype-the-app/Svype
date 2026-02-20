import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Colors } from '@/constants/theme';
import { aiChatResponses, initialChatMessages, Message, quickPrompts } from '@/lib/mock-chat';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

export default function AIChatScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialChatMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response with hardcoded data
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiChatResponses[Math.floor(Math.random() * aiChatResponses.length)],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.avatarContainer}>
              <Avatar
                size={40}
                style={{
                  backgroundColor: colors.primary,
                }}
              >
                <AvatarFallback>
                  <Ionicons name="sparkles" size={20} color="#ffffff" />
                </AvatarFallback>
              </Avatar>
              <View
                style={[
                  styles.onlineIndicator,
                  { backgroundColor: '#22c55e', borderColor: colors.background },
                ]}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                AI Career Coach
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                Always here to help
              </Text>
            </View>
          </View>
          <Badge
            style={{ backgroundColor: colors.primary + '20' }}
            textStyle={{ color: colors.primary }}
          >
            <Ionicons name="sparkles" size={12} color={colors.primary} />
            <Text>AI</Text>
          </Badge>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageRow,
              message.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant,
            ]}
          >
            <Avatar
              size={32}
              style={
                message.role === 'assistant'
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.muted }
              }
            >
              <AvatarFallback>
                {message.role === 'assistant' ? (
                  <Ionicons name="sparkles" size={16} color="#ffffff" />
                ) : (
                  <Ionicons name="person" size={16} color={colors.foreground} />
                )}
              </AvatarFallback>
            </Avatar>

            <View style={styles.messageContent}>
              <Card
                style={
                  message.role === 'user'
                    ? [styles.messageCard, { backgroundColor: colors.primary, borderWidth: 0 }]
                    : styles.messageCard
                }
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user'
                      ? { color: colors.primaryForeground }
                      : { color: colors.foreground },
                  ]}
                >
                  {message.content}
                </Text>
              </Card>
              <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <View style={[styles.messageRow, styles.messageRowAssistant]}>
            <Avatar size={32} style={{ backgroundColor: colors.primary }}>
              <AvatarFallback>
                <Ionicons name="sparkles" size={16} color="#ffffff" />
              </AvatarFallback>
            </Avatar>
            <View style={styles.messageContent}>
              <Card style={styles.messageCard}>
                <View style={styles.typingIndicator}>
                  <TypingDot delay={0} color={colors.mutedForeground} />
                  <TypingDot delay={200} color={colors.mutedForeground} />
                  <TypingDot delay={400} color={colors.mutedForeground} />
                </View>
              </Card>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Prompts */}
      {messages.length === 1 && (
        <View style={styles.quickPromptsContainer}>
          <Text style={[styles.quickPromptsLabel, { color: colors.mutedForeground }]}>
            Quick prompts to get started:
          </Text>
          <View style={styles.quickPrompts}>
            {quickPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                onPress={() => handleQuickPrompt(prompt)}
                style={styles.quickPromptButton}
              >
                <Text style={[styles.quickPromptText, { color: colors.foreground }]}>
                  {prompt}
                </Text>
              </Button>
            ))}
          </View>
        </View>
      )}

      {/* Input Area */}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <View style={styles.inputWrapper}>
          <Textarea
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything about your career..."
            rows={1}
            style={styles.textInput}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || isTyping}
            style={[
              styles.sendButton,
              {
                backgroundColor: colors.primary, // always vibrant
                opacity: (!input.trim() || isTyping) ? 0.7 : 1,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              },
            ]}
          >
            <Ionicons
              name="send"
              size={20}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Typing indicator dot component
function TypingDot({ delay, color }: { delay: number; color: string }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.typingDot,
        {
          backgroundColor: color,
          opacity,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  messageRowUser: {
    flexDirection: 'row-reverse',
  },
  messageRowAssistant: {
    flexDirection: 'row',
  },
  messageContent: {
    flex: 1,
    maxWidth: '80%',
  },
  messageCard: {
    padding: 16,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickPromptsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  quickPromptsLabel: {
    fontSize: 12,
    marginBottom: 12,
  },
  quickPrompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickPromptButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickPromptText: {
    fontSize: 12,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
  },
  sendButton: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
