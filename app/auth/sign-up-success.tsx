import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';

export default function SignUpSuccessScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.muted }]}>
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
              Welcome to SVYPE!
            </Text>

            {/* Description */}
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              Your account has been created. Let&apos;s build your profile with our AI assistant.
            </Text>

            {/* Start Onboarding Button */}
            <Button 
              size="lg" 
              onPress={() => router.push('/modal')}
              style={styles.startButton}
            >
              Start AI Onboarding
            </Button>

            {/* Skip Button */}
            <Button 
              variant="outline"
              onPress={() => router.push('/modal')}
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
  skipButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  skipButtonText: {
    fontSize: 14,
  },
});
