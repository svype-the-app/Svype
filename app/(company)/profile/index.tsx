import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ThemedModal, type ThemedAlertConfig } from '@/components/ui/themed-modal';
import { Colors } from '@/constants/theme';
import { clearCachedData } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import { authApi, resolveMediaUrl, type User } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CompanyProfileData {
  name: string;
  email: string;
  initials: string;
  location: string;
  website: string;
  description: string;
  rating: number;
  reviewsCount: number;
  followersCount: number;
  jobsCount: number;
  culture: string[];
  benefits: string[];
  completionPercentage: number;
  completionFilled: Record<string, boolean>;
  avatarUrl?: string;
}

// Pure transform from the cached `/auth/me/` user to this screen's view-model.
function mapUserToCompanyProfile(user: User): CompanyProfileData {
  const company = (user as any)?.company;

  const companyName =
    company?.name || `${user.first_name} ${user.last_name}`.trim() || user.username || 'Company';
  const initials =
    companyName
      .split(' ')
      .filter(Boolean)
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CO';

  return {
    name: companyName,
    email: company?.email || user.email || '',
    initials,
    location: company?.location || '',
    website: company?.website || '',
    description: company?.description || '',
    rating: Number(company?.rating || 0),
    reviewsCount: Number(company?.reviews_count || 0),
    followersCount: Number(company?.followers_count || 0),
    jobsCount: Number(company?.jobs_count || 0),
    culture: company?.culture || [],
    benefits: company?.benefits || [],
    completionPercentage: Number(company?.completion?.percentage || 0),
    completionFilled: company?.completion?.filled || {},
    avatarUrl: resolveMediaUrl(user.avatar),
  };
}

export default function CompanyProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const meQuery = useQuery({ queryKey: queryKeys.auth.me(), queryFn: authApi.getMe });
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [alertConfig, setAlertConfig] = useState<ThemedAlertConfig | null>(null);

  // Derive the view-model from the cached user. Null until the first load
  // succeeds; the JSX below is null-safe (optional chaining + defaults), so a
  // failed cold load just renders empty fields like the old fallback did.
  const profile = useMemo(
    () => (meQuery.data ? mapUserToCompanyProfile(meQuery.data) : null),
    [meQuery.data]
  );

  // Refresh the profile when the tab regains focus (e.g. after editing it).
  const refetchMe = meQuery.refetch;
  useFocusEffect(
    useCallback(() => {
      refetchMe();
    }, [refetchMe])
  );

  const handleSignOut = () => {
    if (isSigningOut) return;

    setAlertConfig({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      buttons: [
        { label: 'Cancel', variant: 'secondary' },
        {
          label: 'Sign Out',
          variant: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              await authApi.logout();
            } catch (error) {
              console.log('Error during logout', error);
            } finally {
              setIsSigningOut(false);
            }
            clearCachedData();
            router.replace('/(auth)/login');
          },
        },
      ],
    });
  };

  if (meQuery.isPending) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Company Profile</Text>
          <TouchableOpacity onPress={() => router.push('/(company)/profile/settings')}>
            <Ionicons name="settings-outline" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const pct = profile?.completionPercentage ?? 0;
  const completionColor = pct >= 90 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Company Profile</Text>
        <TouchableOpacity onPress={() => router.push('/(company)/profile/settings')}>
          <Ionicons name="settings-outline" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={[styles.avatarText, { color: colors.primaryForeground }]}> 
                  {profile?.initials || 'CO'}
                </Text>
              )}
            </AvatarFallback>
          </Avatar>

          <Text style={[styles.profileName, { color: colors.foreground }]}>{profile?.name}</Text>

          <View style={styles.emailContainer}>
            <Ionicons name="mail-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.email, { color: colors.mutedForeground }]} numberOfLines={1}>
              {profile?.email || 'No company email'}
            </Text>
          </View>

          <Badge
            style={{
              backgroundColor: colors.primary + '20',
              marginTop: 12,
            }}
            textStyle={{ color: colors.primary }}
          >
            <Ionicons name="business" size={12} color={colors.primary} />
            <Text>Employer Account</Text>
          </Badge>
          {meQuery.data?.is_premium && (
            <Badge style={{ backgroundColor: '#f59e0b20', marginTop: 8 }} textStyle={{ color: '#f59e0b' }}>
              <Ionicons name="diamond" size={12} color="#f59e0b" />
              <Text>Premium Member</Text>
            </Badge>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(company)/profile/profile-preview')}
          activeOpacity={0.85}
          style={styles.completionTapTarget}
        >
          <Card
            style={[
              styles.completionCard,
              {
                borderWidth: 1,
                borderColor: completionColor + '66',
                backgroundColor: completionColor + '12',
              },
            ]}
          >
            <CardContent style={styles.completionContent}>
              <View style={styles.completionHeader}>
                <View style={styles.completionTitleRow}>
                  <Ionicons name="stats-chart" size={20} color={completionColor} />
                  <Text style={[styles.completionTitle, { color: colors.foreground }]}>Account Completion</Text>
                </View>
                <View style={styles.completionAction}>
                  <Text style={[styles.completionPercentage, { color: completionColor }]}>
                    {profile?.completionPercentage ?? 0}%
                  </Text>
                  <Ionicons name="chevron-forward-circle" size={22} color={completionColor} />
                </View>
              </View>
              <Progress value={profile?.completionPercentage ?? 0} style={styles.progressBar} />
              <Text style={[styles.completionHint, { color: colors.mutedForeground }]}>
                {(profile?.completionPercentage ?? 0) >= 90
                  ? 'Great! Your company profile is well optimized.'
                  : (profile?.completionPercentage ?? 0) >= 50
                    ? 'Almost there! Add more details to attract better candidates.'
                    : 'Complete your company details to attract better candidates.'}
              </Text>
              <View style={styles.completionTapHintRow}>
                <Ionicons name="create-outline" size={14} color={completionColor} />
                <Text style={[styles.completionTapHint, { color: completionColor }]}>Tap to edit company details</Text>
              </View>
            </CardContent>
          </Card>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, { backgroundColor: colors.primary + '10' }]}>
            <CardContent style={styles.statCardContent}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="briefcase" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.primary }]}>{profile?.jobsCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active Jobs</Text>
            </CardContent>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: '#3b82f610' }]}>
            <CardContent style={styles.statCardContent}>
              <View style={[styles.statIconContainer, { backgroundColor: '#3b82f620' }]}>
                <Ionicons name="people" size={24} color="#3b82f6" />
              </View>
              <Text style={[styles.statValue, { color: '#3b82f6' }]}>{profile?.followersCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Followers</Text>
            </CardContent>
          </Card>
        </View>

        <Card style={styles.sectionCard}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About Company</Text>
            </View>
            <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>
              {profile?.description || 'Add a company description to attract top candidates.'}
            </Text>
          </CardContent>
        </Card>

        <Card style={styles.sectionCard}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="business-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Company Details</Text>
            </View>

            <View style={styles.detailsList}>
              <DetailRow label="Location" value={profile?.location} colors={colors} />
              <DetailRow label="Website" value={profile?.website} colors={colors} />
              <DetailRow label="Rating" value={profile?.rating ? `${profile.rating} (${profile.reviewsCount} reviews)` : ''} colors={colors} />
            </View>
          </CardContent>
        </Card>

        <Card style={styles.sectionCard}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Culture & Benefits</Text>
            </View>

            <View style={styles.badgesContainer}>
              {profile?.culture?.length ? (
                profile.culture.map((item) => (
                  <Badge key={`culture-${item}`} variant="secondary">
                    <Text>{item}</Text>
                  </Badge>
                ))
              ) : (
                <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>No culture tags yet.</Text>
              )}

              {profile?.benefits?.length ? (
                profile.benefits.map((item) => (
                  <Badge key={`benefit-${item}`} variant="secondary">
                    <Text>{item}</Text>
                  </Badge>
                ))
              ) : (
                <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>No benefits added yet.</Text>
              )}
            </View>
          </CardContent>
        </Card>

        <Card style={styles.menuCard}>
          <CardContent style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: colors.foreground }]}>Actions</Text>
            <View style={styles.menuItems}>
              <MenuItem
                icon={<Ionicons name="create-outline" size={20} color={colors.primary} />}
                label="Edit Company Information"
                onPress={() => router.push('/(company)/profile/profile-preview?mode=edit' as any)}
                colors={colors}
              />
              <MenuItem
                icon={<Ionicons name="diamond-outline" size={20} color={'#f59e0b'} />}
                label="Upgrade to Premium"
                onPress={() => router.push('/(company)/profile/upgrade')}
                colors={colors}
              />
              <MenuItem
                icon={<Ionicons name="log-out-outline" size={20} color={colors.destructive} />}
                label={isSigningOut ? 'Signing Out...' : 'Sign Out'}
                onPress={handleSignOut}
                colors={colors}
                isLast
                destructive
              />
            </View>
          </CardContent>
        </Card>
      </ScrollView>

      <ThemedModal
        visible={!!alertConfig}
        title={alertConfig?.title ?? ''}
        message={alertConfig?.message ?? ''}
        buttons={alertConfig?.buttons ?? []}
        onRequestClose={() => setAlertConfig(null)}
      />
    </View>
  );
}

interface DetailRowProps {
  label: string;
  value?: string | number;
  colors: any;
}

function DetailRow({ label, value, colors }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>
        {value || 'Not set'}
      </Text>
    </View>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  colors: any;
  isLast?: boolean;
  destructive?: boolean;
}

function MenuItem({ icon, label, onPress, colors, isLast, destructive }: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.menuItem, !isLast && { borderBottomColor: colors.border }]}
    >
      <View style={styles.menuItemContent}>
        {icon}
        <Text style={[styles.menuItemLabel, { color: destructive ? colors.destructive : colors.foreground }]}>
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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
  completionTapTarget: {
    borderRadius: 14,
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
  completionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  completionTapHintRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completionTapHint: {
    fontSize: 12,
    fontWeight: '600',
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
  detailsList: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
});
