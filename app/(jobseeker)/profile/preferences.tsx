import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Colors } from '@/constants/theme';
import { mockPreferredJobTypes, mockPreferredLocations, mockUserPreferences } from '@/lib/mock-profile';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

export default function PreferencesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [preferences, setPreferences] = useState(mockUserPreferences);
  const [locations, setLocations] = useState(mockPreferredLocations);
  const [jobTypes, setJobTypes] = useState(mockPreferredJobTypes);

  const handleSave = () => {
    Alert.alert('Preferences Saved', 'Your job preferences have been updated successfully.');
  };

  const removeLocation = (location: string) => {
    setLocations(locations.filter((l) => l !== location));
  };

  const removeJobType = (jobType: string) => {
    setJobTypes(jobTypes.filter((j) => j !== jobType));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Job Preferences</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Work Location */}
        <Card style={[styles.card, { borderColor: colors.border }]}>
          <CardContent style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Work Location</Text>
            </View>

            <View style={styles.switchSection}>
              <View style={styles.switchRow}>
                <Label style={[styles.switchLabel, { color: colors.foreground }]}>Remote</Label>
                <Switch
                  value={preferences.remote}
                  onValueChange={(value) => setPreferences({ ...preferences, remote: value })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.switchRow}>
                <Label style={[styles.switchLabel, { color: colors.foreground }]}>Hybrid</Label>
                <Switch
                  value={preferences.hybrid}
                  onValueChange={(value) => setPreferences({ ...preferences, hybrid: value })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.switchRow}>
                <Label style={[styles.switchLabel, { color: colors.foreground }]}>On-site</Label>
                <Switch
                  value={preferences.onsite}
                  onValueChange={(value) => setPreferences({ ...preferences, onsite: value })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Preferred Locations */}
        <Card style={[styles.card, { borderColor: colors.border }]}>
          <CardContent style={styles.cardContent}>
            <View style={styles.cardHeaderWithAction}>
              <View style={styles.cardHeader}>
                <Ionicons name="navigate" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  Preferred Locations
                </Text>
              </View>
              <TouchableOpacity style={styles.addButton}>
                <Text style={[styles.addButtonText, { color: colors.primary }]}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.badgesContainer}>
              {locations.map((location) => (
                <Badge key={location} variant="secondary" style={styles.badge}>
                  <View style={styles.badgeContent}>
                    <Text style={[styles.badgeText, { color: colors.foreground }]}>{location}</Text>
                    <TouchableOpacity onPress={() => removeLocation(location)}>
                      <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                </Badge>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Employment Type */}
        <Card style={[styles.card, { borderColor: colors.border }]}>
          <CardContent style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Employment Type</Text>
            </View>

            <View style={styles.switchSection}>
              <View style={styles.switchRow}>
                <Label style={[styles.switchLabel, { color: colors.foreground }]}>Full-time</Label>
                <Switch
                  value={preferences.fullTime}
                  onValueChange={(value) => setPreferences({ ...preferences, fullTime: value })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.switchRow}>
                <Label style={[styles.switchLabel, { color: colors.foreground }]}>Part-time</Label>
                <Switch
                  value={preferences.partTime}
                  onValueChange={(value) => setPreferences({ ...preferences, partTime: value })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.switchRow}>
                <Label style={[styles.switchLabel, { color: colors.foreground }]}>Contract</Label>
                <Switch
                  value={preferences.contract}
                  onValueChange={(value) => setPreferences({ ...preferences, contract: value })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Job Titles */}
        <Card style={[styles.card, { borderColor: colors.border }]}>
          <CardContent style={styles.cardContent}>
            <View style={styles.cardHeaderWithAction}>
              <View style={styles.cardHeader}>
                <Ionicons name="briefcase" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  Desired Job Titles
                </Text>
              </View>
              <TouchableOpacity style={styles.addButton}>
                <Text style={[styles.addButtonText, { color: colors.primary }]}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.badgesContainer}>
              {jobTypes.map((job) => (
                <Badge key={job} variant="secondary" style={styles.badge}>
                  <View style={styles.badgeContent}>
                    <Text style={[styles.badgeText, { color: colors.foreground }]}>{job}</Text>
                    <TouchableOpacity onPress={() => removeJobType(job)}>
                      <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                </Badge>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Salary Range */}
        <Card style={[styles.card, { borderColor: colors.border }]}>
          <CardContent style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Ionicons name="cash" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Salary Range</Text>
            </View>

            <View style={styles.sliderSection}>
              <View style={styles.sliderRow}>
                <View style={styles.sliderHeader}>
                  <Label style={[styles.sliderLabel, { color: colors.foreground }]}>Minimum</Label>
                  <Text style={[styles.sliderValue, { color: colors.foreground }]}>
                    £{preferences.salaryMin}k
                  </Text>
                </View>
                <View style={[styles.customSlider, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.sliderTrack,
                      { width: `${((preferences.salaryMin - 20) / 130) * 100}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                <View style={styles.sliderControls}>
                  <TouchableOpacity
                    onPress={() =>
                      setPreferences({ ...preferences, salaryMin: Math.max(20, preferences.salaryMin - 5) })
                    }
                    style={[styles.sliderButton, { backgroundColor: colors.muted }]}
                  >
                    <Ionicons name="remove" size={20} color={colors.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      setPreferences({ ...preferences, salaryMin: Math.min(150, preferences.salaryMin + 5) })
                    }
                    style={[styles.sliderButton, { backgroundColor: colors.muted }]}
                  >
                    <Ionicons name="add" size={20} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sliderRow}>
                <View style={styles.sliderHeader}>
                  <Label style={[styles.sliderLabel, { color: colors.foreground }]}>Maximum</Label>
                  <Text style={[styles.sliderValue, { color: colors.foreground }]}>
                    £{preferences.salaryMax}k+
                  </Text>
                </View>
                <View style={[styles.customSlider, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.sliderTrack,
                      { width: `${((preferences.salaryMax - 20) / 130) * 100}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                <View style={styles.sliderControls}>
                  <TouchableOpacity
                    onPress={() =>
                      setPreferences({ ...preferences, salaryMax: Math.max(20, preferences.salaryMax - 5) })
                    }
                    style={[styles.sliderButton, { backgroundColor: colors.muted }]}
                  >
                    <Ionicons name="remove" size={20} color={colors.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      setPreferences({ ...preferences, salaryMax: Math.min(150, preferences.salaryMax + 5) })
                    }
                    style={[styles.sliderButton, { backgroundColor: colors.muted }]}
                  >
                    <Ionicons name="add" size={20} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.salaryRange, { backgroundColor: colors.muted + '50' }]}>
                <Text style={[styles.salaryRangeLabel, { color: colors.mutedForeground }]}>
                  Preferred range:{' '}
                  <Text style={[styles.salaryRangeValue, { color: colors.foreground }]}>
                    £{preferences.salaryMin}k - £{preferences.salaryMax}k+
                  </Text>
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderWidth: 2,
  },
  cardContent: {
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    padding: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchSection: {
    gap: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeText: {
    fontSize: 14,
  },
  sliderSection: {
    gap: 24,
  },
  sliderRow: {
    gap: 12,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 16,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  customSlider: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderTrack: {
    height: '100%',
    borderRadius: 4,
  },
  sliderControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  sliderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  salaryRange: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  salaryRangeLabel: {
    fontSize: 14,
  },
  salaryRangeValue: {
    fontWeight: '700',
  },
  saveButton: {
    width: '100%',
    paddingVertical: 16,
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
