import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Send, Sparkles, AlertTriangle, Check, X, Bot, User } from 'lucide-react-native';
import { api } from '../services/api';

interface Message {
  id?: string;
  isUser: boolean;
  text: string;
}

export default function ChatScreen() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  const suggestions = [
    'How much can I spend today?',
    'What is my spending personality?',
    'Can I afford a 1500 PKR course?',
    'Add expense 500 food',
    'Show budget summary',
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const history = await api.get('/chat/history');
      const formatted: Message[] = [];
      history.forEach((h: any) => {
        formatted.push({ id: `q-${h.id}`, isUser: true, text: h.message });
        formatted.push({ id: `a-${h.id}`, isUser: false, text: h.response });
      });
      setMessages(formatted);
      scrollToBottom();
    } catch (err: any) {
      console.error('Fetch chat history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    setInputVal('');
    setSendLoading(true);
    setPendingAction(null);

    // Append user message
    const userMsg: Message = { isUser: true, text };
    setMessages((prev) => [...prev, userMsg]);
    scrollToBottom();

    try {
      const res = await api.post('/chat/message', { message: text });
      
      // Append AI response
      const aiMsg: Message = { isUser: false, text: res.response };
      setMessages((prev) => [...prev, aiMsg]);
      
      if (res.pendingAction) {
        setPendingAction(res.pendingAction);
      }
      scrollToBottom();
    } catch (err: any) {
      const errorMsg: Message = { isUser: false, text: `⚠️ Error: ${err.message || 'Failed to send message.'}` };
      setMessages((prev) => [...prev, errorMsg]);
      scrollToBottom();
    } finally {
      setSendLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setSendLoading(true);
    const action = pendingAction;
    setPendingAction(null);

    try {
      const res = await api.post('/chat/confirm', {
        type: action.type,
        params: action.params,
      });

      // Append confirmation text
      const confirmMsg: Message = { isUser: false, text: res.response };
      setMessages((prev) => [...prev, confirmMsg]);
      scrollToBottom();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to confirm transaction.');
      setPendingAction(action); // restore
    } finally {
      setSendLoading(false);
    }
  };

  const formatMessageText = (text: string) => {
    // Simple parser for markdown: bold text (**text**) and bullet lines (* line)
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let isBullet = false;
      let cleanLine = line.trim();
      if (cleanLine.startsWith('*')) {
        isBullet = true;
        cleanLine = cleanLine.substring(1).trim();
      } else if (cleanLine.startsWith('-')) {
        isBullet = true;
        cleanLine = cleanLine.substring(1).trim();
      }

      // Parse bold tags
      const parts = cleanLine.split('**');
      const textElements = parts.map((part, pIdx) => {
        const isBold = pIdx % 2 === 1;
        return (
          <Text key={pIdx} style={isBold ? styles.boldText : null}>
            {part}
          </Text>
        );
      });

      return (
        <View key={idx} style={[styles.lineWrapper, isBullet && styles.bulletLine]}>
          {isBullet && <Text style={styles.bulletDot}>•</Text>}
          <Text style={styles.lineText}>{textElements}</Text>
        </View>
      );
    });
  };

  if (loading && messages.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.botIconContainer}>
          <Bot size={20} color="#3b82f6" />
        </View>
        <View>
          <Text style={styles.title}>FinPilot Chatbot</Text>
          <Text style={styles.subtitle}>AI financial assistant</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContent}
        onContentSizeChange={scrollToBottom}
      >
        {messages.length === 0 && (
          <View style={styles.welcomeContainer}>
            <Bot size={48} color="#3b82f6" style={styles.welcomeBot} />
            <Text style={styles.welcomeTitle}>Say Hello to FinPilot!</Text>
            <Text style={styles.welcomeText}>
              I'm your AI digital twin assistant. Ask me questions about your budget, log transactions using text, or check your daily allowance.
            </Text>
          </View>
        )}

        {messages.map((msg, index) => (
          <View
            key={msg.id || index}
            style={[
              styles.msgRow,
              msg.isUser ? styles.msgRowUser : styles.msgRowAssistant,
            ]}
          >
            {!msg.isUser && (
              <View style={[styles.avatarBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Bot size={14} color="#3b82f6" />
              </View>
            )}
            <View
              style={[
                styles.msgBubble,
                msg.isUser ? styles.msgBubbleUser : styles.msgBubbleAssistant,
              ]}
            >
              {msg.isUser ? (
                <Text style={styles.msgTextUser}>{msg.text}</Text>
              ) : (
                <View>{formatMessageText(msg.text)}</View>
              )}
            </View>
            {msg.isUser && (
              <View style={[styles.avatarBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <User size={14} color="#8b5cf6" />
              </View>
            )}
          </View>
        ))}

        {/* Pending Action Approval Card */}
        {pendingAction && (
          <View style={styles.actionCard}>
            <View style={styles.actionHeader}>
              <Sparkles size={16} color="#3b82f6" style={{ marginRight: 6 }} />
              <Text style={styles.actionTitle}>PROPOSED TRANSACTION DETECTED</Text>
            </View>
            <Text style={styles.actionPrompt}>
              Confirm logging {pendingAction.type === 'ADD_INCOME' ? 'Income' : 'Expense'} of Rs. {pendingAction.params.amount} under {pendingAction.params.source || pendingAction.params.category}?
            </Text>
            <View style={styles.actionBtnRow}>
              <TouchableOpacity onPress={handleConfirmAction} style={styles.confirmBtn}>
                <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPendingAction(null)} style={styles.cancelBtn}>
                <X size={16} color="rgba(255,255,255,0.6)" style={{ marginRight: 6 }} />
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Suggestion Chips */}
      <View style={styles.suggestionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
          {suggestions.map((s, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleSendMessage(s)}
              style={styles.suggestionChip}
            >
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Ask FinPilot or log a command..."
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          value={inputVal}
          onChangeText={setInputVal}
          onSubmitEditing={() => handleSendMessage(inputVal)}
          style={styles.input}
        />
        <TouchableOpacity
          onPress={() => handleSendMessage(inputVal)}
          disabled={sendLoading}
          style={styles.sendBtn}
        >
          {sendLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Send size={18} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#0b0f19',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0b0f19',
  },
  botIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 20,
    gap: 16,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
    marginVertical: 40,
  },
  welcomeBot: {
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    lineHeight: 20,
  },
  msgRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  msgRowUser: {
    alignSelf: 'flex-end',
  },
  msgRowAssistant: {
    alignSelf: 'flex-start',
  },
  avatarBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
  },
  msgBubbleUser: {
    backgroundColor: '#8b5cf6',
    borderBottomRightRadius: 2,
  },
  msgBubbleAssistant: {
    backgroundColor: 'rgba(21, 28, 44, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 2,
  },
  msgTextUser: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  lineWrapper: {
    marginVertical: 2,
  },
  bulletLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  bulletDot: {
    color: '#3b82f6',
    fontSize: 14,
    lineHeight: 18,
    marginRight: 6,
  },
  lineText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  actionCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    alignSelf: 'center',
    width: '95%',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3b82f6',
    letterSpacing: 0.5,
  },
  actionPrompt: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18,
    marginBottom: 14,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  suggestionsContainer: {
    paddingVertical: 10,
    backgroundColor: '#0b0f19',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  suggestionsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  suggestionText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 10,
    backgroundColor: '#0b0f19',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(21, 28, 44, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    color: '#ffffff',
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
});
