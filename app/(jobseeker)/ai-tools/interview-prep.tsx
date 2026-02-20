import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import {
    behavioralQuestions,
    BehavioralQuestion,
    interviewResources,
    InterviewResource,
    interviewTips,
    InterviewTip,
    interviewTopics,
    InterviewTopic,
} from '@/lib/mock-ai-tools';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

type Topic = InterviewTopic;
type Resource = InterviewResource;
type Tip = InterviewTip;

export default function InterviewPrepScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [activeTab, setActiveTab] = useState<'questions' | 'resources' | 'tips'>('questions');

  const topics = interviewTopics;
  const resources = interviewResources;
  const tips = interviewTips;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Interview Preparation
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              Ace your next interview
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Card */}
        <Card
          style={[
            styles.heroCard,
            { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' },
          ]}
        >
          <CardContent style={styles.heroCardContent}>
            <View style={[styles.heroIcon, { backgroundColor: colors.primary + '30' }]}>
              <Ionicons name="trending-up" size={28} color={colors.primary} />
            </View>
            <View style={styles.heroText}>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>
                Prepare to Succeed
              </Text>
              <Text style={[styles.heroDescription, { color: colors.mutedForeground }]}>
                Master common interview questions, learn proven techniques, and boost your confidence
                with our comprehensive preparation resources.
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.muted }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('questions')}
            style={[
              styles.tab,
              activeTab === 'questions' && [styles.tabActive, { borderBottomColor: colors.primary }],
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'questions' ? colors.primary : colors.mutedForeground },
              ]}
            >
              Questions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('resources')}
            style={[
              styles.tab,
              activeTab === 'resources' && [styles.tabActive, { borderBottomColor: colors.primary }],
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'resources' ? colors.primary : colors.mutedForeground },
              ]}
            >
              Resources
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('tips')}
            style={[
              styles.tab,
              activeTab === 'tips' && [styles.tabActive, { borderBottomColor: colors.primary }],
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'tips' ? colors.primary : colors.mutedForeground },
              ]}
            >
              Tips
            </Text>
          </TouchableOpacity>
        </View>

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Practice by Category
            </Text>

            <View style={styles.topicsGrid}>
              {topics.map((topic) => (
                <Card key={topic.id} style={[styles.topicCard, { borderColor: colors.border }]}>
                  <CardContent style={styles.topicCardContent}>
                    <Text style={styles.topicIcon}>{topic.icon}</Text>
                    <Text style={[styles.topicTitle, { color: colors.foreground }]}>
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
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Common Questions
            </Text>

            {behavioralQuestions.map((item, index) => (
              <Card key={index} style={[styles.questionCard, { borderColor: colors.border }]}>
                <CardContent style={styles.questionCardContent}>
                  <View style={styles.questionHeader}>
                    <Ionicons name="chatbubbles" size={20} color={colors.primary} />
                    <Text style={[styles.questionTitle, { color: colors.foreground }]}>
                      {item.question}
                    </Text>
                  </View>

                  <View style={styles.tipsSection}>
                    <Text style={[styles.tipsLabel, { color: colors.foreground }]}>
                      How to Answer:
                    </Text>
                    {item.tips.map((tip, i) => (
                      <View key={i} style={styles.tipItem}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={colors.primary}
                          style={styles.tipIcon}
                        />
                        <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                          {tip}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.exampleBox, { backgroundColor: colors.primary + '10', borderLeftColor: colors.primary }]}>
                    <Text style={[styles.exampleLabel, { color: colors.foreground }]}>
                      Example Answer:
                    </Text>
                    <Text style={[styles.exampleText, { color: colors.mutedForeground }]}>
                      "{item.example}"
                    </Text>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Learning Resources
            </Text>

            {resources.map((resource) => (
              <Card key={resource.id} style={[styles.resourceCard, { borderColor: colors.border }]}>
                <CardContent style={styles.resourceCardContent}>
                  <View style={styles.resourceHeader}>
                    <Ionicons
                      name={resource.type === 'article' ? 'book' : 'play-circle'}
                      size={20}
                      color={colors.primary}
                    />
                    <View style={styles.resourceInfo}>
                      <Text style={[styles.resourceTitle, { color: colors.foreground }]}>
                        {resource.title}
                      </Text>
                      <Text style={[styles.resourceDescription, { color: colors.mutedForeground }]}>
                        {resource.description}
                      </Text>
                      <View style={styles.resourceBadges}>
                        <Badge
                          variant="outline"
                          style={StyleSheet.flatten([styles.resourceBadge, { borderColor: colors.border }])}
                        >
                          <View style={styles.badgeContent}>
                            <Ionicons name="time" size={12} color={colors.mutedForeground} />
                            <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                              {resource.readTime}
                            </Text>
                          </View>
                        </Badge>
                        {resource.popular && (
                          <Badge style={StyleSheet.flatten([styles.popularBadge, { backgroundColor: '#fef3c7' }])}>
                            <View style={styles.badgeContent}>
                              <Ionicons name="star" size={12} color="#ca8a04" />
                              <Text style={[styles.badgeText, { color: '#ca8a04' }]}>Popular</Text>
                            </View>
                          </Badge>
                        )}
                      </View>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}

        {/* Tips Tab */}
        {activeTab === 'tips' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Interview Success Tips
            </Text>

            <View style={styles.tipsGrid}>
              {tips.map((tip, index) => (
                <Card key={index} style={[styles.tipCard, { borderColor: colors.border }]}>
                  <CardContent style={styles.tipCardContent}>
                    <View style={styles.tipCardHeader}>
                      <View style={[styles.tipIconContainer, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name={tip.icon} size={20} color={colors.primary} />
                      </View>
                      <View style={styles.tipCardText}>
                        <Text style={[styles.tipCardTitle, { color: colors.foreground }]}>
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
                { backgroundColor: colors.primary + '10', borderColor: colors.primary + '50' },
              ]}
            >
              <CardContent style={styles.proTipContent}>
                <View style={styles.proTipHeader}>
                  <Ionicons name="bulb" size={20} color={colors.primary} />
                  <Text style={[styles.proTipTitle, { color: colors.foreground }]}>
                    Pro Tip: Practice Makes Perfect
                  </Text>
                </View>
                <Text style={[styles.proTipDescription, { color: colors.mutedForeground }]}>
                  The best way to prepare is through practice. Try recording yourself answering common
                  questions, or better yet, do mock interviews with friends or mentors. The more you
                  practice, the more natural and confident you'll become.
                </Text>
                <Button size="default">Schedule Mock Interview</Button>
              </CardContent>
            </Card>
          </View>
        )}
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
  heroCard: {
    borderWidth: 2,
  },
  heroCardContent: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
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
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  topicsGrid: {
    gap: 16,
  },
  topicCard: {
    borderWidth: 2,
  },
  topicCardContent: {
    gap: 12,
  },
  topicIcon: {
    fontSize: 36,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  topicDescription: {
    fontSize: 14,
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
    borderWidth: 2,
  },
  questionCardContent: {
    gap: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  tipsSection: {
    gap: 8,
  },
  tipsLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipIcon: {
    marginTop: 2,
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
    gap: 8,
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  exampleText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  resourceCard: {
    borderWidth: 2,
  },
  resourceCardContent: {
    gap: 12,
  },
  resourceHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  resourceInfo: {
    flex: 1,
    gap: 8,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  resourceDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  resourceBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  resourceBadge: {
    borderWidth: 1,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
  },
  popularBadge: {
    borderWidth: 1,
    borderColor: '#fde047',
  },
  tipsGrid: {
    gap: 16,
  },
  tipCard: {
    borderWidth: 2,
  },
  tipCardContent: {
    gap: 12,
  },
  tipCardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipCardText: {
    flex: 1,
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
    gap: 12,
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proTipTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  proTipDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
