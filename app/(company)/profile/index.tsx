import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { authApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
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
import { SafeAreaView } from 'react-native-safe-area-context';

interface CompanyProfileData {
  name: string;
  email: string;
  initials: string;
  location: string;
  website: string;
  description: string;
  industry: string;
  size: string;
  founded: string;
  rating: number;
  reviewsCount: number;
  followersCount: number;
  jobsCount: number;
  culture: string[];
  benefits: string[];
}

export default function CompanyProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [profile, setProfile] = useState<CompanyProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const user = await authApi.getMe();
      const company = (user as any)?.company;

      const companyName = company?.name || `${user.first_name} ${user.last_name}`.trim() || user.username || 'Company';
      const initials = companyName
        .split(' ')
        .filter(Boolean)
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'CO';

      setProfile({
        name: companyName,
        email: company?.email || user.email || '',
        initials,
        location: company?.location || '',
        website: company?.website || '',
        description: company?.description || '',
        industry: company?.industry || '',
        size: company?.size || '',
        founded: company?.founded || '',
        rating: Number(company?.rating || 0),
        reviewsCount: Number(company?.reviews_count || 0),
        followersCount: Number(company?.followers_count || 0),
        jobsCount: Number(company?.jobs_count || 0),
        culture: company?.culture || [],
        benefits: company?.benefits || [],
      });
    } catch (error) {
      console.log('Could not fetch company profile:', error);
      setProfile({
        name: 'Company',
        email: '',
        initials: 'CO',
        location: '',
        website: '',
        description: '',
        industry: '',
        size: '',
        founded: '',
        rating: 0,
        reviewsCount: 0,
        followersCount: 0,
        jobsCount: 0,
        culture: [],
        benefits: [],
      });
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

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await authApi.logout();
          } catch (error) {
            console.log('Error during logout');
          }
          router.replace('/');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Company Profile</Text>
          <TouchableOpacity onPress={() => router.push('/(company)/profile/settings')}>
            <Ionicons name="settings-outline" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
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
              <Text style={[styles.avatarText, { color: colors.primaryForeground }]}> 
                {profile?.initials || 'CO'}
              </Text>
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
        </View>

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
              <DetailRow label="Industry" value={profile?.industry} colors={colors} />
              <DetailRow label="Location" value={profile?.location} colors={colors} />
              <DetailRow label="Company Size" value={profile?.size} colors={colors} />
              <DetailRow label="Founded" value={profile?.founded} colors={colors} />
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
                label="Edit Company Settings"
                onPress={() => router.push('/(company)/profile/settings')}
                colors={colors}
              />
              <MenuItem
                icon={<Ionicons name="diamond-outline" size={20} color={'#f59e0b'} />}
                label="Upgrade to Premium"
                onPress={() => router.push('/(company)/premium/upgrade')}
                colors={colors}
              />
              <MenuItem
                icon={<Ionicons name="briefcase-outline" size={20} color={colors.primary} />}
                label="Manage Job Posts"
                onPress={() => router.push('/(company)/posts')}
                colors={colors}
              />
              <MenuItem
                icon={<Ionicons name="log-out-outline" size={20} color={colors.destructive} />}
                label="Sign Out"
                onPress={handleSignOut}
                colors={colors}
                isLast
                destructive
              />
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
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
