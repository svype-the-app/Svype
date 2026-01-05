import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.title, { color: colors.cardForeground }]}>
              Profile
            </Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              Manage your profile and settings
            </Text>
            <Button onPress={() => router.push('/(jobseeker)/profile/edit')}>
              Edit Profile
            </Button>
            <Button variant="outline" onPress={() => router.push('/(jobseeker)/profile/settings')}>
              Settings
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
  },
  cardContent: {
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
  },
});
