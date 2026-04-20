import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { authApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function SignUpSuccessScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { firstName } = useLocalSearchParams<{ firstName: string }>();
  const [onboardingRoute, setOnboardingRoute] = useState('/(onboarding)/onboarding-choice');
  const [isCompanyUser, setIsCompanyUser] = useState(false);

  useEffect(() => {
    const resolveRoute = async () => {
      const storedUser = await authApi.getStoredUser();
      if (storedUser?.user_type === 'company') {
        setIsCompanyUser(true);
        setOnboardingRoute('/(onboarding)/company-onboarding');
      }
    };

    resolveRoute();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.appTitle, { color: colors.primary }]}>SVYPE</Text>
        </View>

        <Card>
          <CardContent style={styles.cardContent}>
            {/* Success Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.cardForeground }]}>
              Welcome to SVYPE{firstName ? `, ${firstName}` : ''}!
            </Text>

            {/* Description */}
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              Your account has been created. Let&apos;s build your profile with our AI assistant.
            </Text>

            {/* Start Onboarding Button */}
            <Button 
              size="lg" 
              onPress={() => router.push(onboardingRoute as any)}
              style={styles.startButton}
            >
              {isCompanyUser ? 'Start Onboarding' : 'Manual Onboarding'}
            </Button>

            {!isCompanyUser && (
              <Button
                size="lg"
                onPress={() => router.push('/(onboarding)/job-seeker-onboarding' as any)}
                style={styles.aiOnboardingButton}
              >
                AI Onboarding
              </Button>
            )}

            {/* Skip Button */}
            <Button 
              variant="outline"
              onPress={() => router.push('/(onboarding)/onboarding-choice' as any)}
              style={styles.skipButton}
            >
              <Text style={[styles.skipButtonText, { color: colors.mutedForeground }]}>
                Skip for now
              </Text>
            </Button>
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
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
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
  cardContent: {
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  iconContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  startButton: {
    width: '100%',
  },
  aiOnboardingButton: {
    width: '100%',
    backgroundColor: '#7c3aed',
  },
  skipButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  skipButtonText: {
    fontSize: 14,
  },
});
