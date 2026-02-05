import { useState } from 'react'
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Colors } from '@/constants/theme'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Plan {
  id: string
  name: string
  price: string
  description: string
  features: string[]
  highlighted?: boolean
}

export default function UpgradePremiumScreen() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const [selectedPlan, setSelectedPlan] = useState<string>('pro')

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: '£29',
      description: 'Perfect for small teams',
      features: [
        'Up to 5 job postings',
        'Basic applicant screening',
        'Email support',
        'Job analytics dashboard',
      ],
    },
    {
      id: 'pro',
      name: 'Professional',
      price: '£79',
      description: 'Most popular',
      features: [
        'Unlimited job postings',
        'Advanced AI screening',
        'Priority email & chat support',
        'Advanced analytics',
        'Pre-screening quizzes',
        'Video interview analysis',
        'Custom branding',
      ],
      highlighted: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom integrations',
        'API access',
        'White-label solutions',
        'Advanced security',
        'Training & onboarding',
      ],
    },
  ]

  const handleUpgrade = () => {
    // TODO: Implement payment processing
    alert(`Upgrading to ${selectedPlan} plan...`)
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Upgrade to Premium</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            Unlock powerful features
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Benefits Banner */}
          <Card style={styles.benefitsBanner}>
            <View style={styles.benefitsContent}>
              <Ionicons name="star" size={24} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.benefitsTitle, { color: colors.foreground }]}>
                  Unlock Advanced Features
                </Text>
                <Text style={[styles.benefitsText, { color: colors.mutedForeground }]}>
                  Get AI-powered screening, advanced analytics, and more
                </Text>
              </View>
            </View>
          </Card>

          {/* Plans */}
          <View style={styles.plansContainer}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                style={[
                  styles.planCard,
                  {
                    borderColor: selectedPlan === plan.id ? colors.primary : colors.border,
                    borderWidth: 2,
                    backgroundColor: plan.highlighted
                      ? colors.primary + '10'
                      : colors.card,
                  },
                ]}
              >
                {plan.highlighted && (
                  <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}

                <Text style={[styles.planName, { color: colors.foreground }]}>{plan.name}</Text>
                <Text style={[styles.planDescription, { color: colors.mutedForeground }]}>
                  {plan.description}
                </Text>

                <View style={styles.priceSection}>
                  <Text style={[styles.planPrice, { color: colors.foreground }]}>{plan.price}</Text>
                  {plan.price !== 'Custom' && (
                    <Text style={[styles.pricePerMonth, { color: colors.mutedForeground }]}>
                      /month
                    </Text>
                  )}
                </View>

                {/* Features */}
                <View style={styles.featuresList}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                      <Text
                        style={[styles.featureText, { color: colors.foreground, marginLeft: 8 }]}
                      >
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Selection Indicator */}
                {selectedPlan === plan.id && (
                  <View
                    style={[
                      styles.selectionIndicator,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* FAQs */}
          <Card style={styles.faqCard}>
            <Text style={[styles.faqTitle, { color: colors.foreground }]}>
              Frequently Asked Questions
            </Text>

            <View style={styles.faqItem}>
              <Text style={[styles.faqQuestion, { color: colors.foreground }]}>
                Can I cancel anytime?
              </Text>
              <Text style={[styles.faqAnswer, { color: colors.mutedForeground }]}>
                Yes, you can cancel your subscription at any time. No questions asked.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={[styles.faqQuestion, { color: colors.foreground }]}>
                Is there a free trial?
              </Text>
              <Text style={[styles.faqAnswer, { color: colors.mutedForeground }]}>
                Yes, get 14 days of free access to any premium plan.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={[styles.faqQuestion, { color: colors.foreground }]}>
                What payment methods do you accept?
              </Text>
              <Text style={[styles.faqAnswer, { color: colors.mutedForeground }]}>
                We accept all major credit cards, PayPal, and bank transfers.
              </Text>
            </View>
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              onPress={() => router.back()}
              style={[styles.button, { borderColor: colors.border, borderWidth: 1 }]}
            >
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>Cancel</Text>
            </Button>
            <Button
              onPress={handleUpgrade}
              style={[styles.button, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="star" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>
                Upgrade Now
              </Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
  },
  benefitsBanner: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitsContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitsText: {
    fontSize: 12,
  },
  plansContainer: {
    gap: 12,
  },
  planCard: {
    borderRadius: 12,
    padding: 16,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 12,
    marginBottom: 12,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '700',
  },
  pricePerMonth: {
    fontSize: 12,
    marginLeft: 4,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    fontWeight: '500',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqCard: {
    padding: 16,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
