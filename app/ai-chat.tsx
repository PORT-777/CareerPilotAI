// Powered by OnSpace.AI — Real AI Chat with streaming
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '@/constants/theme';
import { aiService, AIMessage } from '@/services/aiService';

const AGENT_SHORTCUTS = [
  { label: 'بحث وظائف', icon: 'search', message: 'ابحث عن أفضل الوظائف المناسبة لي في مجال تطوير البرمجيات' },
  { label: 'تحسين CV', icon: 'description', message: 'كيف أحسن سيرتي الذاتية للحصول على نقاط ATS أعلى؟' },
  { label: 'تدريب مقابلة', icon: 'mic', message: 'ابدأ معي تدريب مقابلة وظيفية باسئلة شائعة' },
  { label: 'تفاوض راتب', icon: 'payments', message: 'ساعدني في استراتيجية التفاوض على الراتب' },
];

const INITIAL_MESSAGE: AIMessage = {
  id: '0',
  role: 'agent',
  content: 'مرحباً! أنا وكيلك الوظيفي الذكي المدعوم بـ Gemini. يمكنني مساعدتك في البحث عن الوظائف، تحسين سيرتك الذاتية، التحضير للمقابلات، والتفاوض على الراتب. كيف يمكنني مساعدتك اليوم؟',
  timestamp: new Date(),
  agentType: 'main',
};

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<AIMessage[]>([INITIAL_MESSAGE]);
  const [streamingMsg, setStreamingMsg] = useState<string>('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList<AIMessage>>(null);

  // Build history for context (last 10 messages max)
  const buildHistory = useCallback((msgs: AIMessage[]) => {
    return msgs.slice(-10).map(m => ({
      role: m.role === 'agent' ? 'assistant' : 'user',
      content: m.content,
    }));
  }, []);

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || loading) return;

    setInput('');
    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msgText,
      timestamp: new Date(),
    };

    setMessages(prev => {
      const updated = [...prev, userMsg];
      return updated;
    });

    setLoading(true);
    setStreamingMsg('');

    try {
      const currentMessages = [...messages, userMsg];
      const history = buildHistory(currentMessages.slice(0, -1));

      let accumulated = '';
      await aiService.chat(msgText, history, (chunk) => {
        accumulated += chunk;
        setStreamingMsg(accumulated);
      });

      const agentMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: accumulated || 'عذراً، لم أتمكن من الاستجابة. حاول مرة أخرى.',
        timestamp: new Date(),
        agentType: 'main',
      };
      setMessages(prev => [...prev, agentMsg]);
      setStreamingMsg('');
    } catch (err: any) {
      const errMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `عذراً، حدث خطأ: ${err.message}. يرجى المحاولة مرة أخرى.`,
        timestamp: new Date(),
        agentType: 'main',
      };
      setMessages(prev => [...prev, errMsg]);
      setStreamingMsg('');
    } finally {
      setLoading(false);
    }
  };

  const renderMessage: ListRenderItem<AIMessage> = ({ item }) => {
    const isAgent = item.role === 'agent';
    return (
      <View style={[styles.messageRow, isAgent ? styles.agentRow : styles.userRow]}>
        {isAgent && (
          <View style={styles.agentAvatar}>
            <MaterialIcons name="smart-toy" size={16} color={Colors.primary} />
          </View>
        )}
        <View style={[styles.bubble, isAgent ? styles.agentBubble : styles.userBubble]}>
          <Text style={[styles.bubbleText, isAgent ? styles.agentText : styles.userText]}>
            {item.content}
          </Text>
          <Text style={styles.timestamp}>
            {item.timestamp.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, streamingMsg]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Agent Status */}
      <View style={styles.agentStatus}>
        <View style={[styles.agentStatusDot, loading && styles.agentStatusDotPulsing]} />
        <Text style={styles.agentStatusText}>
          {loading ? 'وكيل AI يفكر...' : 'وكيل AI نشط · Gemini 3 Flash'}
        </Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          loading ? (
            <View style={[styles.messageRow, styles.agentRow]}>
              <View style={styles.agentAvatar}>
                <MaterialIcons name="smart-toy" size={16} color={Colors.primary} />
              </View>
              <View style={[styles.bubble, styles.agentBubble]}>
                {streamingMsg ? (
                  <>
                    <Text style={[styles.bubbleText, styles.agentText]}>{streamingMsg}</Text>
                    <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 6 }} />
                  </>
                ) : (
                  <View style={styles.typingDots}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.typingText}>يكتب...</Text>
                  </View>
                )}
              </View>
            </View>
          ) : null
        }
      />

      {/* Shortcuts */}
      <View style={styles.shortcuts}>
        <FlatList
          data={AGENT_SHORTCUTS}
          keyExtractor={item => item.label}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shortcutsList}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => sendMessage(item.message)}
              disabled={loading}
              style={({ pressed }) => [styles.shortcutBtn, pressed && { opacity: 0.7 }, loading && { opacity: 0.5 }]}
            >
              <MaterialIcons name={item.icon as any} size={14} color={Colors.primary} />
              <Text style={styles.shortcutText}>{item.label}</Text>
            </Pressable>
          )}
        />
      </View>

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="اكتب رسالتك..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
          textAlign="right"
          editable={!loading}
        />
        <Pressable
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={({ pressed }) => [
            styles.sendBtn,
            pressed && { opacity: 0.8 },
            (!input.trim() || loading) && styles.sendBtnDisabled,
          ]}
        >
          {loading
            ? <ActivityIndicator size="small" color={Colors.textPrimary} />
            : <MaterialIcons name="send" size={20} color={Colors.textPrimary} />
          }
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  agentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  agentStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.emerald },
  agentStatusDotPulsing: { backgroundColor: Colors.gold },
  agentStatusText: { color: Colors.textSecondary, fontSize: FontSizes.xs },
  messageList: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  messageRow: { flexDirection: 'row', marginBottom: Spacing.md, alignItems: 'flex-end' },
  agentRow: { justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },
  agentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  agentBubble: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  typingDots: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  typingText: { color: Colors.textMuted, fontSize: FontSizes.sm },
  bubbleText: { fontSize: FontSizes.md, lineHeight: 24 },
  agentText: { color: Colors.textPrimary, textAlign: 'right' },
  userText: { color: Colors.textPrimary, textAlign: 'right' },
  timestamp: { color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 4, textAlign: 'right' },
  shortcuts: { borderTopWidth: 1, borderTopColor: Colors.border },
  shortcutsList: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  shortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
  },
  shortcutText: { color: Colors.primary, fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
    includeFontPadding: false,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
});
