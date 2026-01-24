import { Colors } from '@/constants/theme';
import React, { createContext, useContext } from 'react';
import { TouchableOpacity, View, ViewStyle, useColorScheme } from 'react-native';

interface RadioGroupContextValue {
  value: string | null;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | undefined>(undefined);

interface RadioGroupProps {
  value: string | null;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
}

export function RadioGroup({ value, onValueChange, children, disabled, style }: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, disabled }}>
      <View style={style}>{children}</View>
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupItemProps {
  value: string;
  id: string;
  disabled?: boolean;
}

export function RadioGroupItem({ value, disabled }: RadioGroupItemProps) {
  const context = useContext(RadioGroupContext);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!context) {
    throw new Error('RadioGroupItem must be used within a RadioGroup');
  }

  const isSelected = context.value === value;
  const isDisabled = disabled || context.disabled;

  return (
    <TouchableOpacity
      onPress={() => !isDisabled && context.onValueChange(value)}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: isSelected ? colors.primary : colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: isDisabled ? 0.5 : 1,
      }}
    >
      {isSelected && (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.primary,
          }}
        />
      )}
    </TouchableOpacity>
  );
}
