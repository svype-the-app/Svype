import { Colors } from '@/constants/theme';
import React, { createContext, useContext, useState } from 'react';
import { Text, TouchableOpacity, useColorScheme, View, ViewStyle } from 'react-native';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Tabs({ defaultValue, children, style }: TabsProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, onValueChange: setValue }}>
      <View style={style}>{children}</View>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

export function TabsList({ children, style, className }: TabsListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Check if className contains grid-cols-* to determine layout
  const isGrid = className?.includes('grid-cols');
  const colsMatch = className?.match(/grid-cols-(\d+)/);
  const columns = colsMatch ? parseInt(colsMatch[1]) : 2;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: colors.muted,
          borderRadius: 8,
          padding: 4,
          marginBottom: 16,
        },
        isGrid && { width: '100%' },
        style,
      ]}
    >
      {React.Children.map(children, (child) => (
        <View style={isGrid ? { flex: 1 } : undefined}>{child}</View>
      ))}
    </View>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function TabsTrigger({ value, children, style }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component');
  }

  const isActive = context.value === value;

  return (
    <TouchableOpacity
      onPress={() => context.onValueChange(value)}
      activeOpacity={0.7}
      style={[
        {
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 6,
          backgroundColor: isActive ? colors.background : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: isActive ? '600' : '500',
          color: isActive ? colors.foreground : colors.mutedForeground,
        }}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export function TabsContent({ value, children, className, style }: TabsContentProps) {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component');
  }

  if (context.value !== value) {
    return null;
  }

  // Parse className for spacing
  const hasSpacing = className?.includes('space-y');
  const spacing = hasSpacing ? 16 : 0;

  return <View style={[spacing > 0 && { gap: spacing }, style]}>{children}</View>;
}
