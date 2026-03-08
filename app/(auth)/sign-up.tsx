import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Colors } from '@/constants/theme';
import { authApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View, ActivityIndicator } from 'react-native';

export default function SignUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Create refs for each input field
  const fullNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToField = (ref: any) => {
    setTimeout(() => {
      ref?.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
        // Get the position where we want to scroll
        // We want the field to be positioned such that keyboard appears exactly below it
        // Approximately 80px from the bottom of visible area (accounting for keyboard height ~250-300px)
        const scrollPosition = y - 80;
        
        scrollViewRef?.current?.scrollTo({
          y: scrollPosition > 0 ? scrollPosition : 0,
          animated: true,
        });
      });
    }, 100);
  };

  const handleSignUp = async () => {
    // Validate all fields are filled
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    // Check password length
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters');
      return;
    }

    // Check if terms are agreed
    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service to continue');
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the API to register the user
      const response = await authApi.register({
        email,
        username: fullName.replace(/\s+/g, '_').toLowerCase(), // Convert name to username
        password,
        password_confirm: confirmPassword,
        user_type: 'jobseeker', // Default to jobseeker
        full_name: fullName, // Send full name to be split into first/last name
      });
      
      // Success - navigate to success screen with user data
      router.push({
        pathname: '/(auth)/sign-up-success',
        params: { firstName: response.user.first_name }
      });
    } catch (error: any) {
      // Handle API errors
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.errors) {
        // Format validation errors
        const errors = error.errors;
        if (errors.email) {
          errorMessage = errors.email[0];
        } else if (errors.username) {
          errorMessage = errors.username[0];
        } else if (errors.password) {
          errorMessage = errors.password[0];
        } else if (errors.non_field_errors) {
          errorMessage = errors.non_field_errors[0];
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignUp = (provider: string) => {
    // For prototype: Simulate OAuth and go directly to AI onboarding
    console.log(`OAuth sign up with ${provider}`);
    router.push('/(auth)/sign-up-success');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={true}
        >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.appTitle, { color: colors.primary }]}>SVYPE</Text>
          <Text style={[styles.appSubtitle, { color: colors.mutedForeground }]}>
            Join thousands finding their dream jobs.
          </Text>
        </View>

        <Card>
          <CardContent style={styles.cardContent}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Create Account</Text>
              <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                Get started with your dream career
              </Text>
            </View>

            {/* Full Name Field */}
            <View style={styles.field}>
              <Label>Full Name</Label>
              <Input
                ref={fullNameRef}
                placeholder="John Doe"
                autoCapitalize="words"
                returnKeyType="next"
                value={fullName}
                onChangeText={setFullName}
                onSubmitEditing={() => {
                  emailRef.current?.focus();
                  scrollToField(emailRef);
                }}
              />
            </View>

            {/* Email Field */}
            <View style={styles.field}>
              <Label>Email</Label>
              <Input
                ref={emailRef}
                placeholder="m@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={() => {
                  passwordRef.current?.focus();
                  scrollToField(passwordRef);
                }}
              />
            </View>

            {/* Password Field */}
            <View style={styles.field}>
              <Label>Password</Label>
              <View style={styles.passwordInputContainer}>
                <Input
                  ref={passwordRef}
                  placeholder="Min. 8 characters"
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={() => {
                    confirmPasswordRef.current?.focus();
                    scrollToField(confirmPasswordRef);
                  }}
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

            {/* Confirm Password Field */}
            <View style={styles.field}>
              <Label>Confirm Password</Label>
              <View style={styles.passwordInputContainer}>
                <Input
                  ref={confirmPasswordRef}
                  placeholder="Re-enter your password"
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="done"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.passwordInput}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-off' : 'eye'} 
                    size={22} 
                    color={colors.mutedForeground} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms Checkbox */}
            <View style={styles.termsContainer}>
              <Checkbox
                checked={agreedToTerms}
                onCheckedChange={setAgreedToTerms}
              />
              <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
                I agree to the{' '}
                <Text style={[styles.termsLink, { color: colors.primary }]}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={[styles.termsLink, { color: colors.primary }]}>Privacy Policy</Text>
              </Text>
            </View>

            {/* Sign Up Button */}
            <Button 
              size="lg" 
              onPress={handleSignUp}
              disabled={!agreedToTerms || isLoading}
              style={[styles.signUpButton, (!agreedToTerms || isLoading) && { opacity: 0.5 }]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                'Sign Up'
              )}
            </Button>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.foreground }]}>
                Already have an account?{' '}
              </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={[styles.loginLink, { color: colors.primary }]}>Login</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Company Sign Up Link */}
            <View style={[styles.companySignUpContainer, { borderTopColor: colors.border }]}>
              <Link href="/(auth)/company-sign-up" asChild>
                <TouchableOpacity>
                  <Text style={[styles.companySignUpText, { color: colors.mutedForeground }]}>
                    Register as a company instead →
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </CardContent>
        </Card>
      </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    marginBottom: 16,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
  signUpButton: {
    width: '100%',
    marginBottom: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  companySignUpContainer: {
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  companySignUpText: {
    fontSize: 14,
  },
});
