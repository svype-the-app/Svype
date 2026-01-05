import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function OnboardingChoiceScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>Choose Your Path</Text>
        
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>
              AI-Guided Setup
            </Text>
            <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
              Chat with our AI to build your profile naturally
            </Text>
            <Button onPress={() => router.push('/(jobseeker)/chat' as any)}>
              Chat with AI
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>
              Upload CV
            </Text>
            <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
              Let AI extract information from your resume
            </Text>
            <Button onPress={() => router.push('/(onboarding)/upload-cv')}>
              Upload Resume
            </Button>
          </CardContent>
        </Card>

        <Button variant="outline" onPress={() => router.push('/(jobseeker)/swipe' as any)}>
          Skip for now
        </Button>
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
    marginBottom: 16,
  },
  cardContent: {
    gap: 12,
    alignItems: 'center',
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
