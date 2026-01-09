import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function WelcomeChoiceScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.cardForeground }]}>
              Welcome to Svype! 🎉
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Choose how you&rsquo;d like to get started
            </Text>
          </View>

          {/* Option 1: Upload CV */}
          <Card style={styles.card}>
            <CardContent>
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '1A' }]}>
                  <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                </View>
                
                <View style={styles.textContent}>
                  <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>
                    Upload Your CV
                  </Text>
                  <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                    Quick and simple. Upload your resume and start swiping immediately.
                  </Text>
                  <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                      <Text style={[styles.checkmark, { color: colors.mutedForeground }]}>✓</Text>
                      <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                        Apply to multiple jobs
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={[styles.checkmark, { color: colors.mutedForeground }]}>✓</Text>
                      <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                        Start right away
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                      <Text style={[styles.featureTextPrimary, { color: colors.primary }]}>
                        Free forever
                      </Text>
                    </View>
                  </View>
                </View>

                <Button 
                  onPress={() => router.push('/(onboarding)/upload-cv')}
                  style={styles.uploadButton}
                >
                  <Text style={styles.uploadButtonText}>Upload</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </Button>
              </View>
            </CardContent>
          </Card>

          {/* Option 2: AI-Powered Premium */}
          <Card style={[styles.card, styles.premiumCard, { borderColor: colors.primary + '80' }]}>
            <View style={[styles.premiumBadge, { backgroundColor: colors.card }]}>
              <Badge 
                style={{ ...styles.badge, backgroundColor: '#f59e0b' }}
              >
                <Ionicons name="trophy" size={12} color="#fff" />
                <Text style={styles.badgeText}>Premium</Text>
              </Badge>
            </View>
            
            <CardContent>
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, styles.premiumIconContainer, { backgroundColor: colors.primary }]}>
                  <Ionicons name="sparkles" size={24} color="#fff" />
                </View>
                
                <View style={styles.textContent}>
                  <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>
                    AI Career Assistant
                  </Text>
                  <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                    Get personalized CVs and cover letters for every job you apply to.
                  </Text>
                  <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                      <Text style={[styles.checkmark, { color: colors.mutedForeground }]}>✓</Text>
                      <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                        Tailored applications
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={[styles.checkmark, { color: colors.mutedForeground }]}>✓</Text>
                      <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                        Custom cover letters
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={[styles.checkmark, { color: colors.mutedForeground }]}>✓</Text>
                      <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                        AI coaching
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                      <Text style={[styles.featureTextPrimary, { color: colors.primary }]}>
                        3x success rate
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.pricingText, { color: colors.mutedForeground }]}>
                    7-day free trial, then £9.99/month
                  </Text>
                </View>

                <Button 
                  onPress={() => router.push('/(account)/premium-onboarding' as any)}
                  style={[styles.premiumButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.premiumButtonText}>Start</Text>
                  <Ionicons name="sparkles" size={16} color="#fff" />
                </Button>
              </View>
            </CardContent>
          </Card>

          {/* Skip Option */}
          <View style={styles.skipContainer}>
            <Button 
              variant="outline"
              onPress={() => router.push('/(jobseeker)/swipe')}
              style={styles.skipButton}
            >
              <Text style={[styles.skipButtonText, { color: colors.mutedForeground }]}>
                Skip for now
              </Text>
            </Button>
          </View>
        </View>
      </ScrollView>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  content: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    gap: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    marginBottom: 0,
  },
  premiumCard: {
    borderWidth: 2,
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    borderRadius: 12,
    padding: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  cardContent: {
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumIconContainer: {
    // gradient effect simulated with solid color
  },
  textContent: {
    gap: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  featuresList: {
    gap: 6,
    marginTop: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 12,
  },
  featureTextPrimary: {
    fontSize: 12,
    fontWeight: '600',
  },
  pricingText: {
    fontSize: 11,
    marginTop: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  premiumButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  skipContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 14,
  },
});
