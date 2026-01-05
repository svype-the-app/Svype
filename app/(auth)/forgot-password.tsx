import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Card>
            <CardContent style={styles.cardContent}>
              {/* Success Icon */}
              <View style={[styles.successIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="checkmark-circle" size={32} color="#10b981" />
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.cardForeground }]}>
                Check Your Email
              </Text>

              {/* Description */}
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                We&apos;ve sent a password reset link to{' '}
                <Text style={{ fontWeight: '600' }}>{email}</Text>
              </Text>

              {/* Info Text */}
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Click the link in the email to reset your password. The link will expire in 24 hours.
              </Text>

              {/* Back to Login Button */}
              <Button 
                size="lg" 
                onPress={() => router.push('/(auth)/login')}
                style={styles.button}
              >
                Back to Login
              </Button>

              {/* Resend Link */}
              <TouchableOpacity 
                onPress={() => setIsSubmitted(false)}
                style={styles.resendButton}
              >
                <Text style={[styles.resendText, { color: colors.mutedForeground }]}>
                  Didn&apos;t receive the email? Resend
                </Text>
              </TouchableOpacity>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>
        <Card>
          <CardContent style={styles.cardContent}>
            {/* Back Button */}
            <TouchableOpacity 
              onPress={() => router.push('/(auth)/login')}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color={colors.foreground} />
              <Text style={[styles.backButtonText, { color: colors.foreground }]}>
                Back to Login
              </Text>
            </TouchableOpacity>

            {/* Title */}
            <Text style={[styles.title, { color: colors.cardForeground }]}>
              Forgot Password?
            </Text>

            {/* Description */}
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </Text>

            {/* Email Field */}
            <View style={styles.field}>
              <Label>Email Address</Label>
              <View style={styles.inputContainer}>
                <Ionicons 
                  name="mail-outline" 
                  size={16} 
                  color={colors.mutedForeground}
                  style={styles.inputIcon}
                />
                <Input
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.inputWithIcon}
                />
              </View>
            </View>

            {/* Submit Button */}
            <Button 
              size="lg" 
              onPress={handleSubmit}
              style={styles.button}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.primaryForeground} />
                  <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                    Sending...
                  </Text>
                </View>
              ) : (
                'Send Reset Link'
              )}
            </Button>
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
  cardContent: {
    padding: 24,
    gap: 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginLeft: -8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  field: {
    marginBottom: 24,
  },
  inputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
  button: {
    width: '100%',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  resendButton: {
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
