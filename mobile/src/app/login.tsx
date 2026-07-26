import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Body, Button, Card, Field, Screen, Title } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { spacing } from '@/theme/spacing';

const schema = z.object({ email: z.email(), password: z.string().min(1) });
type Form = z.infer<typeof schema>;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
  const submit = handleSubmit(async (values) => {
    try { await signIn(values); } catch (e) { setError('root', { message: e instanceof Error ? e.message : 'Login failed' }); }
  });
  return (
    <Screen><SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.stack}>
      <Title>Welcome back</Title><Body muted>Sign in to Dhara.</Body>
      <Card><Controller control={control} name="email" render={({ field }) => <Field label="Email" autoCapitalize="none" keyboardType="email-address" value={field.value} onChangeText={field.onChange} error={errors.email?.message} />} />
      <Controller control={control} name="password" render={({ field }) => <Field label="Password" secureTextEntry value={field.value} onChangeText={field.onChange} error={errors.password?.message} />} />
      <Button label="Sign in" icon="log-in" loading={isSubmitting} onPress={submit} />{errors.root ? <Body muted>{errors.root.message}</Body> : null}</Card>
      <Link href="/register" asChild><Button label="Create account" tone="neutral" /></Link>
    </ScrollView></SafeAreaView></Screen>
  );
}
const styles = StyleSheet.create({ safe: { flex: 1, padding: spacing.lg }, stack: { gap: spacing.md } });
