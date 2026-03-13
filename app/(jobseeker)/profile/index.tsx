import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Colors } from '@/constants/theme';
import { applicationsApi, authApi, ProfileCompletion } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

interface UserProfile {
  fullName: string;
  email: string;
  initials: string;
  careerGoals: string;
  lifeGoals: string;
  interests: string[];
  completion: ProfileCompletion | null;
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applicationCount, setApplicationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [user, apps] = await Promise.all([
        authApi.getMe(),
        applicationsApi.getApplications(),
      ]);

      const fullName = `${user.first_name} ${user.last_name}`.trim() || 'User';
      const initials = fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase() || 'U';

      setProfile({
        fullName,
        email: user.email,
        initials,
        careerGoals: user.profile?.career_goals || '',
        lifeGoals: user.profile?.life_goals || '',
        interests: user.profile?.interests || [],
        completion: user.profile?.completion || null,
      });

      setApplicationCount(apps.length);
    } catch (error) {
      console.log('Could not fetch user profile:', error);
      setProfile({
        fullName: 'User',
        email: '',
        initials: 'U',
        careerGoals: '',
        lifeGoals: '',
        interests: [],
        completion: null,
      });
      setApplicationCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('user_data');
          } catch (e) {
            console.log('Error clearing auth data');
          }
          router.push('/(auth)/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
          <TouchableOpacity onPress={() => router.push('/(jobseeker)/profile/settings')}>
            <Ionicons name="settings-outline" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const completionPercentage = profile?.completion?.percentage || 15;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        <TouchableOpacity onPress={() => router.push('/(jobseeker)/profile/settings')}>
          <Ionicons name="settings-outline" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar
            size={112}
            style={{
              backgroundColor: colors.primary,
              borderWidth: 4,
              borderColor: colors.primary + '20',
            }}
          >
            <AvatarFallback>
              <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                {profile?.initials || 'U'}
              </Text>
            </AvatarFallback>
          </Avatar>
          <Text style={[styles.profileName, { color: colors.foreground }]}>{profile?.fullName}</Text>
          <View style={styles.emailContainer}>
            <Ionicons name="mail-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.email, { color: colors.mutedForeground }]} numberOfLines={1}>
              {profile?.email || 'No email'}
            </Text>
          </View>
          <Badge
            style={{
              backgroundColor: colors.primary + '20',
              marginTop: 12,
            }}
            textStyle={{ color: colors.primary }}
          >
            <Ionicons name="sparkles" size={12} color={colors.primary} />
            <Text>AI Career Matched</Text>
          </Badge>
        </View>

        {/* Profile Completion Card */}
        <Card style={styles.completionCard}>
          <CardContent style={styles.completionContent}>
            <View style={styles.completionHeader}>
              <View style={styles.completionTitleRow}>
                <Ionicons name="stats-chart" size={20} color={colors.primary} />
                <Text style={[styles.completionTitle, { color: colors.foreground }]}>
                  Profile Completion
                </Text>
              </View>
              <Text style={[styles.completionPercentage, { color: getCompletionColor(completionPercentage) }]}>
                {completionPercentage}%
              </Text>
            </View>
            <Progress value={completionPercentage} style={styles.progressBar} />
            <Text style={[styles.completionHint, { color: colors.mutedForeground }]}>
              {completionPercentage >= 80 
                ? 'Great! Your profile is well optimized.' 
                : 'Complete your profile to get better job matches.'}
            </Text>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, { backgroundColor: colors.primary + '10' }]}>
            <CardContent style={styles.statCardContent}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="trending-up" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.primary }]}>{applicationCount}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Applications
              </Text>
            </CardContent>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: '#3b82f610' }]}>
            <CardContent style={styles.statCardContent}>
              <View style={[styles.statIconContainer, { backgroundColor: '#3b82f620' }]}>
                <Ionicons name="ribbon" size={24} color="#3b82f6" />
              </View>
              <Text style={[styles.statValue, { color: '#3b82f6' }]}>
                {profile?.interests?.length || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Interests</Text>
            </CardContent>
          </Card>
        </View>

        {/* Profile Sections */}
        <View style={styles.sectionsContainer}>
          <ProfileSection
            icon={<Ionicons name="flag" size={20} color={colors.primary} />}
            title="Career Goals"
            content={profile?.careerGoals}
            colors={colors}
          />
          <View>
            <Card style={styles.sectionCard}>
              <CardContent style={styles.sectionContent}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="briefcase" size={20} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Professional Interests
                  </Text>
                </View>
                <View style={styles.interestsContainer}>
                  {profile?.interests && profile.interests.length > 0 ? (
                    profile.interests.map((interest) => (
                      <Badge key={interest} variant="secondary">
                        <Text>{interest}</Text>
                      </Badge>
                    ))
                  ) : (
                    <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
                      No interests added yet.
                    </Text>
                  )}
                </View>
              </CardContent>
            </Card>
          </View>
          <ProfileSection
            icon={<Ionicons name="heart" size={20} color="#f43f5e" />}
            title="Life Aspirations"
            content={profile?.lifeGoals}
            colors={colors}
          />
        </View>

        {/* AI Chat CTA */}
        <Card
          style={[
            styles.ctaCard,
            { backgroundColor: colors.primary + '10', borderColor: colors.primary + '40' },
          ]}
        >
          <CardContent style={styles.ctaContent}>
            <View style={styles.ctaText}>
              <Text style={[styles.ctaTitle, { color: colors.foreground }]}>
                Update Your Goals
              </Text>
              <Text style={[styles.ctaDescription, { color: colors.mutedForeground }]}>
                Talk to AI to refine your career path
              </Text>
            </View>
            <Button onPress={() => router.push('/(jobseeker)/chat')} style={styles.ctaButton}>
              <Ionicons name="sparkles" size={16} color={colors.primaryForeground} />
              <Text style={{ color: colors.primaryForeground }}>Chat</Text>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card style={styles.menuCard}>
          <CardContent style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: colors.foreground }]}>Quick Access</Text>
            <View style={styles.menuItems}>
              <MenuItem
                icon={<Ionicons name="document-text-outline" size={20} color={colors.primary} />}
                label="Generate CV"
                onPress={() => router.push('/(jobseeker)/ai-tools/generate-cv')}
                colors={colors}
              />
              <MenuItem
                icon={<Ionicons name="create-outline" size={20} color={colors.primary} />}
                label="Generate Cover Letter"
                onPress={() => router.push('/(jobseeker)/ai-tools/generate-cover-letter')}
                colors={colors}
              />
              <MenuItem
                icon={<Ionicons name="ribbon-outline" size={20} color="#f59e0b" />}
                label="Skills Assessment"
                onPress={() => router.push('/(jobseeker)/ai-tools/skills-assessment')}
                colors={colors}
              />
              <MenuItem
                icon={<Ionicons name="sparkles-outline" size={20} color="#a855f7" />}
                label="Interview Preparation"
                onPress={() => router.push('/(jobseeker)/ai-tools/interview-prep')}
                colors={colors}
              />
              <MenuItem
                icon={<Ionicons name="bookmark-outline" size={20} color="#3b82f6" />}
                label="Saved Jobs"
                onPress={() => router.push('/(jobseeker)/saved')}
                colors={colors}
                isLast
              />
            </View>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card style={styles.menuCard}>
          <CardContent style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: colors.foreground }]}>Account Settings</Text>
            <View style={styles.menuItems}>
              <MenuItem
                icon={<Ionicons name="person-outline" size={20} color={colors.foreground} />}
                label="Edit Personal Info"
                onPress={() => router.push('/(jobseeker)/profile/personal-info')}
                colors={colors}
              />
              <MenuItem
                icon={<Ionicons name="document-outline" size={20} color={colors.foreground} />}
                label="Resume & Portfolio"
                onPress={() => router.push('/(jobseeker)/profile/resume')}
                colors={colors}
              />
              <MenuItem
                icon={<Ionicons name="options-outline" size={20} color={colors.foreground} />}
                label="Preferences"
                onPress={() => router.push('/(jobseeker)/profile/preferences')}
                colors={colors}
              />
              <TouchableOpacity
                onPress={handleSignOut}
                style={[styles.menuItem, styles.signOutItem, { borderTopColor: colors.border }]}
              >
                <View style={styles.menuItemContent}>
                  <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
                  <Text style={[styles.menuItemLabel, { color: colors.destructive }]}>Sign Out</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}

interface ProfileSectionProps {
  icon: React.ReactNode;
  title: string;
  content?: string;
  colors: any;
}

function ProfileSection({ icon, title, content, colors }: ProfileSectionProps) {
  return (
    <Card style={styles.sectionCard}>
      <CardContent style={styles.sectionContent}>
        <View style={styles.sectionHeader}>
          {icon}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        </View>
        <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
          {content || 'No information provided yet. Talk to the AI coach to update your goals.'}
        </Text>
      </CardContent>
    </Card>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  colors: any;
  isLast?: boolean;
}

function MenuItem({ icon, label, onPress, colors, isLast }: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.menuItem, !isLast && { borderBottomColor: colors.border }]}
    >
      <View style={styles.menuItemContent}>
        {icon}
        <Text style={[styles.menuItemLabel, { color: colors.foreground }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  email: {
    fontSize: 14,
  },
  completionCard: {
    marginBottom: 0,
  },
  completionContent: {
    padding: 16,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    marginBottom: 8,
  },
  completionHint: {
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statCardContent: {
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    padding: 12,
    borderRadius: 50,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionsContainer: {
    gap: 16,
  },
  sectionCard: {
    marginBottom: 0,
  },
  sectionContent: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ctaCard: {
    borderWidth: 1,
  },
  ctaContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  ctaDescription: {
    fontSize: 12,
  },
  ctaButton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  menuCard: {
    marginBottom: 0,
  },
  menuContent: {
    padding: 0,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    padding: 16,
    paddingBottom: 0,
  },
  menuItems: {
    marginTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  signOutItem: {
    borderTopWidth: 1,
    borderBottomWidth: 0,
  },
});
