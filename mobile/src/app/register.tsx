import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Body, Button, Card, Field, Screen, Title } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { spacing } from '@/theme/spacing';

const schema = z.object({ name: z.string().min(2), email: z.email(), password: z.string().min(6), location: z.string().optional(), land_size: z.string().optional() });
type Form = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', password: '', location: '', land_size: '' } });
  const submit = handleSubmit(async (values) => {
    try { await signUp(values); } catch (e) { setError('root', { message: e instanceof Error ? e.message : 'Registration failed' }); }
  });
  return (
    <Screen><SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.stack}>
      <View style={styles.brand}><View style={styles.logo}><Text style={styles.logoText}>D</Text></View><Text style={styles.brandText}>Dhara</Text></View>
      <Title>Create your farm profile</Title><Body muted>Join a calmer, smarter way to plan your season.</Body>
      <Card>{(['name', 'email', 'password', 'location', 'land_size'] as const).map((name) => (
        <Controller key={name} control={control} name={name} render={({ field }) => <Field label={name === 'land_size' ? 'Land size' : name[0].toUpperCase() + name.slice(1)} secureTextEntry={name === 'password'} autoCapitalize={name === 'email' ? 'none' : 'sentences'} value={field.value} onChangeText={field.onChange} error={errors[name]?.message} />} />
      ))}
      <Button label="Create account" icon="person-add" loading={isSubmitting} onPress={submit} />{errors.root ? <Body muted>{errors.root.message}</Body> : null}</Card>
      <Link href="/login" asChild><Button label="I already have an account" tone="neutral" /></Link>
    </ScrollView></SafeAreaView></Screen>
  );
}
const styles = StyleSheet.create({ safe: { flex: 1, padding: spacing.lg }, stack: { gap: spacing.md }, brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }, logo: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#2F6B45', alignItems: 'center', justifyContent: 'center' }, logoText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' }, brandText: { color: '#2F6B45', fontSize: 22, fontWeight: '900' } });
