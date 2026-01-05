import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function JobSeekerOnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.title, { color: colors.cardForeground }]}>
              AI Career Coach Onboarding
            </Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              Let our AI assistant help you build your profile through a conversation.
            </Text>
            <Button onPress={() => router.push('/(onboarding)/onboarding-choice')}>
              Start AI Onboarding
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
  },
  cardContent: {
    gap: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
  },
});
