import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

interface PortfolioLink {
  id: number;
  title: string;
  url: string;
  type: 'website' | 'github' | 'linkedin';
}

interface Experience {
  id: number;
  title: string;
  company: string;
  period: string;
  description: string;
}

export default function ResumeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [hasResume, setHasResume] = useState(true);

  const handleUpload = () => {
    Alert.alert('Upload Resume', 'File upload functionality would be implemented here.');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Resume',
      'Are you sure you want to delete your resume?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setHasResume(false),
        },
      ]
    );
  };

  const portfolioLinks: PortfolioLink[] = [
    { id: 1, title: 'Personal Website', url: 'https://example.com', type: 'website' },
    { id: 2, title: 'GitHub Profile', url: 'https://github.com/username', type: 'github' },
    { id: 3, title: 'LinkedIn', url: 'https://linkedin.com/in/username', type: 'linkedin' },
  ];

  const skills: string[] = [
    'React',
    'TypeScript',
    'Next.js',
    'Node.js',
    'Python',
    'UI/UX Design',
    'Figma',
    'AWS',
    'Docker',
    'PostgreSQL',
  ];

  const experiences: Experience[] = [
    {
      id: 1,
      title: 'Senior Developer',
      company: 'TechCorp Inc.',
      period: '2022 - Present',
      description:
        'Led development of customer-facing web applications using React and Node.js.',
    },
  ];

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'github':
        return 'logo-github';
      case 'linkedin':
        return 'logo-linkedin';
      default:
        return 'link-outline';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={colors.cardForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.cardForeground }]}>
            Resume & Portfolio
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Resume Section */}
        <Card style={[styles.card, { borderWidth: 2, borderColor: colors.border }]}>
          <CardContent style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
                Resume/CV
              </Text>
            </View>

            {hasResume ? (
              <View
                style={[
                  styles.resumeContainer,
                  {
                    borderColor: colors.border,
                    borderStyle: 'dashed',
                  },
                ]}
              >
                <View style={styles.resumeInfo}>
                  <View
                    style={[styles.resumeIcon, { backgroundColor: colors.primary + '20' }]}
                  >
                    <Ionicons name="document-text" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.resumeDetails}>
                    <Text style={[styles.resumeTitle, { color: colors.cardForeground }]}>
                      Resume_2026.pdf
                    </Text>
                    <Text style={[styles.resumeMeta, { color: colors.mutedForeground }]}>
                      Uploaded 2 weeks ago • 245 KB
                    </Text>
                  </View>
                </View>
                <View style={styles.resumeActions}>
                  <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                    <Ionicons name="open-outline" size={20} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleDelete}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.uploadPlaceholder,
                  {
                    borderColor: colors.border,
                    borderStyle: 'dashed',
                  },
                ]}
              >
                <Ionicons name="cloud-upload-outline" size={48} color={colors.mutedForeground} />
                <Text style={[styles.uploadText, { color: colors.mutedForeground }]}>
                  Upload your resume to help employers learn more about you
                </Text>
              </View>
            )}

            <Button onPress={handleUpload} style={styles.uploadButton}>
              <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
              <Text style={styles.uploadButtonText}>
                {hasResume ? 'Upload New Resume' : 'Upload Resume'}
              </Text>
            </Button>
          </CardContent>
        </Card>

        {/* Portfolio Links */}
        <Card style={[styles.card, { borderWidth: 2, borderColor: colors.border }]}>
          <CardContent style={styles.cardContent}>
            <View style={styles.sectionHeaderWithAction}>
              <View style={styles.sectionHeader}>
                <Ionicons name="link-outline" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
                  Portfolio Links
                </Text>
              </View>
              <TouchableOpacity style={styles.addButton} activeOpacity={0.7}>
                <Ionicons name="add" size={20} color={colors.primary} />
                <Text style={[styles.addButtonText, { color: colors.primary }]}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.linksList}>
              {portfolioLinks.map((link) => (
                <View
                  key={link.id}
                  style={[
                    styles.linkItem,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                >
                  <View style={styles.linkInfo}>
                    <Ionicons
                      name={getLinkIcon(link.type) as any}
                      size={16}
                      color={colors.primary}
                    />
                    <View style={styles.linkDetails}>
                      <Text
                        style={[styles.linkTitle, { color: colors.cardForeground }]}
                        numberOfLines={1}
                      >
                        {link.title}
                      </Text>
                      <Text
                        style={[styles.linkUrl, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        {link.url}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.linkActions}>
                    <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                      <Ionicons name="create-outline" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                      <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card style={[styles.card, { borderWidth: 2, borderColor: colors.border }]}>
          <CardContent style={styles.cardContent}>
            <View style={styles.sectionHeaderWithAction}>
              <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
                Skills & Technologies
              </Text>
              <TouchableOpacity style={styles.addButton} activeOpacity={0.7}>
                <Ionicons name="add" size={20} color={colors.primary} />
                <Text style={[styles.addButtonText, { color: colors.primary }]}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.skillsContainer}>
              {skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  style={{ ...styles.skillBadge, backgroundColor: colors.secondary }}
                >
                  <Text style={[styles.skillText, { color: colors.secondaryForeground }]}> 
                    {skill}
                  </Text>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={[styles.skillRemove, { color: colors.secondaryForeground }]}> 
                      ×
                    </Text>
                  </TouchableOpacity>
                </Badge>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Work Experience */}
        <Card style={[styles.card, { borderWidth: 2, borderColor: colors.border }]}>
          <CardContent style={styles.cardContent}>
            <View style={styles.sectionHeaderWithAction}>
              <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
                Work Experience
              </Text>
              <TouchableOpacity style={styles.addButton} activeOpacity={0.7}>
                <Ionicons name="add" size={20} color={colors.primary} />
                <Text style={[styles.addButtonText, { color: colors.primary }]}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.experienceList}>
              {experiences.map((exp) => (
                <View
                  key={exp.id}
                  style={[styles.experienceItem, { borderLeftColor: colors.primary }]}
                >
                  <View style={styles.experienceHeader}>
                    <View style={styles.experienceInfo}>
                      <Text style={[styles.experienceTitle, { color: colors.cardForeground }]}>
                        {exp.title}
                      </Text>
                      <Text style={[styles.experienceCompany, { color: colors.mutedForeground }]}>
                        {exp.company}
                      </Text>
                    </View>
                    <View style={styles.experienceActions}>
                      <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color={colors.mutedForeground}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                        <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={[styles.experiencePeriod, { color: colors.mutedForeground }]}>
                    {exp.period}
                  </Text>
                  <Text style={[styles.experienceDescription, { color: colors.cardForeground }]}>
                    {exp.description}
                  </Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
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
    fontSize: 20,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resumeContainer: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resumeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  resumeIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeDetails: {
    flex: 1,
  },
  resumeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  resumeMeta: {
    fontSize: 12,
  },
  resumeActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    padding: 8,
  },
  uploadPlaceholder: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 250,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  linksList: {
    gap: 12,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  linkDetails: {
    flex: 1,
    minWidth: 0,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  linkUrl: {
    fontSize: 12,
  },
  linkActions: {
    flexDirection: 'row',
    gap: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  skillRemove: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  experienceList: {
    gap: 16,
  },
  experienceItem: {
    borderLeftWidth: 2,
    paddingLeft: 16,
    paddingVertical: 8,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  experienceInfo: {
    flex: 1,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  experienceCompany: {
    fontSize: 14,
  },
  experienceActions: {
    flexDirection: 'row',
    gap: 4,
  },
  experiencePeriod: {
    fontSize: 12,
    marginBottom: 8,
  },
  experienceDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});