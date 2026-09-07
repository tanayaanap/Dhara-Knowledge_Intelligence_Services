import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/theme/use-app-theme';

export default function TabsLayout() {
  const { colors } = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, height: 70, paddingTop: 8, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" color={color} size={22} /> }} />
      <Tabs.Screen name="crop" options={{ title: 'Crop', tabBarIcon: ({ color }) => <Ionicons name="leaf" color={color} size={22} /> }} />
      <Tabs.Screen name="ai" options={{ title: 'AI', tabBarIcon: ({ color }) => <Ionicons name="sparkles" color={color} size={22} /> }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity', tabBarIcon: ({ color }) => <Ionicons name="pulse" color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person-circle" color={color} size={22} /> }} />
    </Tabs>
  );
}
