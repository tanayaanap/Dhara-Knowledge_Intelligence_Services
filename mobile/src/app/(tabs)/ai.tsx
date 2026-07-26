import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { Button, Field, Screen, Title, Body } from '@/components/ui';
import { sendChatMessage } from '@/services/api';
import { ChatMessage } from '@/types/api';
import { spacing } from '@/theme/spacing';
import { useAppTheme } from '@/theme/use-app-theme';

export default function AiScreen() {
  const { colors } = useAppTheme();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chat = useMutation({ mutationFn: sendChatMessage });

  const send = async () => {
    const clean = text.trim();
    if (!clean) return;
    setText('');
    const userMessage: ChatMessage = { id: `${Date.now()}-u`, role: 'user', text: clean };
    setMessages((prev) => [...prev, userMessage]);
    try {
      const reply = await chat.mutateAsync(clean);
      setMessages((prev) => [...prev, { id: `${Date.now()}-a`, role: 'assistant', text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: `${Date.now()}-e`, role: 'assistant', text: 'I could not reach Dhara AI. Check the backend connection and try again.' }]);
    }
  };

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <Title>Dhara AI</Title>
            <Body muted>Ask crop, soil, and farming questions.</Body>
          </View>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Body muted>No messages yet. Start with a practical field question.</Body>}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble, { backgroundColor: item.role === 'user' ? colors.primary : colors.surface }]}>
                <Text style={{ color: item.role === 'user' ? '#FFFFFF' : colors.text, lineHeight: 21 }}>{item.text}</Text>
              </View>
            )}
            contentContainerStyle={styles.messages}
          />
          <View style={styles.composer}>
            <View style={styles.input}><Field label="Message" value={text} onChangeText={setText} placeholder="Ask about crops..." /></View>
            <Button label="Send" icon="send" onPress={send} loading={chat.isPending} />
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
  messages: { gap: spacing.sm, paddingVertical: spacing.lg },
  bubble: { maxWidth: '86%', borderRadius: 18, padding: spacing.md },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  assistantBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 6 },
  composer: { gap: spacing.sm },
  input: { flex: 1 },
});
