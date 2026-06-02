import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ThemedModal, type ThemedAlertConfig } from '@/components/ui/themed-modal';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useChatUnread } from '@/lib/chat-unread-context';
import { clearCachedData, invalidateCache } from '@/lib/query-client';
import { aiChatApi, authApi, profileApi, ProfileCompletion, resolveMediaUrl, ResumeRecord, WorkExperienceEntry, EducationEntry } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ProfileDraft = {
  name: string;
  contactNumber: string;
  email: string;
  headline: string;
  about: string;
  location: string;
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
  const insets = useSafeAreaInsets();
  const { setHasUnreadAiMsg } = useChatUnread();

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
  const [workExperiences, setWorkExperiences] = useState<WorkExperienceEntry[]>([]);
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([]);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [originalDraft, setOriginalDraft] = useState<ProfileDraft>(createEmptyDraft());
  const [draft, setDraft] = useState<ProfileDraft>(createEmptyDraft());

  const [newExp, setNewExp] = useState({ job_title: '', company: '', duration: '' });
  const [newEdu, setNewEdu] = useState({ institution: '', field_of_study: '', start_year: '', end_year: '' });
  const [pendingExperiences, setPendingExperiences] = useState<{ job_title: string; company: string; duration: string }[]>([]);
  const [pendingEducation, setPendingEducation] = useState<{ institution: string; field_of_study: string; start_year: string; end_year: string }[]>([]);
  const [removedExpIds, setRemovedExpIds] = useState<number[]>([]);
  const [removedEduIds, setRemovedEduIds] = useState<number[]>([]);
  const [alertConfig, setAlertConfig] = useState<ThemedAlertConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
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
        skills: profile?.skills || [],
        completion: profile?.completion || null,
      };

      setOriginalDraft(builtDraft);
      setDraft(builtDraft);
      setAvatarUrl(resolveMediaUrl(user.avatar));
      setResumes(resumeItems);
      setHasResume(resumeItems.length > 0 || Boolean(profile?.completion?.filled?.resume));
      setWorkExperiences(profile?.work_experiences || []);
      setEducationEntries(profile?.education_entries || []);
    } catch (error) {
      console.log('Could not fetch profile preview data:', error);
      setLoadError('Failed to load profile. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
    // Profile changed (fields / resume / avatar) — refresh the cached profile.
    invalidateCache.me();
  };

  const removeSavedExperience = (id: number) => {
    setWorkExperiences((prev) => prev.filter((e) => e.id !== id));
    setRemovedExpIds((prev) => [...prev, id]);
  };

  const removeSavedEducation = (id: number) => {
    setEducationEntries((prev) => prev.filter((e) => e.id !== id));
    setRemovedEduIds((prev) => [...prev, id]);
  };

  const addPendingExperience = () => {
    const { job_title, company, duration } = newExp;
    if (!job_title.trim() || !company.trim() || !duration.trim()) return;
    setPendingExperiences((prev) => [...prev, { job_title: job_title.trim(), company: company.trim(), duration: duration.trim() }]);
    setNewExp({ job_title: '', company: '', duration: '' });
  };

  const removePendingExperience = (index: number) => {
    setPendingExperiences((prev) => prev.filter((_, i) => i !== index));
  };

  const addPendingEducation = () => {
    const { institution, field_of_study, start_year, end_year } = newEdu;
    if (!institution.trim() || !field_of_study.trim() || !start_year.trim() || !end_year.trim()) return;
    setPendingEducation((prev) => [...prev, { institution: institution.trim(), field_of_study: field_of_study.trim(), start_year: start_year.trim(), end_year: end_year.trim() }]);
    setNewEdu({ institution: '', field_of_study: '', start_year: '', end_year: '' });
  };

  const removePendingEducation = (index: number) => {
    setPendingEducation((prev) => prev.filter((_, i) => i !== index));
  };

  const getProfileUpdatePayload = () => {
    return {
      full_name: draft.name.trim() || originalDraft.name,
      contact_number: draft.contactNumber.trim(),
      headline: draft.headline.trim(),
      about: draft.about.trim(),
      location: draft.location.trim(),
      skills: toNormalizedList(draft.skills),
    };
  };

  const saveDraftToDatabase = async () => {
    await profileApi.updateProfile(getProfileUpdatePayload());
    for (const id of removedExpIds) {
      await profileApi.deleteWorkExperience(id);
    }
    for (const id of removedEduIds) {
      await profileApi.deleteEducation(id);
    }
    for (const exp of pendingExperiences) {
      await profileApi.addWorkExperience({
        job_title: exp.job_title,
        company: exp.company,
        duration: parseInt(exp.duration, 10),
      });
    }
    for (const edu of pendingEducation) {
      await profileApi.addEducation({
        institution: edu.institution,
        field_of_study: edu.field_of_study,
        start_year: parseInt(edu.start_year, 10),
        end_year: parseInt(edu.end_year, 10),
      });
    }
    if (removedExpIds.length > 0 || removedEduIds.length > 0 || pendingExperiences.length > 0 || pendingEducation.length > 0) {
      const user = await authApi.getMe();
      setWorkExperiences(user.profile?.work_experiences || []);
      setEducationEntries(user.profile?.education_entries || []);
      setPendingExperiences([]);
      setPendingEducation([]);
      setRemovedExpIds([]);
      setRemovedEduIds([]);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveDraftToDatabase();
      await refreshCompletionAndResumes();
      router.replace('/(jobseeker)/profile' as any);
    } catch (error: any) {
      setAlertConfig({
        title: 'Save failed',
        message: error?.message || 'Unable to save profile changes.',
        buttons: [{ label: 'OK' }],
      });
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
      await authApi.updateState('data_collection');
      invalidateCache.me();
      router.replace('/(jobseeker)/profile' as any);
    } catch (error: any) {
      setAlertConfig({
        title: 'Save failed',
        message: error?.message || 'Unable to save profile changes.',
        buttons: [{ label: 'OK' }],
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!resumes.length) return;
    try {
      setIsUploadingResume(true);
      await profileApi.deleteResume(resumes[0].id);
      setResumes([]);
      setHasResume(false);
      await refreshCompletionAndResumes();
    } catch (error: any) {
      setAlertConfig({
        title: 'Delete failed',
        message: error?.message || 'Unable to delete resume.',
        buttons: [{ label: 'OK' }],
      });
    } finally {
      setIsUploadingResume(false);
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

      // Delete existing resume first (replace flow)
      if (resumes.length > 0) {
        await profileApi.deleteResume(resumes[0].id);
      }

      const file = result.assets[0];
      await profileApi.uploadResume(file.uri, file.name || 'resume.pdf', file.size || 0);
      await refreshCompletionAndResumes();
      setAlertConfig({
        title: 'Resume uploaded',
        message: 'Your resume was uploaded successfully.',
        buttons: [{ label: 'OK' }],
      });
    } catch (error: any) {
      setAlertConfig({
        title: 'Upload failed',
        message: error?.message || 'Unable to upload resume right now.',
        buttons: [{ label: 'OK' }],
      });
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
      setAlertConfig({
        title: 'Profile photo updated',
        message: 'Your profile picture has been updated.',
        buttons: [{ label: 'OK' }],
      });
    } catch (error: any) {
      setAlertConfig({
        title: 'Upload failed',
        message: error?.message || 'Unable to upload profile picture right now.',
        buttons: [{ label: 'OK' }],
      });
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

  if (loadError) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>{loadError}</Text>
        <TouchableOpacity
          onPress={fetchProfile}
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.retryButtonText, { color: colors.background }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={8}
            style={styles.headerBack}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{pageHeading}</Text>
          <View style={styles.headerBack} />
        </View>
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
                <View key={skill} style={styles.savedTag}>
                  <Ionicons name="checkmark-circle" size={13} color="#10b981" />
                  <Text style={[styles.savedTagText, { color: colors.foreground }]}>{skill}</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Work Experience</Text>
            {(workExperiences.length > 0 || pendingExperiences.length > 0) && (
              <View style={styles.chipContainer}>
                {workExperiences.map((exp) => (
                  <View key={exp.id} style={[styles.savedTag]}>
                    <Ionicons name="checkmark-circle" size={13} color="#10b981" />
                    <Text style={[styles.savedTagText, { color: colors.foreground }]}>
                      {exp.duration != null ? `${exp.duration} year${exp.duration !== 1 ? 's' : ''} as ` : ''}{exp.job_title} at {exp.company}
                    </Text>
                    <TouchableOpacity onPress={() => removeSavedExperience(exp.id)}>
                      <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                ))}
                {pendingExperiences.map((exp, index) => (
                  <View key={`pending-exp-${index}`} style={[styles.chip, styles.pendingChip, { borderColor: colors.primary, backgroundColor: colors.background }]}>
                    <Text style={[styles.chipText, { color: colors.foreground }]}>
                      {exp.duration} year{parseInt(exp.duration, 10) !== 1 ? 's' : ''} as {exp.job_title} at {exp.company}
                    </Text>
                    <TouchableOpacity onPress={() => removePendingExperience(index)}>
                      <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <TextInput
              value={newExp.job_title}
              onChangeText={(v) => setNewExp((prev) => ({ ...prev, job_title: v }))}
              placeholder="Job title"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <TextInput
              value={newExp.company}
              onChangeText={(v) => setNewExp((prev) => ({ ...prev, company: v }))}
              placeholder="Company"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <View style={styles.inlineInputRow}>
              <TextInput
                value={newExp.duration}
                onChangeText={(v) => setNewExp((prev) => ({ ...prev, duration: v.replace(/[^0-9]/g, '') }))}
                placeholder="Duration (years)"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                style={[styles.inlineInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              <Button
                variant="outline"
                onPress={addPendingExperience}
                disabled={!newExp.job_title.trim() || !newExp.company.trim() || !newExp.duration.trim()}
              >
                <Text style={{ color: colors.foreground }}>Add</Text>
              </Button>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Education</Text>
            {(educationEntries.length > 0 || pendingEducation.length > 0) && (
              <View style={styles.chipContainer}>
                {educationEntries.map((edu) => (
                  <View key={edu.id} style={[styles.savedTag]}>
                    <Ionicons name="checkmark-circle" size={13} color="#10b981" />
                    <Text style={[styles.savedTagText, { color: colors.foreground }]}>
                      {edu.field_of_study || edu.degree || 'Degree'} from {edu.institution}
                    </Text>
                    <TouchableOpacity onPress={() => removeSavedEducation(edu.id)}>
                      <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                ))}
                {pendingEducation.map((edu, index) => (
                  <View key={`pending-edu-${index}`} style={[styles.chip, styles.pendingChip, { borderColor: colors.primary, backgroundColor: colors.background }]}>
                    <Text style={[styles.chipText, { color: colors.foreground }]}>
                      {edu.field_of_study} from {edu.institution}
                    </Text>
                    <TouchableOpacity onPress={() => removePendingEducation(index)}>
                      <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <TextInput
              value={newEdu.institution}
              onChangeText={(v) => setNewEdu((prev) => ({ ...prev, institution: v }))}
              placeholder="Institute"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <TextInput
              value={newEdu.field_of_study}
              onChangeText={(v) => setNewEdu((prev) => ({ ...prev, field_of_study: v }))}
              placeholder="Program / Field of Study"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <View style={styles.inlineInputRow}>
              <TextInput
                value={newEdu.start_year}
                onChangeText={(v) => setNewEdu((prev) => ({ ...prev, start_year: v.replace(/[^0-9]/g, '') }))}
                placeholder="Start year"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                style={[styles.inlineInput, { flex: 1, color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              <TextInput
                value={newEdu.end_year}
                onChangeText={(v) => setNewEdu((prev) => ({ ...prev, end_year: v.replace(/[^0-9]/g, '') }))}
                placeholder="End year"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                style={[styles.inlineInput, { flex: 1, color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              <Button
                variant="outline"
                onPress={addPendingEducation}
                disabled={!newEdu.institution.trim() || !newEdu.field_of_study.trim() || !newEdu.start_year.trim() || !newEdu.end_year.trim()}
              >
                <Text style={{ color: colors.foreground }}>Add</Text>
              </Button>
            </View>
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

            {!hasResume && (
              <Text style={styles.resumeRequiredNote}>
                ⚠️ A resume is required to apply for jobs.
              </Text>
            )}

            {hasResume ? (
              <View style={styles.resumeActions}>
                <Button
                  variant="outline"
                  onPress={handleDeleteResume}
                  disabled={isUploadingResume}
                  style={[styles.resumeActionButton, { borderColor: '#ef4444' }]}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    <Text style={[styles.buttonText, { color: '#ef4444' }]}>Delete</Text>
                  </View>
                </Button>
                <Button
                  variant="outline"
                  onPress={handleResumeUpload}
                  disabled={isUploadingResume}
                  style={styles.resumeActionButton}
                >
                  <View style={styles.buttonContent}>
                    {isUploadingResume ? (
                      <ActivityIndicator size="small" color={colors.foreground} />
                    ) : (
                      <Ionicons name="cloud-upload-outline" size={16} color={colors.foreground} />
                    )}
                    <Text style={[styles.buttonText, { color: colors.foreground }]}>
                      {isUploadingResume ? 'Uploading...' : 'Upload New'}
                    </Text>
                  </View>
                </Button>
              </View>
            ) : (
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
            )}
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
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerBack: {
    width: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    flex: 1,
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
    maxWidth: '100%',
  },
  pendingChip: {
    borderStyle: 'dashed',
  },
  savedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#10b98118',
    maxWidth: '100%',
  },
  savedTagText: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  chipText: {
    fontSize: 13,
    flexShrink: 1,
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
  resumeActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  resumeActionButton: {
    flex: 1,
  },
  resumeRequiredNote: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 6,
    textAlign: 'center',
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
    textAlign: 'center',
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    gap: 3,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  entrySubtitle: {
    fontSize: 13,
  },
  entryMeta: {
    fontSize: 12,
  },
  entryDescription: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
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
