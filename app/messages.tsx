import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  MessageCircle,
  Search,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useCommunity } from '@/contexts/CommunityContext';
import { useUser } from '@/contexts/UserContext';
import { getPalette, getGradient, shadow, spacing, radii, typography } from '@/constants/theme';
import { router } from 'expo-router';
import type { Conversation } from '@/types/community';

const { width: screenWidth } = Dimensions.get('window');

export default function MessagesScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { user: currentUser } = useUser();
  const {
    getConversation,
    posts,
  } = useCommunity();

  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    loadConversations();
  }, [currentUser?.id]);

  const loadConversations = () => {
    if (!currentUser?.id) return;
    
    const allConversations = getConversation('');
    if (Array.isArray(allConversations)) {
      // Sort by last message time (newest first)
      const sorted = [...allConversations].sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      setConversations(sorted);
    }
  };

  const getUserInfo = (userId: string) => {
    if (userId === currentUser?.id) return null;
    
    // Find user from posts
    const allPosts = Object.values(posts).flat();
    const userPost = allPosts.find(p => p.author.id === userId);
    if (userPost) {
      return {
        id: userPost.author.id,
        name: userPost.author.name,
        avatar: userPost.author.avatar,
      };
    }
    
    return {
      id: userId,
      name: 'User',
      avatar: '',
    };
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Conversations List */}
      <ScrollView style={styles.conversationsList} showsVerticalScrollIndicator={false}>
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageCircle size={64} color={palette.textMuted} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation by messaging someone from their profile</Text>
          </View>
        ) : (
          conversations.map((conversation) => {
            const otherUserId = conversation.participantIds.find(id => id !== currentUser?.id);
            if (!otherUserId) return null;
            
            const userInfo = getUserInfo(otherUserId);
            if (!userInfo) return null;

            return (
              <View
                key={conversation.id}
                style={styles.conversationItem}
              >
                <TouchableOpacity
                  style={styles.avatarContainer}
                  onPress={() => {
                    router.push({
                      pathname: '/user-profile',
                      params: { userId: otherUserId },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: userInfo.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150' }}
                    style={styles.conversationAvatar}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.conversationContent}
                  onPress={() => {
                    router.push({
                      pathname: '/chat',
                      params: {
                        userId: otherUserId,
                        conversationId: conversation.id,
                      },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.conversationHeader}>
                    <TouchableOpacity
                      onPress={() => {
                        router.push({
                          pathname: '/user-profile',
                          params: { userId: otherUserId },
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.conversationName}>{userInfo.name}</Text>
                    </TouchableOpacity>
                    {conversation.lastMessage && (
                      <Text style={styles.conversationTime}>
                        {formatTime(conversation.lastMessage.createdAt)}
                      </Text>
                    )}
                  </View>
                  {conversation.lastMessage && (
                    <Text style={styles.conversationPreview} numberOfLines={1}>
                      {conversation.lastMessage.text || (conversation.lastMessage.imageUrl ? '📷 Photo' : '')}
                    </Text>
                  )}
                </TouchableOpacity>
                {conversation.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>
                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
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
  headerTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.divider,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  conversationAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.surfaceElevated,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conversationName: {
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: palette.textPrimary,
  },
  conversationTime: {
    fontSize: 12,
    color: palette.textMuted,
  },
  conversationPreview: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: spacing.sm,
  },
  unreadCount: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600' as const,
    color: palette.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.body.fontSize,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

