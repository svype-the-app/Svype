// Before using this screen run: npx expo install react-native-webview
import { Colors } from '@/constants/theme';
import { githubApi } from '@/services/github';
import type { GitHubConnectResult } from '@/services/github';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

export default function GitHubConnectScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  const handleConnectPress = async () => {
    setConnecting(true);
    setError(null);
    try {
      const { auth_url } = await githubApi.getAuthUrl();
      setAuthUrl(auth_url);
      setShowWebView(true);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to start GitHub connection');
    } finally {
      setConnecting(false);
    }
  };

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    if (handledRef.current) return;

    let result: GitHubConnectResult;
    try {
      result = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    handledRef.current = true;

    if (result.success) {
      // Navigate to chat — AI will confirm imported skills there
      router.replace('/(jobseeker)/chat?reason=github_connected' as any);
    } else {
      Alert.alert(
        'GitHub Error',
        result.error ?? 'Something went wrong. Please try again.',
        [{ text: 'OK', onPress: () => { setShowWebView(false); setAuthUrl(null); handledRef.current = false; } }],
      );
    }
  };

  // WebView OAuth flow
  if (showWebView && authUrl) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border ?? '#e5e7eb' }]}>
          <TouchableOpacity onPress={() => { setShowWebView(false); setAuthUrl(null); handledRef.current = false; }} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Connect GitHub</Text>
          <View style={styles.cancelButton} />
        </View>
        <WebView
          source={{ uri: authUrl }}
          onMessage={handleMessage}
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          style={{ flex: 1 }}
        />
      </View>
    );
  }

  // Landing page
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border ?? '#e5e7eb' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Connect GitHub</Text>
        <View style={styles.cancelButton} />
      </View>

      <View style={styles.landing}>
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: colors.muted }]}>
          <Ionicons name="logo-github" size={48} color={colors.foreground} />
        </View>

        {/* Title & description */}
        <Text style={[styles.title, { color: colors.foreground }]}>
          Import skills from GitHub
        </Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          We'll scan your public repositories and automatically extract your top programming
          languages and technologies. This gives you a more accurate and complete skills profile.
        </Text>

        {/* Bullet points */}
        {['Automatic skill detection from your repos', 'Works with all public repositories', 'You can edit or remove skills after import'].map((item) => (
          <View key={item} style={styles.bullet}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{item}</Text>
          </View>
        ))}

        {error ? (
          <Text style={[styles.errorText, { color: colors.destructive ?? '#ef4444' }]}>{error}</Text>
        ) : null}

        {/* Connect button */}
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
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
});
