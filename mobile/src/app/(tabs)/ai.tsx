import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { Button, Field, Screen, Title, Body, EmptyState } from '@/components/ui';
import { sendChatMessage } from '@/services/api';
import { ChatMessage } from '@/types/api';
import { useLocale } from '@/i18n';
import { spacing } from '@/theme/spacing';
import { useAppTheme } from '@/theme/use-app-theme';

export default function AiScreen() {
  const { colors } = useAppTheme();
  const { t } = useLocale();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chat = useMutation({ mutationFn: sendChatMessage });

  const send = async () => {
    const clean = text.trim();
    if (!clean) return;
    setText('');
    setMessages((prev) => [...prev, { id: `${Date.now()}-u`, role: 'user', text: clean }]);
    try {
      const reply = await chat.mutateAsync(clean);
      setMessages((prev) => [...prev, { id: `${Date.now()}-a`, role: 'assistant', text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: `${Date.now()}-e`, role: 'assistant', text: t('ai.offline') }]);
    }
  };

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {messages.length === 0 ? (
            <View style={styles.header}>
              <Title>{t('ai.title')}</Title>
              <Body muted>{t('ai.subtitle')}</Body>
            </View>
          ) : null}
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<EmptyState icon="chatbubble-ellipses-outline" title={t('ai.emptyTitle')} body={t('ai.emptyBody')} />}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble, { backgroundColor: item.role === 'user' ? colors.primary : colors.surface }]}>
                <Text style={{ color: item.role === 'user' ? '#FFFFFF' : colors.text, lineHeight: 21 }}>{item.text}</Text>
              </View>
            )}
            contentContainerStyle={styles.messages}
          />
          <View style={styles.composer}>
            <View style={styles.input}><Field label={t('ai.title')} value={text} onChangeText={setText} placeholder={t('ai.placeholder')} /></View>
            <Button label={t('ai.ask')} icon="send" onPress={send} loading={chat.isPending} fullWidth={false} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  wrap: { flex: 1, padding: spacing.lg, gap: spacing.md },
  header: { gap: spacing.xs },
  messages: { gap: spacing.sm, paddingVertical: spacing.lg, flexGrow: 1 },
  bubble: { maxWidth: '86%', borderRadius: 18, padding: spacing.md },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  assistantBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 6 },
  composer: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  input: { flex: 1 },
});