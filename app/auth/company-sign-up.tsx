import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/button';
import { useRouter } from 'expo-router';

export default function CompanySignUpScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Company Sign Up</Text>
        <Text style={styles.subtitle}>Create your company account to start hiring talent</Text>
        
        <View style={styles.form}>
          <Text style={styles.placeholder}>Company sign up form will go here</Text>
        </View>

        <Button onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  placeholder: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 48,
  },
});
