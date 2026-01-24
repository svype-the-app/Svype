import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

interface Topic {
  id: string;
  title: string;
  icon: string;
  description: string;
  questions: number;
  duration: string;
}

interface Resource {
  id: string;
  type: 'article' | 'video';
  title: string;
  description: string;
  readTime: string;
  popular: boolean;
}

interface BehavioralQuestion {
  question: string;
  tips: string[];
  example: string;
}

interface Tip {
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

export default function InterviewPrepScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const topics: Topic[] = [
    {
      id: 'behavioral',
      title: 'Behavioral Questions',
      icon: '💬',
      description: 'Common behavioral interview questions and how to answer them',
      questions: 15,
      duration: '30 min',
    },
    {
      id: 'technical',
      title: 'Technical Questions',
      icon: '💻',
      description: 'Technical questions for software engineering roles',
      questions: 20,
      duration: '45 min',
    },
    {
      id: 'system-design',
      title: 'System Design',
      icon: '🏗️',
      description: 'Learn how to approach system design interviews',
      questions: 10,
      duration: '60 min',
    },
    {
      id: 'culture-fit',
      title: 'Culture Fit',
      icon: '🤝',
      description: 'Questions about company culture and values',
      questions: 12,
      duration: '20 min',
    },
  ];

  const resources: Resource[] = [
    {
      id: '1',
      type: 'article',
      title: 'The STAR Method for Behavioral Interviews',
      description: 'Learn how to structure your answers using Situation, Task, Action, Result',
      readTime: '5 min read',
      popular: true,
    },
    {
      id: '2',
      type: 'video',
      title: 'Mock Interview: Senior Frontend Engineer',
      description: 'Watch a full mock interview and learn from expert feedback',
      readTime: '45 min watch',
      popular: true,
    },
    {
      id: '3',
      type: 'article',
      title: '10 Questions You Should Ask Interviewers',
      description: 'Impress employers with thoughtful questions about the role',
      readTime: '4 min read',
      popular: false,
    },
    {
      id: '4',
      type: 'video',
      title: 'Handling Salary Negotiations',
      description: 'Tips for discussing compensation confidently',
      readTime: '20 min watch',
      popular: true,
    },
  ];

  const behavioralQuestions: BehavioralQuestion[] = [
    {
      question: 'Tell me about yourself',
      tips: [
        'Keep it professional and relevant to the role',
        'Structure: Present → Past → Future',
        'Highlight key achievements and skills',
        'Keep it under 2 minutes',
      ],
      example:
        "I'm currently a frontend engineer with 5 years of experience building scalable web applications. In my previous role at TechCorp, I led a team of 4 developers and increased page load speed by 40%. I'm now looking for opportunities to expand my leadership skills while continuing to work with modern technologies like React and Next.js.",
    },
    {
      question: 'What are your greatest strengths?',
      tips: [
        'Choose 2-3 strengths relevant to the job',
        'Provide specific examples',
        'Show how your strengths benefit the team',
        'Be genuine and confident',
      ],
      example:
        'One of my greatest strengths is problem-solving. For example, when our application faced performance issues affecting thousands of users, I analyzed the codebase, identified bottlenecks, and implemented optimizations that improved load times by 60%. I also excel at collaboration—I believe the best solutions come from diverse perspectives.',
    },
    {
      question: 'Describe a challenging situation and how you overcame it',
      tips: [
        'Use the STAR method',
        'Choose a relevant professional example',
        'Focus on your actions and decisions',
        'End with the positive outcome',
      ],
      example:
        'In my last project, we had a tight deadline and discovered a critical security vulnerability two days before launch (Situation). As the lead developer, I needed to fix it without delaying the launch (Task). I quickly assembled a small team, we worked through the weekend implementing a patch and comprehensive tests (Action). We launched on time with zero security issues and received praise from the client (Result).',
    },
  ];

  const tips: Tip[] = [
    {
      title: 'Research the Company',
      description: 'Understand their products, values, and recent news. Show genuine interest.',
      iconName: 'search-outline',
    },
    {
      title: 'Prepare Your Stories',
      description: 'Have 5-7 STAR stories ready that showcase different skills and situations.',
      iconName: 'book-outline',
    },
    {
      title: 'Practice Out Loud',
      description:
        'Rehearse your answers verbally, not just in your head. Record yourself if possible.',
      iconName: 'chatbubbles-outline',
    },
    {
      title: 'Ask Smart Questions',
      description: 'Prepare 3-5 thoughtful questions about the role, team, and company.',
      iconName: 'bulb-outline',
    },
    {
      title: 'Plan Your Logistics',
      description:
        'Test your tech setup for video calls. Arrive 10 minutes early for in-person interviews.',
      iconName: 'time-outline',
    },
    {
      title: 'Follow Up',
      description:
        'Send a thank-you email within 24 hours. Reiterate your interest and key points.',
      iconName: 'checkmark-circle-outline',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Interview Preparation
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              Ace your next interview
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <Card style={[styles.heroCard, { backgroundColor: colors.primary + '10' }]}>
          <CardContent style={styles.heroCardContent}>
            <View style={[styles.heroIcon, { backgroundColor: colors.primary + '30' }]}>
              <Ionicons name="trending-up" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroTitle, { color: colors.cardForeground }]}>
                Prepare to Succeed
              </Text>
              <Text style={[styles.heroDescription, { color: colors.mutedForeground }]}>
                Master common interview questions, learn proven techniques, and boost your
                confidence with our comprehensive preparation resources.
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="questions">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="tips">Tips</TabsTrigger>
          </TabsList>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-4">
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Practice by Category
            </Text>
            <View style={styles.topicsGrid}>
              {topics.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  onPress={() => setSelectedTopic(topic.id)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.topicCard}>
                    <CardContent style={styles.topicCardContent}>
                      <Text style={styles.topicIcon}>{topic.icon}</Text>
                      <Text style={[styles.topicTitle, { color: colors.cardForeground }]}>
                        {topic.title}
                      </Text>
                      <Text style={[styles.topicDescription, { color: colors.mutedForeground }]}>
                        {topic.description}
                      </Text>
                      <View style={styles.topicMeta}>
                        <Text style={[styles.topicMetaText, { color: colors.mutedForeground }]}>
                          📝 {topic.questions} questions
                        </Text>
                        <Text style={[styles.topicMetaText, { color: colors.mutedForeground }]}>
                          ⏱️ {topic.duration}
                        </Text>
                      </View>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>
              Common Questions
            </Text>
            {behavioralQuestions.map((item, index) => (
              <Card key={index} style={styles.questionCard}>
                <CardContent style={styles.questionCardContent}>
                  <View style={styles.questionHeader}>
                    <Ionicons
                      name="chatbubbles-outline"
                      size={20}
                      color={colors.primary}
                      style={{ marginTop: 2 }}
                    />
                    <Text style={[styles.questionText, { color: colors.cardForeground }]}>
                      {item.question}
                    </Text>
                  </View>

                  <View style={styles.tipsSection}>
                    <Text style={[styles.tipsTitle, { color: colors.foreground }]}>
                      How to Answer:
                    </Text>
                    <View style={styles.tipsList}>
                      {item.tips.map((tip, i) => (
                        <View key={i} style={styles.tipItem}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={colors.primary}
                            style={{ marginTop: 2 }}
                          />
                          <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                            {tip}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.exampleBox,
                      {
                        backgroundColor: colors.primary + '10',
                        borderLeftColor: colors.primary,
                      },
                    ]}
                  >
                    <Text style={[styles.exampleTitle, { color: colors.foreground }]}>
                      Example Answer:
                    </Text>
                    <Text style={[styles.exampleText, { color: colors.mutedForeground }]}>
                      "{item.example}"
                    </Text>
                  </View>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-4">
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Learning Resources
            </Text>
            {resources.map((resource) => (
              <TouchableOpacity key={resource.id} activeOpacity={0.7}>
                <Card style={styles.resourceCard}>
                  <CardContent style={styles.resourceCardContent}>
                    <View style={styles.resourceHeader}>
                      <Ionicons
                        name={resource.type === 'article' ? 'book-outline' : 'play-circle-outline'}
                        size={20}
                        color={colors.primary}
                        style={{ marginTop: 2 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.resourceTitle, { color: colors.cardForeground }]}>
                          {resource.title}
                        </Text>
                        <Text
                          style={[styles.resourceDescription, { color: colors.mutedForeground }]}
                        >
                          {resource.description}
                        </Text>
                        <View style={styles.resourceBadges}>
                          <View
                            style={[
                              styles.timeBadge,
                              {
                                backgroundColor: colors.secondary,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <Ionicons
                              name="time-outline"
                              size={12}
                              color={colors.mutedForeground}
                            />
                            <Text
                              style={[styles.timeBadgeText, { color: colors.mutedForeground }]}
                            >
                              {resource.readTime}
                            </Text>
                          </View>
                          {resource.popular && (
                            <View style={styles.popularBadge}>
                              <Ionicons name="star" size={12} color="#f59e0b" />
                              <Text style={styles.popularBadgeText}>Popular</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))}
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className="space-y-4">
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Interview Success Tips
            </Text>
            <View style={styles.tipsGrid}>
              {tips.map((tip, index) => (
                <Card key={index} style={styles.tipCard}>
                  <CardContent style={styles.tipCardContent}>
                    <View style={styles.tipCardHeader}>
                      <View
                        style={[styles.tipCardIcon, { backgroundColor: colors.primary + '20' }]}
                      >
                        <Ionicons name={tip.iconName} size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.tipCardTitle, { color: colors.cardForeground }]}>
                          {tip.title}
                        </Text>
                        <Text style={[styles.tipCardDescription, { color: colors.mutedForeground }]}>
                          {tip.description}
                        </Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>

            <Card
              style={[
                styles.proTipCard,
                {
                  backgroundColor: colors.primary + '10',
                  borderColor: colors.primary + '50',
                },
              ]}
            >
              <CardContent style={styles.proTipContent}>
                <View style={styles.proTipHeader}>
                  <Ionicons name="bulb" size={20} color={colors.primary} />
                  <Text style={[styles.proTipTitle, { color: colors.cardForeground }]}>
                    Pro Tip: Practice Makes Perfect
                  </Text>
                </View>
                <Text style={[styles.proTipDescription, { color: colors.mutedForeground }]}>
                  The best way to prepare is through practice. Try recording yourself answering
                  common questions, or better yet, do mock interviews with friends or mentors. The
                  more you practice, the more natural and confident you'll become.
                </Text>
                <Button size="lg" style={styles.proTipButton}>
                  Schedule Mock Interview
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
    paddingBottom: 100,
  },
  heroCard: {
    marginBottom: 20,
  },
  heroCardContent: {
    padding: 20,
    flexDirection: 'row',
    gap: 16,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  topicsGrid: {
    gap: 16,
    marginBottom: 16,
  },
  topicCard: {
    marginBottom: 0,
  },
  topicCardContent: {
    padding: 20,
  },
  topicIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  topicDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  topicMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  topicMetaText: {
    fontSize: 12,
  },
  questionCard: {
    marginBottom: 16,
  },
  questionCardContent: {
    padding: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  tipsSection: {
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  tipText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  exampleBox: {
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  resourceCard: {
    marginBottom: 16,
  },
  resourceCardContent: {
    padding: 20,
  },
  resourceHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  resourceBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  timeBadgeText: {
    fontSize: 12,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f59e0b20',
  },
  popularBadgeText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  tipsGrid: {
    gap: 16,
    marginBottom: 16,
  },
  tipCard: {
    marginBottom: 0,
  },
  tipCardContent: {
    padding: 20,
  },
  tipCardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  tipCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  tipCardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  proTipCard: {
    borderWidth: 2,
  },
  proTipContent: {
    padding: 20,
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  proTipTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  proTipDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  proTipButton: {
    marginTop: 8,
  },
});
