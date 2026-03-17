import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authApi, ProfileCompletion } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProfileData {
  name: string;
  email: string;
  headline: string;
  location: string;
  bio: string;
  skills: string[];
  experience: string;
  education: string;
  preferences: {
    jobTypes: string[];
    salaryMin: number | null;
    salaryMax: number | null;
    location: string;
  };
  hasResume: boolean;
  completion: ProfileCompletion | null;
}

export default function ProfilePreviewScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  // Fetch user profile data from API on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await authApi.getMe();
        const profile = user.profile;
        const fullName = `${user.first_name} ${user.last_name}`.trim() || 'User';
        
        setProfileData({
          name: fullName,
          email: user.email,
          headline: profile?.bio ? profile.bio.split('.')[0].substring(0, 100) : '',
          location: profile?.location || '',
          bio: profile?.bio || '',
          skills: profile?.skills || [],
          experience: profile?.experience || '',
          education: profile?.career_goals || '',
          preferences: {
            jobTypes: profile?.preferred_job_types || [],
            salaryMin: profile?.salary_min || null,
            salaryMax: profile?.salary_max || null,
            location: profile?.preferred_locations?.[0] || '',
          },
          hasResume: profile?.completion?.filled?.resume || false,
          completion: profile?.completion || null,
        });
      } catch (error) {
        console.log('Could not fetch profile:', error);
        try {
          await authApi.logout();
        } catch {
          // ignore
        }
        router.replace('/');
        return;
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const handleStartSwiping = async () => {
    try {
      await authApi.updateState('active');
    } catch (error) {
      console.log('Could not update state, continuing anyway');
    }
    router.replace('/(jobseeker)/swipe' as any);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading your profile...</Text>
      </View>
    );
  }

  const completion = profileData?.completion?.percentage || 15;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Your Profile Preview
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
          {completion >= 80 ? 'Your profile is looking great!' : 'Complete your profile to stand out'}
        </Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Completion Bar */}
        <Card>
          <CardContent style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <Text style={[styles.completionTitle, { color: colors.foreground }]}>
                Profile Completion
              </Text>
              <Text style={[styles.completionPercentage, { color: getCompletionColor(completion) }]}>
                {completion}%
              </Text>
            </View>
            <Progress value={completion} style={styles.progressBar} />
            <View style={styles.completionItems}>
              {profileData?.completion?.filled && Object.entries(profileData.completion.filled).map(([key, isFilled]) => (
                <View key={key} style={styles.completionItem}>
                  <Ionicons 
                    name={isFilled ? 'checkmark-circle' : 'ellipse-outline'} 
                    size={16} 
                    color={isFilled ? '#10b981' : colors.mutedForeground} 
                  />
                  <Text style={[styles.completionItemText, { 
                    color: isFilled ? colors.foreground : colors.mutedForeground 
                  }]}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Profile Header */}
        <Card>
          <CardContent style={styles.cardContent}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.background }]}>
                  {getInitials(profileData?.name || '')}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.name, { color: colors.foreground }]}>
                  {profileData?.name || 'Add your name'}
                </Text>
                {profileData?.headline ? (
                  <Text style={[styles.headline, { color: colors.mutedForeground }]}>
                    {profileData.headline}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={() => router.push('/(jobseeker)/profile' as any)}>
                    <Text style={[styles.placeholder, { color: colors.primary }]}>
                      + Add a professional headline
                    </Text>
                  </TouchableOpacity>
                )}
                <View style={styles.contactInfo}>
                  <View style={styles.contactItem}>
                    <Ionicons name="location" size={14} color={colors.mutedForeground} />
                    {profileData?.location ? (
                      <Text style={[styles.contactText, { color: colors.mutedForeground }]}>
                        {profileData.location}
                      </Text>
                    ) : (
                      <Text style={[styles.placeholderSmall, { color: colors.primary }]}>Add location</Text>
                    )}
                  </View>
                  <View style={styles.contactItem}>
                    <Ionicons name="mail" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.contactText, { color: colors.mutedForeground }]}>
                      {profileData?.email || 'No email'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.border }]} />

            {/* About Section */}
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                About
              </Text>
              {profileData?.bio ? (
                <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>
                  {profileData.bio}
                </Text>
              ) : (
                <TouchableOpacity 
                  style={[styles.emptySection, { borderColor: colors.border }]}
                  onPress={() => router.push('/(jobseeker)/profile' as any)}
                >
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                  <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
                    Tell employers about yourself
                  </Text>
                </TouchableOpacity>
              )}
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
              {profileData?.skills && profileData.skills.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.badgeText, { color: colors.foreground }]}>
                    {profileData.skills.length} skills
                  </Text>
                </View>
              )}
            </View>
            {profileData?.skills && profileData.skills.length > 0 ? (
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
            ) : (
              <TouchableOpacity 
                style={[styles.emptySection, { borderColor: colors.border }]}
                onPress={() => router.push('/(jobseeker)/profile' as any)}
              >
                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
                  Add your skills to get better job matches
                </Text>
              </TouchableOpacity>
            )}
          </CardContent>
        </Card>

        {/* Experience */}
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Experience
            </Text>
            {profileData?.experience ? (
              <Text style={[styles.experienceText, { color: colors.mutedForeground }]}>
                {profileData.experience}
              </Text>
            ) : (
              <TouchableOpacity 
                style={[styles.emptySection, { borderColor: colors.border }]}
                onPress={() => router.push('/(jobseeker)/profile' as any)}
              >
                <Ionicons name="briefcase-outline" size={24} color={colors.primary} />
                <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
                  Add your work experience
                </Text>
              </TouchableOpacity>
            )}
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Education
            </Text>
            {profileData?.education ? (
              <Text style={[styles.educationText, { color: colors.mutedForeground }]}>
                {profileData.education}
              </Text>
            ) : (
              <TouchableOpacity 
                style={[styles.emptySection, { borderColor: colors.border }]}
                onPress={() => router.push('/(jobseeker)/profile' as any)}
              >
                <Ionicons name="school-outline" size={24} color={colors.primary} />
                <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
                  Add your education
                </Text>
              </TouchableOpacity>
            )}
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Job Preferences
            </Text>
            {(profileData?.preferences?.jobTypes?.length || profileData?.preferences?.salaryMin) ? (
              <View style={styles.preferencesContainer}>
                {profileData?.preferences?.jobTypes && profileData.preferences.jobTypes.length > 0 && (
                  <View style={styles.preferenceItem}>
                    <Ionicons name="briefcase-outline" size={20} color={colors.mutedForeground} />
                    <View style={styles.preferenceContent}>
                      <Text style={[styles.preferenceLabel, { color: colors.foreground }]}>
                        Job Type
                      </Text>
                      <View style={styles.preferenceValues}>
                        {profileData.preferences.jobTypes.map((type, index) => (
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
                )}
                {(profileData?.preferences?.salaryMin || profileData?.preferences?.salaryMax) && (
                  <View style={styles.preferenceItem}>
                    <Ionicons name="cash-outline" size={20} color={colors.mutedForeground} />
                    <View style={styles.preferenceContent}>
                      <Text style={[styles.preferenceLabel, { color: colors.foreground }]}>
                        Salary Expectations
                      </Text>
                      <Text style={[styles.preferenceValue, { color: colors.mutedForeground }]}>
                        ${profileData?.preferences?.salaryMin?.toLocaleString() || '0'} - ${profileData?.preferences?.salaryMax?.toLocaleString() || 'Open'}
                      </Text>
                    </View>
                  </View>
                )}
                {profileData?.preferences?.location && (
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
                )}
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.emptySection, { borderColor: colors.border }]}
                onPress={() => router.push('/(jobseeker)/profile' as any)}
              >
                <Ionicons name="options-outline" size={24} color={colors.primary} />
                <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
                  Set your job preferences
                </Text>
              </TouchableOpacity>
            )}
          </CardContent>
        </Card>

        {/* Resume Section */}
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Resume/CV
            </Text>
            {profileData?.hasResume ? (
              <View style={[styles.resumeUploaded, { backgroundColor: colors.muted }]}>
                <Ionicons name="document-text" size={24} color={colors.primary} />
                <Text style={[styles.resumeText, { color: colors.foreground }]}>Resume uploaded</Text>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.emptySection, { borderColor: colors.border }]}
                onPress={() => router.push('/(onboarding)/upload-cv' as any)}
              >
                <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
                  Upload your resume (PDF, DOCX)
                </Text>
              </TouchableOpacity>
            )}
          </CardContent>
        </Card>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { 
          backgroundColor: completion >= 50 ? colors.primary + '1A' : '#f59e0b1A',
          borderColor: completion >= 50 ? colors.primary + '33' : '#f59e0b33'
        }]}>
          <Ionicons 
            name={completion >= 50 ? 'information-circle' : 'alert-circle'} 
            size={20} 
            color={completion >= 50 ? colors.primary : '#f59e0b'} 
          />
          <View style={styles.infoBannerContent}>
            <Text style={[styles.infoBannerTitle, { color: colors.foreground }]}>
              {completion >= 50 ? 'Looking Good!' : 'Tip: Complete your profile'}
            </Text>
            <Text style={[styles.infoBannerText, { color: colors.mutedForeground }]}>
              {completion >= 50 
                ? 'You can edit any section anytime from your profile page.'
                : 'Profiles with more information get 3x more views from employers.'}
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
          onPress={handleStartSwiping}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
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
  completionCard: {
    padding: 20,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  completionPercentage: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressBar: {
    marginBottom: 16,
  },
  completionItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  completionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '45%',
  },
  completionItemText: {
    fontSize: 12,
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
  placeholder: {
    fontSize: 14,
    fontWeight: '500',
  },
  placeholderSmall: {
    fontSize: 13,
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
  emptySection: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptySectionText: {
    fontSize: 13,
    textAlign: 'center',
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
  experienceText: {
    fontSize: 13,
    lineHeight: 20,
  },
  educationText: {
    fontSize: 13,
    lineHeight: 20,
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
  resumeUploaded: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  resumeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  infoBannerContent: {
    flex: 1,
    gap: 4,
  },
  infoBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoBannerText: {
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
