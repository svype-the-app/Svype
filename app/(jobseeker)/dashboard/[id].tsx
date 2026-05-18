import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { applicationsApi } from '@/services/api';
import type { Application } from '@/services/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'applied': return '#3b82f6';
    case 'shortlisted': return '#22c55e';
    case 'interview': return '#f59e0b';
    case 'offered': return '#22c55e';
    case 'rejected':
    case 'withdrawn': return '#ef4444';
    default: return '#8b5cf6';
  }
}

export default function ApplicationDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const appId = Number(id);

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  // Withdraw modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [timer, setTimer] = useState(5);
  const [withdrawing, setWithdrawing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    applicationsApi.getApplication(appId)
      .then(setApplication)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [appId]);

  const startWithdrawTimer = () => {
    setShowWithdrawModal(true);
    setTimer(5);
    progressAnim.setValue(0);
    Animated.timing(progressAnim, { toValue: 1, duration: 5000, useNativeDriver: false }).start();
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          doWithdraw();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelWithdraw = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    progressAnim.stopAnimation();
    setShowWithdrawModal(false);
    setTimer(5);
  };

  const doWithdraw = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setWithdrawing(true);
    try {
      await applicationsApi.updateStatus(appId, 'withdrawn');
      setShowWithdrawModal(false);
      router.back();
    } catch {
      setWithdrawing(false);
    }
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatSalary = (min?: number, max?: number) => {
    if (typeof min !== 'number' || typeof max !== 'number') return null;
    return `£${(min / 1000).toFixed(0)}k – £${(max / 1000).toFixed(0)}k`;
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

  const canWithdraw = application && !['rejected', 'withdrawn'].includes(application.status.toLowerCase());

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Application Detail</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !application ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Not found</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Status banner */}
            <View style={[styles.statusBanner, { backgroundColor: getStatusColor(application.status) + '18', borderColor: getStatusColor(application.status) + '40' }]}>
              <Ionicons name="information-circle-outline" size={18} color={getStatusColor(application.status)} />
              <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
                {application.status.toUpperCase()}
              </Text>
            </View>

            <Card style={styles.card}>
              <CardContent style={styles.cardContent}>
                <Text style={[styles.jobTitle, { color: colors.foreground }]}>{application.job.title}</Text>
                <Text style={[styles.companyName, { color: colors.mutedForeground }]}>{application.job.company_name}</Text>

                <View style={styles.metaGrid}>
                  {!!application.job.location && (
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={15} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{application.job.location}</Text>
                    </View>
                  )}
                  {!!application.job.job_type && (
                    <View style={styles.metaRow}>
                      <Ionicons name="briefcase-outline" size={15} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{application.job.job_type}</Text>
                    </View>
                  )}
                  {!!formatSalary(application.job.salary_min, application.job.salary_max) && (
                    <View style={styles.metaRow}>
                      <Ionicons name="cash-outline" size={15} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {formatSalary(application.job.salary_min, application.job.salary_max)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={15} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                      Applied {formatDate(application.applied_at)}
                    </Text>
                  </View>
                </View>

                {!!application.job.description && (
                  <View style={styles.descSection}>
                    <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Description</Text>
                    <Text style={[styles.descText, { color: colors.mutedForeground }]}>{application.job.description}</Text>
                  </View>
                )}
              </CardContent>
            </Card>
          </ScrollView>

          {canWithdraw && (
            <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
              <TouchableOpacity
                style={[styles.withdrawBtn, { borderColor: '#ef4444' }]}
                onPress={startWithdrawTimer}
              >
                <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                <Text style={styles.withdrawBtnText}>Withdraw Application</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Withdraw countdown modal */}
      <Modal visible={showWithdrawModal} transparent animationType="fade" onRequestClose={cancelWithdraw}>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <CardContent style={styles.modalContent}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Withdraw Application?</Text>
              <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>
                This will remove your application. This cannot be undone.
              </Text>
              <View style={styles.timerWrap}>
                <Animated.View
                  style={[styles.timerRing, {
                    transform: [{
                      rotate: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    }],
                  }]}
                >
                  <View style={[styles.timerRingInner, { borderColor: '#ef4444' }]} />
                </Animated.View>
                <View style={[styles.timerCenter, { backgroundColor: colors.card }]}>
                  <Text style={styles.timerText}>{timer}s</Text>
                </View>
              </View>
              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.muted }]}
                  onPress={cancelWithdraw}
                >
                  <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#ef4444' }]}
                  onPress={doWithdraw}
                  disabled={withdrawing}
                >
                  {withdrawing
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={[styles.modalBtnText, { color: '#fff' }]}>Withdraw</Text>
                  }
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 24 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  statusText: { fontSize: 13, fontWeight: '700' },
  card: {},
  cardContent: { padding: 16 },
  jobTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  companyName: { fontSize: 15, marginBottom: 16 },
  metaGrid: { gap: 8, marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14 },
  descSection: { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 14 },
  sectionLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  descText: { fontSize: 14, lineHeight: 21 },
  footer: { padding: 16, borderTopWidth: 1 },
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
  },
  withdrawBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalCard: { width: '100%', maxWidth: 320 },
  modalContent: { alignItems: 'center', gap: 12, padding: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  timerWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  timerRing: { position: 'absolute', width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  timerRingInner: { width: 120, height: 120, borderRadius: 60, borderWidth: 5 },
  timerCenter: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  timerText: { fontSize: 32, fontWeight: '700', color: '#ef4444' },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { fontSize: 14, fontWeight: '600' },
});
