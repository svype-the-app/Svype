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

  const greeting = `Welcome${firstName ? `, ${firstName}` : ''}.`;

  if (isCompanyUser) {
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
                Tell candidates who you are. You&apos;ll be ready to post jobs and review applicants in a few minutes.
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.appTitle, { color: colors.primary }]}>SVYPE</Text>
        </View>
        <Text style={[styles.headline, { color: colors.foreground }]}>{greeting}</Text>
        <Text style={[styles.subhead, { color: colors.mutedForeground }]}>
          Let&apos;s set up your profile.
        </Text>

        <Card>
          <CardContent>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>
              RECOMMENDED  ·  2 MIN
            </Text>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Chat with Svyper
            </Text>
            <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>
              Tell us about yourself in a quick chat. We&apos;ll handle the rest, including the stuff that never makes it onto a resume.
            </Text>
            <Button size="lg" onPress={() => router.push(AI_ROUTE as any)} style={styles.cta}>
              Start chat
            </Button>
          </CardContent>
        </Card>

        <Pressable
          onPress={() => router.push(MANUAL_ROUTE as any)}
          hitSlop={8}
          style={({ pressed }) => [
            styles.manualLink,
            pressed && { backgroundColor: colors.muted },
          ]}
        >
          <Text style={[styles.manualLinkText, { color: colors.mutedForeground }]}>
            Or import from LinkedIn  ·  upload your CV
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
        </Pressable>
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
  meta: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 14,
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
  manualLink: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
  },
  manualLinkText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
