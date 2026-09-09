import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Card, Divider, ListRow, Screen, Title, Body, SectionLabel } from '@/components/ui';
import { useLocale } from '@/i18n';
import { palette } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { useAppTheme } from '@/theme/use-app-theme';

export default function CropHub() {
  const { colors } = useAppTheme();
  const { t } = useLocale();

  const tools = [
    { title: t('cropHub.predictTitle'), subtitle: t('cropHub.predictBody'), href: '/crop/predict' as const, icon: 'leaf-outline' as const, bg: colors.primarySoft, fg: colors.primary },
    { title: t('cropHub.fertilizerTitle'), subtitle: t('cropHub.fertilizerBody'), href: '/crop/fertilizer' as const, icon: 'flask-outline' as const, bg: '#FBF0DF', fg: colors.accent },
    { title: t('cropHub.diseaseTitle'), subtitle: t('cropHub.diseaseBody'), href: '/crop/disease' as const, icon: 'bug-outline' as const, bg: '#FCE8E8', fg: colors.danger },
  ];

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.list}>
          <SectionLabel>{t('cropHub.label')}</SectionLabel>
          <Title>{t('cropHub.title')}</Title>
          <Body muted>{t('cropHub.subtitle')}</Body>

          <Card tight>
            {tools.map((item, i) => (
              <View key={item.title}>
                {i > 0 ? <Divider /> : null}
                <Link href={item.href} asChild>
                  <ListRow icon={item.icon} iconBg={item.bg} iconColor={item.fg} title={item.title} subtitle={item.subtitle} />
                </Link>
              </View>
            ))}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.md },
});