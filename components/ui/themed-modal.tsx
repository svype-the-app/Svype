import { Colors } from '@/constants/theme';
import { Modal, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export type ThemedAlertVariant = 'primary' | 'secondary' | 'destructive';

export type ThemedAlertButton = {
  label: string;
  onPress?: () => void;
  variant?: ThemedAlertVariant;
};

// Convenience shape for the `const [alertConfig, setAlertConfig] = useState<ThemedAlertConfig | null>(null)`
// pattern used across the app to replace Alert.alert.
export type ThemedAlertConfig = {
  title: string;
  message: string;
  buttons: ThemedAlertButton[];
};

interface ThemedModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: ThemedAlertButton[];
  onRequestClose?: () => void;
}

/**
 * Theme-aware replacement for React Native's `Alert.alert`. Renders a centered
 * card over a dimmed overlay using the app's `Colors`. Pressing any button runs
 * its `onPress` and then calls `onRequestClose` (so callers don't have to
 * dismiss manually). Buttons stack vertically when there are more than two.
 */
export function ThemedModal({ visible, title, message, buttons, onRequestClose }: ThemedModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const list: ThemedAlertButton[] =
    buttons && buttons.length > 0 ? buttons : [{ label: 'OK', variant: 'primary' }];
  const stacked = list.length > 2;

  const handlePress = (btn: ThemedAlertButton) => {
    btn.onPress?.();
    onRequestClose?.();
  };

  const backgroundFor = (v?: ThemedAlertVariant) =>
    v === 'destructive' ? colors.destructive : v === 'secondary' ? colors.muted : colors.primary;
  const textColorFor = (v?: ThemedAlertVariant) =>
    v === 'destructive' ? colors.destructiveForeground : v === 'secondary' ? colors.mutedForeground : '#ffffff';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {!!title && <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>}
          {!!message && <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
          <View style={[styles.buttonRow, stacked && styles.buttonColumn]}>
            {list.map((btn, idx) => (
              <TouchableOpacity
                key={`${btn.label}-${idx}`}
                style={[
                  styles.button,
                  stacked ? styles.buttonStacked : styles.buttonInline,
                  { backgroundColor: backgroundFor(btn.variant) },
                ]}
                onPress={() => handlePress(btn)}
                activeOpacity={0.85}
              >
                <Text style={[styles.buttonText, { color: textColorFor(btn.variant) }]}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 24,
  },
  card: { width: '100%', maxWidth: 360, borderRadius: 16, borderWidth: 1, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  message: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  buttonColumn: { flexDirection: 'column' },
  button: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonInline: { flex: 1 },
  buttonStacked: { width: '100%' },
  buttonText: { fontSize: 14, fontWeight: '600' },
});
