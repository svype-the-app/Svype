import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

export default function PreferencesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [preferences, setPreferences] = useState({
    remote: true,
    hybrid: true,
    onsite: false,
    fullTime: true,
    partTime: false,
    contract: false,
    salaryMin: 40,
    salaryMax: 100,
  });

  const [locations, setLocations] = useState(['London', 'Manchester', 'Remote']);
  const [jobTypes, setJobTypes] = useState([
    'Software Engineer',
    'Frontend Developer',
    'Full Stack Developer',
  ]);

  const handleSave = () => {
    Alert.alert('Preferences Saved', 'Your job preferences have been updated successfully.');
  };

  const removeItem = (arr: string[], setter: (val: string[]) => void, item: string) => {
    setter(arr.filter((i) => i !== item));
  };

  const addLocation = () => {
    Alert.prompt(
      'Add Location',
      'Enter a new preferred location',
      (text) => {
        if (text && text.trim()) {
          setLocations([...locations, text.trim()]);
        }
      }
    );
  };

  const addJobType = () => {
    Alert.prompt(
      'Add Job Title',
      'Enter a desired job title',
      (text) => {
        if (text && text.trim()) {
          setJobTypes([...jobTypes, text.trim()]);
        }
      }
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Job Preferences</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Work Location */}
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Ionicons name="map-outline" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>
                Work Location
              </Text>
            </View>

            <View style={styles.switchList}>
              <View style={styles.switchItem}>
                <Label style={styles.switchLabel}>Remote</Label>
                <Switch
                  checked={preferences.remote}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, remote: checked })}
                />
              </View>
              <View style={styles.switchItem}>
                <Label style={styles.switchLabel}>Hybrid</Label>
                <Switch
                  checked={preferences.hybrid}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, hybrid: checked })}
                />
              </View>
              <View style={styles.switchItem}>
                <Label style={styles.switchLabel}>On-site</Label>
                <Switch
                  checked={preferences.onsite}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, onsite: checked })}
                />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Preferred Locations */}
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <View style={styles.cardHeaderWithAction}>
              <View style={styles.cardHeader}>
                <Ionicons name="location-outline" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>
                  Preferred Locations
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addLocation}
                activeOpacity={0.7}
              >
                <Text style={[styles.addButtonText, { color: colors.primary }]}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.badgeContainer}>
              {locations.map((location) => (
                <View key={location} style={styles.badgeWrapper}>
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: colors.secondary, ...styles.badge }}
                  >
                    <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>
                      {location}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeItem(locations, setLocations, location)}
                      style={styles.removeButton}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.removeButtonText, { color: colors.secondaryForeground }]}>
                        ×
                      </Text>
                    </TouchableOpacity>
                  </Badge>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Employment Type */}
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>
                Employment Type
              </Text>
            </View>

            <View style={styles.switchList}>
              <View style={styles.switchItem}>
                <Label style={styles.switchLabel}>Full-time</Label>
                <Switch
                  checked={preferences.fullTime}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, fullTime: checked })
                  }
                />
              </View>
              <View style={styles.switchItem}>
                <Label style={styles.switchLabel}>Part-time</Label>
                <Switch
                  checked={preferences.partTime}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, partTime: checked })
                  }
                />
              </View>
              <View style={styles.switchItem}>
                <Label style={styles.switchLabel}>Contract</Label>
                <Switch
                  checked={preferences.contract}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, contract: checked })
                  }
                />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Job Titles */}
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <View style={styles.cardHeaderWithAction}>
              <View style={styles.cardHeader}>
                <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>
                  Desired Job Titles
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addJobType}
                activeOpacity={0.7}
              >
                <Text style={[styles.addButtonText, { color: colors.primary }]}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.badgeContainer}>
              {jobTypes.map((job) => (
                <View key={job} style={styles.badgeWrapper}>
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: colors.secondary, ...styles.badge }}
                  >
                    <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>
                      {job}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeItem(jobTypes, setJobTypes, job)}
                      style={styles.removeButton}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.removeButtonText, { color: colors.secondaryForeground }]}>
                        ×
                      </Text>
                    </TouchableOpacity>
                  </Badge>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Salary Range */}
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Ionicons name="cash-outline" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>
                Salary Range
              </Text>
            </View>

            <View style={styles.salarySection}>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderHeader}>
                  <Label style={styles.sliderLabel}>Minimum</Label>
                  <Text style={[styles.sliderValue, { color: colors.foreground }]}>
                    £{preferences.salaryMin}k
                  </Text>
                </View>
                <Slider
                  value={[preferences.salaryMin]}
                  onValueChange={([value]) => setPreferences({ ...preferences, salaryMin: value })}
                  min={20}
                  max={150}
                  step={5}
                />
              </View>

              <View style={styles.sliderContainer}>
                <View style={styles.sliderHeader}>
                  <Label style={styles.sliderLabel}>Maximum</Label>
                  <Text style={[styles.sliderValue, { color: colors.foreground }]}>
                    £{preferences.salaryMax}k+
                  </Text>
                </View>
                <Slider
                  value={[preferences.salaryMax]}
                  onValueChange={([value]) => setPreferences({ ...preferences, salaryMax: value })}
                  min={20}
                  max={150}
                  step={5}
                />
              </View>

              <View style={styles.rangeDisplay}>
                <Text style={[styles.rangeText, { color: colors.mutedForeground }]}>
                  Preferred range:{' '}
                  <Text style={[styles.rangeValue, { color: colors.foreground }]}>
                    £{preferences.salaryMin}k - £{preferences.salaryMax}k+
                  </Text>
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button size="lg" onPress={handleSave} style={styles.saveButton}>
          Save Preferences
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
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
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchList: {
    gap: 16,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeWrapper: {
    marginBottom: 0,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    marginLeft: 4,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 20,
  },
  salarySection: {
    gap: 24,
  },
  sliderContainer: {
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
    fontWeight: '600',
  },
  rangeDisplay: {
    paddingTop: 8,
    alignItems: 'center',
  },
  rangeText: {
    fontSize: 14,
  },
  rangeValue: {
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});
