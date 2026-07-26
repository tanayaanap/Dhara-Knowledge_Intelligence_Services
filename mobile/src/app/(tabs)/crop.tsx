import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Body, Button, Card, Field, Screen, Title } from '@/components/ui';
import { predictCrop, scanSoilReport } from '@/services/api';
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
const fields: Array<[keyof FormValues, string]> = [
  ['nitrogen', 'Nitrogen N kg/ha'],
  ['phosphorus', 'Phosphorus P kg/ha'],
  ['potassium', 'Potassium K kg/ha'],
  ['temperature', 'Temperature C'],
  ['humidity', 'Humidity %'],
  ['ph', 'pH level'],
  ['rainfall', 'Rainfall mm'],
];

export default function CropScreen() {
  const { colors } = useAppTheme();
  const [mode, setMode] = useState<'manual' | 'scan'>('manual');
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const predict = useMutation({ mutationFn: predictCrop });
  const scan = useMutation({ mutationFn: scanSoilReport });

  const submit = handleSubmit((values) => predict.mutate({
    N: values.nitrogen,
    P: values.phosphorus,
    K: values.potassium,
    temperature: values.temperature,
    humidity: values.humidity,
    ph: values.ph,
    rainfall: values.rainfall,
  }));

  const pickReport = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'application/pdf'], copyToCacheDirectory: true });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    const result = await scan.mutateAsync({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
    if (result.success && result.extracted) {
      const map = { nitrogen: 'nitrogen', phosphorus: 'phosphorus', potassium: 'potassium', temperature: 'temperature', humidity: 'humidity', ph: 'ph', rainfall: 'rainfall' } as const;
      Object.entries(map).forEach(([formKey, apiKey]) => {
        const value = result.extracted[apiKey];
        if (value !== undefined) setValue(formKey as keyof FormValues, value);
      });
      setMode('manual');
    }
  };

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <FlatList
          data={predict.data?.results ?? []}
          keyExtractor={(item) => item.crop}
          ListHeaderComponent={(
            <View style={styles.stack}>
              <Title>Crop Prediction</Title>
              <Body muted>Enter values manually or scan a soil report to fill the form.</Body>
              <View style={[styles.segment, { backgroundColor: colors.primarySoft }]}>
                {(['manual', 'scan'] as const).map((item) => (
                  <Pressable key={item} onPress={() => setMode(item)} style={[styles.segmentItem, mode === item && { backgroundColor: colors.surface }]}>
                    <Text style={[styles.segmentText, { color: mode === item ? colors.primary : colors.muted }]}>{item === 'manual' ? 'Manual' : 'Scan report'}</Text>
                  </Pressable>
                ))}
              </View>
              {mode === 'scan' ? (
                <Card>
                  <View style={styles.stack}>
                    <Title small>Upload Soil Test Report</Title>
                    <Body muted>Supports JPG, PNG, and PDF. Extracted values are copied into the crop form.</Body>
                    <Button label="Choose report" icon="cloud-upload" onPress={pickReport} loading={scan.isPending} />
                    {scan.data ? <Body muted>{Object.keys(scan.data.extracted || {}).length} fields extracted.</Body> : null}
                  </View>
                </Card>
              ) : null}
              <Card>
                <View style={styles.stack}>
                  {fields.map(([name, label]) => (
                    <Controller
                      key={name}
                      control={control}
                      name={name}
                      render={({ field: { onChange, value } }) => (
                        <Field
                          label={label}
                          value={value === undefined ? '' : String(value)}
                          onChangeText={onChange}
                          keyboardType="decimal-pad"
                          error={errors[name]?.message}
                        />
                      )}
                    />
                  ))}
                  <Button label="Predict best crops" icon="analytics" onPress={submit} loading={predict.isPending} />
                  {predict.isError ? <Body muted>Prediction failed. Check your inputs and backend connection.</Body> : null}
                </View>
              </Card>
            </View>
          )}
          renderItem={({ item, index }) => (
            <Card>
              <View style={styles.result}>
                <Text style={[styles.rank, { color: colors.primary }]}>{index + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Title small>{item.crop}</Title>
                  <Body muted>{item.probability}% confidence</Body>
                </View>
              </View>
            </Card>
          )}
          contentContainerStyle={styles.list}
        />
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
  segmentText: { fontWeight: '800' },
  result: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rank: { fontSize: 28, fontWeight: '900', width: 36 },
});
