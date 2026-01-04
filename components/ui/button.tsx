import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle, useColorScheme } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'outline';
  size?: 'default' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({ 
  children, 
  onPress, 
  variant = 'default', 
  size = 'default',
  style,
  textStyle 
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: colors.primary,
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: Radius.md,
          alignItems: 'center',
          justifyContent: 'center',
        },
        variant === 'outline' && {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        },
        size === 'lg' && {
          paddingVertical: 16,
          paddingHorizontal: 32,
        },
        style
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          {
            color: colors.primaryForeground,
            fontSize: 16,
            fontWeight: '600',
          },
          variant === 'outline' && {
            color: colors.foreground,
          },
          size === 'lg' && {
            fontSize: 18,
          },
          textStyle
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}
