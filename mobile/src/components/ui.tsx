import { PropsWithChildren, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius } from '@/theme/borderRadius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useAppTheme } from '@/theme/use-app-theme';

export function Screen({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.screenInner}>{children}</View>
    </View>
  );
}

export function Section({
  label,
  title,
  action,
  children,
}: PropsWithChildren<{ label?: string; title?: string; action?: { label: string; onPress: () => void } }>) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.section}>
      {(label || title || action) && (
        <View style={styles.sectionHead}>
          <View style={{ gap: 2, flex: 1 }}>
            {label ? <SectionLabel>{label}</SectionLabel> : null}
            {title ? <Text style={[styles.h2, { color: colors.text }]}>{title}</Text> : null}
          </View>
          {action ? (
            <Pressable onPress={action.onPress} hitSlop={8}>
              <Text style={[styles.sectionAction, { color: colors.primary }]}>{action.label}</Text>
            </Pressable>
          ) : null}
        </View>
      )}
      {children}
    </View>
  );
}

export function Divider() {
  const { colors } = useAppTheme();
  return <View style={[styles.divider, { backgroundColor: colors.line }]} />;
}

export function Card({ children, tight, accent }: PropsWithChildren<{ tight?: boolean; accent?: string }>) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.line,
          padding: tight ? spacing.md : spacing.lg,
          borderLeftWidth: accent ? 3 : StyleSheet.hairlineWidth,
          borderLeftColor: accent ?? colors.line,
        },
      ]}
    >
      {children}
    </View>
  );
}

export function Title({ children, small }: PropsWithChildren<{ small?: boolean }>) {
  const { colors } = useAppTheme();
  return <Text style={[small ? styles.h2 : styles.title, { color: colors.text }]}>{children}</Text>;
}

export function Body({ children, muted }: PropsWithChildren<{ muted?: boolean }>) {
  const { colors } = useAppTheme();
  return <Text style={[styles.body, { color: muted ? colors.muted : colors.text }]}>{children}</Text>;
}

// No textTransform: uppercase — breaks visually for non-Latin scripts (e.g. Devanagari).
// A colored dot carries the "label" feel instead, and works in any language.
export function SectionLabel({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.eyebrowRow}>
      <View style={[styles.eyebrowDot, { backgroundColor: colors.primary }]} />
      <Text style={[styles.eyebrow, { color: colors.muted }]}>{children}</Text>
    </View>
  );
}

type Tone = 'primary' | 'neutral' | 'outline' | 'ghost' | 'danger';

export function Button({
  label,
  icon,
  iconPosition = 'left',
  onPress,
  loading,
  disabled,
  tone = 'primary',
  fullWidth = true,
  ...props
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  tone?: Tone;
  fullWidth?: boolean;
} & PressableProps) {
  const { colors } = useAppTheme();

  const bg =
    tone === 'danger' ? colors.danger
    : tone === 'primary' ? colors.primary
    : tone === 'neutral' ? colors.primarySoft
    : 'transparent';
  const fg =
    tone === 'primary' || tone === 'danger' ? '#FFFFFF'
    : tone === 'neutral' ? colors.primary
    : tone === 'outline' ? colors.text
    : colors.primary;
  const border = tone === 'outline' ? colors.line : 'transparent';

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: tone === 'outline' ? StyleSheet.hairlineWidth * 2 : 0,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: fullWidth ? spacing.lg : spacing.xl,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && iconPosition === 'left' ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text style={[styles.buttonText, { color: fg }]} numberOfLines={1}>{label}</Text>
          {icon && iconPosition === 'right' ? <Ionicons name={icon} size={18} color={fg} /> : null}
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  tone = 'neutral',
  size = 40,
  ...props
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  tone?: 'neutral' | 'primary' | 'danger';
  size?: number;
} & PressableProps) {
  const { colors } = useAppTheme();
  const bg = tone === 'primary' ? colors.primarySoft : tone === 'danger' ? '#FCE8E8' : colors.elevated;
  const fg = tone === 'primary' ? colors.primary : tone === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable
      {...props}
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Ionicons name={icon} size={size * 0.45} color={fg} />
    </Pressable>
  );
}

// `iconBg`/`iconColor` let each row get a distinct accent (see feature list) —
// small but kills the "everything identical" feel without adding new colors.
export function ListRow({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  value,
  onPress,
  showChevron = true,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
}) {
  const { colors } = useAppTheme();
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: any) => [styles.listRow, { opacity: pressed ? 0.6 : 1 }]}
    >
      {icon ? (
        <View style={[styles.listRowIcon, { backgroundColor: iconBg ?? colors.primarySoft }]}>
          <Ionicons name={icon} size={18} color={iconColor ?? colors.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={[styles.listRowTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.listRowSubtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
      </View>
      {typeof value === 'string' ? <Text style={[styles.listRowValue, { color: colors.muted }]}>{value}</Text> : value}
      {onPress && showChevron ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </Wrapper>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'danger' | 'accent' }) {
  const { colors } = useAppTheme();
  const bg =
    tone === 'success' ? '#E4F6EE' : tone === 'danger' ? '#FCE8E8' : tone === 'accent' ? '#FBF0DF' : colors.primarySoft;
  const fg = tone === 'success' ? colors.success : tone === 'danger' ? colors.danger : tone === 'accent' ? colors.accent : colors.primary;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const { colors } = useAppTheme();
  const initials = name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft }]}>
      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void };
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={[styles.h2, { color: colors.text, textAlign: 'center' }]}>{title}</Text>
      {body ? <Text style={[styles.body, { color: colors.muted, textAlign: 'center' }]}>{body}</Text> : null}
      {action ? <Button label={action.label} onPress={action.onPress} fullWidth={false} tone="neutral" /> : null}
    </View>
  );
}

export function ChipGroup({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.chipWrap}>
        {options.map((opt) => {
          const active = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.elevated,
                  borderColor: active ? colors.primary : colors.line,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: active ? '#FFFFFF' : colors.text }]}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={[styles.helperText, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

export function Field({
  label,
  error,
  helper,
  icon,
  ...props
}: TextInputProps & { label: string; error?: string; helper?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.line;

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: colors.elevated, borderColor, borderWidth: focused || error ? 1.5 : 1 }]}>
        {icon ? <Ionicons name={icon} size={18} color={colors.muted} style={{ marginRight: spacing.sm }} /> : null}
        <TextInput
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text }]}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          {...props}
        />
      </View>
      {error ? (
        <Text style={[styles.helperText, { color: colors.danger }]}>{error}</Text>
      ) : helper ? (
        <Text style={[styles.helperText, { color: colors.muted }]}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  screenInner: { flex: 1, width: '100%', maxWidth: 560 },

  section: { gap: spacing.md, marginBottom: spacing.xl },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.sm },
  sectionAction: { fontSize: typography.small, fontWeight: '700' },

  divider: { height: StyleSheet.hairlineWidth, width: '100%' },

  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    shadowColor: '#0B221D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },

  title: { fontSize: typography.title, fontWeight: '800', letterSpacing: -0.4 },
  h2: { fontSize: typography.h2, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: typography.body, lineHeight: 22 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3 },
  eyebrow: { fontSize: typography.small, fontWeight: '700' },

  button: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  buttonText: { fontSize: 16, fontWeight: '700' },

  iconButton: { alignItems: 'center', justifyContent: 'center' },

  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  listRowIcon: { width: 36, height: 36, borderRadius: radius.sm ?? 8, alignItems: 'center', justifyContent: 'center' },
  listRowTitle: { fontSize: 15, fontWeight: '600' },
  listRowSubtitle: { fontSize: 13 },
  listRowValue: { fontSize: 14, fontWeight: '500' },

  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full ?? 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  avatar: { alignItems: 'center', justifyContent: 'center' },

  emptyState: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl ?? 32, paddingHorizontal: spacing.lg },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },

  fieldWrap: { gap: spacing.xs },
  label: { fontSize: typography.small, fontWeight: '700' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 50 },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
  helperText: { fontSize: 12 },
    // add to styles:
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full ?? 999, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
});