import React, { forwardRef } from 'react';
import { TextInput, TextInputProps, StyleSheet, useColorScheme } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

interface InputProps extends TextInputProps {
  // Additional props can be added here
}

export const Input = forwardRef<TextInput, InputProps>(({ style, ...props }, ref) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TextInput
      ref={ref}
      style={[
        {
          height: 48,
          borderWidth: 2,
          borderColor: colors.border,
          borderRadius: Radius.md,
          paddingHorizontal: 16,
          fontSize: 16,
          color: colors.foreground,
          backgroundColor: colors.background,
        },
        style,
      ]}
      placeholderTextColor={colors.mutedForeground}
      {...props}
    />
  );
});
