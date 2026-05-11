import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

/**
 * Shown after the essential onboarding chat finishes.
 * Two ideas the user lands on here:
 *   1. They can preview their profile now.
 *   2. They can come back to the chat anytime to share more so AI knows them better.
 */
export default function OnboardingSuccessScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handlePreview = () => {
    router.replace('/(jobseeker)/profile' as any);
  };

  const handleBackToChat = () => {
    router.replace('/(onboarding)/job-seeker-onboarding' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '22' }]}>
          <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          Your essentials are in!
        </Text>

        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Nice work. The basics are saved — you can preview your profile now.
        </Text>

        <View style={[styles.tipCard, { backgroundColor: colors.muted + '40', borderColor: colors.border }]}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
          <View style={styles.tipText}>
            <Text style={[styles.tipTitle, { color: colors.foreground }]}>
              Want better job matches?
            </Text>
            <Text style={[styles.tipBody, { color: colors.mutedForeground }]}>
              Come back to the AI chat anytime. The more you share — past roles,
              preferences, what you're looking for — the better we can match you.
            </Text>
          </View>
        </View>

        <Button onPress={handlePreview} style={styles.primaryButton}>
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Click here for profile preview</Text>
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
