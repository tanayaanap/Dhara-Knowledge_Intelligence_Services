import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Card, Screen, Title, Body, SectionLabel, ListRow, Divider } from '@/components/ui';
import { getStats } from '@/services/api';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/i18n';
import { palette } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { useAppTheme } from '@/theme/use-app-theme';

export default function Home() {
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { t } = useLocale();
  const stats = useQuery({ queryKey: ['stats'], queryFn: getStats });

  const statItems = [
    [t('home.stats.users'), stats.data?.total ?? 0],
    [t('home.stats.crops'), stats.data?.crop ?? 0],
    [t('home.stats.disease'), stats.data?.disease ?? 0],
    [t('home.stats.fertilizer'), stats.data?.fertilizer ?? 0],
  ] as const;

  const features = [
    { title: t('home.cropTitle'), subtitle: t('home.cropBody'), href: '/crop' as const, icon: 'leaf-outline' as const, bg: colors.primarySoft, fg: colors.primary },
    { title: t('home.scanTitle'), subtitle: t('home.scanBody'), href: '/crop' as const, icon: 'document-text-outline' as const, bg: '#E9EEFD', fg: palette.blue },
    { title: t('home.aiTitle'), subtitle: t('home.aiBody'), href: '/ai' as const, icon: 'sparkles-outline' as const, bg: '#F1E9FD', fg: palette.violet },
  ];

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.greeting}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              <Ionicons name="leaf" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.brand, { color: colors.primary }]}>Dhara</Text>
          </View>

          <Title>{user ? t('home.greeting', { name: user.name || 'farmer' }) : t('home.title')}</Title>
          <Body muted>{user ? t('home.subtitleUser') : t('home.subtitleGuest')}</Body>

          <Card tight>
            <View style={styles.statStrip}>
              {statItems.map(([label, value], i) => (
                <View
                  key={label}
                  style={[styles.statItem, i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.line }]}
                >
                  <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]} numberOfLines={2}>{label}</Text>
                </View>
              ))}
            </View>
          </Card>

          <SectionLabel>{t('home.tools')}</SectionLabel>
          <Card tight>
            {features.map((item, i) => (
              <View key={item.title}>
                {i > 0 ? <Divider /> : null}
                <Link href={item.href} asChild>
                  <ListRow icon={item.icon} iconBg={item.bg} iconColor={item.fg} title={item.title} subtitle={item.subtitle} />
                </Link>
              </View>
            ))}
          </Card>

          <Body muted>{t('home.comingSoon')}</Body>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.md },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 16, fontWeight: '800' },
  statStrip: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2, textAlign: 'center' },
});