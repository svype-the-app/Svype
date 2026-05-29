import { Card, CardContent } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { aiChatApi, authApi } from '@/services/api';
import type { AiCheckInFrequency } from '@/services/ai-chat';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FrequencyOption {
  value: AiCheckInFrequency;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  {
    value: 'every_5_mins',
    label: 'Every 5 minutes',
    description: 'Rapid nudges every 5 minutes — handy for testing.',
    icon: 'flash-outline',
  },
  {
    value: 'daily',
    label: 'Once a day',
    description: 'A quick nudge each day to keep your profile fresh.',
    icon: 'sunny-outline',
  },
  {
    value: 'every_3_days',
    label: 'Every 3 days',
    description: 'A light touch every few days — enough to stay current.',
    icon: 'calendar-outline',
  },
  {
    value: 'weekly',
    label: 'Once a week',
    description: 'A weekly check-in to capture anything new.',
    icon: 'time-outline',
  },
  {
    value: 'never',
    label: 'Never',
    description: 'Turn off proactive check-ins. You can still chat anytime.',
    icon: 'notifications-off-outline',
  },
];

export default function AiSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [frequency, setFrequency] = useState<AiCheckInFrequency | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<AiCheckInFrequency | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const user = await authApi.getMe();
        if (cancelled) return;
        const current = user.profile?.ai_checkin_frequency ?? 'daily';
        setFrequency(current);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message ?? 'Could not load your AI settings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelect = async (value: AiCheckInFrequency) => {
    if (value === frequency || saving) return;
    setSaving(value);
    setError(null);
    const previous = frequency;
    setFrequency(value); // optimistic
    try {
      const result = await aiChatApi.updateCheckInSettings(value);
      setFrequency(result.ai_checkin_frequency);
      setToast('Saved');
      setTimeout(() => setToast(null), 1800);
    } catch (err: any) {
      setFrequency(previous);
      setError(err?.message ?? 'Could not save. Try again.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          AI Assistant Settings
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Check-in Frequency
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
          How often should the AI reach out to keep your profile and matches up to date?
        </Text>

        {loading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <Card style={[styles.optionsCard, { borderColor: colors.border }]}>
            <CardContent style={styles.optionsContent}>
              {FREQUENCY_OPTIONS.map((opt, idx) => {
                const selected = frequency === opt.value;
                const busy = saving === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => handleSelect(opt.value)}
                    activeOpacity={0.85}
                    disabled={!!saving}
                    style={[
                      styles.option,
                      idx !== FREQUENCY_OPTIONS.length - 1 && {
                        borderBottomColor: colors.border,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: colors.muted }]}>
                      <Ionicons name={opt.icon} size={20} color={colors.foreground} />
                    </View>
                    <View style={styles.optionTextBlock}>
                      <Text style={[styles.optionLabel, { color: colors.foreground }]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>
                        {opt.description}
                      </Text>
                    </View>
                    {busy ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor: selected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        {selected ? (
                          <View
                            style={[styles.radioInner, { backgroundColor: colors.primary }]}
                          />
                        ) : null}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </CardContent>
          </Card>
        )}

        {error ? (
          <Text style={[styles.errorText, { color: colors.destructive ?? '#ef4444' }]}>
            {error}
          </Text>
        ) : null}
      </ScrollView>

      {toast ? (
        <View style={[styles.toast, { backgroundColor: colors.foreground }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.background} />
          <Text style={[styles.toastText, { color: colors.background }]}>{toast}</Text>
        </View>
      ) : null}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { minWidth: 32, padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  sectionDescription: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  loadingBlock: { paddingVertical: 32, alignItems: 'center' },
  optionsCard: { borderWidth: StyleSheet.hairlineWidth },
  optionsContent: { padding: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  optionTextBlock: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  optionDescription: { fontSize: 12, lineHeight: 18 },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  errorText: { fontSize: 13, textAlign: 'center', marginTop: 12 },
  toast: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  toastText: { fontSize: 13, fontWeight: '600' },
});
