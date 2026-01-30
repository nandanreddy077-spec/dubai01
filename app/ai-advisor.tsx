import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Send, 
  Sparkles, 
  ChevronLeft,
  Droplets,
  Sun,
  Moon,
  Leaf,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { makeOpenAIRequestWithTools, type ChatMessage as OpenAIChatMessage } from '@/lib/openai-service';
import { useUser } from '@/contexts/UserContext';
import PressableScale from "@/components/PressableScale";
import Svg, { Circle, Ellipse } from 'react-native-svg';



interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  { id: 'dry', label: 'My skin feels dry', icon: <Droplets color="#3B82F6" size={24} /> },
  { id: 'morning', label: 'Morning routine tips', icon: <Sun color="#F59E0B" size={24} /> },
  { id: 'night', label: 'Night routine tips', icon: <Moon color="#8B5CF6" size={24} /> },
  { id: 'natural', label: 'Natural remedies', icon: <Leaf color="#10B981" size={24} /> },
];

export default function AIAdvisorScreen() {
  useUser();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const sendMessage = async (userMessage: string) => {
    setShowChat(true);
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const openAIMessages: OpenAIChatMessage[] = [
        {
          role: 'system',
          content: `You are a friendly skincare guide. Keep responses short (2-3 sentences max). Be warm and helpful. Don't use bullet points or lists - just speak naturally. If asked about products, suggest general types rather than specific brands.`,
        },
        ...messages.map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content,
        })),
        { role: 'user', content: userMessage }
      ];

      const response = await makeOpenAIRequestWithTools(openAIMessages, [], {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 150,
      });

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content || "Let me think about that...",
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (error) {
      console.log('Error sending message:', error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I am having trouble connecting. Please try again in a moment.",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color="#0A0A0A" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Skin Guide</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!showChat ? (
            <Animated.View style={[styles.welcomeSection, { opacity: fadeAnim }]}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#C9A961', '#E8DED2']}
                  style={styles.avatarCircle}
                >
                  <Svg width={60} height={60} viewBox="0 0 60 60">
                    <Circle cx="30" cy="25" r="12" fill="rgba(255,255,255,0.3)" />
                    <Ellipse cx="30" cy="50" rx="18" ry="12" fill="rgba(255,255,255,0.3)" />
                  </Svg>
                </LinearGradient>
              </View>

              <Text style={styles.welcomeTitle}>Hi there!</Text>
              <Text style={styles.welcomeSubtitle}>
                I am here to help with your skincare questions. What would you like to know?
              </Text>

              <View style={styles.quickQuestionsContainer}>
                {QUICK_QUESTIONS.map((q) => (
                  <PressableScale
                    key={q.id}
                    onPress={() => handleQuickQuestion(q.label)}
                    pressedScale={0.97}
                    style={styles.quickButton}
                  >
                    <View style={styles.quickButtonIcon}>
                      {q.icon}
                    </View>
                    <Text style={styles.quickButtonText}>{q.label}</Text>
                  </PressableScale>
                ))}
              </View>

              <View style={styles.orDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.orText}>or ask anything</Text>
                <View style={styles.dividerLine} />
              </View>
            </Animated.View>
          ) : (
            <View style={styles.chatSection}>
              {messages.map((message) => (
                <View 
                  key={message.id} 
                  style={[
                    styles.messageBubble,
                    message.role === 'user' ? styles.userBubble : styles.assistantBubble
                  ]}
                >
                  {message.role === 'assistant' && (
                    <View style={styles.assistantIcon}>
                      <Sparkles color="#C9A961" size={16} />
                    </View>
                  )}
                  <Text style={[
                    styles.messageText,
                    message.role === 'user' ? styles.userText : styles.assistantText
                  ]}>
                    {message.content}
                  </Text>
                </View>
              ))}

              {isTyping && (
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <View style={styles.assistantIcon}>
                    <Sparkles color="#C9A961" size={16} />
                  </View>
                  <Text style={styles.typingText}>thinking...</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type your question..."
                placeholderTextColor="#9CA3AF"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]} 
                onPress={handleSend}
                disabled={!input.trim() || isTyping}
              >
                <Send color="#FFFFFF" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  welcomeSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0A0A0A',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  quickQuestionsContainer: {
    width: '100%',
    gap: 12,
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  quickButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  orText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginHorizontal: 16,
    fontWeight: '500',
  },
  chatSection: {
    gap: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#0A0A0A',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  assistantIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#1a1a1a',
  },
  typingText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  inputSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    color: '#0A0A0A',
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});
