import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Clipboard, ScrollView, Share, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

const toneOptions = [
  { value: "professional", label: "Professional", description: "Formal and business-like" },
  { value: "enthusiastic", label: "Enthusiastic", description: "Passionate and energetic" },
  { value: "confident", label: "Confident", description: "Strong and assertive" },
  { value: "creative", label: "Creative", description: "Unique and innovative" }
];

const mockJobs = [
  { 
    id: "1", 
    title: "Senior Frontend Engineer", 
    company: "TechCorp Inc.",
    description: "Looking for an experienced React developer..."
  },
  { 
    id: "2", 
    title: "Full Stack Developer", 
    company: "StartupXYZ",
    description: "Join our fast-growing startup..."
  },
  { 
    id: "3", 
    title: "React Developer", 
    company: "Digital Agency",
    description: "Creative agency seeking talented developer..."
  }
];

export default function GenerateCoverLetterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const [showJobPicker, setShowJobPicker] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const selectedJobData = mockJobs.find(j => j.id === selectedJob);
    const letter = `Dear Hiring Manager,

I am writing to express my strong interest in the ${selectedJobData?.title} position at ${selectedJobData?.company}. With over 5 years of experience in full-stack development and a proven track record of delivering high-quality web applications, I am confident that I would be a valuable addition to your team.

Throughout my career, I have developed expertise in React, TypeScript, Node.js, and modern cloud technologies. At my current role at Tech Corp, I have led the development of several customer-facing applications that serve millions of users, resulting in a 40% increase in user engagement and a 25% improvement in application performance.

What particularly excites me about this opportunity at ${selectedJobData?.company} is ${selectedJobData?.description.toLowerCase()} I am passionate about creating exceptional user experiences and believe my technical skills combined with my collaborative approach would make me an ideal fit for your team.

${additionalNotes ? `\n${additionalNotes}\n\n` : ''}I would welcome the opportunity to discuss how my experience and skills align with your needs. Thank you for considering my application.

Sincerely,
John Doe`;

    setGeneratedLetter(letter);
    setIsGenerating(false);
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleCopy = async () => {
    Clipboard.setString(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      await Share.share({
        message: generatedLetter,
        title: 'Cover Letter'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share cover letter');
    }
  };

  const selectedJobData = mockJobs.find(j => j.id === selectedJob);

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
              Generate Cover Letter
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              AI-powered, tailored to each job
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Job Selection */}
          <Card style={styles.card}>
            <CardContent>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>
                    Select Job
                  </Text>
                  <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                    Choose the position you&rsquo;re applying for
                  </Text>
                </View>
                <Badge variant="secondary" style={styles.aiBadge}>
                  <Ionicons name="sparkles" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.aiBadgeText, { color: colors.mutedForeground }]}>
                    AI Powered
                  </Text>
                </Badge>
              </View>

              <TouchableOpacity 
                style={[styles.selectTrigger, { 
                  backgroundColor: colors.card,
                  borderColor: colors.border 
                }]}
                onPress={() => setShowJobPicker(!showJobPicker)}
              >
                <Text style={[
                  styles.selectText,
                  { color: selectedJob ? colors.cardForeground : colors.mutedForeground }
                ]}>
                  {selectedJob 
                    ? mockJobs.find(j => j.id === selectedJob)?.title
                    : "Select a job to generate cover letter"
                  }
                </Text>
                <Ionicons 
                  name={showJobPicker ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.mutedForeground} 
                />
              </TouchableOpacity>

              {showJobPicker && (
                <View style={[styles.jobPicker, { backgroundColor: colors.muted + '40', borderColor: colors.border }]}>
                  {mockJobs.map((job) => (
                    <TouchableOpacity
                      key={job.id}
                      style={[styles.jobOption, selectedJob === job.id && { backgroundColor: colors.primary + '10' }]}
                      onPress={() => {
                        setSelectedJob(job.id);
                        setShowJobPicker(false);
                      }}
                    >
                      <Text style={[styles.jobTitle, { color: colors.cardForeground }]}>
                        {job.title}
                      </Text>
                      <Text style={[styles.jobCompany, { color: colors.mutedForeground }]}>
                        {job.company}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {selectedJob && (
                <View style={[styles.selectedJob, { backgroundColor: colors.muted + '80' }]}>
                  <Text style={[styles.selectedJobTitle, { color: colors.cardForeground }]}>
                    {selectedJobData?.title}
                  </Text>
                  <Text style={[styles.selectedJobCompany, { color: colors.mutedForeground }]}>
                    {selectedJobData?.company}
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>

          {/* Tone Selection */}
          <Card style={styles.card}>
            <CardContent>
              <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>
                Choose Tone
              </Text>
              <View style={styles.toneGrid}>
                {toneOptions.map((tone) => (
                  <TouchableOpacity
                    key={tone.value}
                    onPress={() => setSelectedTone(tone.value)}
                    style={[
                      styles.toneOption,
                      {
                        borderColor: selectedTone === tone.value ? colors.primary : colors.border,
                        backgroundColor: selectedTone === tone.value ? colors.primary + '0D' : 'transparent'
                      }
                    ]}
                  >
                    <Text style={[styles.toneLabel, { color: colors.cardForeground }]}>
                      {tone.label}
                    </Text>
                    <Text style={[styles.toneDescription, { color: colors.mutedForeground }]}>
                      {tone.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card style={styles.card}>
            <CardContent>
              <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>
                Additional Information (Optional)
              </Text>
              <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                Add any specific points you&rsquo;d like to mention in your cover letter
              </Text>
              <Textarea
                placeholder="e.g., mention a specific project, connection to the company, or relevant achievement..."
                value={additionalNotes}
                onChangeText={setAdditionalNotes}
                numberOfLines={4}
                style={styles.textarea}
              />
            </CardContent>
          </Card>

          {/* Generate Button */}
          {!generatedLetter && (
            <Button
              onPress={handleGenerate}
              disabled={!selectedJob || isGenerating}
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
                  <Text style={styles.buttonText}>Generate Cover Letter</Text>
                </>
              )}
            </Button>
          )}

          {/* Generated Letter */}
          {generatedLetter && (
            <>
              <Card style={styles.card}>
                <CardContent>
                  <View style={styles.letterHeader}>
                    <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>
                      Your Cover Letter
                    </Text>
                    <Badge variant="secondary" style={styles.generatedBadge}>
                      <Ionicons name="document-text" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.generatedBadgeText, { color: colors.mutedForeground }]}>
                        AI Generated
                      </Text>
                    </Badge>
                  </View>

                  <View style={[styles.letterContent, { 
                    backgroundColor: colorScheme === 'dark' ? colors.muted + '40' : '#fff',
                    borderColor: colors.border 
                  }]}>
                    <Text style={[styles.letterText, { color: colors.cardForeground }]}>
                      {generatedLetter}
                    </Text>
                  </View>

                  <View style={styles.letterInfo}>
                    <Ionicons name="sparkles" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.letterInfoText, { color: colors.mutedForeground }]}>
                      Tailored for {selectedJobData?.title} at {selectedJobData?.company}
                    </Text>
                  </View>
                </CardContent>
              </Card>

              {/* Actions */}
              <View style={styles.actionsGrid}>
                <Button
                  variant="outline"
                  onPress={handleRegenerate}
                  disabled={isGenerating}
                  style={styles.actionButton}
                >
                  <Ionicons name="refresh" size={16} color={colors.primary} />
                  <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                    Regenerate
                  </Text>
                </Button>
                <Button
                  variant="outline"
                  onPress={handleCopy}
                  style={styles.actionButton}
                >
                  {copied ? (
                    <>
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                        Copied!
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="copy-outline" size={16} color={colors.primary} />
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                        Copy
                      </Text>
                    </>
                  )}
                </Button>
                <Button
                  onPress={handleDownload}
                  style={styles.actionButton}
                >
                  <Ionicons name="download-outline" size={16} color="#fff" />
                  <Text style={styles.downloadButtonText}>Download</Text>
                </Button>
              </View>
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
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
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
  selectedJob: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
  },
  selectedJobTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedJobCompany: {
    fontSize: 12,
  },
  toneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  toneOption: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  toneLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  toneDescription: {
    fontSize: 11,
  },
  textarea: {
    marginTop: 16,
    minHeight: 100,
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
  letterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  generatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  generatedBadgeText: {
    fontSize: 11,
  },
  letterContent: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 400,
  },
  letterText: {
    fontSize: 14,
    lineHeight: 22,
  },
  letterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  letterInfoText: {
    fontSize: 11,
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
});
