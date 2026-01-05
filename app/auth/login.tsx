import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // For prototype: Accept any credentials and go directly to swipe page
    // TODO: Navigate to swipe page once created
    router.push('/modal');
  };

  const handleOAuthLogin = (provider: string) => {
    // For prototype: Simulate OAuth login
    console.log(`OAuth login with ${provider}`);
    // TODO: Navigate to swipe page once created
    router.push('/modal');
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.appTitle, { color: colors.primary }]}>SVYPE</Text>
          <Text style={[styles.appSubtitle, { color: colors.mutedForeground }]}>
            Find your next career move, one swipe at a time.
          </Text>
        </View>

        <Card>
          <CardContent style={styles.cardContent}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Login</Text>
              <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                Enter your email below to login to your account
              </Text>
            </View>

            {/* OAuth Buttons */}
            <View style={styles.oauthContainer}>
              <Button
                variant="outline"
                onPress={() => handleOAuthLogin('linkedin')}
                style={styles.oauthButton}
              >
                <Ionicons name="logo-linkedin" size={16} color={colors.foreground} />
                <Text style={[styles.oauthButtonText, { color: colors.foreground }]}>LinkedIn</Text>
              </Button>
              <Button
                variant="outline"
                onPress={() => handleOAuthLogin('github')}
                style={styles.oauthButton}
              >
                <Ionicons name="logo-github" size={16} color={colors.foreground} />
                <Text style={[styles.oauthButtonText, { color: colors.foreground }]}>GitHub</Text>
              </Button>
            </View>

            {/* Separator */}
            <View style={styles.separatorContainer}>
              <Separator />
              <View style={[styles.separatorTextContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.separatorText, { color: colors.mutedForeground }]}>
                  Or continue with email
                </Text>
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.field}>
              <Label>Email</Label>
              <Input
                placeholder="m@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Field */}
            <View style={styles.field}>
              <View style={styles.passwordHeader}>
                <Label>Password</Label>
                <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
                  <Text style={[styles.forgotPassword, { color: colors.primary }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>
              <Input
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Login Button */}
            <Button size="lg" onPress={handleLogin} style={styles.loginButton}>
              Login
            </Button>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={[styles.signUpText, { color: colors.foreground }]}>
                Don&apos;t have an account?{' '}
              </Text>
              <Link href="/auth/sign-up" asChild>
                <TouchableOpacity>
                  <Text style={[styles.signUpLink, { color: colors.primary }]}>Sign up</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Company Login Link */}
            <View style={[styles.companyLoginContainer, { borderTopColor: colors.border }]}>
              <Link href="/auth/company-login" asChild>
                <TouchableOpacity>
                  <Text style={[styles.companyLoginText, { color: colors.mutedForeground }]}>
                    Are you a company? Login here →
                  </Text>
                </TouchableOpacity>
              </Link>
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
    marginBottom: 8,
    letterSpacing: -1,
  },
  appSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  cardContent: {
    gap: 0,
    padding: 24,
  },
  cardHeader: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
  },
  oauthContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  oauthButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
  },
  oauthButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  separatorContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  separatorTextContainer: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -80 }],
    paddingHorizontal: 8,
  },
  separatorText: {
    fontSize: 12,
  },
  field: {
    marginBottom: 24,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    fontSize: 12,
    fontWeight: '600',
  },
  loginButton: {
    width: '100%',
    marginBottom: 16,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  companyLoginContainer: {
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  companyLoginText: {
    fontSize: 14,
  },
});
