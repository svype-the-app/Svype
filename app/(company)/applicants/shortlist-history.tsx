import { Card, CardContent } from '@/components/ui/card'
import { Screen, ScreenHeader } from '@/components/ui/screen'
import { Colors } from '@/constants/theme'
import { applicationsApi, type ShortlistRun } from '@/services/api'
import { formatRelativeTime } from '@/utils/time'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native'

export default function ShortlistHistoryScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const router = useRouter()
  const params = useLocalSearchParams<{ jobId?: string; jobTitle?: string }>()

  const jobId = Number(params.jobId)
  const jobTitle = (params.jobTitle as string) || 'Applicants'

  const [history, setHistory] = useState<ShortlistRun[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [runningNew, setRunningNew] = useState(false)

  // Current applicant count for the job (to decide if "Run Again" is enabled)
  const [currentApplicantCount, setCurrentApplicantCount] = useState<number | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    setError(null)
    try {
      const [runs, applicants] = await Promise.all([
        applicationsApi.getShortlistHistory(jobId),
        applicationsApi.getApplicants(jobId),
      ])
      setHistory(runs)
      setCurrentApplicantCount(applicants.length)
    } catch (err: any) {
      setError(err?.message || 'Could not load shortlist history.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [jobId])

  useEffect(() => { load() }, [load])

  const handleRunAgain = async () => {
    if (runningNew || !jobId) return
    setRunningNew(true)
    try {
      const runDetail = await applicationsApi.runShortlist(jobId)
      router.push(
        `/(company)/applicants/review-applicants?jobId=${jobId}&jobTitle=${encodeURIComponent(jobTitle)}&shortlistRunId=${runDetail.id}&shortlistMode=true` as any
      )
    } catch {
      // silently ignore, button returns to idle
    } finally {
      setRunningNew(false)
    }
  }

  const handleOpenRun = (run: ShortlistRun) => {
    router.push(
      `/(company)/applicants/review-applicants?jobId=${jobId}&jobTitle=${encodeURIComponent(jobTitle)}&shortlistRunId=${run.id}&shortlistMode=true` as any
    )
  }


  // "Run Again" is available when: no runs yet, OR current applicant count > last run's count
  const lastRun = history[0]
  const canRunAgain = !lastRun || (currentApplicantCount !== null && currentApplicantCount > lastRun.applicant_count)

  return (
    <Screen>
      <ScreenHeader
        title="AI Shortlist History"
        onBack={() =>
          router.push(
            `/(company)/applicants/review-applicants?jobId=${jobId}&jobTitle=${encodeURIComponent(jobTitle)}` as any
          )
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Job title + Run Again button */}
        <View style={[styles.jobRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.jobLabel, { color: colors.mutedForeground }]}>Job</Text>
            <Text style={[styles.jobTitle, { color: colors.foreground }]} numberOfLines={1}>
              {jobTitle}
            </Text>
            {currentApplicantCount !== null && (
              <Text style={[styles.jobMeta, { color: colors.mutedForeground }]}>
                {currentApplicantCount} current applicant{currentApplicantCount === 1 ? '' : 's'}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.runAgainBtn,
              { backgroundColor: canRunAgain ? '#059669' : colors.muted },
              runningNew && { opacity: 0.7 },
            ]}
            onPress={handleRunAgain}
            disabled={!canRunAgain || runningNew}
          >
            {runningNew ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles" size={14} color={canRunAgain ? '#fff' : colors.mutedForeground} />
                <Text style={[styles.runAgainText, { color: canRunAgain ? '#fff' : colors.mutedForeground }]}>
                  {history.length === 0 ? 'Run Shortlist' : 'Run Again'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Failed to Load</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{error}</Text>
            <TouchableOpacity
              onPress={() => load()}
              style={[styles.retryBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.retryText, { color: colors.foreground }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="people-outline" size={64} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No shortlist runs yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap "Run Shortlist" above to rank applicants by AI compatibility.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {history.length} run{history.length === 1 ? '' : 's'}
            </Text>
            {history.map((run, index) => (
              <TouchableOpacity key={run.id} onPress={() => handleOpenRun(run)} activeOpacity={0.8}>
                <Card style={styles.card}>
                  <CardContent style={styles.cardContent}>
                    <View style={styles.cardTop}>
                      <View style={styles.cardLeft}>
                        <View style={[styles.runBadge, { backgroundColor: '#8b5cf620' }]}>
                          <Ionicons name="sparkles" size={14} color="#8b5cf6" />
                          <Text style={[styles.runBadgeText, { color: '#8b5cf6' }]}>Run #{history.length - index}</Text>
                        </View>
                      </View>
                      <View style={styles.cardRight}>
                        <Text style={[styles.cardTimestamp, { color: colors.mutedForeground }]}>
                          {formatRelativeTime(run.created_at)}
                        </Text>
                        <Text style={[styles.applicantCount, { color: colors.foreground }]}>
                          {run.applicant_count}
                        </Text>
                        <Text style={[styles.applicantCountLabel, { color: colors.mutedForeground }]}>
                          applicant{run.applicant_count === 1 ? '' : 's'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardFooter}>
                      <Text style={[styles.viewText, { color: colors.primary }]}>View shortlisted order</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  jobLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  jobTitle: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  jobMeta: { fontSize: 12, marginTop: 2 },
  runAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 90,
    justifyContent: 'center',
  },
  runAgainText: { fontSize: 13, fontWeight: '700' },
  centered: { alignItems: 'center', paddingVertical: 64, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  retryText: { fontSize: 14, fontWeight: '600' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  card: { marginBottom: 0 },
  cardContent: { padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardLeft: { gap: 4 },
  runBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  runBadgeText: { fontSize: 12, fontWeight: '700' },
  runDate: { fontSize: 12 },
  cardRight: { alignItems: 'center' },
  cardTimestamp: { fontSize: 11, marginBottom: 4 },
  applicantCount: { fontSize: 28, fontWeight: '800' },
  applicantCountLabel: { fontSize: 11 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: { fontSize: 13, fontWeight: '600' },
})
