import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Colors } from '@/constants/theme';
import { authApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Appearance,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CompanySettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    applicantNotifications: true,
    jobPostAlerts: true,
    language: 'English',
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setTimeout(() => {
      Alert.alert('Setting Updated', 'Your preferences have been saved.');
    }, 100);
  };

  const handleThemeToggle = () => {
    const newTheme = colorScheme === 'dark' ? 'light' : 'dark';
    Appearance.setColorScheme(newTheme);
    setTimeout(() => {
      Alert.alert('Theme Updated', `Switched to ${newTheme} mode.`);
    }, 100);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear your local cache?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Data Cleared', 'Your local cache has been cleared successfully.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your company account? This action cannot be undone and will remove all your job posts and applicant data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Alert.alert('Account Deletion', 'Your account deletion request has been submitted.');
            try {
              await authApi.logout();
            } catch (error) {
              console.log('Error during logout');
            }
            router.replace('/');
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://svype.com/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://svype.com/terms');
  };

  const handleDataPrivacy = () => {
    Alert.alert('Data & Privacy', 'Data and privacy settings will be available soon.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Section */}
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
                Notifications
              </Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Label style={styles.settingLabel}>Push Notifications</Label>
                <Text style={[styles.settingDescription, { color: colors.mutedForeground }]}>
                  Receive updates about applicants and jobs
                </Text>
              </View>
              <Switch
                checked={settings.notifications}
                onCheckedChange={() => handleToggle('notifications')}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Label style={styles.settingLabel}>Email Alerts</Label>
                <Text style={[styles.settingDescription, { color: colors.mutedForeground }]}>
                  Get new applicant alerts via email
                </Text>
              </View>
              <Switch
                checked={settings.emailAlerts}
                onCheckedChange={() => handleToggle('emailAlerts')}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Label style={styles.settingLabel}>Applicant Notifications</Label>
                <Text style={[styles.settingDescription, { color: colors.mutedForeground }]}>
                  Notify when someone applies to your jobs
                </Text>
              </View>
              <Switch
                checked={settings.applicantNotifications}
                onCheckedChange={() => handleToggle('applicantNotifications')}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Label style={styles.settingLabel}>Job Post Alerts</Label>
                <Text style={[styles.settingDescription, { color: colors.mutedForeground }]}>
                  Get reminders about job post status
                </Text>
              </View>
              <Switch
                checked={settings.jobPostAlerts}
                onCheckedChange={() => handleToggle('jobPostAlerts')}
              />
            </View>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="moon-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
                Appearance
              </Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Label style={styles.settingLabel}>Dark Mode</Label>
                <Text style={[styles.settingDescription, { color: colors.mutedForeground }]}>
                  Toggle dark theme
                </Text>
              </View>
              <Switch
                checked={colorScheme === 'dark'}
                onCheckedChange={handleThemeToggle}
              />
            </View>
          </CardContent>
        </Card>

        {/* Language & Region Section */}
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="globe-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
                Language & Region
              </Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Label style={styles.settingLabel}>Language</Label>
                <Text style={[styles.settingDescription, { color: colors.mutedForeground }]}>
                  English (US)
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.changeButton, { borderColor: colors.border }]}
                onPress={() => Alert.alert('Language', 'Language selection coming soon')}
              >
                <Text style={[styles.changeButtonText, { color: colors.foreground }]}>
                  Change
                </Text>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        {/* Privacy & Security Section */}
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
                Privacy & Security
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.border }]}
              onPress={handlePrivacyPolicy}
            >
              <Text style={[styles.actionButtonText, { color: colors.foreground }]}>
                Privacy Policy
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.border }]}
              onPress={handleTermsOfService}
            >
              <Text style={[styles.actionButtonText, { color: colors.foreground }]}>
                Terms of Service
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.border }]}
              onPress={handleDataPrivacy}
            >
              <Text style={[styles.actionButtonText, { color: colors.foreground }]}>
                Data & Privacy Settings
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </CardContent>
        </Card>

        {/* Data Management Section */}
        <Card style={[styles.card, { borderColor: colors.destructive + '33' }]}>
          <CardContent style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trash-outline" size={20} color={colors.destructive} />
              <Text style={[styles.sectionTitle, { color: colors.destructive }]}>
                Data Management
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { borderColor: colors.destructive + '80' },
              ]}
              onPress={handleClearData}
            >
              <Text style={[styles.actionButtonText, { color: colors.destructive }]}>
                Clear Cache
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.destructive} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { borderColor: colors.destructive + '80' },
              ]}
              onPress={handleDeleteAccount}
            >
              <Text style={[styles.actionButtonText, { color: colors.destructive }]}>
                Delete Company Account
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.destructive} />
            </TouchableOpacity>
          </CardContent>
        </Card>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: colors.mutedForeground }]}>
            SVYPE Business v1.0.0
          </Text>
          <Text style={[styles.appInfoTextSmall, { color: colors.mutedForeground }]}>
            © 2026 SVYPE. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 12,
  },
  cardContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  changeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  appInfoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  appInfoTextSmall: {
    fontSize: 12,
    marginTop: 4,
  },
});
