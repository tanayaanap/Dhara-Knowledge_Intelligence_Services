import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Body, Card, Screen, Title, SectionLabel } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { useAppTheme } from '@/theme/use-app-theme';

const items = [
  ['AI-powered predictions', 'Crop recommendations use your field details and our trained model.', 'hardware-chip'],
  ['Disease guidance', 'A crop health tool is being prepared for a future update.', 'bug'],
  ['Fertilizer guidance', 'Personalized fertilizer recommendations are coming soon.', 'flask'],
  ['Our mission', 'Make agricultural intelligence practical, accessible, and useful for every farmer.', 'earth'],
] as const;

export default function ActivityScreen() {
  const { colors } = useAppTheme();
  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <FlatList
          data={items}
          keyExtractor={(item) => item[0]}
          ListHeaderComponent={<View style={styles.header}><SectionLabel>About Dhara</SectionLabel><Title>Tools that grow with you</Title><Body muted>Everything here is designed to make everyday farm decisions a little clearer.</Body></View>}
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
