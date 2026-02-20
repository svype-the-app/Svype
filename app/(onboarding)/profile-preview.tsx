import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { mockProfilePreviewData } from '@/lib/mock-onboarding';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProfilePreviewScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Profile data from mock
  const profileData = mockProfilePreviewData;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Your Profile Preview
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
          Review your AI-generated profile
        </Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Card>
          <CardContent style={styles.cardContent}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.background }]}>
                  {getInitials(profileData.name)}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.name, { color: colors.foreground }]}>
                  {profileData.name}
                </Text>
                <Text style={[styles.headline, { color: colors.mutedForeground }]}>
                  {profileData.headline}
                </Text>
                <View style={styles.contactInfo}>
                  <View style={styles.contactItem}>
                    <Ionicons name="location" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.contactText, { color: colors.mutedForeground }]}>
                      {profileData.location}
                    </Text>
                  </View>
                  <View style={styles.contactItem}>
                    <Ionicons name="mail" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.contactText, { color: colors.mutedForeground }]}>
                      {profileData.email}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.border }]} />

            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                About
              </Text>
              <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>
                {profileData.summary}
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardContent style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Skills
              </Text>
              <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.badgeText, { color: colors.foreground }]}>
                  {profileData.skills.length} skills
                </Text>
              </View>
            </View>
            <View style={styles.skillsContainer}>
              {profileData.skills.map((skill, index) => (
                <View 
                  key={index} 
                  style={[styles.skillBadge, { 
                    backgroundColor: colors.background,
                    borderColor: colors.border 
                  }]}
                >
                  <Text style={[styles.skillText, { color: colors.foreground }]}>
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Experience */}
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Experience
            </Text>
            <View style={styles.experienceContainer}>
              {profileData.experience.map((exp, index) => (
                <View key={index} style={styles.experienceItem}>
                  <View style={styles.timelineContainer}>
                    <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                    {index !== profileData.experience.length - 1 && (
                      <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                    )}
                  </View>
                  <View style={styles.experienceContent}>
                    <Text style={[styles.experienceTitle, { color: colors.foreground }]}>
                      {exp.title}
                    </Text>
                    <Text style={[styles.experienceCompany, { color: colors.mutedForeground }]}>
                      {exp.company}
                    </Text>
                    <View style={styles.experienceMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                          {exp.period}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="location" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                          {exp.location}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.experienceDescription, { color: colors.mutedForeground }]}>
                      {exp.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Education
            </Text>
            <View style={styles.educationContainer}>
              {profileData.education.map((edu, index) => (
                <View key={index} style={styles.educationItem}>
                  <Text style={[styles.educationDegree, { color: colors.foreground }]}>
                    {edu.degree}
                  </Text>
                  <Text style={[styles.educationInstitution, { color: colors.mutedForeground }]}>
                    {edu.institution}
                  </Text>
                  <Text style={[styles.educationPeriod, { color: colors.mutedForeground }]}>
                    {edu.period}
                  </Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Job Preferences
            </Text>
            <View style={styles.preferencesContainer}>
              <View style={styles.preferenceItem}>
                <Ionicons name="briefcase-outline" size={20} color={colors.mutedForeground} />
                <View style={styles.preferenceContent}>
                  <Text style={[styles.preferenceLabel, { color: colors.foreground }]}>
                    Job Type
                  </Text>
                  <View style={styles.preferenceValues}>
                    {profileData.preferences.jobType.map((type, index) => (
                      <View 
                        key={index} 
                        style={[styles.preferenceBadge, { backgroundColor: colors.muted }]}
                      >
                        <Text style={[styles.preferenceBadgeText, { color: colors.foreground }]}>
                          {type}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.preferenceItem}>
                <Ionicons name="cash-outline" size={20} color={colors.mutedForeground} />
                <View style={styles.preferenceContent}>
                  <Text style={[styles.preferenceLabel, { color: colors.foreground }]}>
                    Salary Expectations
                  </Text>
                  <Text style={[styles.preferenceValue, { color: colors.mutedForeground }]}>
                    {profileData.preferences.salaryMin} - {profileData.preferences.salaryMax}
                  </Text>
                </View>
              </View>

              <View style={styles.preferenceItem}>
                <Ionicons name="location" size={20} color={colors.mutedForeground} />
                <View style={styles.preferenceContent}>
                  <Text style={[styles.preferenceLabel, { color: colors.foreground }]}>
                    Preferred Location
                  </Text>
                  <Text style={[styles.preferenceValue, { color: colors.mutedForeground }]}>
                    {profileData.preferences.location}
                  </Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* AI Generation Badge */}
        <View style={[styles.aiBanner, { 
          backgroundColor: colors.primary + '1A',
          borderColor: colors.primary + '33'
        }]}>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          <View style={styles.aiBannerContent}>
            <Text style={[styles.aiBannerTitle, { color: colors.foreground }]}>
              Profile Generated with AI
            </Text>
            <Text style={[styles.aiBannerText, { color: colors.mutedForeground }]}>
              We&apos;ve created your profile based on your responses and imported data. You can edit any section from your profile page.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { 
        backgroundColor: colors.card, 
        borderTopColor: colors.border 
      }]}>
        <Button
          variant="outline"
          onPress={() => router.push('/(jobseeker)/profile' as any)}
          style={styles.actionButton}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="create-outline" size={18} color={colors.foreground} />
            <Text style={[styles.buttonText, { color: colors.foreground }]}>
              Edit Profile
            </Text>
          </View>
        </Button>
        <Button
          onPress={() => router.push('/(jobseeker)/swipe' as any)}
          style={styles.actionButton}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="checkmark-circle" size={18} color={colors.background} />
            <Text style={[styles.buttonTextPrimary, { color: colors.background }]}>
              Start Swiping
            </Text>
          </View>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
    gap: 16,
  },
  cardContent: {
    padding: 20,
    gap: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
  },
  headline: {
    fontSize: 14,
  },
  contactInfo: {
    marginTop: 8,
    gap: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 13,
  },
  separator: {
    height: 1,
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  skillText: {
    fontSize: 13,
  },
  experienceContainer: {
    gap: 24,
    marginTop: 8,
  },
  experienceItem: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineContainer: {
    alignItems: 'center',
    width: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  experienceContent: {
    flex: 1,
    gap: 4,
  },
  experienceTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  experienceCompany: {
    fontSize: 13,
  },
  experienceMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  experienceDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  educationContainer: {
    gap: 16,
    marginTop: 8,
  },
  educationItem: {
    gap: 4,
  },
  educationDegree: {
    fontSize: 15,
    fontWeight: '600',
  },
  educationInstitution: {
    fontSize: 13,
  },
  educationPeriod: {
    fontSize: 12,
    marginTop: 2,
  },
  preferencesContainer: {
    gap: 16,
    marginTop: 8,
  },
  preferenceItem: {
    flexDirection: 'row',
    gap: 12,
  },
  preferenceContent: {
    flex: 1,
    gap: 6,
  },
  preferenceLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  preferenceValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  preferenceBadgeText: {
    fontSize: 12,
  },
  preferenceValue: {
    fontSize: 13,
  },
  aiBanner: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  aiBannerContent: {
    flex: 1,
    gap: 4,
  },
  aiBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  aiBannerText: {
    fontSize: 12,
    lineHeight: 16,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    fontSize: 15,
    fontWeight: '600',
  },
});
