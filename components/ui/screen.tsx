import { Borders, Colors, FontSizes, HitSlop, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Edge = 'top' | 'bottom';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /**
   * Which screen edges receive safe-area insets as padding.
   * Defaults to ['top'] because every section already has a bottom tab bar
   * that handles the bottom inset. Pass ['top', 'bottom'] for chat/full-
   * screen layouts that need to clear the bottom gesture bar.
   */
  edges?: Edge[];
}

/**
 * Standard screen wrapper.
 *
 * Renders a theme-coloured background that fills the device edge-to-edge
 * (including under the status bar) and applies the status-bar height as
 * top padding so screen content clears the system clock, battery, and
 * notification icons. Avoids the black inset band that SafeAreaView
 * produces when the system background does not match the app theme.
 */
export function Screen({ children, style, edges = ['top'] }: ScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const paddingTop = edges.includes('top') ? insets.top : 0;
  const paddingBottom = edges.includes('bottom') ? insets.bottom : 0;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop, paddingBottom },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  /** Optional right-side element (icon button, badge, etc.). */
  rightSlot?: React.ReactNode;
}

/**
 * Canonical back-arrow + centered-title screen header.
 *
 * Matches the dimensions every existing back-arrow header in the app
 * already uses: 16/12 padding, 1px hairline bottom border, 18/700 title,
 * 24px arrow icon. Use this only for screens that already render this
 * exact pattern — section landing screens (dashboards, swipe, auth) have
 * bespoke headers and should keep them.
 */
export function ScreenHeader({ title, onBack, rightSlot }: ScreenHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={[
        styles.header,
        { borderBottomColor: colors.border },
      ]}
    >
      {onBack ? (
        <TouchableOpacity onPress={onBack} hitSlop={HitSlop.default}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {rightSlot ? rightSlot : <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: Borders.hairline,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
  },
  spacer: {
    width: 24,
  },
});
