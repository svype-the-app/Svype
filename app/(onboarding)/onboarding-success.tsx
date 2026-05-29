import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { authApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

/**
 * Shown once after essential onboarding finishes.
 * Transitions user state to 'active' on mount so this screen never re-triggers.
 * - Primary: generate resume → navigate to generate-cv screen
 * - Secondary: keep chatting → return to chat with a hint message injected
 */
export default function OnboardingSuccessScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Transition to active state as soon as this screen is seen.
  // After this, the backend will no longer return next_route = onboarding-success.
  useEffect(() => {
    authApi.updateState('active').catch(() => {
      // Ignore if transition already happened or fails silently
    });
  }, []);

  const handleGenerateResume = () => {
    router.replace('/(jobseeker)/profile/generate-cv' as any);
  };

  const handleBackToChat = () => {
    // Pass a flag so the chat screen injects a hint message about CV generation
    router.replace('/(onboarding)/job-seeker-onboarding?cv_hint=1' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '22' }]}>
          <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          Your profile is ready!
        </Text>

        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Your essentials are saved. Generate a tailored AI resume now, or keep
          chatting to improve your job matches.
        </Text>

        <View style={[styles.tipCard, { backgroundColor: colors.muted + '40', borderColor: colors.border }]}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
          <View style={styles.tipText}>
            <Text style={[styles.tipTitle, { color: colors.foreground }]}>
              AI-powered resume
            </Text>
            <Text style={[styles.tipBody, { color: colors.mutedForeground }]}>
              We'll use everything you shared to generate a professional resume
              tailored to your experience and goals.
            </Text>
          </View>
        </View>

        <Button onPress={handleGenerateResume} style={styles.primaryButton}>
          <Ionicons name="document-text-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Generate My Resume</Text>
        </Button>

        <Button variant="outline" onPress={handleBackToChat} style={styles.secondaryButton}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
            Keep chatting with AI
          </Text>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  tipCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  tipText: {
    flex: 1,
    gap: 4,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
