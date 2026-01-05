import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function ResetAccountScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Card>
        <CardContent>
          <Text style={[styles.title, { color: colors.cardForeground }]}>
            Reset Account
          </Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            Reset your account settings and data
          </Text>
        </CardContent>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
