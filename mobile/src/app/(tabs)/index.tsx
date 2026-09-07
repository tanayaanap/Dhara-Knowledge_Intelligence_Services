import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Card, Screen, Title, Body, SectionLabel } from '@/components/ui';
import { getStats } from '@/services/api';
import { useAuth } from '@/context/auth-context';
import { spacing } from '@/theme/spacing';
import { useAppTheme } from '@/theme/use-app-theme';

const features = [
  { title: 'Crop intelligence', body: 'Predict the best crops from soil and climate readings.', href: '/crop', icon: 'leaf' },
  { title: 'Soil report scan', body: 'Upload a report and auto-fill crop inputs with OCR.', href: '/crop', icon: 'document-text' },
  { title: 'Dhara AI', body: 'Ask practical farming questions through the backend assistant.', href: '/ai', icon: 'sparkles' },
] as const;

export default function Home() {
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const stats = useQuery({ queryKey: ['stats'], queryFn: getStats });

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <FlatList
          data={features}
          keyExtractor={(item) => item.title}
          refreshControl={<RefreshControl refreshing={stats.isFetching} onRefresh={() => stats.refetch()} tintColor={colors.primary} />}
          ListHeaderComponent={(
            <View style={styles.header}>
              <View style={styles.greeting}>
                <View style={[styles.logo, { backgroundColor: colors.primary }]}>
                  <Ionicons name="leaf" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.brand, { color: colors.primary }]}>Dhara</Text>
                  <Text style={[styles.eyebrow, { color: colors.muted }]}>FARM SMARTER</Text>
                </View>
              </View>
              <Title>{user ? `Good morning, ${user.name || 'farmer'}` : 'Better decisions for your farm'}</Title>
              <Body muted>{user ? 'Your farm insights are ready when you are.' : 'Simple agricultural intelligence to help every season grow.'}</Body>
              <View style={[styles.hero, { backgroundColor: colors.primary }]}>
                <Ionicons name="sunny-outline" size={30} color="#DCECCB" />
                <View style={styles.heroText}>
                  <Text style={styles.heroTitle}>Your farm, your advantage</Text>
                  <Text style={styles.heroBody}>Use your soil and climate data to make confident choices.</Text>
                </View>
              </View>
              <SectionLabel>Dhara at a glance</SectionLabel>
              <View style={styles.stats}>
                {[
                  ['Users', stats.data?.total ?? 0],
                  ['Crops', stats.data?.crop ?? 0],
                  ['Disease', stats.data?.disease ?? 0],
                  ['Fertilizer', stats.data?.fertilizer ?? 0],
                ].map(([label, value]) => (
                  <Card key={label}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
                  </Card>
                ))}
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <Link href={item.href} asChild>
              <Pressable>
                <Card>
                  <View style={styles.feature}>
                    <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                      <Ionicons name={item.icon} size={24} color={colors.primary} />
                    </View>
                    <View style={styles.featureText}>
                      <Title small>{item.title}</Title>
                      <Body muted>{item.body}</Body>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                  </View>
                </Card>
              </Pressable>
            </Link>
          )}
          ListFooterComponent={<Body muted>More crop health and fertilizer tools are coming soon.</Body>}
          contentContainerStyle={styles.list}
        />
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.md },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 18, fontWeight: '900' },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 1 },
  hero: { borderRadius: 18, padding: spacing.lg, flexDirection: 'row', gap: spacing.md, alignItems: 'center', marginVertical: spacing.sm },
  heroText: { flex: 1, gap: 4 },
  heroTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  heroBody: { color: '#E7F1E4', lineHeight: 20 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, gap: 3 },
});
