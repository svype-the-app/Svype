import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Colors } from '@/constants/theme';
import { mockPortfolioLinks, mockResumes, PortfolioLink, ResumeFile } from '@/lib/mock-profile';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

export default function ResumeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [resumes, setResumes] = useState<ResumeFile[]>(mockResumes);
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>(
    mockPortfolioLinks.map(link => ({ ...link, icon: link.icon as keyof typeof Ionicons.glyphMap }))
  );

  const [newLink, setNewLink] = useState({ platform: '', url: '' });
  const [showAddLink, setShowAddLink] = useState(false);

  const handleUploadResume = () => {
    Alert.alert('Upload Resume', 'File picker would open here in production');
  };

  const handleDeleteResume = (id: string) => {
    Alert.alert('Delete Resume', 'Are you sure you want to delete this resume?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setResumes(resumes.filter((r) => r.id !== id)),
      },
    ]);
  };

  const handleAddLink = () => {
    if (newLink.platform && newLink.url) {
      const icon = newLink.platform.toLowerCase().includes('github')
        ? 'logo-github'
        : newLink.platform.toLowerCase().includes('linkedin')
        ? 'logo-linkedin'
        : 'globe-outline';

      setPortfolioLinks([
        ...portfolioLinks,
        {
          id: Date.now().toString(),
          platform: newLink.platform,
          url: newLink.url,
          icon: icon as keyof typeof Ionicons.glyphMap,
        },
      ]);
      setNewLink({ platform: '', url: '' });
      setShowAddLink(false);
    }
  };

  const handleDeleteLink = (id: string) => {
    setPortfolioLinks(portfolioLinks.filter((l) => l.id !== id));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Resume & Portfolio</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              Manage your documents and links
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Resume Section */}
        <Card style={[styles.card, { borderColor: colors.border }]}>
          <CardContent style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Resume/CV</Text>
                <Text style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
                  Upload your latest resume
                </Text>
              </View>
              <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="document-text" size={24} color={colors.primary} />
              </View>
            </View>

            {/* Resume Files */}
            {resumes.length > 0 ? (
              <View style={styles.filesContainer}>
                {resumes.map((resume) => (
                  <View
                    key={resume.id}
                    style={[styles.fileItem, { backgroundColor: colors.muted + '50', borderColor: colors.border }]}
                  >
                    <View style={[styles.fileIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="document" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={1}>
                        {resume.name}
                      </Text>
                      <View style={styles.fileMeta}>
                        <Text style={[styles.fileMetaText, { color: colors.mutedForeground }]}>
                          {resume.size}
                        </Text>
                        <Text style={[styles.fileMetaText, { color: colors.mutedForeground }]}>•</Text>
                        <Text style={[styles.fileMetaText, { color: colors.mutedForeground }]}>
                          {resume.uploadedAt}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteResume(resume.id)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.muted + '30' }]}>
                <Ionicons name="document-outline" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
                  No resume uploaded yet
                </Text>
              </View>
            )}

            <Button onPress={handleUploadResume} style={styles.uploadButton}>
              <View style={styles.buttonContent}>
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={styles.buttonText}>Upload Resume</Text>
              </View>
            </Button>
          </CardContent>
        </Card>

        {/* Portfolio Links Section */}
        <Card style={[styles.card, { borderColor: colors.border }]}>
          <CardContent style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Portfolio Links</Text>
                <Text style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
                  Add your professional profiles
                </Text>
              </View>
              <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="link" size={24} color={colors.primary} />
              </View>
            </View>

            {/* Portfolio Links */}
            {portfolioLinks.length > 0 && (
              <View style={styles.linksContainer}>
                {portfolioLinks.map((link) => (
                  <View
                    key={link.id}
                    style={[styles.linkItem, { backgroundColor: colors.muted + '50', borderColor: colors.border }]}
                  >
                    <View style={[styles.linkIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name={link.icon} size={20} color={colors.primary} />
                    </View>
                    <View style={styles.linkInfo}>
                      <Text style={[styles.linkPlatform, { color: colors.foreground }]}>
                        {link.platform}
                      </Text>
                      <Text style={[styles.linkUrl, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {link.url}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteLink(link.id)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add Link Form */}
            {showAddLink && (
              <View style={[styles.addLinkForm, { backgroundColor: colors.muted + '30' }]}>
                <View style={styles.formField}>
                  <Label style={[styles.label, { color: colors.foreground }]}>Platform Name</Label>
                  <Input
                    value={newLink.platform}
                    onChangeText={(text) => setNewLink({ ...newLink, platform: text })}
                    placeholder="e.g., GitHub, LinkedIn"
                    style={styles.input}
                  />
                </View>
                <View style={styles.formField}>
                  <Label style={[styles.label, { color: colors.foreground }]}>URL</Label>
                  <Input
                    value={newLink.url}
                    onChangeText={(text) => setNewLink({ ...newLink, url: text })}
                    placeholder="e.g., github.com/username"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
                <View style={styles.formButtons}>
                  <Button
                    variant="outline"
                    onPress={() => {
                      setShowAddLink(false);
                      setNewLink({ platform: '', url: '' });
                    }}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </Button>
                  <Button onPress={handleAddLink} style={styles.addButton}>
                    Add Link
                  </Button>
                </View>
              </View>
            )}

            {!showAddLink && (
              <Button
                variant="outline"
                onPress={() => setShowAddLink(true)}
                style={styles.addLinkButton}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                  <Text style={[styles.addLinkButtonText, { color: colors.primary }]}>
                    Add Portfolio Link
                  </Text>
                </View>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card style={[styles.tipsCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <CardContent style={styles.cardContent}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={20} color={colors.primary} />
              <Text style={[styles.tipsTitle, { color: colors.foreground }]}>Tips</Text>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                  Keep your resume updated and tailored to each job
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                  Add links to showcase your work and projects
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                  Use PDF format for best compatibility
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
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
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filesContainer: {
    gap: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  fileMetaText: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  emptyStateText: {
    fontSize: 14,
  },
  uploadButton: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linksContainer: {
    gap: 12,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkInfo: {
    flex: 1,
  },
  linkPlatform: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  linkUrl: {
    fontSize: 12,
  },
  addLinkForm: {
    padding: 16,
    borderRadius: 8,
    gap: 16,
  },
  formField: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    marginTop: 0,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  addButton: {
    flex: 1,
  },
  addLinkButton: {
    width: '100%',
  },
  addLinkButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
    borderWidth: 2,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
