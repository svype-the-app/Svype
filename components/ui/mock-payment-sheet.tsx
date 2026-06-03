/**
 * MockPaymentSheet — a self-contained card-entry UI that mimics Stripe's
 * PaymentSheet appearance. Works in Expo Go (zero native dependencies).
 *
 * Test cards (any future expiry + any CVC):
 *   4242 4242 4242 4242 → success
 *   4000 0000 0000 0002 → declined
 */

import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { paymentsApi } from '@/services/payments';
import { invalidateCache } from '@/lib/query-client';

// ── Card numbers ─────────────────────────────────────────────────────────────
const SUCCESS_CARD = '4242424242424242';
const DECLINED_CARD = '4000000000000002';

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatCardNumber = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})(?=.)/g, '$1 ');
};

const formatExpiry = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

const maskCard = (num: string): string => {
  const d = num.replace(/\s/g, '');
  if (d.length < 4) return '•••• •••• •••• ••••';
  const last4 = d.slice(-4).padEnd(4, '•');
  return `•••• •••• •••• ${last4}`;
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface MockPaymentSheetProps {
  visible: boolean;
  amount: string;       // e.g. "£9.99"
  description: string;  // e.g. "Svype Premium – Jobseeker"
  onClose: () => void;
  onSuccess: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function MockPaymentSheet({
  visible,
  amount,
  description,
  onClose,
  onSuccess,
}: MockPaymentSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const expiryRef = useRef<TextInput>(null);
  const cvcRef = useRef<TextInput>(null);

  // Shake animation for decline
  const shakeX = useRef(new Animated.Value(0)).current;
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 10, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeX, { toValue: -10, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeX, { toValue: 8, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeX, { toValue: -8, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: true, easing: Easing.linear }),
    ]).start();
  };

  const reset = () => {
    setCardNumber('');
    setExpiry('');
    setCvc('');
    setStatus('idle');
    setErrorMsg('');
    setProcessing(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isFormValid = () => {
    const d = cardNumber.replace(/\s/g, '');
    const [mm] = expiry.split('/');
    return d.length === 16 && expiry.length === 5 && Number(mm) >= 1 && Number(mm) <= 12 && cvc.length >= 3;
  };

  const handlePay = async () => {
    if (!isFormValid() || processing) return;

    const raw = cardNumber.replace(/\s/g, '');
    setProcessing(true);
    setStatus('idle');
    setErrorMsg('');

    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 1400));

    if (raw === DECLINED_CARD) {
      setProcessing(false);
      setStatus('error');
      setErrorMsg('Your card was declined. Please try a different card.');
      shake();
      return;
    }

    if (raw !== SUCCESS_CARD) {
      setProcessing(false);
      setStatus('error');
      setErrorMsg('Card not recognized. Use 4242 4242 4242 4242 for success.');
      shake();
      return;
    }

    // SUCCESS — call backend to mark premium
    try {
      await paymentsApi.activatePremium();
      invalidateCache.me();
      setStatus('success');
      setProcessing(false);
      // Hold the success screen for 1.8s then close + notify parent
      await new Promise((r) => setTimeout(r, 1800));
      reset();
      onSuccess();
    } catch (e: any) {
      setProcessing(false);
      setStatus('error');
      setErrorMsg(e?.message || 'Something went wrong. Please try again.');
      shake();
    }
  };

  // ─── Success screen ─────────────────────────────────────────────────────────
  const SuccessView = () => (
    <View style={styles.feedbackWrap}>
      <View style={[styles.feedbackIconCircle, { backgroundColor: '#10b98120' }]}>
        <Ionicons name="checkmark-circle" size={56} color="#10b981" />
      </View>
      <Text style={[styles.feedbackTitle, { color: colors.foreground }]}>Payment Successful!</Text>
      <Text style={[styles.feedbackSub, { color: colors.mutedForeground }]}>
        Welcome to Premium. Your badge will appear on your profile.
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, transform: [{ translateX: shakeX }] },
          ]}
        >
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            {status !== 'success' && (
              <TouchableOpacity onPress={handleClose} hitSlop={8} style={styles.closeBtn} disabled={processing}>
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {status === 'success' ? 'Payment Complete' : 'Add Payment Details'}
            </Text>
            <Text style={[styles.headerAmount, { color: colors.primary }]}>{amount}</Text>
            <Text style={[styles.headerDesc, { color: colors.mutedForeground }]}>{description}</Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {status === 'success' ? (
            <SuccessView />
          ) : (
            <>
              {/* Card visual */}
              <View style={[styles.cardVisual, { backgroundColor: colors.foreground }]}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.chip, { backgroundColor: '#f59e0b' }]} />
                  <Ionicons name="wifi-outline" size={18} color="rgba(255,255,255,0.7)" style={{ transform: [{ rotate: '90deg' }] }} />
                </View>
                <Text style={styles.cardMaskedNumber}>{maskCard(cardNumber)}</Text>
                <View style={styles.cardBottomRow}>
                  <Text style={styles.cardLabel}>
                    {expiry || 'MM/YY'}
                  </Text>
                  <Text style={styles.cardLogo}>VISA</Text>
                </View>
              </View>

              {/* Inputs */}
              <View style={styles.inputs}>
                {/* Card number */}
                <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Ionicons name="card-outline" size={18} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="Card number"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    value={cardNumber}
                    onChangeText={(t) => {
                      const formatted = formatCardNumber(t);
                      setCardNumber(formatted);
                      if (formatted.replace(/\s/g, '').length === 16) expiryRef.current?.focus();
                    }}
                    maxLength={19}
                    editable={!processing}
                  />
                </View>

                {/* Expiry + CVC row */}
                <View style={styles.row}>
                  <View style={[styles.inputWrap, styles.halfInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <Ionicons name="calendar-outline" size={18} color={colors.mutedForeground} />
                    <TextInput
                      ref={expiryRef}
                      style={[styles.input, { color: colors.foreground }]}
                      placeholder="MM/YY"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numeric"
                      value={expiry}
                      onChangeText={(t) => {
                        const formatted = formatExpiry(t);
                        setExpiry(formatted);
                        if (formatted.length === 5) cvcRef.current?.focus();
                      }}
                      maxLength={5}
                      editable={!processing}
                    />
                  </View>
                  <View style={[styles.inputWrap, styles.halfInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />
                    <TextInput
                      ref={cvcRef}
                      style={[styles.input, { color: colors.foreground }]}
                      placeholder="CVC"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numeric"
                      secureTextEntry
                      value={cvc}
                      onChangeText={(t) => setCvc(t.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      editable={!processing}
                    />
                  </View>
                </View>

                {/* Error */}
                {status === 'error' && !!errorMsg && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={15} color="#ef4444" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                )}

                {/* Hint */}
                <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                  Test: 4242 4242 4242 4242 — any expiry &amp; CVC
                </Text>
              </View>

              {/* Pay button */}
              <TouchableOpacity
                onPress={handlePay}
                disabled={!isFormValid() || processing}
                style={[
                  styles.payBtn,
                  { backgroundColor: colors.primary },
                  (!isFormValid() || processing) && { opacity: 0.55 },
                ]}
                activeOpacity={0.85}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.payBtnText}>Pay {amount}</Text>
                )}
              </TouchableOpacity>

              {/* Powered by "Stripe" text */}
              <View style={styles.poweredRow}>
                <Ionicons name="lock-closed" size={11} color={colors.mutedForeground} />
                <Text style={[styles.poweredText, { color: colors.mutedForeground }]}>
                  Secured by Stripe (test mode)
                </Text>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: { alignItems: 'center', marginBottom: 16, position: 'relative' },
  closeBtn: { position: 'absolute', right: 0, top: 0 },
  headerTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  headerAmount: { fontSize: 28, fontWeight: '800' },
  headerDesc: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginBottom: 16 },
  // Card visual
  cardVisual: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chip: { width: 34, height: 24, borderRadius: 5 },
  cardMaskedNumber: { color: '#fff', fontSize: 17, fontWeight: '600', letterSpacing: 2, marginBottom: 16 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  cardLogo: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  // Inputs
  inputs: { gap: 10, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 10 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flex: 1,
  },
  halfInput: { flex: 1 },
  input: { flex: 1, fontSize: 15 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { color: '#ef4444', fontSize: 13, flex: 1 },
  hint: { fontSize: 11, textAlign: 'center' },
  // Pay button
  payBtn: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  poweredRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  poweredText: { fontSize: 11 },
  // Feedback
  feedbackWrap: { alignItems: 'center', paddingVertical: 28, gap: 12 },
  feedbackIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTitle: { fontSize: 22, fontWeight: '800' },
  feedbackSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
});
