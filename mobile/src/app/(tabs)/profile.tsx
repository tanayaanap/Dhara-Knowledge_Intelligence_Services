import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Body, Button, Card, Field, Screen, Title } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { getProfile, updateProfile } from '@/services/api';
import { spacing } from '@/theme/spacing';

type ProfileForm = { name: string; location: string; land_size: string };

export default function ProfileScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const profile = useQuery({ queryKey: ['profile'], queryFn: getProfile, enabled: !!user });
  const { control, reset, handleSubmit } = useForm<ProfileForm>({ defaultValues: { name: '', location: '', land_size: '' } });
  const save = useMutation({ mutationFn: updateProfile, onSuccess: async () => { await refreshUser(); await profile.refetch(); } });

  useEffect(() => {
    if (profile.data) reset({ name: profile.data.name || '', location: profile.data.location || '', land_size: profile.data.land_size || '' });
  }, [profile.data, reset]);

  if (!user) {
    return (
      <Screen>
        <SafeAreaView style={styles.safe}>
          <View style={styles.stack}>
            <Title>Profile</Title>
            <Body muted>Sign in to manage your Dhara account and saved farm details.</Body>
            <Link href="/login" asChild><Button label="Sign in" icon="log-in" /></Link>
            <Link href="/register" asChild><Button label="Create account" icon="person-add" tone="neutral" /></Link>
          </View>
        </SafeAreaView>
      </Screen>
    );
  }

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.stack}>
          <Title>Profile</Title>
          <Card>
            <View style={styles.stack}>
              <Title small>{profile.data?.name || user.name || 'Farmer'}</Title>
              <Body muted>{profile.data?.email || user.email}</Body>
            </View>
          </Card>
          <Card>
            <View style={styles.stack}>
              {(['name', 'location', 'land_size'] as const).map((name) => (
                <Controller key={name} control={control} name={name} render={({ field }) => (
                  <Field label={name === 'land_size' ? 'Land size' : name[0].toUpperCase() + name.slice(1)} value={field.value} onChangeText={field.onChange} />
                )} />
              ))}
              <Button label="Save profile" icon="save" loading={save.isPending} onPress={handleSubmit((values) => save.mutate(values))} />
              {save.isSuccess ? <Body muted>Profile updated.</Body> : null}
              {save.isError ? <Body muted>Could not save profile.</Body> : null}
            </View>
          </Card>
          <Button label="Logout" icon="log-out" tone="danger" onPress={signOut} />
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: spacing.lg },
  stack: { gap: spacing.md },
});
