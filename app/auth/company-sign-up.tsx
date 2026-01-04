import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Colors } from '@/constants/theme';

export default function CompanySignUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    website: '',
    location: '',
    description: '',
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.companyName || !formData.email || !formData.password || !formData.location || !formData.description) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    // Simulate registration
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Company Registered!',
        'Your company account has been created successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)'), // Navigate to dashboard/home
          },
        ]
      );
    }, 1500);
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
              Register Your Company
            </Text>

            {/* Description */}
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              Create an account to post jobs and find talented candidates
            </Text>

            {/* Form */}
            <View style={styles.form}>
              {/* Company Name */}
              <View style={styles.field}>
                <Label>Company Name</Label>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="business" size={20} color={colors.mutedForeground} />
                  </View>
                  <Input
                    placeholder="TechCorp Inc."
                    value={formData.companyName}
                    onChangeText={(value) => handleChange('companyName', value)}
                    style={styles.inputWithIcon}
                  />
                </View>
              </View>

              {/* Company Email */}
              <View style={styles.field}>
                <Label>Company Email</Label>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="mail" size={20} color={colors.mutedForeground} />
                  </View>
                  <Input
                    placeholder="hr@company.com"
                    value={formData.email}
                    onChangeText={(value) => handleChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.inputWithIcon}
                  />
                </View>
              </View>

              {/* Website */}
              <View style={styles.field}>
                <Label>Website</Label>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="globe" size={20} color={colors.mutedForeground} />
                  </View>
                  <Input
                    placeholder="https://company.com"
                    value={formData.website}
                    onChangeText={(value) => handleChange('website', value)}
                    keyboardType="url"
                    autoCapitalize="none"
                    style={styles.inputWithIcon}
                  />
                </View>
              </View>

              {/* Location */}
              <View style={styles.field}>
                <Label>Location</Label>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="location" size={20} color={colors.mutedForeground} />
                  </View>
                  <Input
                    placeholder="London, UK"
                    value={formData.location}
                    onChangeText={(value) => handleChange('location', value)}
                    style={styles.inputWithIcon}
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.field}>
                <Label>Company Description</Label>
                <Textarea
                  placeholder="Tell candidates about your company..."
                  value={formData.description}
                  onChangeText={(value) => handleChange('description', value)}
                  rows={3}
                />
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
                    <Text style={[styles.buttonText, { color: '#fff' }]}>Creating account...</Text>
                  </View>
                ) : (
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Create Company Account</Text>
                )}
              </Button>

              {/* Sign In Link */}
              <View style={styles.linkContainer}>
                <Text style={[styles.linkText, { color: colors.mutedForeground }]}>
                  Already have an account?{' '}
                </Text>
                <Link href="/auth/company-login" style={[styles.link, { color: colors.primary }]}>
                  Sign in
                </Link>
              </View>

              {/* Job Seeker Link */}
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <Link href="/auth/sign-up" style={[styles.footerLink, { color: colors.mutedForeground }]}>
                  ← Register as a job seeker instead
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
    maxWidth: 800,
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
