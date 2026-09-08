import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { Body, Card, Divider, ListRow, Screen, Title, SectionLabel } from '@/components/ui';
import { useLocale } from '@/i18n';
import { palette } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { useAppTheme } from '@/theme/use-app-theme';

export default function ActivityScreen() {
  const { colors } = useAppTheme();
  const { t } = useLocale();

  const items = [
    { title: t('activity.predictionsTitle'), body: t('activity.predictionsBody'), icon: 'hardware-chip-outline' as const, bg: colors.primarySoft, fg: colors.primary },
    { title: t('activity.diseaseTitle'), body: t('activity.diseaseBody'), icon: 'bug-outline' as const, bg: '#FCE8E8', fg: colors.danger },
    { title: t('activity.fertilizerTitle'), body: t('activity.fertilizerBody'), icon: 'flask-outline' as const, bg: '#FBF0DF', fg: colors.accent },
    { title: t('activity.missionTitle'), body: t('activity.missionBody'), icon: 'earth-outline' as const, bg: '#E9EEFD', fg: palette.blue },
  ];

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.list}>
          <SectionLabel>{t('activity.about')}</SectionLabel>
          <Title>{t('activity.title')}</Title>
          <Body muted>{t('activity.subtitle')}</Body>

          <Card tight>
            {items.map((item, i) => (
              <View key={item.title}>
                {i > 0 ? <Divider /> : null}
                <ListRow icon={item.icon} iconBg={item.bg} iconColor={item.fg} title={item.title} subtitle={item.body} showChevron={false} />
              </View>
            ))}
          </Card>

          <Text style={[styles.footer, { color: colors.muted }]}>{t('activity.footer')}</Text>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.md },
  footer: { textAlign: 'center', marginVertical: spacing.lg },
});