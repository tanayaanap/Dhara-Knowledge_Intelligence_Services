import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Body, Button, Card, Divider, Field, Screen, Title, SectionLabel, Badge } from '@/components/ui';
import { predictCrop, scanSoilReport } from '@/services/api';
import { useLocale } from '@/i18n';
import { spacing } from '@/theme/spacing';
import { useAppTheme } from '@/theme/use-app-theme';

const schema = z.object({
  nitrogen: z.coerce.number().min(0),
  phosphorus: z.coerce.number().min(0),
  potassium: z.coerce.number().min(0),
  temperature: z.coerce.number(),
  humidity: z.coerce.number().min(0).max(100),
  ph: z.coerce.number().min(0).max(14),
  rainfall: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof schema>;

export default function CropScreen() {
  const { colors } = useAppTheme();
  const { t } = useLocale();
  const [mode, setMode] = useState<'manual' | 'scan'>('manual');
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<z.input<typeof schema>, unknown, FormValues>({ resolver: zodResolver(schema) });
  const predict = useMutation({ mutationFn: predictCrop });
  const scan = useMutation({ mutationFn: scanSoilReport });

  const fields: Array<[keyof FormValues, string]> = [
    ['nitrogen', t('crop.fields.nitrogen')],
    ['phosphorus', t('crop.fields.phosphorus')],
    ['potassium', t('crop.fields.potassium')],
    ['temperature', t('crop.fields.temperature')],
    ['humidity', t('crop.fields.humidity')],
    ['ph', t('crop.fields.ph')],
    ['rainfall', t('crop.fields.rainfall')],
  ];

  const submit = handleSubmit((values) => predict.mutate({
    N: values.nitrogen, P: values.phosphorus, K: values.potassium,
    temperature: values.temperature, humidity: values.humidity, ph: values.ph, rainfall: values.rainfall,
  }));

  const pickReport = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'application/pdf'], copyToCacheDirectory: true });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    const result = await scan.mutateAsync({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
    if (result.success && result.extracted) {
      Object.entries(result.extracted).forEach(([apiKey, value]) => {
        if (value !== undefined) setValue(apiKey as keyof FormValues, value as number);
      });
      setMode('manual');
    }
  };

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.list}>
          <SectionLabel>{t('crop.label')}</SectionLabel>
          <Title>{t('crop.title')}</Title>
          <Body muted>{t('crop.subtitle')}</Body>

          <View style={[styles.segment, { backgroundColor: colors.primarySoft }]}>
            {(['manual', 'scan'] as const).map((item) => (
              <Pressable key={item} onPress={() => setMode(item)} style={[styles.segmentItem, mode === item && { backgroundColor: colors.surface }]}>
                <Text style={[styles.segmentText, { color: mode === item ? colors.primary : colors.muted }]}>
                  {item === 'manual' ? t('crop.manual') : t('crop.scan')}
                </Text>
              </Pressable>
            ))}
          </View>

          {mode === 'scan' ? (
            <Card accent={colors.accent}>
              <View style={styles.stack}>
                <Title small>{t('crop.scanTitle')}</Title>
                <Body muted>{t('crop.scanBody')}</Body>
                <Button label={t('crop.choose')} icon="cloud-upload" onPress={pickReport} loading={scan.isPending} />
                {scan.data ? <Badge label={t('crop.extracted', { count: Object.keys(scan.data.extracted || {}).length })} tone="success" /> : null}
              </View>
            </Card>
          ) : (
            <Card>
              <View style={styles.stack}>
                <SectionLabel>{t('crop.readings')}</SectionLabel>
                {fields.map(([name, label]) => (
                  <Controller
                    key={name}
                    control={control}
                    name={name}
                    render={({ field: { onChange, value } }) => (
                      <Field label={label} value={value === undefined ? '' : String(value)} onChangeText={onChange} keyboardType="decimal-pad" error={errors[name]?.message} />
                    )}
                  />
                ))}
                <Button label={t('crop.submit')} icon="analytics" onPress={submit} loading={predict.isPending} />
                {predict.isError ? <Body muted>{t('crop.error')}</Body> : null}
              </View>
            </Card>
          )}

          {predict.data?.results?.length ? (
            <>
              <SectionLabel>{t('crop.matches')}</SectionLabel>
              <Card tight>
                {predict.data.results.map((item, index) => (
                  <View key={item.crop}>
                    {index > 0 ? <Divider /> : null}
                    <View style={styles.result}>
                      <View style={[styles.rank, { backgroundColor: colors.primarySoft }]}>
                        <Text style={{ color: colors.primary, fontWeight: '800' }}>{index + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Title small>{item.crop}</Title>
                        <Body muted>{t('crop.matchPct', { pct: item.probability })}</Body>
                      </View>
                    </View>
                  </View>
                ))}
              </Card>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.md },
  stack: { gap: spacing.md },
  segment: { borderRadius: 14, padding: 4, flexDirection: 'row' },
  segmentItem: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  segmentText: { fontWeight: '700' },
  result: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  rank: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});