import React from 'react';
import { View, ViewProps, useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

interface SeparatorProps extends ViewProps {
  // Additional props can be added here
}

export function Separator({ style, ...props }: SeparatorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: colors.border,
        },
        style,
      ]}
      {...props}
    />
  );
}
