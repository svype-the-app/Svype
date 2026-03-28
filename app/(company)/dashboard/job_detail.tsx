import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { jobsApi, type Job } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CompanyJobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      try {
        const data = await jobsApi.getJob(Number(id));
        setJob(data);
      } catch (error) {
        console.error('Failed to fetch job details', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const salaryText = useMemo(() => {
    if (!job?.salary_min && !job?.salary_max) return 'Not specified';
    if (job.salary_min && job.salary_max) return `£${job.salary_min.toLocaleString()} - £${job.salary_max.toLocaleString()}`;
    if (job.salary_min) return `From £${job.salary_min.toLocaleString()}`;
    return `Up to £${job?.salary_max?.toLocaleString()}`;
  }, [job]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(company)/dashboard');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.helperText, { color: colors.mutedForeground }]}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}> 
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Job Details</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.centeredState}>
          <Text style={[styles.helperText, { color: colors.mutedForeground }]}>Job not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Job Details</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card>
          <CardContent style={styles.cardContent}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.foreground }]}>{job.title}</Text>
              <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                <Text style={[styles.badgeText, { color: job.status === 'active' ? '#fff' : colors.mutedForeground }]}>
                  {job.status}
                </Text>
              </Badge>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{job.location}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={16} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{job.job_type}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={16} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{salaryText}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="help-circle-outline" size={16} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>Pre-screening: {job.has_questions ? 'Enabled' : 'Disabled'}</Text>
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Description</Text>
            <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>{job.description}</Text>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Requirements</Text>
            {job.requirements?.length ? (
              <View style={styles.requirementsWrap}>
                {job.requirements.map((req, index) => (
                  <Badge key={`${req}-${index}`} variant="secondary">
                    <Text>{req}</Text>
                  </Badge>
                ))}
              </View>
            ) : (
              <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>No requirements listed.</Text>
            )}
          </CardContent>
        </Card>

        <Button
          variant="outline"
          onPress={() =>
            router.push({
              pathname: '/(company)/dashboard/edit_job',
              params: { id: String(job.id) },
            })
          }
          style={styles.editButton}
        >
          <Ionicons name="create-outline" size={16} color={colors.foreground} style={{ marginRight: 6 }} />
          <Text style={{ color: colors.foreground }}>Edit Job</Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  helperText: { fontSize: 13 },
  cardContent: { padding: 14, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionText: { fontSize: 14, lineHeight: 20 },
  requirementsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  editButton: { alignSelf: 'flex-start' },
});