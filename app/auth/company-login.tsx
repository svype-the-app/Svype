import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Colors } from '@/constants/theme';

export default function CompanyLoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    // Simulate login
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Welcome back!',
        'Successfully logged in to your company account.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)'), // Navigate to dashboard
          },
        ]
      );
    }, 1000);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>
        <Card>
          <CardContent style={styles.cardContent}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="briefcase" size={32} color="#10b981" />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.cardForeground }]}>
              Company Login
            </Text>

            {/* Description */}
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              Access your company dashboard and manage job postings
            </Text>

            {/* Form */}
            <View style={styles.form}>
              {/* Email */}
              <View style={styles.field}>
                <Label>Company Email</Label>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="mail" size={20} color={colors.mutedForeground} />
                  </View>
                  <Input
                    placeholder="company@example.com"
                    value={formData.email}
                    onChangeText={(value) => handleChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.inputWithIcon}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.field}>
                <Label>Password</Label>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="lock-closed" size={20} color={colors.mutedForeground} />
                  </View>
                  <Input
                    placeholder="••••••••"
                    value={formData.password}
                    onChangeText={(value) => handleChange('password', value)}
                    secureTextEntry
                    style={styles.inputWithIcon}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <Button
                size="lg"
                onPress={handleSubmit}
                disabled={loading}
                style={styles.button}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" />
                    <Text style={[styles.buttonText, { color: '#fff' }]}>Signing in...</Text>
                  </View>
                ) : (
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Sign In</Text>
                )}
              </Button>

              {/* Sign Up Link */}
              <View style={styles.linkContainer}>
                <Text style={[styles.linkText, { color: colors.mutedForeground }]}>
                  Don&apos;t have an account?{' '}
                </Text>
                <Link href="/auth/company-sign-up" style={[styles.link, { color: colors.primary }]}>
                  Register your company
                </Link>
              </View>

              {/* Job Seeker Link */}
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <Link href="/auth/login" style={[styles.footerLink, { color: colors.mutedForeground }]}>
                  ← Back to job seeker login
                </Link>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  cardContent: {
    padding: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 14,
    zIndex: 1,
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
  button: {
    width: '100%',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 14,
  },
});
