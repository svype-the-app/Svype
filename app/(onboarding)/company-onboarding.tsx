import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Colors } from '@/constants/theme';
import { authApi, companyApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function CompanyOnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    website: '',
    description: '',
  });
  const [serverCompletion, setServerCompletion] = useState<number | null>(null);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const me = await authApi.getMe();
        const company = me.company;

        setFormData({
          location: company?.location || '',
          website: company?.website || '',
          description: company?.description || '',
        });
        setServerCompletion(company?.completion?.percentage ?? null);
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, []);

  const localCompletion = useMemo(() => {
    // base 40% (name + email from signup), remaining 60% here
    let total = 40;
    if (formData.location.trim()) total += 20;
    if (formData.website.trim()) total += 15;
    if (formData.description.trim()) total += 25;
    return Math.min(total, 100);
  }, [formData]);

  const completionPercentage = serverCompletion ?? localCompletion;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const goToProfile = async () => {
    try {
      await authApi.updateState('active');
    } catch {
      // ignore if already active
    }
    router.replace('/(company)/profile');
  };

  const handleSkip = async () => {
    if (saving) return;
    await goToProfile();
  };

  const handleCompleteSetup = async () => {
    if (saving) return;
    setSaving(true);

    try {
      await companyApi.updateMyCompany({
        location: formData.location.trim(),
        website: formData.website.trim(),
        description: formData.description.trim(),
      });

      await goToProfile();
    } catch (error: any) {
      Alert.alert('Setup Failed', error?.message || 'Could not save company profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.title, { color: colors.cardForeground }]}>
              Company Setup
            </Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              Complete your company profile to improve trust and candidate quality.
            </Text>

            <View style={styles.completionWrapper}>
              <View style={styles.completionHeader}>
                <Text style={[styles.completionTitle, { color: colors.foreground }]}>Account Completion</Text>
                <Text style={[styles.completionPercent, { color: colors.primary }]}>{completionPercentage}%</Text>
              </View>
              <Progress value={completionPercentage} />
            </View>

            <View style={styles.field}>
              <Label>Location (optional)</Label>
              <Input
                placeholder="London, UK"
                value={formData.location}
                onChangeText={(value) => handleChange('location', value)}
              />
            </View>

            <View style={styles.field}>
              <Label>Website (optional)</Label>
              <Input
                placeholder="https://company.com"
                autoCapitalize="none"
                keyboardType="url"
                value={formData.website}
                onChangeText={(value) => handleChange('website', value)}
              />
            </View>

            <View style={styles.field}>
              <Label>Company Description (optional)</Label>
              <Textarea
                placeholder="Tell candidates about your company, mission, and culture..."
                rows={4}
                value={formData.description}
                onChangeText={(value) => handleChange('description', value)}
              />
            </View>

            <Button onPress={handleCompleteSetup} disabled={saving}>
              {saving ? 'Saving...' : 'Complete Setup'}
            </Button>

            <Button variant="outline" onPress={handleSkip} disabled={saving}>
              Skip for now
            </Button>
          </CardContent>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  cardContent: {
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
  },
  completionWrapper: {
    gap: 8,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  completionPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  field: {
    gap: 6,
  },
});
