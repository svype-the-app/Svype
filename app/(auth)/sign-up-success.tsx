import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { authApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

const AI_ROUTE = '/(onboarding)/job-seeker-onboarding';
const MANUAL_ROUTE = '/(onboarding)/onboarding-choice';
const SKIP_ROUTE = '/(jobseeker)/chat';
const COMPANY_ROUTE = '/(company)/profile/profile-preview?mode=onboarding';

export default function SignUpSuccessScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { firstName } = useLocalSearchParams<{ firstName: string }>();
  const [isCompanyUser, setIsCompanyUser] = useState(false);

  useEffect(() => {
    const resolve = async () => {
      const storedUser = await authApi.getStoredUser();
      if (storedUser?.user_type === 'company') {
        setIsCompanyUser(true);
      }
    };
    resolve();
  }, []);

  // Company flow is unchanged — keeps its dedicated single-CTA card.
  if (isCompanyUser) {
    const greeting = `Welcome${firstName ? `, ${firstName}` : ''}.`;
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.appTitle, { color: colors.primary }]}>SVYPE</Text>
          </View>
          <Text style={[styles.headline, { color: colors.foreground }]}>{greeting}</Text>
          <Text style={[styles.subhead, { color: colors.mutedForeground }]}>
            Let&apos;s set up your company.
          </Text>

          <Card>
            <CardContent>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Your company profile
              </Text>
              <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>
                Tell candidates who you are. You&apos;ll be ready to post jobs and review
                applicants in a few minutes.
              </Text>
              <Button size="lg" onPress={() => router.push(COMPANY_ROUTE as any)} style={styles.cta}>
                Get started
              </Button>
            </CardContent>
          </Card>
        </View>
      </View>
    );
  }

  const welcomeTitle = `Welcome to SVYPE${firstName ? `, ${firstName}` : ''}!`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.appTitle, { color: colors.primary }]}>SVYPE</Text>
        </View>

        <Card>
          <CardContent style={styles.successCard}>
            <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={36} color={colors.background} />
            </View>

            <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
              {welcomeTitle}
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.mutedForeground }]}>
              Your account has been created. Let&apos;s build your profile with our AI assistant.
            </Text>

            <Button
              size="lg"
              onPress={() => router.push(MANUAL_ROUTE as any)}
              style={styles.ctaButton}
            >
              Manual Onboarding
            </Button>

            <Button
              size="lg"
              onPress={() => router.push(AI_ROUTE as any)}
              style={styles.ctaButton}
            >
              ✨ AI Onboarding
            </Button>

            <Pressable
              onPress={() => router.replace(SKIP_ROUTE as any)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.skipPressable,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
                Skip for now
              </Text>
            </Pressable>
          </CardContent>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subhead: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 28,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  cta: {
    width: '100%',
  },
  successCard: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 14,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  ctaButton: {
    width: '100%',
  },
  skipPressable: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 2,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
