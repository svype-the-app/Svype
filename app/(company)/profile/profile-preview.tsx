import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authApi, resolveMediaUrl } from '@/services/api';
import { companyApi } from '@/services/company';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

type CompanyDraft = {
  name: string;
  email: string;
  location: string;
  website: string;
  description: string;
  culture: string[];
  benefits: string[];
  completionPercentage: number;
  completionFilled: Record<string, boolean>;
};

const createEmptyDraft = (): CompanyDraft => ({
  name: '',
  email: '',
  location: '',
  website: '',
  description: '',
  culture: [],
  benefits: [],
  completionPercentage: 0,
  completionFilled: {},
});

const toNormalizedList = (values: string[]): string[] => {
  const unique = new Set<string>();
  for (const v of values) {
    const c = v.trim();
    if (c) unique.add(c);
  }
  return Array.from(unique);
};

const getCompletionColor = (pct: number) => {
  if (pct >= 90) return '#16a34a';
  if (pct >= 50) return '#d97706';
  return '#dc2626';
};

const FIELD_LABELS: Record<string, string> = {
  name: 'Company Name',
  email: 'Company Email',
  location: 'Location',
  website: 'Website',
  description: 'Description',
  logo: 'Company Logo',
  culture: 'Culture Tags',
  benefits: 'Benefits',
};

export default function CompanyProfilePreviewScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';
  const isOnboarding = mode === 'onboarding';
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [newCultureTag, setNewCultureTag] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [draft, setDraft] = useState<CompanyDraft>(createEmptyDraft());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authApi.getMe();
        const company = (user as any)?.company;
        const built: CompanyDraft = {
          name: company?.name || '',
          email: company?.email || user.email || '',
          location: company?.location || '',
          website: company?.website || '',
          description: company?.description || '',
          culture: company?.culture || [],
          benefits: company?.benefits || [],
          completionPercentage: Number(company?.completion?.percentage || 0),
          completionFilled: company?.completion?.filled || {},
        };
        setDraft(built);
        setLogoUrl(resolveMediaUrl((user as any).avatar));
      } catch (error) {
        console.log('Could not fetch company data:', error);
        Alert.alert('Error', 'Could not load company profile.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const completion = draft.completionPercentage;

  const refreshCompletion = async () => {
    try {
      const user = await authApi.getMe();
      const company = (user as any)?.company;
      setDraft((prev) => ({
        ...prev,
        completionPercentage: Number(company?.completion?.percentage || 0),
        completionFilled: company?.completion?.filled || {},
      }));
    } catch {
      // silent
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await companyApi.updateMyCompany({
        name: draft.name.trim(),
        email: draft.email.trim(),
        location: draft.location.trim(),
        website: draft.website.trim(),
        description: draft.description.trim(),
        culture: toNormalizedList(draft.culture),
        benefits: toNormalizedList(draft.benefits),
      });
      await refreshCompletion();
      Alert.alert('Saved', 'Company profile updated successfully.');
      router.back();
    } catch (error: any) {
      Alert.alert('Save failed', error?.message || 'Unable to save company profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      setIsSaving(true);
      await companyApi.updateMyCompany({
        name: draft.name.trim(),
        email: draft.email.trim(),
        location: draft.location.trim(),
        website: draft.website.trim(),
        description: draft.description.trim(),
        culture: toNormalizedList(draft.culture),
        benefits: toNormalizedList(draft.benefits),
      });
      await authApi.updateState('active');
      router.replace('/(company)/profile' as any);
    } catch (error: any) {
      Alert.alert('Save failed', error?.message || 'Unable to save company profile.');
    } finally {
      setIsSaving(false);
    }
  };


  const handleLogoUpload = async () => {
    try {
      setIsUploadingLogo(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.length) return;
      const file = result.assets[0];
      const updatedUser = await authApi.uploadAvatar(file.uri, file.name || 'logo.jpg');
      setLogoUrl(resolveMediaUrl(updatedUser.avatar));
      await refreshCompletion();
      Alert.alert('Logo updated', 'Company logo has been updated.');
    } catch (error: any) {
      Alert.alert('Upload failed', error?.message || 'Unable to upload logo right now.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const addCultureTag = () => {
    const tag = newCultureTag.trim();
    if (!tag || draft.culture.includes(tag)) return;
    setDraft((prev) => ({ ...prev, culture: [...prev.culture, tag] }));
    setNewCultureTag('');
  };

  const removeCultureTag = (tag: string) => {
    setDraft((prev) => ({ ...prev, culture: prev.culture.filter((c) => c !== tag) }));
  };

  const addBenefit = () => {
    const b = newBenefit.trim();
    if (!b || draft.benefits.includes(b)) return;
    setDraft((prev) => ({ ...prev, benefits: [...prev.benefits, b] }));
    setNewBenefit('');
  };

  const removeBenefit = (b: string) => {
    setDraft((prev) => ({ ...prev, benefits: prev.benefits.filter((x) => x !== b) }));
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading company profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isOnboarding ? 'Company Profile Setup' : isEditMode ? 'Edit Company Information' : 'Complete Company Profile'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
          {isOnboarding
            ? 'Set up your company profile to get started.'
            : isEditMode
            ? 'Update your company details below.'
            : 'Fill in your company details to attract top candidates.'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Completion Card */}
        <Card>
          <CardContent style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Profile Completion</Text>
              <Text style={[styles.completionPercentage, { color: getCompletionColor(completion) }]}>{completion}%</Text>
            </View>
            <Progress value={completion} style={styles.progressBar} />
            <View style={styles.completionItems}>
              {Object.entries(draft.completionFilled).map(([key, isFilled]) => (
                <View key={key} style={styles.completionItem}>
                  <Ionicons
                    name={isFilled ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={isFilled ? '#10b981' : colors.mutedForeground}
                  />
                  <Text style={[styles.completionItemText, { color: isFilled ? colors.foreground : colors.mutedForeground }]}>
                    {FIELD_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Company Logo</Text>
            <TouchableOpacity onPress={handleLogoUpload} activeOpacity={0.85} style={styles.logoTouchable}>
              <View style={[styles.logoContainer, { backgroundColor: colors.primary + '20', borderColor: colors.border }]}>
                {logoUrl ? (
                  <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="cover" />
                ) : (
                  <Ionicons name="business" size={40} color={colors.primary} />
                )}
                <View style={[styles.logoEditBadge, { backgroundColor: colors.primary }]}>
                  {isUploadingLogo ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="camera" size={14} color="#fff" />
                  )}
                </View>
              </View>
              <Text style={[styles.logoHint, { color: colors.primary }]}>Tap to upload company logo</Text>
            </TouchableOpacity>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Company Name</Text>
            <TextInput
              value={draft.name}
              onChangeText={(v) => setDraft((p) => ({ ...p, name: v }))}
              placeholder="e.g. Acme Corporation"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            />

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Company Email</Text>
            <TextInput
              value={draft.email}
              onChangeText={(v) => setDraft((p) => ({ ...p, email: v }))}
              placeholder="contact@company.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            />

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Location</Text>
            <TextInput
              value={draft.location}
              onChangeText={(v) => setDraft((p) => ({ ...p, location: v }))}
              placeholder="e.g. London, United Kingdom"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            />

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Website</Text>
            <TextInput
              value={draft.website}
              onChangeText={(v) => setDraft((p) => ({ ...p, website: v }))}
              placeholder="https://www.company.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="url"
              autoCapitalize="none"
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            />
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About the Company</Text>
            <TextInput
              value={draft.description}
              onChangeText={(v) => setDraft((p) => ({ ...p, description: v }))}
              placeholder="Tell candidates what makes your company great..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.textarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            />
          </CardContent>
        </Card>

        {/* Culture Tags */}
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Culture Tags</Text>
            <View style={styles.chipContainer}>
              {draft.culture.map((tag) => (
                <View key={tag} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Text style={[styles.chipText, { color: colors.foreground }]}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeCultureTag(tag)}>
                    <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.inlineInputRow}>
              <TextInput
                value={newCultureTag}
                onChangeText={setNewCultureTag}
                placeholder="e.g. Remote-friendly"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.inlineInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                onSubmitEditing={addCultureTag}
              />
              <Button variant="outline" onPress={addCultureTag}>
                <Text style={{ color: colors.foreground }}>Add</Text>
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Benefits</Text>
            <View style={styles.chipContainer}>
              {draft.benefits.map((b) => (
                <View key={b} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Text style={[styles.chipText, { color: colors.foreground }]}>{b}</Text>
                  <TouchableOpacity onPress={() => removeBenefit(b)}>
                    <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.inlineInputRow}>
              <TextInput
                value={newBenefit}
                onChangeText={setNewBenefit}
                placeholder="e.g. Health Insurance"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.inlineInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                onSubmitEditing={addBenefit}
              />
              <Button variant="outline" onPress={addBenefit}>
                <Text style={{ color: colors.foreground }}>Add</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      </ScrollView>

      <View style={[styles.bottomActions, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {isOnboarding ? (
          <Button onPress={handleSaveAndContinue} disabled={isSaving} style={styles.singleActionButton}>
            <View style={styles.buttonContent}>
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Ionicons name="arrow-forward" size={18} color={colors.background} />
              )}
              <Text style={[styles.buttonTextPrimary, { color: colors.background }]}>
                {isSaving ? 'Saving...' : 'Save and Continue'}
              </Text>
            </View>
          </Button>
        ) : (
          <>
            <Button variant="outline" onPress={() => router.back()} style={styles.actionButton}>
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
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 14 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  headerSubtitle: { fontSize: 13 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 120, gap: 16 },

  completionCard: { padding: 20 },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  completionPercentage: { fontSize: 20, fontWeight: '700' },
  progressBar: { marginBottom: 12 },
  completionItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  completionItem: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: '45%' },
  completionItemText: { fontSize: 12 },

  cardContent: { padding: 20, gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 4,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 4,
  },

  logoTouchable: { alignItems: 'center', paddingVertical: 8 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  logoImage: { width: '100%', height: '100%' },
  logoEditBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHint: { fontSize: 12, marginTop: 8 },

  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontSize: 13 },
  inlineInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  inlineInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },

  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
  },
  actionButton: { flex: 1 },
  singleActionButton: { flex: 1 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  buttonText: { fontSize: 14, fontWeight: '600' },
  buttonTextPrimary: { fontSize: 14, fontWeight: '600' },
});
