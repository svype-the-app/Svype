import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { jobsApi, type Job } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type JobStatus = 'active' | 'closed' | 'draft';
type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';

export default function EditCompanyJobScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState<Job | null>(null);

  const [jobType, setJobType] = useState<JobType>('full-time');
  const [status, setStatus] = useState<JobStatus>('active');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      try {
        const data = await jobsApi.getJob(Number(id));
        setJob(data);
        setJobType((data.job_type as JobType) || 'full-time');
        setStatus((data.status as JobStatus) || 'active');
        setSalaryMin(data.salary_min ? String(data.salary_min) : '');
        setSalaryMax(data.salary_max ? String(data.salary_max) : '');
      } catch (error) {
        console.error('Failed to fetch job for edit', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const canSubmit = useMemo(() => !!job && !saving, [job, saving]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(company)/dashboard');
  };

  const handleSave = async () => {
    if (!job) return;

    const parsedMin = salaryMin ? Number(salaryMin) : undefined;
    const parsedMax = salaryMax ? Number(salaryMax) : undefined;

    if ((salaryMin && Number.isNaN(parsedMin)) || (salaryMax && Number.isNaN(parsedMax))) {
      Alert.alert('Invalid Salary', 'Please enter valid salary values.');
      return;
    }

    if (parsedMin && parsedMax && parsedMin > parsedMax) {
      Alert.alert('Invalid Salary Range', 'Minimum salary cannot be greater than maximum salary.');
      return;
    }

    setSaving(true);
    try {
      await jobsApi.updateJob(job.id, {
        job_type: jobType,
        status,
        salary_min: parsedMin,
        salary_max: parsedMax,
      });

      Alert.alert('Saved', 'Job updated successfully.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(company)/dashboard'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Update Failed', error?.message || 'Could not update job.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}> 
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Job</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.centeredState}>
          <Text style={[styles.helperText, { color: colors.mutedForeground }]}>Job not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Job</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card>
          <CardContent style={styles.cardContent}>
            <Text style={[styles.jobTitle, { color: colors.foreground }]}>{job.title}</Text>

            <View style={styles.group}>
              <Label>Job Type</Label>
              <View style={styles.pillRow}>
                {(['full-time', 'part-time', 'contract', 'internship', 'remote'] as JobType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setJobType(type)}
                    style={[
                      styles.pill,
                      {
                        borderColor: colors.border,
                        backgroundColor: jobType === type ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    <Text style={{ color: jobType === type ? '#fff' : colors.foreground, fontSize: 12 }}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.group}>
              <Label>Status</Label>
              <View style={styles.pillRow}>
                {(['active', 'closed', 'draft'] as JobStatus[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setStatus(s)}
                    style={[
                      styles.pill,
                      {
                        borderColor: colors.border,
                        backgroundColor: status === s ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    <Text style={{ color: status === s ? '#fff' : colors.foreground, fontSize: 12 }}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.group}>
              <Label>Minimum Salary</Label>
              <Input
                value={salaryMin}
                onChangeText={setSalaryMin}
                keyboardType="number-pad"
                placeholder="40000"
              />
            </View>

            <View style={styles.group}>
              <Label>Maximum Salary</Label>
              <Input
                value={salaryMax}
                onChangeText={setSalaryMax}
                keyboardType="number-pad"
                placeholder="60000"
              />
            </View>

            <Button onPress={handleSave} disabled={!canSubmit} style={styles.saveBtn}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Save Changes</Text>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 16 },
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
  centeredState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  helperText: { fontSize: 14 },
  cardContent: { padding: 14, gap: 14 },
  jobTitle: { fontSize: 18, fontWeight: '700' },
  group: { gap: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  saveBtn: { marginTop: 8 },
});