import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Body, Card, Screen, Title } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { useAppTheme } from '@/theme/use-app-theme';

const items = [
  ['AI-Powered Predictions', 'Crop recommendations use the existing trained backend model.', 'hardware-chip'],
  ['Disease Prediction', 'TODO: backend route `/api/predict-disease` is referenced by the web app but not implemented.', 'bug'],
  ['Fertilizer Recommendation', 'TODO: backend route `/api/recommend-fertilizer` is referenced by the web app but not implemented.', 'flask'],
  ['Our Mission', 'Democratize agricultural intelligence for better yield and sustainability.', 'earth'],
] as const;

export default function ActivityScreen() {
  const { colors } = useAppTheme();
  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <FlatList
          data={items}
          keyExtractor={(item) => item[0]}
          ListHeaderComponent={<View style={styles.header}><Title>Activity</Title><Body muted>Feature coverage, backend status, and Dhara product context.</Body></View>}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                <Ionicons name={item[2]} color={colors.primary} size={24} />
                <View style={styles.text}>
                  <Title small>{item[0]}</Title>
                  <Body muted>{item[1]}</Body>
                </View>
              </View>
            </Card>
          )}
          ListFooterComponent={<Text style={[styles.footer, { color: colors.muted }]}>Dhara: Knowledge • Intelligence • Services</Text>}
          contentContainerStyle={styles.list}
        />
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.md },
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  text: { flex: 1, gap: 3 },
  footer: { textAlign: 'center', marginVertical: spacing.lg },
});
