import { TextInput, StyleSheet, useColorScheme, type TextInputProps } from 'react-native';
import { Colors } from '@/constants/theme';
import { Radius } from '@/constants/theme';

interface TextareaProps extends TextInputProps {
  rows?: number;
}

export function Textarea({ rows = 4, style, ...props }: TextareaProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TextInput
      multiline
      numberOfLines={rows}
      textAlignVertical="top"
      style={[
        styles.textarea,
        {
          backgroundColor: colors.background,
          color: colors.foreground,
          borderColor: colors.input,
          height: rows * 24 + 24, // Approximate height based on rows
        },
        style,
      ]}
      placeholderTextColor={colors.mutedForeground}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  textarea: {
    borderWidth: 2,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'System',
  },
});
