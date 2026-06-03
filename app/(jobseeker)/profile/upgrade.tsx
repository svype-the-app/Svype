import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authApi } from '@/services/api';
import { MockPaymentSheet } from '@/components/ui/mock-payment-sheet';

const PREMIUM_PRICE_LABEL = '£9.99';

const PERKS = [
  'Premium badge on your profile',
  'Priority placement to recruiters',
  'Stand out from other applicants',
  'Early access to new features',
];

export default function JobseekerUpgradeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [isPremium, setIsPremium] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    let active = true;
    authApi
      .getMe()
      .then((u) => { if (active) setIsPremium(Boolean(u.is_premium)); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Svype Premium</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Card style={[styles.hero, { backgroundColor: '#f59e0b12', borderColor: '#f59e0b55', borderWidth: 1 }]}>
          <View style={[styles.crownCircle, { backgroundColor: '#f59e0b' }]}>
            <Ionicons name="diamond" size={34} color="#fff" />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Go Premium</Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
            Get noticed faster and unlock the most of Svype.
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.foreground }]}>{PREMIUM_PRICE_LABEL}</Text>
            <Text style={[styles.pricePer, { color: colors.mutedForeground }]}>/month</Text>
          </View>
        </Card>

        {/* Perks */}
        <Card style={styles.perksCard}>
          <Text style={[styles.perksTitle, { color: colors.foreground }]}>What you get</Text>
          {PERKS.map((perk) => (
            <View key={perk} style={styles.perkRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.perkText, { color: colors.foreground }]}>{perk}</Text>
            </View>
          ))}
        </Card>

        {isPremium && (
          <Card style={[styles.premiumBanner, { backgroundColor: '#f59e0b15', borderColor: '#f59e0b' }]}>
            <Ionicons name="checkmark-circle" size={22} color="#f59e0b" />
            <Text style={[styles.premiumBannerText, { color: colors.foreground }]}>
              You&apos;re a Premium member — thanks for the support!
            </Text>
          </Card>
        )}

        {isPremium ? (
          <Button onPress={() => router.back()} style={[styles.cta, { backgroundColor: colors.primary }]}>
            <Text style={styles.ctaText}>Done</Text>
          </Button>
        ) : (
          <Button
            onPress={() => setShowPayment(true)}
            style={[styles.cta, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="diamond" size={18} color="#fff" />
            <Text style={[styles.ctaText, { marginLeft: 8 }]}>Upgrade Now — {PREMIUM_PRICE_LABEL}</Text>
          </Button>
        )}

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Test mode — use card 4242 4242 4242 4242 with any expiry &amp; CVC.
        </Text>
      </ScrollView>

      <MockPaymentSheet
        visible={showPayment}
        amount={PREMIUM_PRICE_LABEL}
        description="Svype Premium – Jobseeker"
        onClose={() => setShowPayment(false)}
        onSuccess={() => {
          setShowPayment(false);
          setIsPremium(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  hero: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, gap: 8 },
  crownCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroTitle: { fontSize: 24, fontWeight: '800' },
  heroSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  price: { fontSize: 34, fontWeight: '800' },
  pricePer: { fontSize: 14, marginLeft: 4 },
  perksCard: { padding: 18, gap: 14 },
  perksTitle: { fontSize: 16, fontWeight: '700' },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { fontSize: 14, flex: 1 },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderWidth: 1,
  },
  premiumBannerText: { flex: 1, fontSize: 13, fontWeight: '600' },
  cta: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disclaimer: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
