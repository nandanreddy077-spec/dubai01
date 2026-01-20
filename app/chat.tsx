import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Send,
  Camera,
  Image as ImageIcon,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useCommunity } from '@/contexts/CommunityContext';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { getPalette, getGradient, shadow, spacing, radii, typography } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import type { Message, Conversation } from '@/types/community';
import * as ImagePicker from 'expo-image-picker';

const { width: screenWidth } = Dimensions.get('window');

export default function ChatScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const params = useLocalSearchParams<{ userId?: string; conversationId?: string }>();
  const { user: currentUser } = useUser();
  const { user: authUser } = useAuth();
  
  const {
    getConversation,
    getMessages,
    sendMessage,
    markMessagesAsRead,
    posts,
  } = useCommunity();

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const userId = params.userId || '';
  const conversationId = params.conversationId || '';

  // Get recipient user info from posts
  const recipientUser = useMemo(() => {
    if (!userId) return null;
    
    // Try to find user from posts
    const allPosts = Object.values(posts).flat();
    const userPost = allPosts.find(p => p.author.id === userId);
    if (userPost) {
      return {
        id: userPost.author.id,
        name: userPost.author.name,
        avatar: userPost.author.avatar,
      };
    }
    
    // Fallback
    return {
      id: userId,
      name: 'User',
      avatar: '',
    };
  }, [userId, posts]);

  useEffect(() => {
    loadConversation();
  }, [userId, conversationId]);

  const loadConversation = async () => {
    try {
      setIsLoading(true);
      let conv: Conversation | null = null;
      
      if (conversationId) {
        const result = getConversation(conversationId);
        conv = Array.isArray(result) ? null : result;
      } else if (userId && currentUser?.id) {
        // Find or create conversation between current user and recipient
        const allConversations = getConversation(''); // Get all conversations
        if (Array.isArray(allConversations)) {
          conv = allConversations.find(c => 
            c.participantIds.includes(currentUser.id) && 
            c.participantIds.includes(userId)
          ) || null;
        }
      }

      if (conv) {
        setConversation(conv);
        const msgs = getMessages(conv.id);
        setMessages(msgs || []);
        // Mark messages as read
        if (currentUser?.id) {
          markMessagesAsRead(conv.id, currentUser.id);
        }
      } else {
        // Create new conversation
        if (userId && currentUser?.id) {
          const newConv: Conversation = {
            id: `conv_${Date.now()}`,
            participantIds: [currentUser.id, userId],
            lastMessageAt: Date.now(),
            unreadCount: 0,
            createdAt: Date.now(),
          };
          setConversation(newConv);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversation || !currentUser?.id || !userId) return;

    try {
      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        conversationId: conversation.id,
        senderId: currentUser.id,
        receiverId: userId,
        text: messageText.trim(),
        createdAt: Date.now(),
      };

      await sendMessage(newMessage);
      setMessages(prev => [...prev, newMessage]);
      setMessageText('');
      
      // Update conversation
      const updatedConv: Conversation = {
        ...conversation,
        lastMessage: newMessage,
        lastMessageAt: Date.now(),
      };
      setConversation(updatedConv);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && conversation && currentUser?.id && userId) {
        const imageUri = result.assets[0].uri;
        const newMessage: Message = {
          id: `msg_${Date.now()}`,
          conversationId: conversation.id,
          senderId: currentUser.id,
          receiverId: userId,
          text: '',
          imageUrl: imageUri,
          createdAt: Date.now(),
        };

        await sendMessage(newMessage);
        setMessages(prev => [...prev, newMessage]);
        
        const updatedConv: Conversation = {
          ...conversation,
          lastMessage: newMessage,
          lastMessageAt: Date.now(),
        };
        setConversation(updatedConv);

        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={palette.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          {recipientUser && (
            <>
              <Image
                source={{ uri: recipientUser.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150' }}
                style={styles.headerAvatar}
              />
              <Text style={styles.headerName}>{recipientUser.name}</Text>
            </>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderId === currentUser?.id;
              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageWrapper,
                    isOwnMessage ? styles.messageWrapperRight : styles.messageWrapperLeft,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isOwnMessage ? styles.messageBubbleOwn : styles.messageBubbleOther,
                    ]}
                  >
                    {message.imageUrl && (
                      <Image source={{ uri: message.imageUrl }} style={styles.messageImage} />
                    )}
                    {message.text ? (
                      <Text
                        style={[
                          styles.messageText,
                          isOwnMessage ? styles.messageTextOwn : styles.messageTextOther,
                        ]}
                      >
                        {message.text}
                      </Text>
                    ) : null}
                    <Text
                      style={[
                        styles.messageTime,
                        isOwnMessage ? styles.messageTimeOwn : styles.messageTimeOther,
                      ]}
                    >
                      {formatTime(message.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.inputButton}
            onPress={handlePickImage}
            activeOpacity={0.7}
          >
            <ImageIcon size={22} color={palette.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={palette.textMuted}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
            activeOpacity={0.7}
          >
            <Send size={20} color={messageText.trim() ? '#FFF' : palette.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.body.fontSize,
    color: palette.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.divider,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.surfaceElevated,
  },
  headerName: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700' as const,
    color: palette.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageWrapper: {
    marginBottom: spacing.sm,
    maxWidth: '75%',
  },
  messageWrapperLeft: {
    alignSelf: 'flex-start',
  },
  messageWrapperRight: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: radii.lg,
    ...shadow.sm,
  },
  messageBubbleOwn: {
    backgroundColor: palette.primary,
    borderBottomRightRadius: radii.xs,
  },
  messageBubbleOther: {
    backgroundColor: palette.surfaceElevated,
    borderBottomLeftRadius: radii.xs,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
  },
  messageText: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  messageTextOwn: {
    color: '#FFF',
  },
  messageTextOther: {
    color: palette.textPrimary,
  },
  messageTime: {
    fontSize: 10,
    marginTop: spacing.xs,
  },
  messageTimeOwn: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageTimeOther: {
    color: palette.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600' as const,
    color: palette.textSecondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.body.fontSize,
    color: palette.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: palette.divider,
    backgroundColor: palette.background,
    gap: spacing.sm,
  },
  inputButton: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body.fontSize,
    color: palette.textPrimary,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: palette.surfaceElevated,
  },
});

