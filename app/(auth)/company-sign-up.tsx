import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function CompanySignUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Create refs for each input field
  const companyNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const websiteRef = useRef<TextInput>(null);
  const locationRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    website: '',
    location: '',
    description: '',
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.companyName || !formData.email || !formData.password || !formData.confirmPassword || !formData.location || !formData.description) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service to continue');
      return;
    }

    setLoading(true);

    // Simulate registration
    setTimeout(() => {
      setLoading(false);
      router.push('/(onboarding)/company-onboarding');
    }, 1500);
  };

  // TODO: Temporary bypass - Click on "Terms of Service" text to skip form filling during development
  const handleTermsClick = () => {
    router.push('/(onboarding)/company-onboarding');
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
            Hire top talent, simplified. Build your dream team.
          </Text>
        </View>

        <Card>
          <CardContent style={styles.cardContent}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Register Company</Text>
              <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                Post jobs and find talented candidates
              </Text>
            </View>

            {/* Company Name */}
            <View style={styles.field}>
              <Label>Company Name</Label>
              <Input
                ref={companyNameRef}
                placeholder="TechCorp Inc."
                autoCapitalize="words"
                returnKeyType="next"
                value={formData.companyName}
                onChangeText={(value) => handleChange('companyName', value)}
                onSubmitEditing={() => {
                  emailRef.current?.focus();
                  scrollToField(emailRef);
                }}
              />
            </View>

            {/* Email Field */}
            <View style={styles.field}>
              <Label>Company Email</Label>
              <Input
                ref={emailRef}
                placeholder="hr@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                onSubmitEditing={() => {
                  websiteRef.current?.focus();
                  scrollToField(websiteRef);
                }}
              />
            </View>

            {/* Website */}
            <View style={styles.field}>
              <Label>Website</Label>
              <Input
                ref={websiteRef}
                placeholder="https://company.com"
                autoCapitalize="none"
                returnKeyType="next"
                value={formData.website}
                onChangeText={(value) => handleChange('website', value)}
                onSubmitEditing={() => {
                  locationRef.current?.focus();
                  scrollToField(locationRef);
                }}
              />
            </View>

            {/* Location */}
            <View style={styles.field}>
              <Label>Location</Label>
              <Input
                ref={locationRef}
                placeholder="London, UK"
                returnKeyType="next"
                value={formData.location}
                onChangeText={(value) => handleChange('location', value)}
                onSubmitEditing={() => {
                  descriptionRef.current?.focus();
                  scrollToField(descriptionRef);
                }}
              />
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Label>Company Description</Label>
              <Textarea
                ref={descriptionRef}
                placeholder="Tell candidates about your company..."
                value={formData.description}
                onChangeText={(value) => handleChange('description', value.replace(/\n/g, ''))}
                rows={2}
                returnKeyType="next"
                blurOnSubmit={false}
                multiline={false}
                onSubmitEditing={() => {
                  passwordRef.current?.focus();
                  scrollToField(passwordRef);
                }}
              />
            </View>

            {/* Password Field */}
            <View style={styles.field}>
              <Label>Password</Label>
              <Input
                ref={passwordRef}
                placeholder="Min. 8 characters"
                secureTextEntry
                returnKeyType="next"
                value={formData.password}
                onChangeText={(value) => handleChange('password', value)}
                onSubmitEditing={() => {
                  confirmPasswordRef.current?.focus();
                  scrollToField(confirmPasswordRef);
                }}
              />
            </View>

            {/* Confirm Password Field */}
            <View style={styles.field}>
              <Label>Confirm Password</Label>
              <Input
                ref={confirmPasswordRef}
                placeholder="Re-enter your password"
                secureTextEntry
                returnKeyType="done"
                value={formData.confirmPassword}
                onChangeText={(value) => handleChange('confirmPassword', value)}
              />
            </View>

            {/* Terms Checkbox */}
            <View style={styles.termsContainer}>
              <Checkbox
                checked={agreedToTerms}
                onCheckedChange={setAgreedToTerms}
              />
              <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
                I agree to the{' '}
                <Text 
                  style={[styles.termsLink, { color: colors.primary }]}
                  onPress={handleTermsClick}
                >
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text style={[styles.termsLink, { color: colors.primary }]}>Privacy Policy</Text>
              </Text>
            </View>

            {/* Submit Button */}
            <Button 
              size="lg" 
              onPress={handleSubmit}
              disabled={loading || !agreedToTerms}
              style={[styles.signUpButton, (loading || !agreedToTerms) && { opacity: 0.5 }]}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" />
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Creating account...</Text>
                </View>
              ) : (
                'Create Account'
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

            {/* Job Seeker Link */}
            <View style={[styles.jobSeekerContainer, { borderTopColor: colors.border }]}>
              <Link href="/(auth)/sign-up" asChild>
                <TouchableOpacity>
                  <Text style={[styles.jobSeekerText, { color: colors.mutedForeground }]}>
                    Sign up as a job seeker instead →
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
  field: {
    marginBottom: 16,
    gap: 2,
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
    marginTop: 24,
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
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
  },
  jobSeekerContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  jobSeekerText: {
    fontSize: 14,
  },
});
