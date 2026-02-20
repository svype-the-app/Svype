import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { onboardingSteps, OnboardingStep } from '@/lib/mock-onboarding';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

interface Message {
  id: number;
  type: 'bot' | 'user';
  content: string;
}

type Step = OnboardingStep;

export default function JobSeekerOnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      type: "bot",
      content: "Hi! I'm your AI career assistant. I'll help you build your profile so we can find the perfect job opportunities for you. Ready? Let's start!"
    },
    {
      id: 1,
      type: "bot",
      content: onboardingSteps[0].question
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  const handleSend = async (answer?: string) => {
    const userAnswer = answer || input.trim();
    if (!userAnswer) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length,
      type: "user",
      content: userAnswer
    };
    setMessages([...messages, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1000));

    const nextStep = currentStep + 1;
    
    if (nextStep < onboardingSteps.length) {
      // Add next question
      const botMessage: Message = {
        id: messages.length + 1,
        type: "bot",
        content: onboardingSteps[nextStep].question
      };
      setMessages(prev => [...prev, botMessage]);
      setCurrentStep(nextStep);
    } else {
      // Onboarding complete
      const completionMessage: Message = {
        id: messages.length + 1,
        type: "bot",
        content: "Perfect! I've created your profile. Let me show you a choice for importing additional data..."
      };
      setMessages(prev => [...prev, completionMessage]);
      
      // Navigate to choice screen after delay
      setTimeout(() => {
        router.push('/(onboarding)/onboarding-choice' as any);
      }, 2000);
    }
    
    setIsTyping(false);
  };

  const handleSkip = () => {
    router.push('/(onboarding)/onboarding-choice' as any);
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.botInfo}>
              <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="chatbubble-ellipses" size={20} color={colors.background} />
              </View>
              <View>
                <Text style={[styles.botName, { color: colors.foreground }]}>AI Career Assistant</Text>
                <Text style={[styles.botStatus, { color: colors.mutedForeground }]}>Building your profile</Text>
              </View>
            </View>
            <Pressable onPress={handleSkip}>
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip</Text>
            </Pressable>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                Step {currentStep + 1} of {onboardingSteps.length}
              </Text>
              <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                {Math.round(progress)}%
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { backgroundColor: colors.primary, width: `${progress}%` }
                ]} 
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
            style={[
              styles.messageRow,
              message.type === 'user' && styles.messageRowReverse
            ]}
          >
            <View style={[
              styles.avatar,
              message.type === 'bot' 
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.muted }
            ]}>
              <Ionicons 
                name={message.type === 'bot' ? 'chatbubble-ellipses' : 'person'} 
                size={16} 
                color={message.type === 'bot' ? colors.background : colors.foreground}
              />
            </View>
            <View style={[
              styles.messageBubble,
              message.type === 'bot'
                ? { backgroundColor: colors.muted }
                : { backgroundColor: colors.primary }
            ]}>
              <Text style={[
                styles.messageText,
                { color: message.type === 'bot' ? colors.foreground : colors.background }
              ]}>
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
        {/* Quick Options */}
        {currentStepData.options && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.optionsScroll}
            contentContainerStyle={styles.optionsContent}
          >
            {currentStepData.options.map((option, index) => (
              <Pressable
                key={index}
                onPress={() => handleSend(option)}
                style={[styles.optionBadge, { 
                  backgroundColor: colors.background,
                  borderColor: colors.border 
                }]}
              >
                <Text style={[styles.optionText, { color: colors.foreground }]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Text Input */}
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            placeholder={currentStepData.placeholder}
            placeholderTextColor={colors.mutedForeground}
            editable={!isTyping}
            style={[styles.textInput, { 
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.foreground
            }]}
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={!input.trim() || isTyping}
            style={[
              styles.sendButton,
              { backgroundColor: (!input.trim() || isTyping) ? colors.muted : colors.primary }
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

// Typing indicator dot component
function TypingDot({ delay, color }: { delay: number; color: string }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay, opacity]);

  return (
    <Animated.View
      style={[
        styles.typingDot,
        { backgroundColor: color, opacity }
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    maxWidth: 672,
    width: '100%',
    alignSelf: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  botInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botName: {
    fontSize: 16,
    fontWeight: '600',
  },
  botStatus: {
    fontSize: 12,
  },
  skipText: {
    fontSize: 14,
  },
  progressContainer: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
    maxWidth: 672,
    width: '100%',
    alignSelf: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  messageRowReverse: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
  },
  optionsScroll: {
    marginBottom: 12,
  },
  optionsContent: {
    gap: 8,
  },
  optionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    maxWidth: 672,
    width: '100%',
    alignSelf: 'center',
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
