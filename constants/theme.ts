/**
 * Theme colors converted from the Next.js app's global CSS
 * Using oklch color values converted to hex for React Native compatibility
 */

import { Platform } from 'react-native';

// Helper function to convert oklch to approximate hex values
// Note: These are approximate conversions from the oklch values
export const Colors = {
  light: {
    background: '#f9fafb',
    foreground: '#1f2937',
    card: '#ffffff',
    cardForeground: '#1f2937',
    popover: '#ffffff',
    popoverForeground: '#1f2937',
    primary: '#10b981', // Professional Emerald Green
    primaryForeground: '#ffffff',
    secondary: '#f3f4f6',
    secondaryForeground: '#1f2937',
    muted: '#f9fafb',
    mutedForeground: '#6b7280',
    accent: '#f0fdf4',
    accentForeground: '#1f2937',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#e5e7eb',
    input: '#e5e7eb',
    ring: '#10b981',
    text: '#1f2937',
    icon: '#6b7280',
    tabIconDefault: '#6b7280',
    tabIconSelected: '#10b981',
  },
  dark: {
    background: '#1a1f1e',
    foreground: '#f9fafb',
    card: '#232827',
    cardForeground: '#f9fafb',
    popover: '#1f2524',
    popoverForeground: '#fafafa',
    primary: '#34d399',
    primaryForeground: '#1a1f1e',
    secondary: '#374151',
    secondaryForeground: '#fafafa',
    muted: '#374151',
    mutedForeground: '#9ca3af',
    accent: '#374151',
    accentForeground: '#fafafa',
    destructive: '#dc2626',
    destructiveForeground: '#fee2e2',
    border: '#2d3432',
    input: '#374151',
    ring: '#6b7280',
    text: '#f9fafb',
    icon: '#9ca3af',
    tabIconDefault: '#9ca3af',
    tabIconSelected: '#34d399',
  },
};

export const Radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
