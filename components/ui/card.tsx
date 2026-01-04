import React from 'react';
import { View, ViewProps, useColorScheme } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...props }: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: Radius.lg,
          borderWidth: 2,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

interface CardContentProps extends ViewProps {
  children: React.ReactNode;
}

export function CardContent({ children, style, ...props }: CardContentProps) {
  return (
    <View style={[{ padding: 24 }, style]} {...props}>
      {children}
    </View>
  );
}
