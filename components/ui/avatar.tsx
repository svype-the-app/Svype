import { Colors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, useColorScheme, View, ViewStyle } from 'react-native';

interface AvatarProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  size?: number;
}

export function Avatar({ children, style, size = 40 }: AvatarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.muted,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface AvatarFallbackProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function AvatarFallback({ children, style }: AvatarFallbackProps) {
  return (
    <View style={[styles.fallback, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
});
