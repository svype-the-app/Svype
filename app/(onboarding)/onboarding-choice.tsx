import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type ImportStatus = 'idle' | 'loading' | 'success';

export default function OnboardingChoiceScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [linkedinStatus, setLinkedinStatus] = useState<ImportStatus>('idle');
  const [githubStatus, setGithubStatus] = useState<ImportStatus>('idle');

  const handleLinkedInImport = async () => {
    setLinkedinStatus('loading');
    // Simulate import
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLinkedinStatus('success');
  };

  const handleGithubImport = async () => {
    setGithubStatus('loading');
    // Simulate import
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGithubStatus('success');
  };

  const handleContinue = () => {
    router.push('/(onboarding)/upload-cv' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Import Your Data
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Speed up your profile by importing data from LinkedIn or GitHub (optional)
          </Text>
        </View>

        {/* Import Cards */}
        <View style={styles.cardsContainer}>
          {/* LinkedIn Card */}
          <Card>
            <CardContent style={styles.cardContent}>
              <View style={styles.cardRow}>
                <View style={[styles.iconContainer, { backgroundColor: '#0A66C2' + '1A' }]}>
                  <Ionicons name="logo-linkedin" size={24} color="#0A66C2" />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    Connect LinkedIn
                  </Text>
                  <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                    Import your work experience, education, and skills
                  </Text>
                  
                  {linkedinStatus === 'success' ? (
                    <View style={styles.successContainer}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={[styles.successText, { color: '#10b981' }]}>
                        Data imported successfully
                      </Text>
                    </View>
                  ) : (
                    <Button
                      variant="outline"
                      onPress={handleLinkedInImport}
                      disabled={linkedinStatus === 'loading'}
                      style={styles.importButton}
                    >
                      {linkedinStatus === 'loading' ? (
                        <View style={styles.buttonContent}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text style={[styles.buttonText, { color: colors.foreground }]}>
                            Importing...
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.buttonContent}>
                          <Ionicons name="logo-linkedin" size={16} color={colors.foreground} />
                          <Text style={[styles.buttonText, { color: colors.foreground }]}>
                            Connect LinkedIn
                          </Text>
                        </View>
                      )}
                    </Button>
                  )}
                  
                  {linkedinStatus === 'loading' && (
                    <View style={styles.loadingIndicator}>
                      <View style={[styles.loadingDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                        Fetching profile data...
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </CardContent>
          </Card>

          {/* GitHub Card */}
          <Card>
            <CardContent style={styles.cardContent}>
              <View style={styles.cardRow}>
                <View style={[styles.iconContainer, { backgroundColor: colors.muted }]}>
                  <Ionicons name="logo-github" size={24} color={colors.foreground} />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    Connect GitHub
                  </Text>
                  <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                    Showcase your projects, contributions, and technical skills
                  </Text>
                  
                  {githubStatus === 'success' ? (
                    <View style={styles.successContainer}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={[styles.successText, { color: '#10b981' }]}>
                        Data imported successfully
                      </Text>
                    </View>
                  ) : (
                    <Button
                      variant="outline"
                      onPress={handleGithubImport}
                      disabled={githubStatus === 'loading'}
                      style={styles.importButton}
                    >
                      {githubStatus === 'loading' ? (
                        <View style={styles.buttonContent}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text style={[styles.buttonText, { color: colors.foreground }]}>
                            Importing...
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.buttonContent}>
                          <Ionicons name="logo-github" size={16} color={colors.foreground} />
                          <Text style={[styles.buttonText, { color: colors.foreground }]}>
                            Connect GitHub
                          </Text>
                        </View>
                      )}
                    </Button>
                  )}
                  
                  {githubStatus === 'loading' && (
                    <View style={styles.loadingIndicator}>
                      <View style={[styles.loadingDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                        Analyzing repositories...
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.muted + '80' }]}>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            <Text style={{ fontWeight: '600', color: colors.foreground }}>Note: </Text>
            Your data is encrypted and only used to enhance your job applications. You can disconnect anytime from settings.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Button
          size="lg"
          onPress={handleContinue}
          style={styles.continueButton}
        >
          <View style={styles.buttonContent}>
            <Text style={[styles.continueButtonText, { color: colors.background }]}>Continue</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.background} />
          </View>
        </Button>
        <Pressable onPress={handleContinue}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
            Skip for now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  cardContent: {
    padding: 20,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  successText: {
    fontSize: 13,
    fontWeight: '500',
  },
  importButton: {
    marginTop: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  loadingText: {
    fontSize: 12,
  },
  infoBanner: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    gap: 12,
  },
  continueButton: {
    width: '100%',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
