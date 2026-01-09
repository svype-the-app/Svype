import { Colors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TextStyle, useColorScheme, View, ViewStyle } from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({ 
  children, 
  variant = 'default',
  style,
  textStyle,
}: BadgeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const variantStyles = {
    default: {
      container: { backgroundColor: colors.primary },
      text: { color: colors.primaryForeground },
    },
    outline: {
      container: { 
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
      },
      text: { color: colors.foreground },
    },
    secondary: {
      container: { backgroundColor: colors.secondary },
      text: { color: colors.secondaryForeground },
    },
  };

  return (
    <View style={[styles.badge, variantStyles[variant].container, style]}>
      <Text style={[styles.badgeText, variantStyles[variant].text, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
