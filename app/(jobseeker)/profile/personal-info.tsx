import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Colors } from '@/constants/theme';
import { getProfile, updateProfile, type Profile } from '@/lib/mock-data';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
  });

  useEffect(() => {
    const userProfile = getProfile();
    setProfile(userProfile);
    setFormData({
      full_name: userProfile.full_name,
      email: userProfile.email,
      phone: "",
      location: "",
      bio: "",
    });
  }, []);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateProfile({ full_name: formData.full_name });
    Alert.alert(
      'Profile Updated',
      'Your personal information has been saved successfully.'
    );
    setTimeout(() => router.back(), 1000);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.cardForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.cardForeground }]}>
            Personal Info
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Profile Photo */}
          <Card style={styles.card}>
            <CardContent>
              <Label style={[styles.sectionLabel, { color: colors.cardForeground }]}>
                Profile Photo
              </Label>
              <View style={styles.avatarSection}>
                <Avatar size={80}>
                  <AvatarFallback 
                    style={{ ...styles.avatarFallback, backgroundColor: colors.primary }}
                  >
                    <Text style={styles.avatarText}>
                      {profile?.full_name?.charAt(0) || "U"}
                    </Text>
                  </AvatarFallback>
                </Avatar>
                <View style={styles.avatarButtons}>
                  <Button variant="outline" style={styles.uploadButton}>
                    <Ionicons name="camera-outline" size={16} color={colors.primary} />
                    <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
                      Upload Photo
                    </Text>
                  </Button>
                  <TouchableOpacity style={styles.removeButton}>
                    <Text style={[styles.removeButtonText, { color: colors.mutedForeground }]}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card style={styles.card}>
            <CardContent>
              <View style={styles.formField}>
                <Label style={[styles.label, { color: colors.cardForeground }]}>
                  Full Name
                </Label>
                <Input
                  value={formData.full_name}
                  onChangeText={(text) => handleChange('full_name', text)}
                  placeholder="Enter your full name"
                  style={styles.input}
                />
              </View>

              <View style={styles.formField}>
                <Label style={[styles.label, { color: colors.cardForeground }]}>
                  Email Address
                </Label>
                <Input
                  value={formData.email}
                  onChangeText={(text) => handleChange('email', text)}
                  placeholder="your.email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              <View style={styles.formField}>
                <Label style={[styles.label, { color: colors.cardForeground }]}>
                  Phone Number
                </Label>
                <Input
                  value={formData.phone}
                  onChangeText={(text) => handleChange('phone', text)}
                  placeholder="+44 7XXX XXXXXX"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>

              <View style={styles.formField}>
                <Label style={[styles.label, { color: colors.cardForeground }]}>
                  Location
                </Label>
                <Input
                  value={formData.location}
                  onChangeText={(text) => handleChange('location', text)}
                  placeholder="City, Country"
                  style={styles.input}
                />
              </View>

              <View style={styles.formField}>
                <Label style={[styles.label, { color: colors.cardForeground }]}>
                  Bio
                </Label>
                <Textarea
                  value={formData.bio}
                  onChangeText={(text) => handleChange('bio', text)}
                  placeholder="Tell us about yourself..."
                  numberOfLines={4}
                  style={styles.textarea}
                />
              </View>
            </CardContent>
          </Card>

          {/* Save Buttons */}
          <View style={styles.actionButtons}>
            <Button 
              variant="outline" 
              onPress={() => router.back()}
              style={styles.cancelButton}
            >
              <Text style={[styles.cancelButtonText, { color: colors.primary }]}>
                Cancel
              </Text>
            </Button>
            <Button 
              onPress={handleSave}
              style={styles.saveButton}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.saveButtonText}>
                Save Changes
              </Text>
            </Button>
          </View>
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
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
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
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  card: {
    marginBottom: 0,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  avatarButtons: {
    flex: 1,
    gap: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 14,
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    marginTop: 0,
  },
  textarea: {
    marginTop: 0,
    minHeight: 100,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
