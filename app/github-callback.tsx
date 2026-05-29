import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

// Lands here when the OAuth flow redirects back into the app. Reads the
// success/error params straight off the URL via useLocalSearchParams —
// no Linking event listener, no race conditions. Replaces the previous
// listener-based approach in github-connect.tsx, which was getting
// unmounted by Expo Router before its callback could fire.
export default function GitHubCallback() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{
    success?: string;
    skills_added?: string;
    github_username?: string;
    error?: string;
  }>();

  useEffect(() => {
    // OS usually closes the OAuth browser when it follows our deep-link
    // redirect, but call this defensively in case it didn't.
    WebBrowser.dismissBrowser();
  }, []);

  const success = params.success === 'true';
  const skills = useMemo(
    () => (params.skills_added ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    [params.skills_added],
  );
  const username = params.github_username ?? '';
  const errorMsg = params.error ?? '';

  if (!success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border ?? '#e5e7eb' }]}>
          <View style={styles.cancelButton} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Connection failed</Text>
          <View style={styles.cancelButton} />
        </View>

        <ScrollView contentContainerStyle={styles.landing}>
          <View style={[styles.iconCircle, { backgroundColor: colors.muted }]}>
            <Ionicons name="alert-circle" size={56} color={colors.destructive ?? '#ef4444'} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>Couldn&apos;t connect GitHub</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            {errorMsg
              ? `Reason: ${errorMsg}`
              : 'Something went wrong on the way back from GitHub. Please try again.'}
          </Text>

          <TouchableOpacity
            style={[styles.connectButton, { backgroundColor: colors.foreground }]}
            onPress={() => router.replace('/(jobseeker)/profile/github-connect' as any)}
            activeOpacity={0.85}
          >
            <Text style={[styles.connectButtonText, { color: colors.background }]}>Try again</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border ?? '#e5e7eb' }]}>
        <View style={styles.cancelButton} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>GitHub Connected</Text>
        <View style={styles.cancelButton} />
      </View>

      <ScrollView contentContainerStyle={styles.landing}>
        <View style={[styles.iconCircle, { backgroundColor: colors.muted }]}>
          <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          {skills.length > 0 ? 'Skills extracted!' : 'GitHub connected'}
        </Text>

        {username ? (
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            Connected as @{username}
          </Text>
        ) : null}

        {skills.length > 0 ? (
          <>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              We pulled these skills from your public repositories:
            </Text>
            <View style={styles.chipRow}>
              {skills.map((skill) => (
                <View
                  key={skill}
                  style={[styles.chip, { backgroundColor: colors.muted, borderColor: colors.border ?? '#e5e7eb' }]}
                >
                  <Text style={[styles.chipText, { color: colors.foreground }]}>{skill}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            We didn&apos;t find any new skills to add — your profile already has everything we
            detected from your repositories.
          </Text>
        )}

        <TouchableOpacity
          style={[styles.connectButton, { backgroundColor: colors.foreground }]}
          onPress={() => router.replace('/(jobseeker)/chat?reason=github_connected' as any)}
          activeOpacity={0.85}
        >
          <Text style={[styles.connectButtonText, { color: colors.background }]}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: { fontSize: 16, fontWeight: '600' },
  cancelButton: { minWidth: 60 },
  landing: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
    gap: 16,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  description: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 8 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontSize: 13, fontWeight: '500' },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignSelf: 'stretch',
    marginTop: 8,
  },
  connectButtonText: { fontSize: 16, fontWeight: '600' },
});
