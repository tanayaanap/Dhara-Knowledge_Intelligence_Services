import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Body, Button, Card, Screen, Title, SectionLabel, Badge } from '@/components/ui';
import { predictDisease, getDiseaseInfo } from '@/services/api';
import { useLocale } from '@/i18n';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/borderRadius';
import { Stack } from 'expo-router';


export default function DiseaseScreen() {
    const { t, locale } = useLocale();
    const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const predict = useMutation({ mutationFn: predictDisease });

    // Step 2: Gemini explains the predicted disease in the app's current language.
    // Refetches automatically if the language changes; cached per class + language.
    const rawClass = predict.data?.success ? predict.data.raw_class : undefined;
    const infoQuery = useQuery({
        queryKey: ['disease-info', rawClass, locale],
        queryFn: () => getDiseaseInfo(rawClass as string, locale),
        enabled: !!rawClass,
        staleTime: Infinity,
        retry: false,
    });
    const info = infoQuery.data?.success ? infoQuery.data.info : undefined;

    const pick = async (source: 'library' | 'camera') => {
        const result = source === 'library'
        ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (!result.canceled) {
        setImage(result.assets[0]);
        predict.reset();
        }
    };

    const submit = () => {
        if (!image) return;
        predict.mutate({ uri: image.uri, name: image.fileName || 'leaf.jpg', mimeType: image.mimeType });
    };

    <Stack.Screen options={{ headerShown: true, title: t('crop.title') }} />

    return (
        <Screen>
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.list}>
            <SectionLabel>{t('disease.label')}</SectionLabel>
            <Title>{t('disease.title')}</Title>
            <Body muted>{t('disease.subtitle')}</Body>

            <Card>
                {image ? (
                <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
                ) : null}
                <View style={styles.row}>
                <Button label={t('disease.choosePhoto')} icon="images" tone="outline" onPress={() => pick('library')} fullWidth={false} />
                <Button label={t('disease.takePhoto')} icon="camera" tone="outline" onPress={() => pick('camera')} fullWidth={false} />
                </View>
                <Button label={t('disease.submit')} icon="search" onPress={submit} loading={predict.isPending} disabled={!image} />
                {predict.isError ? <Body muted>{t('disease.error')}</Body> : null}
            </Card>

            {predict.data?.success ? (
                <Card accent={predict.data.disease === 'Healthy' ? '#059669' : '#DC2626'}>
                <SectionLabel>{predict.data.plant}</SectionLabel>
                <Title small>{predict.data.disease === 'Healthy' ? t('disease.healthy') : predict.data.disease}</Title>
                <Badge
                    label={t('disease.confidence', { pct: predict.data.confidence })}
                    tone={predict.data.disease === 'Healthy' ? 'success' : 'danger'}
                />
                </Card>
            ) : null}

            {rawClass ? (
                <Card>
                <SectionLabel>{t('disease.about')}</SectionLabel>
                {infoQuery.isLoading ? <Body muted>{t('disease.loadingInfo')}</Body> : null}
                {!infoQuery.isLoading && !info ? (
                    <>
                    <Body muted>{infoQuery.data?.error || t('disease.error')}</Body>
                    <Button label={t('disease.retry')} tone="outline" onPress={() => infoQuery.refetch()} />
                    </>
                ) : null}
                {info ? (
                    <>
                    {info.disease_name ? <Title small>{info.disease_name}</Title> : null}
                    {info.severity !== 'none' ? (
                        <Badge
                        label={`${t('disease.severity')}: ${info.severity_label || info.severity}`}
                        tone={info.severity === 'high' ? 'danger' : info.severity === 'medium' ? 'accent' : 'success'}
                        />
                    ) : null}
                    <Body>{info.summary}</Body>
                    {([
                        ['disease.symptoms', info.symptoms],
                        ['disease.causes', info.causes],
                        ['disease.treatment', info.treatment],
                        ['disease.prevention', info.prevention],
                    ] as [string, string[]][]).map(([key, items]) =>
                        items.length ? (
                        <View key={key} style={styles.block}>
                            <SectionLabel>{t(key)}</SectionLabel>
                            {items.map((item, i) => <Body key={i}>{'• ' + item}</Body>)}
                        </View>
                        ) : null
                    )}
                    {info.when_to_consult ? (
                        <View style={styles.block}>
                        <SectionLabel>{t('disease.consult')}</SectionLabel>
                        <Body>{info.when_to_consult}</Body>
                        </View>
                    ) : null}
                    <Body muted>{t('disease.aiNote')}</Body>
                    </>
                ) : null}
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
    preview: { width: '100%', height: 200, borderRadius: radius.md, marginBottom: spacing.sm },
    row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    block: { gap: spacing.xs, marginTop: spacing.sm },
});