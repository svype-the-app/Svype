import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
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
                placeholder="TechCorp Inc."
                autoCapitalize="words"
                value={formData.companyName}
                onChangeText={(value) => handleChange('companyName', value)}
              />
            </View>

            {/* Email Field */}
            <View style={styles.field}>
              <Label>Company Email</Label>
              <Input
                placeholder="hr@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
              />
            </View>

            {/* Website */}
            <View style={styles.field}>
              <Label>Website</Label>
              <Input
                placeholder="https://company.com"
                autoCapitalize="none"
                value={formData.website}
                onChangeText={(value) => handleChange('website', value)}
              />
            </View>

            {/* Location */}
            <View style={styles.field}>
              <Label>Location</Label>
              <Input
                placeholder="London, UK"
                value={formData.location}
                onChangeText={(value) => handleChange('location', value)}
              />
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

            {/* Password Field */}
            <View style={styles.field}>
              <Label>Password</Label>
              <Input
                placeholder="Min. 8 characters"
                secureTextEntry
                value={formData.password}
                onChangeText={(value) => handleChange('password', value)}
              />
            </View>

            {/* Submit Button */}
            <Button 
              size="lg" 
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.signUpButton, loading && { opacity: 0.5 }]}
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
              <Link href="/(auth)/company-login" asChild>
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
                    Register as a job seeker instead →
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
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
    gap: 8,
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
