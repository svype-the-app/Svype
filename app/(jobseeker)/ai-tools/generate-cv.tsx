import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { cvTemplates } from '@/lib/mock-ai-tools';
import { cvApi, CvSections, CvTemplate } from '@/services/cv';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function GenerateCVScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { template: templateParam } = useLocalSearchParams<{ template?: string }>();

  const VALID_TEMPLATES: CvTemplate[] = ['modern', 'classic', 'creative', 'minimal'];
  const initialTemplate: CvTemplate =
    templateParam && VALID_TEMPLATES.includes(templateParam as CvTemplate)
      ? (templateParam as CvTemplate)
      : (cvTemplates[0].id as CvTemplate);

  const [selectedTemplate, setSelectedTemplate] = useState<CvTemplate>(initialTemplate);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'customize' | 'preview'>('customize');
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvSections, setCvSections] = useState<CvSections | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Pre-select the template from the AI recommendation (if provided via params)
  useEffect(() => {
    if (templateParam && VALID_TEMPLATES.includes(templateParam as CvTemplate)) {
      setSelectedTemplate(templateParam as CvTemplate);
    }
  }, [templateParam]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const result = await cvApi.generateCv({ template: selectedTemplate });
      setCvUrl(result.cv_url);
      setCvSections(result.sections);
      setIsGenerated(true);
      setIsSaved(false);
      setActiveTab('preview');
    } catch (error: any) {
      const msg = error?.message || 'Failed to generate CV. Please try again.';
      setGenerateError(msg);
      Alert.alert('Generation Failed', msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!cvUrl) return;
    try {
      await Linking.openURL(cvUrl);
    } catch {
      Alert.alert('Error', 'Could not open the PDF. Try copying the URL manually.');
    }
  };

  const handleShare = async () => {
    if (!cvUrl) return;
    try {
      await Linking.openURL(cvUrl);
    } catch {
      Alert.alert('Error', 'Could not share the CV.');
    }
  };

  const handleSaveAsResume = async () => {
    if (!cvUrl) return;
    setIsSaving(true);
    try {
      await cvApi.saveAsResume(cvUrl);
      setIsSaved(true);
      Alert.alert('Saved', 'Your CV has been saved as a resume in your profile.');
    } catch (error: any) {
      Alert.alert('Save failed', error?.message || 'Could not save CV as resume. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.cardForeground} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.cardForeground }]}>
              Generate CV
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              Create AI-powered CVs tailored to jobs
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.muted + '40' }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'customize' && { backgroundColor: colors.card }
          ]}
          onPress={() => setActiveTab('customize')}
        >
          <Ionicons
            name="brush-outline"
            size={16}
            color={activeTab === 'customize' ? colors.cardForeground : colors.mutedForeground}
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'customize' ? colors.cardForeground : colors.mutedForeground }
          ]}>
            Customize
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'preview' && { backgroundColor: colors.card },
            !isGenerated && styles.tabDisabled
          ]}
          onPress={() => isGenerated && setActiveTab('preview')}
          disabled={!isGenerated}
        >
          <Ionicons
            name="eye-outline"
            size={16}
            color={activeTab === 'preview' && isGenerated ? colors.cardForeground : colors.mutedForeground}
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'preview' && isGenerated ? colors.cardForeground : colors.mutedForeground }
          ]}>
            Preview
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {activeTab === 'customize' && (
            <>
              {/* Template Selection */}
              <Card style={styles.card}>
                <CardContent>
                  <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
                    Choose Template
                  </Text>
                  <View style={styles.templatesGrid}>
                    {cvTemplates.map((template) => (
                      <TouchableOpacity
                        key={template.id}
                        onPress={() => setSelectedTemplate(template.id as CvTemplate)}
                        style={[
                          styles.templateCard,
                          {
                            borderColor: selectedTemplate === template.id ? colors.primary : colors.border,
                            backgroundColor: selectedTemplate === template.id ? colors.primary + '0D' : 'transparent'
                          }
                        ]}
                      >
                        <View style={[styles.templatePreview, { backgroundColor: colors.primary + '10' }]}>
                          <Ionicons name="document-text-outline" size={40} color={colors.primary + '40'} />
                        </View>
                        <View style={styles.templateInfo}>
                          <Text style={[styles.templateName, { color: colors.cardForeground }]}>
                            {template.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </CardContent>
              </Card>

              {/* AI Badge */}
              <Card style={styles.card}>
                <CardContent>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderText}>
                      <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
                        AI-Powered Generation
                      </Text>
                      <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                        Your profile data will be used to craft a polished, professional CV with strong action verbs and compelling language.
                      </Text>
                    </View>
                    <Badge variant="secondary" style={styles.aiBadge}>
                      <Ionicons name="sparkles" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.aiBadgeText, { color: colors.mutedForeground }]}>
                        AI Powered
                      </Text>
                    </Badge>
                  </View>
                </CardContent>
              </Card>

              {/* Error display */}
              {generateError && (
                <Card style={[styles.card, { borderColor: '#ef4444', borderWidth: 1 }]}>
                  <CardContent>
                    <Text style={{ color: '#ef4444', fontSize: 13 }}>{generateError}</Text>
                  </CardContent>
                </Card>
              )}

              {/* Generate Button */}
              <Button
                onPress={handleGenerate}
                disabled={isGenerating}
                style={styles.generateButton}
              >
                {isGenerating ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Generating with AI...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Generate CV</Text>
                  </>
                )}
              </Button>
            </>
          )}

          {activeTab === 'preview' && cvSections && (
            <>
              {/* CV Preview — structured sections from the AI */}
              <Card style={styles.card}>
                <CardContent>
                  <View style={[styles.cvPreview, { backgroundColor: '#fff' }]}>
                    <View style={styles.cvContent}>
                      <View style={[styles.cvHeader, { borderBottomColor: colors.primary }]}>
                        <Text style={styles.cvName}>{cvSections.name || ''}</Text>
                        <Text style={styles.cvJobTitle}>{cvSections.headline || ''}</Text>
                      </View>
                      <View style={styles.cvSections}>
                        {/* Summary */}
                        {!!cvSections.summary && (
                          <View style={styles.cvSection}>
                            <Text style={[styles.cvSectionTitle, { color: colors.primary }]}>
                              PROFESSIONAL SUMMARY
                            </Text>
                            <Text style={styles.cvTextGray}>{cvSections.summary}</Text>
                          </View>
                        )}
                        {/* Experience */}
                        {(cvSections.experience ?? []).length > 0 && (
                          <View style={styles.cvSection}>
                            <Text style={[styles.cvSectionTitle, { color: colors.primary }]}>
                              EXPERIENCE
                            </Text>
                            {(cvSections.experience ?? []).map((job, i) => (
                              <View key={i} style={[styles.cvExperience, { marginBottom: 8 }]}>
                                <Text style={styles.cvExperienceTitle}>{job.title} — {job.company}</Text>
                                <Text style={styles.cvExperienceDate}>{job.dates}</Text>
                                {(job.bullets ?? []).slice(0, 3).map((b, j) => (
                                  <Text key={j} style={[styles.cvTextGray, { marginTop: 2 }]}>• {b}</Text>
                                ))}
                              </View>
                            ))}
                          </View>
                        )}
                        {/* Education */}
                        {(cvSections.education ?? []).length > 0 && (
                          <View style={styles.cvSection}>
                            <Text style={[styles.cvSectionTitle, { color: colors.primary }]}>
                              EDUCATION
                            </Text>
                            {(cvSections.education ?? []).map((edu, i) => (
                              <View key={i} style={{ marginBottom: 6 }}>
                                <Text style={styles.cvExperienceTitle}>{edu.degree} — {edu.institution}</Text>
                                <Text style={styles.cvExperienceDate}>{edu.dates}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                        {/* Skills */}
                        {(cvSections.skills ?? []).length > 0 && (
                          <View style={styles.cvSection}>
                            <Text style={[styles.cvSectionTitle, { color: colors.primary }]}>SKILLS</Text>
                            <Text style={styles.cvTextGray}>{(cvSections.skills ?? []).join(', ')}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </CardContent>
              </Card>

              {/* Actions */}
              <View style={styles.actionsGrid}>
                <Button
                  variant="outline"
                  onPress={handleShare}
                  style={styles.actionButton}
                >
                  <Ionicons name="open-outline" size={16} color={colors.primary} />
                  <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                    Open
                  </Text>
                </Button>
                <Button
                  onPress={handleDownload}
                  style={styles.actionButton}
                >
                  <Ionicons name="download-outline" size={16} color="#fff" />
                  <Text style={styles.downloadButtonText}>Download PDF</Text>
                </Button>
              </View>
              <Button
                onPress={handleSaveAsResume}
                disabled={isSaving || isSaved}
                style={[styles.saveResumeButton, isSaved && { backgroundColor: '#10b981' }]}
              >
                {isSaving ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.downloadButtonText}>Saving...</Text>
                  </>
                ) : isSaved ? (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.downloadButtonText}>Saved to Profile</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="save-outline" size={16} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.downloadButtonText}>Save as Resume</Text>
                  </>
                )}
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
  },
  header: {
    marginTop: 40,
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
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 4,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabDisabled: {
    opacity: 0.5,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  templatePreview: {
    aspectRatio: 3 / 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateInfo: {
    padding: 8,
  },
  templateName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderText: {
    flex: 1,
    marginRight: 8,
  },
  cardDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  aiBadgeText: {
    fontSize: 11,
  },
  selectTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectText: {
    fontSize: 14,
    flex: 1,
  },
  jobPicker: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  jobOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  jobCompany: {
    fontSize: 12,
  },
  aiOptimization: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  aiOptimizationContent: {
    flexDirection: 'row',
    gap: 12,
  },
  aiOptimizationText: {
    flex: 1,
  },
  aiOptimizationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  aiOptimizationDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  profilePreview: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileTitle: {
    fontSize: 13,
    marginBottom: 8,
  },
  profileBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  profileBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  profileBadgeText: {
    fontSize: 11,
  },
  profileNote: {
    fontSize: 11,
  },
  profileLink: {
    textDecorationLine: 'underline',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cvPreview: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cvContent: {
    padding: 24,
  },
  cvHeader: {
    borderBottomWidth: 2,
    paddingBottom: 12,
    marginBottom: 12,
  },
  cvName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  cvJobTitle: {
    fontSize: 16,
    color: '#666',
  },
  cvSections: {
    gap: 12,
  },
  cvSection: {
    gap: 4,
  },
  cvSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  cvText: {
    fontSize: 12,
    color: '#000',
  },
  cvTextGray: {
    fontSize: 12,
    color: '#555',
  },
  cvExperience: {
    gap: 2,
  },
  cvExperienceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  cvExperienceDate: {
    fontSize: 11,
    color: '#666',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveResumeButton: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
