import React from 'react';
import { Text, TextProps, useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

interface LabelProps extends TextProps {
  children: React.ReactNode;
}

export function Label({ children, style, ...props }: LabelProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Text
      style={[
        {
          fontSize: 14,
          fontWeight: '600',
          color: colors.foreground,
          marginBottom: 8,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
