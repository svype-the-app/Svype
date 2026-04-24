import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function UserTypeSelectionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>Welcome to SVYPE!</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Choose how you&apos;d like to continue
        </Text>

        <Card>
          <CardContent style={styles.cardContent}>
            <Ionicons name="person" size={48} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Job Seeker</Text>
            <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
              Find your dream job with AI-powered matching
            </Text>
            <Button onPress={() => router.push('/(onboarding)/onboarding-choice')}>
              Continue as Job Seeker
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={styles.cardContent}>
            <Ionicons name="business" size={48} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Company</Text>
            <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
              Post jobs and find talented candidates
            </Text>
            <Button onPress={() => router.push('/(company)/profile/profile-preview?mode=onboarding' as any)}>
              Continue as Company
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
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  cardContent: {
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
});
