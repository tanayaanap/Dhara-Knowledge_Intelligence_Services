import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Card, Screen, Title, Body } from '@/components/ui';
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
              <Text style={[styles.brand, { color: colors.primary }]}>Dhara</Text>
              <Title>Knowledge. Intelligence. Services.</Title>
              <Body muted>{user ? `Welcome back, ${user.name || user.email}.` : 'Mobile-first agricultural intelligence for faster field decisions.'}</Body>
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
          ListFooterComponent={<Body muted>TODO: disease and fertilizer prediction screens are included as unavailable activities because `/api/predict-disease` and `/api/recommend-fertilizer` are not implemented in the backend.</Body>}
          contentContainerStyle={styles.list}
        />
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.md },
  header: { gap: spacing.lg, marginBottom: spacing.sm },
  brand: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, gap: 3 },
});
