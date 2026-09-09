import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Body, Button, Card, ChipGroup, Field, Screen, Title, SectionLabel, Badge } from '@/components/ui';
import { getMlOptions, recommendFertilizer } from '@/services/api';
import { useLocale } from '@/i18n';
import { spacing } from '@/theme/spacing';
import { Stack } from 'expo-router';

type FormValues = {
  soil_type: string; crop_type: string;
  nitrogen: string; phosphorous: string; potassium: string;
  temperature: string; moisture: string; rainfall: string; ph: string; carbon: string;
};

export default function FertilizerScreen() {
  const { t } = useLocale();
  const options = useQuery({ queryKey: ['ml-options'], queryFn: getMlOptions });
  const recommend = useMutation({ mutationFn: recommendFertilizer });
  const { control, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      soil_type: '', crop_type: '',
      nitrogen: '', phosphorous: '', potassium: '',
      temperature: '25', moisture: '40', rainfall: '100', ph: '6.5', carbon: '0.5',
    },
  });

  const numericFields: Array<[keyof FormValues, string]> = [
    ['nitrogen', t('fertilizer.nitrogen')],
    ['phosphorous', t('fertilizer.phosphorous')],
    ['potassium', t('fertilizer.potassium')],
    ['temperature', t('fertilizer.temperature')],
    ['moisture', t('fertilizer.moisture')],
    ['rainfall', t('fertilizer.rainfall')],
    ['ph', t('fertilizer.ph')],
    ['carbon', t('fertilizer.carbon')],
  ];

  const submit = handleSubmit((values) => recommend.mutate({
    soil_type: values.soil_type,
    crop_type: values.crop_type,
    nitrogen: Number(values.nitrogen) || 0,
    phosphorous: Number(values.phosphorous) || 0,
    potassium: Number(values.potassium) || 0,
    temperature: Number(values.temperature) || 25,
    moisture: Number(values.moisture) || 40,
    rainfall: Number(values.rainfall) || 100,
    ph: Number(values.ph) || 6.5,
    carbon: Number(values.carbon) || 0.5,
  }));

  <Stack.Screen options={{ headerShown: true, title: t('crop.title') }} />

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.list}>
          <SectionLabel>{t('fertilizer.label')}</SectionLabel>
          <Title>{t('fertilizer.title')}</Title>
          <Body muted>{t('fertilizer.subtitle')}</Body>

          <Card>
            <Controller
              control={control}
              name="soil_type"
              render={({ field }) => (
                <ChipGroup label={t('fertilizer.soilType')} options={options.data?.soil_types ?? []} value={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              control={control}
              name="crop_type"
              render={({ field }) => (
                <ChipGroup label={t('fertilizer.cropType')} options={options.data?.crop_types ?? []} value={field.value} onChange={field.onChange} />
              )}
            />
          </Card>

          <Card>
            <SectionLabel>{t('fertilizer.title')}</SectionLabel>
            {numericFields.map(([name, label]) => (
              <Controller
                key={name}
                control={control}
                name={name}
                render={({ field }) => (
                  <Field label={label} value={field.value} onChangeText={field.onChange} keyboardType="decimal-pad" />
                )}
              />
            ))}
            <Button label={t('fertilizer.submit')} icon="flask" onPress={submit} loading={recommend.isPending} />
            {recommend.isError ? <Body muted>{t('fertilizer.error')}</Body> : null}
          </Card>

          {recommend.data?.success ? (
            <Card accent="#059669">
              <SectionLabel>{t('fertilizer.resultTitle')}</SectionLabel>
              <Title small>{recommend.data.recommended_fertilizer}</Title>
              <Body muted>{t('fertilizer.quantity')}: {recommend.data.quantity}</Body>
              <Badge label={t('fertilizer.confidence', { pct: recommend.data.confidence })} tone="success" />
            </Card>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.md },
});