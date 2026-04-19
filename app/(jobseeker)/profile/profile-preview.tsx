import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authApi, profileApi, ProfileCompletion, resolveMediaUrl, ResumeRecord } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type ProfileDraft = {
  name: string;
  contactNumber: string;
  email: string;
  headline: string;
  about: string;
  location: string;
  experience: string;
  education: string;
  skills: string[];
  completion: ProfileCompletion | null;
};

const createEmptyDraft = (): ProfileDraft => ({
  name: '',
  contactNumber: '',
  email: '',
  headline: '',
  about: '',
  location: '',
  experience: '',
  education: '',
  skills: [],
  completion: null,
});

const toNormalizedList = (values: string[]): string[] => {
  const unique = new Set<string>();
  for (const value of values) {
    const cleaned = value.trim();
    if (cleaned) unique.add(cleaned);
  }
  return Array.from(unique);
};

export default function ProfilePreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const isEditMode = params.mode === 'edit';
  const isPersonalInfoMode = params.mode === 'personal';
  const isDirectEditMode = isEditMode || isPersonalInfoMode;
  const pageHeading = isPersonalInfoMode
    ? 'Edit Personal Information'
    : isEditMode
      ? 'Profile Completion'
      : 'Your Profile Preview';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [hasResume, setHasResume] = useState(false);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [originalDraft, setOriginalDraft] = useState<ProfileDraft>(createEmptyDraft());
  const [draft, setDraft] = useState<ProfileDraft>(createEmptyDraft());

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [user, resumeItems] = await Promise.all([
          authApi.getMe(),
          profileApi.getResumes().catch(() => []),
        ]);

        const profile = user.profile;
        const fullName = `${user.first_name} ${user.last_name}`.trim() || 'User';
        const builtDraft: ProfileDraft = {
          name: fullName,
          contactNumber: profile?.contact_number || '',
          email: user.email,
          headline: profile?.headline || '',
          about: profile?.about || '',
          location: profile?.location || '',
          experience: profile?.experience || '',
          education: profile?.education || '',
          skills: profile?.skills || [],
          completion: profile?.completion || null,
        };

        setOriginalDraft(builtDraft);
        setDraft(builtDraft);
        setAvatarUrl(resolveMediaUrl(user.avatar));
        setResumes(resumeItems);
        setHasResume(resumeItems.length > 0 || Boolean(profile?.completion?.filled?.resume));
      } catch (error) {
        console.log('Could not fetch profile preview data:', error);
        Alert.alert('Session expired', 'Please log in again.');
        try {
          await authApi.logout();
        } catch {
          // ignore
        }
        router.replace('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const completion = draft.completion?.percentage || 15;

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(originalDraft);
  }, [draft, originalDraft]);

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const addSkill = () => {
    const value = newSkill.trim();
    if (!value) return;
    setDraft((prev) => ({
      ...prev,
      skills: toNormalizedList([...prev.skills, value]),
    }));
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    setDraft((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const refreshCompletionAndResumes = async () => {
    const [user, resumeItems] = await Promise.all([
      authApi.getMe(),
      profileApi.getResumes().catch(() => []),
    ]);

    const updatedCompletion = user.profile?.completion || null;
    const updatedDraft = {
      ...draft,
      completion: updatedCompletion,
    };

    setDraft(updatedDraft);
    setOriginalDraft(updatedDraft);
    setAvatarUrl(resolveMediaUrl(user.avatar));
    setResumes(resumeItems);
    setHasResume(resumeItems.length > 0 || Boolean(updatedCompletion?.filled?.resume));
  };

  const getProfileUpdatePayload = () => {
    return {
      full_name: draft.name.trim() || originalDraft.name,
      contact_number: draft.contactNumber.trim(),
      headline: draft.headline.trim(),
      about: draft.about.trim(),
      location: draft.location.trim(),
      experience: draft.experience.trim(),
      education: draft.education.trim(),
      skills: toNormalizedList(draft.skills),
      // Keep legacy fields in sync where older screens still read them.
      career_goals: draft.education.trim(),
    };
  };

  const saveDraftToDatabase = async () => {
    await profileApi.updateProfile(getProfileUpdatePayload());
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveDraftToDatabase();
      await refreshCompletionAndResumes();
      router.replace('/(jobseeker)/profile' as any);
    } catch (error: any) {
      Alert.alert('Save failed', error?.message || 'Unable to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setDraft(originalDraft);
    }
    if (isDirectEditMode) {
      router.back();
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      setIsSaving(true);
      await saveDraftToDatabase();
      await authApi.updateState('active');
      router.replace('/(jobseeker)/swipe' as any);
    } catch (error: any) {
      Alert.alert('Save failed', error?.message || 'Unable to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeUpload = async () => {
    try {
      setIsUploadingResume(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const file = result.assets[0];
      await profileApi.uploadResume(file.uri, file.name || 'resume.pdf', file.size || 0);
      await refreshCompletionAndResumes();
      Alert.alert('Resume uploaded', 'Your resume was uploaded successfully.');
    } catch (error: any) {
      Alert.alert('Upload failed', error?.message || 'Unable to upload resume right now.');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleAvatarUpload = async () => {
    try {
      setIsUploadingAvatar(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const file = result.assets[0];
      const fileName = file.name || 'profile-photo.jpg';
      const updatedUser = await authApi.uploadAvatar(file.uri, fileName);
      setAvatarUrl(resolveMediaUrl(updatedUser.avatar));
      await refreshCompletionAndResumes();
      Alert.alert('Profile photo updated', 'Your profile picture has been updated.');
    } catch (error: any) {
      Alert.alert('Upload failed', error?.message || 'Unable to upload profile picture right now.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{pageHeading}</Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
          {isDirectEditMode ? 'Edit and save your profile sections.' : 'Complete your profile to stand out.'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isPersonalInfoMode && (
          <Card>
            <CardContent style={styles.cardContent}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Personal Information</Text>

              <View>
                <Text style={[styles.sectionSubTitle, { color: colors.foreground }]}>Full Name</Text>
                <TextInput
                  value={draft.name}
                  onChangeText={(value) => setDraft((prev) => ({ ...prev, name: value }))}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                />
              </View>

              <View>
                <Text style={[styles.sectionSubTitle, { color: colors.foreground }]}>Contact Number</Text>
                <TextInput
                  value={draft.contactNumber}
                  onChangeText={(value) => setDraft((prev) => ({ ...prev, contactNumber: value }))}
                  placeholder="e.g. +60 12 345 6789"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="phone-pad"
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                />
              </View>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <Text style={[styles.completionTitle, { color: colors.foreground }]}>Profile Completion</Text>
              <Text style={[styles.completionPercentage, { color: getCompletionColor(completion) }]}>{completion}%</Text>
            </View>
            <Progress value={completion} style={styles.progressBar} />
            <View style={styles.completionItems}>
              {draft.completion?.filled &&
                Object.entries(draft.completion.filled).map(([key, isFilled]) => (
                  <View key={key} style={styles.completionItem}>
                    <Ionicons
                      name={isFilled ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={isFilled ? '#10b981' : colors.mutedForeground}
                    />
                    <Text style={[styles.completionItemText, { color: isFilled ? colors.foreground : colors.mutedForeground }]}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                  </View>
                ))}
            </View>
          </CardContent>
        </Card>

        <Button onPress={() => {}} style={styles.aiProfileButton}>
          <View style={styles.buttonContent}>
            <Ionicons name="sparkles" size={16} color="#ffffff" />
            <Text style={styles.aiProfileButtonText}>AI profile completion</Text>
          </View>
        </Button>

        <Card>
          <CardContent style={styles.cardContent}>
            <View style={styles.profileHeader}>
              <TouchableOpacity onPress={handleAvatarUpload} activeOpacity={0.85} style={styles.avatarTouchable}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}> 
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
                  ) : (
                    <Text style={[styles.avatarText, { color: colors.background }]}>{getInitials(draft.name)}</Text>
                  )}
                </View>
                <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary }]}> 
                  {isUploadingAvatar ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Ionicons name="camera" size={14} color={colors.background} />
                  )}
                </View>
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={[styles.name, { color: colors.foreground }]}>{draft.name || 'Your Name'}</Text>
                <Text style={[styles.contactText, { color: colors.mutedForeground }]}>{draft.email || 'No email'}</Text>
                <Text style={[styles.avatarHint, { color: colors.primary }]}>Tap photo to change profile picture</Text>
              </View>
            </View>

            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Professional Headline</Text>
              <TextInput
                value={draft.headline}
                onChangeText={(value) => setDraft((prev) => ({ ...prev, headline: value }))}
                placeholder="e.g. Product Designer with 4 years in mobile UX"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              />
            </View>

            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About</Text>
              <TextInput
                value={draft.about}
                onChangeText={(value) => setDraft((prev) => ({ ...prev, about: value }))}
                placeholder="Tell employers more about your background"
                placeholderTextColor={colors.mutedForeground}
                multiline
                style={[styles.textarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              />
            </View>

            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Location</Text>
              <TextInput
                value={draft.location}
                onChangeText={(value) => setDraft((prev) => ({ ...prev, location: value }))}
                placeholder="City, Country"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              />
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skills</Text>
            <View style={styles.chipContainer}>
              {draft.skills.map((skill) => (
                <View key={skill} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.background }]}> 
                  <Text style={[styles.chipText, { color: colors.foreground }]}>{skill}</Text>
                  <TouchableOpacity onPress={() => removeSkill(skill)}>
                    <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.inlineInputRow}>
              <TextInput
                value={newSkill}
                onChangeText={setNewSkill}
                placeholder="Add a skill"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.inlineInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              <Button variant="outline" onPress={addSkill}>
                <Text style={{ color: colors.foreground }}>Add</Text>
              </Button>
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Experience</Text>
            <TextInput
              value={draft.experience}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, experience: value }))}
              placeholder="e.g. 3 years in frontend development"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            />

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Education</Text>
            <TextInput
              value={draft.education}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, education: value }))}
              placeholder="e.g. BSc in Computer Science, University of Malaya"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.textarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Resume (PDF)</Text>
            {hasResume ? (
              <View style={[styles.resumeUploaded, { backgroundColor: colors.muted }]}> 
                <Ionicons name="document-text" size={24} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resumeText, { color: colors.foreground }]}>Resume uploaded</Text>
                  {!!resumes.length && (
                    <Text style={[styles.resumeMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {resumes[0].file_name}
                    </Text>
                  )}
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              </View>
            ) : (
              <View style={[styles.emptySection, { borderColor: colors.border }]}> 
                <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>No resume uploaded yet</Text>
              </View>
            )}

            <Button variant="outline" onPress={handleResumeUpload} disabled={isUploadingResume}>
              <View style={styles.buttonContent}>
                {isUploadingResume ? (
                  <ActivityIndicator size="small" color={colors.foreground} />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={18} color={colors.foreground} />
                )}
                <Text style={[styles.buttonText, { color: colors.foreground }]}>
                  {isUploadingResume ? 'Uploading...' : 'Upload PDF Resume'}
                </Text>
              </View>
            </Button>
          </CardContent>
        </Card>
      </ScrollView>

      <View style={[styles.bottomActions, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {isDirectEditMode ? (
          <>
            <Button variant="outline" onPress={handleCancel} style={styles.actionButton}>
              <View style={styles.buttonContent}>
                <Ionicons name="close" size={18} color={colors.foreground} />
                <Text style={[styles.buttonText, { color: colors.foreground }]}>Cancel</Text>
              </View>
            </Button>
            <Button onPress={handleSave} disabled={isSaving} style={styles.actionButton}>
              <View style={styles.buttonContent}>
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Ionicons name="save-outline" size={18} color={colors.background} />
                )}
                <Text style={[styles.buttonTextPrimary, { color: colors.background }]}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </View>
            </Button>
          </>
        ) : (
          <Button onPress={handleSaveAndContinue} disabled={isSaving} style={styles.singleActionButton}>
            <View style={styles.buttonContent}>
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Ionicons name="save-outline" size={18} color={colors.background} />
              )}
              <Text style={[styles.buttonTextPrimary, { color: colors.background }]}>
                {isSaving ? 'Saving...' : 'Save and Continue'}
              </Text>
            </View>
          </Button>
        )}
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
    gap: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
  },
  contactText: {
    fontSize: 13,
  },
  avatarHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionSubTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: {
    fontSize: 13,
  },
  inlineInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  inlineInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  resumeUploaded: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  resumeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resumeMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  emptySection: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  emptySectionText: {
    fontSize: 13,
  },
  aiProfileButton: {
    backgroundColor: '#7c3aed',
  },
  aiProfileButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
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
  singleActionButton: {
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
