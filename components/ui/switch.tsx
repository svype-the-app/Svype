import { Colors } from '@/constants/theme';
import React from 'react';
import { Switch as RNSwitch, SwitchProps, useColorScheme } from 'react-native';

interface CustomSwitchProps extends Omit<SwitchProps, 'value' | 'onValueChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function Switch({ checked, onCheckedChange, disabled, ...props }: CustomSwitchProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <RNSwitch
      value={checked}
      onValueChange={onCheckedChange}
      disabled={disabled}
      trackColor={{
        false: colors.input,
        true: colors.primary,
      }}
      thumbColor={checked ? colors.primaryForeground : colors.card}
      ios_backgroundColor={colors.input}
      {...props}
    />
  );
}
