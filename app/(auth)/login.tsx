import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemedModal, type ThemedAlertConfig } from '@/components/ui/themed-modal';
import { Colors } from '@/constants/theme';
import { clearCachedData, prefetchForUser } from '@/lib/query-client';
import { authApi } from '@/services/api';
import { getRouteForUserState } from '@/services/routing';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertConfig, setAlertConfig] = useState<ThemedAlertConfig | null>(null);

  const handleLogin = async () => {
    // Validate fields
    if (!email || !password) {
      setAlertConfig({
        title: 'Missing Fields',
        message: 'Please enter your email and password',
        buttons: [{ label: 'OK' }],
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call login API
      const response = await authApi.login(email, password);

      // Drop any cached data from a previously signed-in account, then force a
      // fresh fetch from the database for THIS user's home tabs. Clearing first
      // guarantees no flash of the previous user's data; `force` guarantees the
      // new account's data is loaded from the DB rather than any stale cache.
      clearCachedData();
      prefetchForUser(response.user, { force: true });

      // Route based on user state so users in profile_preview / data_collection
      // land on the correct screen rather than being dropped into the swipe feed.
      const route = getRouteForUserState(response.user);
      router.replace(route as any);
    } catch (error: any) {
      // Handle errors
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.error) {
        errorMessage = error.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAlertConfig({ title: 'Login Failed', message: errorMessage, buttons: [{ label: 'OK' }] });
    } finally {
      setIsLoading(false);
    }
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
            Find jobs or hire talent, one swipe at a time.
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
                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={[styles.forgotPassword, { color: colors.primary }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passwordInputContainer}>
                <Input
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                  style={styles.passwordInput}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={22} 
                    color={colors.mutedForeground} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <Button size="lg" onPress={handleLogin} style={styles.loginButton} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                'Login'
              )}
            </Button>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={[styles.signUpText, { color: colors.foreground }]}>
                Don&apos;t have an account?{' '}
              </Text>
              <Link href="/sign-up" asChild>
                <TouchableOpacity>
                  <Text style={[styles.signUpLink, { color: colors.primary }]}>Sign up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </CardContent>
        </Card>
      </View>

      <ThemedModal
        visible={!!alertConfig}
        title={alertConfig?.title ?? ''}
        message={alertConfig?.message ?? ''}
        buttons={alertConfig?.buttons ?? []}
        onRequestClose={() => setAlertConfig(null)}
      />
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
  field: {
    marginBottom: 24,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
});
