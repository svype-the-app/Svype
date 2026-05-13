// Before using this screen run: npx expo install react-native-webview
import { Colors } from '@/constants/theme';
import { githubApi } from '@/services/github';
import type { GitHubConnectResult } from '@/services/github';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    githubApi
      .getAuthUrl()
      .then(({ auth_url }) => {
        setAuthUrl(auth_url);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message ?? 'Failed to start GitHub connection');
        setLoading(false);
      });
  }, []);

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
      const count = result.skills_added?.length ?? 0;
      Alert.alert(
        'GitHub Connected!',
        count > 0
          ? `Added ${count} skill${count === 1 ? '' : 's'} from @${result.github_username}.`
          : `Connected @${result.github_username}. No new skills found.`,
      );
      setTimeout(() => router.back(), 1500);
    } else {
      Alert.alert(
        'GitHub Error',
        result.error ?? 'Something went wrong. Please try again.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Connecting to GitHub…
        </Text>
      </View>
    );
  }

  if (error || !authUrl) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive ?? '#ef4444' }]}>
          {error ?? 'Could not load GitHub authorization page.'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    minWidth: 60,
  },
  cancelText: {
    fontSize: 16,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
});
