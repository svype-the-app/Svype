import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { mockCompanyData, mockCompanyJobs, mockCompanyReviews } from '@/lib/mock-company';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function CompanyProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [activeTab, setActiveTab] = useState<'about' | 'jobs' | 'culture' | 'reviews'>('about');

  // Get company data with dynamic name based on slug
  const company = {
    ...mockCompanyData,
    name: typeof slug === 'string' 
      ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Company Name',
    slug: slug,
  };

  const jobs = mockCompanyJobs;
  const reviews = mockCompanyReviews;

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[...Array(5)].map((_, i) => (
          <Ionicons
            key={i}
            name={i < rating ? "star" : "star-outline"}
            size={size}
            color={i < rating ? "#fbbf24" : colors.muted}
          />
        ))}
      </View>
    );
  };

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.card}>
        <CardContent>
          <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
            About Us
          </Text>
          <Text style={[styles.paragraph, { color: colors.mutedForeground }]}>
            {company.description}
          </Text>
          <Text style={[styles.paragraph, { color: colors.mutedForeground }]}>
            We&rsquo;re passionate about building products that make a difference. Our team is dedicated to innovation, collaboration, and continuous improvement. Join us in shaping the future of technology.
          </Text>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardContent>
          <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
            Benefits & Perks
          </Text>
          <View style={styles.benefitsContainer}>
            {company.benefits.map((benefit) => (
              <Badge key={benefit} variant="secondary" style={styles.benefitBadge}>
                <Text style={styles.benefitText}>{benefit}</Text>
              </Badge>
            ))}
          </View>
        </CardContent>
      </Card>
    </View>
  );

  const renderJobsTab = () => (
    <View style={styles.tabContent}>
      {jobs.map((job) => (
        <TouchableOpacity 
          key={job.id}
          onPress={() => router.push(`/(jobseeker)/job/${job.id}`)}
        >
          <Card style={[styles.card, styles.jobCard]}>
            <CardContent>
              <Text style={[styles.jobTitle, { color: colors.cardForeground }]}>
                {job.title}
              </Text>
              <View style={styles.jobBadges}>
                <Badge variant="outline" style={styles.jobBadge}>
                  <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.jobBadgeText, { color: colors.mutedForeground }]}>
                    {job.location}
                  </Text>
                </Badge>
                <Badge variant="outline" style={styles.jobBadge}>
                  <Ionicons name="briefcase-outline" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.jobBadgeText, { color: colors.mutedForeground }]}>
                    {job.type}
                  </Text>
                </Badge>
              </View>
              <Text style={[styles.jobPosted, { color: colors.mutedForeground }]}>
                Posted {job.posted}
              </Text>
            </CardContent>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCultureTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.card}>
        <CardContent>
          <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
            Our Culture
          </Text>
          <View style={styles.cultureGrid}>
            {company.culture.map((item) => (
              <View 
                key={item} 
                style={[styles.cultureItem, { backgroundColor: colors.primary + '0D' }]}
              >
                <Ionicons name="trophy-outline" size={20} color={colors.primary} />
                <Text style={[styles.cultureText, { color: colors.cardForeground }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardContent>
          <Text style={[styles.sectionTitle, { color: colors.cardForeground }]}>
            What Our Employees Say
          </Text>
          <View style={styles.testimonialsContainer}>
            <View style={[styles.testimonial, { backgroundColor: colors.muted + '80' }]}>
              <Text style={[styles.testimonialText, { color: colors.mutedForeground }]}>
                &ldquo;Great team culture and leadership. Everyone is supportive and willing to help each other grow.&rdquo;
              </Text>
              <Text style={[styles.testimonialAuthor, { color: colors.mutedForeground }]}>
                - Software Engineer
              </Text>
            </View>
            <View style={[styles.testimonial, { backgroundColor: colors.muted + '80' }]}>
              <Text style={[styles.testimonialText, { color: colors.mutedForeground }]}>
                &ldquo;Best work-life balance I&rsquo;ve experienced. The flexibility to work remotely is amazing.&rdquo;
              </Text>
              <Text style={[styles.testimonialAuthor, { color: colors.mutedForeground }]}>
                - Product Designer
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  );

  const renderReviewsTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.reviewsHeader}>
            <View>
              <View style={styles.ratingRow}>
                <Text style={[styles.overallRating, { color: colors.cardForeground }]}>
                  {company.rating}
                </Text>
                <Ionicons name="star" size={24} color="#fbbf24" />
              </View>
              <Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>
                {company.reviews} reviews
              </Text>
            </View>
            <Button onPress={() => {}}>
              <Text style={styles.buttonText}>Write Review</Text>
            </Button>
          </View>

          <View style={styles.reviewsList}>
            {reviews.map((review) => (
              <View 
                key={review.id} 
                style={[styles.reviewCard, { backgroundColor: colors.muted + '80' }]}
              >
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAuthorSection}>
                    <Text style={[styles.reviewAuthor, { color: colors.cardForeground }]}>
                      {review.author}
                    </Text>
                    <View style={styles.reviewRatingRow}>
                      {renderStars(review.rating, 14)}
                      <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>
                        {review.date}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.reviewTitle, { color: colors.cardForeground }]}>
                  {review.title}
                </Text>
                <Text style={[styles.reviewContent, { color: colors.mutedForeground }]}>
                  {review.content}
                </Text>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.cardForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.cardForeground }]}>
            Company Profile
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Company Header */}
          <Card style={styles.card}>
            <CardContent>
              <View style={styles.companyHeader}>
                <Avatar size={80}>
                  <AvatarFallback 
                    style={{ ...styles.avatarFallback, backgroundColor: colors.primary }}
                  >
                    <Text style={styles.avatarText}>{company.name.charAt(0)}</Text>
                  </AvatarFallback>
                </Avatar>
                <View style={styles.companyInfo}>
                  <Text style={[styles.companyName, { color: colors.cardForeground }]}>
                    {company.name}
                  </Text>
                  <View style={styles.companyMeta}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#fbbf24" />
                      <Text style={[styles.ratingText, { color: colors.cardForeground }]}>
                        {company.rating}
                      </Text>
                      <Text style={[styles.reviewsText, { color: colors.mutedForeground }]}>
                        ({company.reviews} reviews)
                      </Text>
                    </View>
                    <Text style={[styles.metaSeparator, { color: colors.mutedForeground }]}>•</Text>
                    <Text style={[styles.followersText, { color: colors.mutedForeground }]}>
                      {company.followers} followers
                    </Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <Button onPress={() => {}} style={styles.followButton}>
                      <Ionicons name="heart-outline" size={16} color="#fff" />
                      <Text style={styles.followButtonText}>Follow</Text>
                    </Button>
                    <Button 
                      variant="outline" 
                      onPress={() => Linking.openURL(`https://${company.website}`)}
                      style={styles.websiteButton}
                    >
                      <Ionicons name="globe-outline" size={16} color={colors.primary} />
                      <Text style={[styles.websiteButtonText, { color: colors.primary }]}>
                        Website
                      </Text>
                    </Button>
                  </View>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={[styles.statItem, { backgroundColor: colors.muted + '80' }]}>
                  <Ionicons name="business-outline" size={20} color={colors.primary} />
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Industry
                  </Text>
                  <Text style={[styles.statValue, { color: colors.cardForeground }]}>
                    {company.industry}
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: colors.muted + '80' }]}>
                  <Ionicons name="people-outline" size={20} color={colors.primary} />
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Company Size
                  </Text>
                  <Text style={[styles.statValue, { color: colors.cardForeground }]}>
                    {company.size}
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: colors.muted + '80' }]}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Founded
                  </Text>
                  <Text style={[styles.statValue, { color: colors.cardForeground }]}>
                    {company.founded}
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: colors.muted + '80' }]}>
                  <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Open Roles
                  </Text>
                  <Text style={[styles.statValue, { color: colors.cardForeground }]}>
                    {company.openJobs}
                  </Text>
                </View>
              </View>

              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={colors.mutedForeground} />
                <Text style={[styles.locationText, { color: colors.cardForeground }]}>
                  {company.location}
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <View style={[styles.tabsList, { backgroundColor: colors.muted + '40' }]}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'about' && { backgroundColor: colors.card }
                ]}
                onPress={() => setActiveTab('about')}
              >
                <Text style={[
                  styles.tabText,
                  { color: activeTab === 'about' ? colors.cardForeground : colors.mutedForeground }
                ]}>
                  About
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'jobs' && { backgroundColor: colors.card }
                ]}
                onPress={() => setActiveTab('jobs')}
              >
                <Text style={[
                  styles.tabText,
                  { color: activeTab === 'jobs' ? colors.cardForeground : colors.mutedForeground }
                ]}>
                  Jobs ({company.openJobs})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'culture' && { backgroundColor: colors.card }
                ]}
                onPress={() => setActiveTab('culture')}
              >
                <Text style={[
                  styles.tabText,
                  { color: activeTab === 'culture' ? colors.cardForeground : colors.mutedForeground }
                ]}>
                  Culture
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'reviews' && { backgroundColor: colors.card }
                ]}
                onPress={() => setActiveTab('reviews')}
              >
                <Text style={[
                  styles.tabText,
                  { color: activeTab === 'reviews' ? colors.cardForeground : colors.mutedForeground }
                ]}>
                  Reviews
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'about' && renderAboutTab()}
            {activeTab === 'jobs' && renderJobsTab()}
            {activeTab === 'culture' && renderCultureTab()}
            {activeTab === 'reviews' && renderReviewsTab()}
          </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
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
  companyHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
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
  companyInfo: {
    flex: 1,
    gap: 8,
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
  },
  companyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewsText: {
    fontSize: 14,
  },
  metaSeparator: {
    fontSize: 14,
  },
  followersText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  websiteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
  },
  tabsContainer: {
    gap: 0,
  },
  tabsList: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabContent: {
    gap: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  benefitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  benefitBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  benefitText: {
    fontSize: 13,
  },
  jobCard: {
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  jobBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  jobBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  jobBadgeText: {
    fontSize: 12,
  },
  jobPosted: {
    fontSize: 13,
  },
  cultureGrid: {
    gap: 12,
  },
  cultureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  cultureText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  testimonialsContainer: {
    gap: 16,
  },
  testimonial: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  testimonialText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  testimonialAuthor: {
    fontSize: 13,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  overallRating: {
    fontSize: 28,
    fontWeight: '700',
  },
  reviewCount: {
    fontSize: 13,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  reviewHeader: {
    marginBottom: 4,
  },
  reviewAuthorSection: {
    gap: 4,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 11,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  reviewContent: {
    fontSize: 13,
    lineHeight: 20,
  },
});
