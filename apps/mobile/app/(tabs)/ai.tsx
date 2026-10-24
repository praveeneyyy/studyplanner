import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colorTokens } from '@ai-study/design-tokens';
import { Send, Sparkles } from 'lucide-react-native';
import { mobileApi } from '../../src/lib/api';

const FORMATS = ['EXPLAIN', 'SIMPLE', 'EXAM_2M', 'EXAM_5M', 'EXAM_10M', 'CODE', 'FLASHCARDS'];

export default function MobileAITutor() {
  const [format, setFormat] = useState('EXPLAIN');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'assistant',
      content: 'Hello! I am your AI Study Tutor. Ask any academic question or request university exam answers (2, 5, or 10-mark formats).'
    }
  ]);
  const [streaming, setStreaming] = useState(false);

  const colors = colorTokens.light;

  const handleSend = async () => {
    if (!prompt.trim() || streaming) return;

    const userText = prompt;
    setPrompt('');
    setMessages((prev) => [...prev, { sender: 'user', content: userText }]);
    setStreaming(true);

    const assistantMsg = { sender: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMsg]);

    await mobileApi.streamAI(
      {
        prompt: userText,
        formatType: format as any
      },
      {
        onDelta: (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.sender === 'assistant') {
              last.content += chunk;
            }
            return updated;
          });
        },
        onDone: () => setStreaming(false),
        onError: () => setStreaming(false)
      }
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgApp }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>AI Study Tutor</Text>
        </View>

        {/* Formats Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formatsStrip}>
          {FORMATS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFormat(f)}
              style={[
                styles.formatPill,
                format === f
                  ? { backgroundColor: colors.accentBase }
                  : { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }
              ]}
            >
              <Text
                style={[
                  styles.formatText,
                  { color: format === f ? '#FFFFFF' : colors.textMuted }
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chat Stream */}
        <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
          {messages.map((m, idx) => {
            const isUser = m.sender === 'user';
            return (
              <View
                key={idx}
                style={[
                  styles.messageBubble,
                  isUser
                    ? [styles.userBubble, { backgroundColor: colors.accentBase }]
                    : [styles.assistantBubble, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]
                ]}
              >
                <Text style={[styles.messageText, { color: isUser ? '#FFFFFF' : colors.textPrimary }]}>
                  {m.content}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.bgSurface, borderTopColor: colors.borderSubtle }]}>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder={`Ask a question (${format})...`}
            style={[styles.input, { backgroundColor: colors.bgElevated, borderColor: colors.borderStrong }]}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={streaming || !prompt.trim()}
            style={[styles.sendBtn, { backgroundColor: colors.accentBase }]}
          >
            <Send size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: 'bold' },
  formatsStrip: { maxHeight: 40, paddingHorizontal: 16, marginBottom: 8 },
  formatPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8
  },
  formatText: { fontSize: 10, fontWeight: 'bold' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  messageBubble: { padding: 12, borderRadius: 12, maxWidth: '85%' },
  userBubble: { alignSelf: 'flex-end' },
  assistantBubble: { alignSelf: 'flex-start', borderWidth: 1 },
  messageText: { fontSize: 13, lineHeight: 18 },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 8
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 13
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
