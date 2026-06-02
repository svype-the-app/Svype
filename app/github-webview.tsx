import { ThemedModal, type ThemedAlertConfig } from '@/components/ui/themed-modal';
import { Colors } from '@/constants/theme';
import { githubApi } from '@/services/github';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { type WebViewNavigation } from 'react-native-webview';

// Desktop Chrome UA — GitHub's login page refuses to render inside an
// "embedded WebView" identified by a mobile WebView user-agent. Pretending to
// be desktop Chrome works around that check and gives us a clean login page.
const DESKTOP_CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Backend redirects the WebView to this URL after the user authorizes.
// We intercept this navigation BEFORE the browser actually loads the page,
// extract code+state, and call our JSON exchange endpoint — so the user
// never sees the ngrok URL flash by.
//
// IMPORTANT: we match on URL.pathname, NOT a `.includes()` on the raw URL.
// The initial OAuth authorize URL has the callback as a `redirect_uri=...`
// query parameter, so a substring match would fire the interceptor on the
// very first load — there's no code/state at that point, and the user gets
// a spurious "missing_code_or_state" error.
const CALLBACK_URL_PATH = '/api/auth/github/callback/';

function isOAuthCallbackUrl(rawUrl: string | undefined): boolean {
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl);
    // Strict: the navigation must actually be heading TO the callback path,
    // not just contain it as a query parameter.
    if (parsed.pathname !== CALLBACK_URL_PATH) return false;
    // Only intercept if GitHub has actually issued a code/error redirect.
    return parsed.searchParams.has('code') || parsed.searchParams.has('error');
  } catch {
    return false;
  }
}

type Phase = 'oauth' | 'exchanging' | 'done';

/**
 * In-app GitHub OAuth screen using react-native-webview.
 *
 * Why this exists:
 *   1. Forces a fresh GitHub login on every connect — cookies are NOT shared
 *      with the system browser, so saved github.com credentials don't
 *      auto-login the user. iOS uses `sharedCookiesEnabled={false}` and
 *      Android uses `incognito={true}` to isolate cookies.
 *   2. Hides the ngrok callback URL. The WebView's onShouldStartLoadWithRequest
 *      catches GitHub's 302 redirect to our backend *before* the browser
 *      navigates there, so the user never sees the ngrok domain.
 *
 * Flow:
 *   - Screen receives `authUrl` via params (built server-side in
 *     /api/auth/github/initiate/).
 *   - WebView loads github.com/login/oauth/authorize/...
 *   - User authenticates and clicks "Authorize".
 *   - GitHub issues a redirect to wifi-...ngrok-free.dev/api/auth/github/callback/?code=X&state=Y
 *   - We intercept on the redirect, prevent the WebView from following it,
 *     POST {code, state} to /api/auth/github/exchange/, and either route to
 *     the success screen or show an error.
 */
export default function GitHubWebViewScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { authUrl } = useLocalSearchParams<{ authUrl: string }>();

  const [phase, setPhase] = useState<Phase>('oauth');
  const [error, setError] = useState<string | null>(null);
  const [alertConfig, setAlertConfig] = useState<ThemedAlertConfig | null>(null);
  // Re-entrancy guard so onShouldStartLoadWithRequest doesn't fire
  // exchangeCode twice if the WebView retries the redirect.
  const handlingRef = useRef(false);

  useEffect(() => {
    if (!authUrl) {
      setAlertConfig({
        title: 'GitHub Error',
        message: 'Missing authorization URL.',
        buttons: [{ label: 'OK', onPress: () => router.back() }],
      });
    }
  }, [authUrl, router]);

  const handleClose = () => {
    if (phase === 'exchanging') return; // don't close mid-exchange
    router.back();
  };

  const finishWithSuccess = (skillsAdded: string[], username: string) => {
    setPhase('done');
    // Hand off to the existing callback screen which shows the chip-card
    // success UI and then routes to chat?reason=github_connected.
    const params = new URLSearchParams({
      success: 'true',
      skills_added: skillsAdded.join(','),
      github_username: username,
    });
    router.replace(`/github-callback?${params.toString()}` as any);
  };

  const finishWithError = (message: string) => {
    setPhase('done');
    const params = new URLSearchParams({ success: 'false', error: message });
    router.replace(`/github-callback?${params.toString()}` as any);
  };

  /**
   * Intercept every navigation. If the WebView is about to load our backend's
   * callback URL (with a real code/error from GitHub), stop, pull code+state
   * from the query string, and exchange server-side. Returning false cancels
   * the navigation.
   *
   * The first WebView load is the GitHub authorize URL which contains the
   * callback URL as a `redirect_uri=...` query param — we explicitly do NOT
   * intercept that, since the user hasn't authorized yet.
   */
  const onShouldStartLoadWithRequest = (req: WebViewNavigation): boolean => {
    if (!isOAuthCallbackUrl(req.url)) return true;
    if (handlingRef.current) return false;
    handlingRef.current = true;

    setPhase('exchanging');

    try {
      const url = new URL(req.url);
      const code = url.searchParams.get('code') ?? '';
      const state = url.searchParams.get('state') ?? '';
      const oauthError = url.searchParams.get('error') ?? '';

      if (oauthError) {
        finishWithError(oauthError);
        return false;
      }
      if (!code || !state) {
        finishWithError('missing_code_or_state');
        return false;
      }

      githubApi
        .exchangeCode(code, state)
        .then((res) => {
          if (res.success) {
            finishWithSuccess(res.skills_added ?? [], res.github_username ?? '');
          } else {
            finishWithError(res.error || 'exchange_failed');
          }
        })
        .catch((err: any) => {
          finishWithError(err?.message ?? 'network_error');
        });
    } catch {
      finishWithError('bad_redirect_url');
    }

    return false; // Always cancel — we handled it
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border ?? '#e5e7eb' }]}>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.headerButton}
          disabled={phase === 'exchanging'}
        >
          <Ionicons name="close" size={24} color={phase === 'exchanging' ? colors.mutedForeground : colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Ionicons name="logo-github" size={18} color={colors.foreground} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Sign in to GitHub</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.destructive ?? '#ef4444' }]}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.webviewContainer}>
        {authUrl ? (
          <WebView
            source={{ uri: authUrl }}
            userAgent={DESKTOP_CHROME_UA}
            sharedCookiesEnabled={false}
            thirdPartyCookiesEnabled={false}
            incognito
            cacheEnabled={false}
            javaScriptEnabled
            domStorageEnabled
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}
          />
        ) : null}

        {phase === 'exchanging' ? (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Importing your skills…
            </Text>
          </View>
        ) : null}
      </View>

      <ThemedModal
        visible={!!alertConfig}
        title={alertConfig?.title ?? ''}
        message={alertConfig?.message ?? ''}
        buttons={alertConfig?.buttons ?? []}
        onRequestClose={() => setAlertConfig(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitleBlock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  webviewContainer: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14 },
  errorContainer: { padding: 12, alignItems: 'center' },
  errorText: { fontSize: 13, textAlign: 'center' },
});
