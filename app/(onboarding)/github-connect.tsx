import { Colors } from '@/constants/theme';
import { authApi } from '@/services/api';
import { githubApi } from '@/services/github';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Onboarding variant of the GitHub-connect screen. Lives in the (onboarding)
// stack so it renders WITHOUT the jobseeker bottom tab bar — the user must not
// be able to navigate the rest of the app mid-onboarding. The connect button
// logic is identical to the post-onboarding screen; only the chrome differs
// (no back arrow, a "Cancel" button that returns to the chat).
export default function OnboardingGitHubConnectScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [connecting, setConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // When this screen regains focus, check whether GitHub is now connected (the
  // OAuth round-trip happens in the WebView/callback). If so, return the user
  // to the onboarding chat instead of leaving them on this screen.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const me = await authApi.getMe();
          const connected = Boolean((me.profile as any)?.github_url);
          if (active && connected) {
            router.replace('/(jobseeker)/chat' as any);
          }
        } catch {
          // Network/auth error — stay on the screen, don't redirect.
        }
      })();
      return () => {
        active = false;
      };
    }, [router])
  );

  const handleConnectPress = async () => {
    setConnecting(true);
    setError(null);
    setStatusMessage('Contacting server…');

    try {
      // The in-app WebView (see app/github-webview.tsx) handles the full
      // OAuth flow internally and routes to /github-callback on success/failure.
      const { auth_url } = await githubApi.getAuthUrl();
      setStatusMessage(null);
      router.push({
        pathname: '/github-webview',
        params: { authUrl: auth_url },
      } as any);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to start GitHub connection');
    } finally {
      setStatusMessage(null);
      setConnecting(false);
    }
  };

  const handleCancelInFlight = () => {
    // Reset the UI so the user can tap Connect again. The underlying network
    // request will resolve in the background and be ignored.
    setStatusMessage(null);
    setConnecting(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border ?? '#e5e7eb' }]}>
        <View style={styles.cancelButton} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Connect GitHub</Text>
        <View style={styles.cancelButton} />
      </View>

      <View style={styles.landing}>
        <View style={[styles.iconCircle, { backgroundColor: colors.muted }]}>
          <Ionicons name="logo-github" size={48} color={colors.foreground} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          Import skills from GitHub
        </Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          We&apos;ll scan your public repositories and automatically extract your top programming
          languages and technologies. This gives you a more accurate and complete skills profile.
        </Text>

        {['Automatic skill detection from your repos', 'Works with all public repositories', 'You can edit or remove skills after import'].map((item) => (
          <View key={item} style={styles.bullet}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{item}</Text>
          </View>
        ))}

        {error ? (
          <Text style={[styles.errorText, { color: colors.destructive ?? '#ef4444' }]}>{error}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.connectButton, { backgroundColor: colors.foreground }, connecting && styles.connectButtonDisabled]}
          onPress={handleConnectPress}
          disabled={connecting}
          activeOpacity={0.85}
        >
          {connecting ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <Ionicons name="logo-github" size={20} color={colors.background} />
              <Text style={[styles.connectButtonText, { color: colors.background }]}>
                Connect GitHub
              </Text>
            </>
          )}
        </TouchableOpacity>

        {statusMessage ? (
          <>
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.mutedForeground} />
              <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                {statusMessage}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCancelInFlight} style={styles.cancelInFlight}>
              <Text style={[styles.cancelInFlightText, { color: colors.primary }]}>
                Tap to cancel
              </Text>
            </TouchableOpacity>
          </>
        ) : null}

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.skipButton}
        >
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text style={[styles.skipSubtext, { color: colors.mutedForeground }]}>
          You can connect from Profile → Settings later
        </Text>
      </View>
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
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch' },
  bulletText: { fontSize: 14, flex: 1 },
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
  connectButtonDisabled: { opacity: 0.6 },
  connectButtonText: { fontSize: 16, fontWeight: '600' },
  skipButton: { paddingVertical: 12 },
  skipText: { fontSize: 14 },
  skipSubtext: { fontSize: 12, textAlign: 'center', marginTop: -4 },
  errorText: { fontSize: 13, textAlign: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  statusText: { fontSize: 13 },
  cancelInFlight: { paddingVertical: 8 },
  cancelInFlightText: { fontSize: 13, textDecorationLine: 'underline' },
});
