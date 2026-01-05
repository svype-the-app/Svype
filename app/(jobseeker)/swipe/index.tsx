import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function SwipeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Card>
          <CardContent>
            <Text style={[styles.title, { color: colors.cardForeground }]}>
              Swipe Jobs
            </Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              Main swipe interface for job matching
            </Text>
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
