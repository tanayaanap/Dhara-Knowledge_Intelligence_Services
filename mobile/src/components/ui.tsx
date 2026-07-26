import { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, PressableProps, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius } from '@/theme/borderRadius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useAppTheme } from '@/theme/use-app-theme';

export function Screen({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  return <View style={[styles.screen, { backgroundColor: colors.background }]}>{children}</View>;
}

export function Card({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>{children}</View>;
}

export function Title({ children, small }: PropsWithChildren<{ small?: boolean }>) {
  const { colors } = useAppTheme();
  return <Text style={[small ? styles.h2 : styles.title, { color: colors.text }]}>{children}</Text>;
}

export function Body({ children, muted }: PropsWithChildren<{ muted?: boolean }>) {
  const { colors } = useAppTheme();
  return <Text style={[styles.body, { color: muted ? colors.muted : colors.text }]}>{children}</Text>;
}

export function Button({ label, icon, onPress, loading, disabled, tone = 'primary', ...props }: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  tone?: 'primary' | 'neutral' | 'danger';
} & PressableProps) {
  const { colors } = useAppTheme();
  const bg = tone === 'danger' ? colors.danger : tone === 'neutral' ? colors.primarySoft : colors.primary;
  const fg = tone === 'neutral' ? colors.primary : '#FFFFFF';
  return (
    <Pressable {...props} accessibilityRole="button" onPress={onPress} disabled={disabled || loading} style={[styles.button, { backgroundColor: bg, opacity: disabled ? 0.55 : 1 }]}>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, { backgroundColor: colors.elevated, borderColor: error ? colors.danger : colors.line, color: colors.text }]}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#0B221D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  title: { fontSize: typography.title, fontWeight: '800', letterSpacing: 0 },
  h2: { fontSize: typography.h2, fontWeight: '750', letterSpacing: 0 },
  body: { fontSize: typography.body, lineHeight: 23 },
  button: { minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  buttonText: { fontSize: 16, fontWeight: '700' },
  fieldWrap: { gap: spacing.xs },
  label: { fontSize: typography.small, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.lg, minHeight: 50, fontSize: 16 },
  error: { fontSize: 12 },
});
