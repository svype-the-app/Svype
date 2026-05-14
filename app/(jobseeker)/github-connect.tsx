import { Colors } from '@/constants/theme';
import { githubApi } from '@/services/github';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function GitHubConnectScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [connecting, setConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ username: string; skills: string[] } | null>(null);

  const handleConnectPress = async () => {
    setConnecting(true);
    setError(null);
    setStatusMessage('Contacting server…');
    try {
      // Expo Go → exp://192.168.x.x:8081/--/github-callback
      // Custom dev client / production build → svype://github-callback
      const redirectUrl = Linking.createURL('github-callback');

      // Tell the backend where to bounce us back to — the scheme differs
      // between Expo Go and a real build, so we can't hard-code it server-side.
      const { auth_url } = await githubApi.getAuthUrl(redirectUrl);

      setStatusMessage('Opening GitHub…');
      // prefersEphemeralWebBrowserSession: isolate from system browser cookies
      // so GitHub always shows the login screen instead of silently
      // re-authorizing the existing session. iOS only — on Android the user
      // can revoke at github.com/settings/applications to force re-login.
      const authResult = await WebBrowser.openAuthSessionAsync(auth_url, redirectUrl, {
        preferEphemeralSession: true,
      });

      if (authResult.type !== 'success' || !authResult.url) {
        // 'cancel' or 'dismiss' — user closed the browser
        setStatusMessage(null);
        return;
      }

      const { queryParams } = Linking.parse(authResult.url);
      if (queryParams?.success === 'true') {
        const skillsRaw = (queryParams?.skills_added as string) ?? '';
        const skills = skillsRaw ? skillsRaw.split(',').filter(Boolean) : [];
        const username = (queryParams?.github_username as string) ?? '';
        setStatusMessage(null);
        setResult({ username, skills });
      } else {
        setStatusMessage(null);
        const errMsg = (queryParams?.error as string) ?? 'Something went wrong.';
        Alert.alert('GitHub Error', errMsg);
      }
    } catch (err: any) {
      setStatusMessage(null);
      setError(err?.message ?? 'Failed to start GitHub connection');
    } finally {
      setConnecting(false);
    }
  };

  const handleContinueToChat = () => {
    router.replace('/(jobseeker)/chat?reason=github_connected' as any);
  };

  const handleCancelInFlight = () => {
    // Reset the UI so the user can tap Connect again. The underlying network
    // request will resolve in the background and be ignored.
    setStatusMessage(null);
    setConnecting(false);
  };

  if (result) {
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
            {result.skills.length > 0 ? 'Skills extracted!' : 'GitHub connected'}
          </Text>
          {result.username ? (
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              Connected as @{result.username}
            </Text>
          ) : null}

          {result.skills.length > 0 ? (
            <>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                We pulled these skills from your public repositories:
              </Text>
              <View style={styles.chipRow}>
                {result.skills.map((skill) => (
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
              We didn't find any new skills to add — your profile already has everything we
              detected from your repositories.
            </Text>
          )}

          <TouchableOpacity
            style={[styles.connectButton, { backgroundColor: colors.foreground }]}
            onPress={handleContinueToChat}
            activeOpacity={0.85}
          >
            <Text style={[styles.connectButtonText, { color: colors.background }]}>
              Continue
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border ?? '#e5e7eb' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
        </TouchableOpacity>
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
          We'll scan your public repositories and automatically extract your top programming
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

        <TouchableOpacity onPress={() => router.back()} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
            I'll enter skills manually
          </Text>
        </TouchableOpacity>
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
  cancelText: { fontSize: 16 },
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
  errorText: { fontSize: 13, textAlign: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  statusText: { fontSize: 13 },
  cancelInFlight: { paddingVertical: 8 },
  cancelInFlightText: { fontSize: 13, textDecorationLine: 'underline' },
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
});
