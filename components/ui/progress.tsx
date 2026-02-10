import { Colors } from '@/constants/theme';
import React from 'react';
import { View, ViewStyle, useColorScheme } from 'react-native';

interface ProgressProps {
  value: number;
  className?: string;
  style?: ViewStyle;
}

export function Progress({ value, style }: ProgressProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <View
      style={[
        {
          height: 8,
          backgroundColor: colors.secondary,
          borderRadius: 4,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        style={{
          height: '100%',
          width: `${clampedValue}%`,
          backgroundColor: colors.primary,
          borderRadius: 4,
        }}
      />
    </View>
  );
}
