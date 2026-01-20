import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Share2,
  BadgeCheck,
  Sparkles,
  MapPin,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useCommunity } from '@/contexts/CommunityContext';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { getPalette, getGradient, shadow, spacing, radii } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import type { Post } from '@/types/community';

const { width: screenWidth } = Dimensions.get('window');

export default function PostDetailScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const params = useLocalSearchParams<{ postId?: string; circleId?: string }>();
  const { user } = useUser();
  const { user: authUser } = useAuth();
  
  const {
    posts,
    reactToPost,
    addComment,
    reportPost,
    createStory,
    deletePost,
  } = useCommunity();

  const [commentText, setCommentText] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const post = useMemo(() => {
    if (!params.postId || !params.circleId) return null;
    const circlePosts = posts[params.circleId] || [];
    const foundPost = circlePosts.find(p => p.id === params.postId);
    // Don't show removed posts
    if (foundPost && foundPost.isRemoved) {
      return null;
    }
    return foundPost || null;
  }, [posts, params.postId, params.circleId]);

  const userId = user?.id ?? authUser?.id ?? 'guest';
  const hasLiked = post ? (post.reactions.love?.includes(userId) || post.reactions.like?.includes(userId)) : false;
  const hasSaved = post ? post.reactions.save?.includes(userId) : false;

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Post not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this post on GlowCheck: ${post.caption}`,
      });
    } catch (error) {
      console.log('Share error:', error);
      Alert.alert('Error', 'Failed to share post. Please try again.');
    }
  };

  const handleShareToStory = async () => {
    try {
      if (!post.imageUrl && (!post.images || post.images.length === 0)) {
        Alert.alert('No Image', 'This post doesn\'t have an image to share to story.');
        return;
      }
      
      const imageUri = post.imageUrl || post.images?.[0];
      if (imageUri) {
        const story = await createStory(imageUri, 'image');
        if (story) {
          Alert.alert('✨ Shared!', 'Post shared to your story successfully!');
        } else {
          throw new Error('Failed to create story');
        }
      } else {
        Alert.alert('Error', 'Could not find image to share.');
      }
    } catch (error) {
      console.error('Error sharing to story:', error);
      Alert.alert('Error', 'Failed to share to story. Please try again.');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !params.circleId) return;
    try {
      await addComment(params.circleId, post.id, commentText.trim());
      setCommentText('');
      Alert.alert('✨ Comment Added!', 'Your comment has been posted.');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w`;
  };

  const postImages = post.images && post.images.length > 0 ? post.images : (post.imageUrl ? [post.imageUrl] : []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => {
            const isOwnPost = post.author.id === userId;
            Alert.alert(
              'Post Options',
              'Choose an option',
              [
                ...(isOwnPost ? [
                  {
                    text: 'Edit Post',
                    onPress: () => {
                      Alert.alert('Edit', 'Edit post functionality coming soon!');
                    },
                  },
                  {
                    text: 'Delete Post',
                    onPress: () => {
                      Alert.alert(
                        'Delete Post',
                        'Are you sure you want to delete this post?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive' as const,
                            onPress: async () => {
                              if (!post) return;
                              try {
                                const result = await deletePost(post.circleId, post.id);
                                if (result?.error) {
                                  Alert.alert('Error', result.error);
                                } else {
                                  Alert.alert('Deleted', 'Post deleted successfully!', [
                                    {
                                      text: 'OK',
                                      onPress: () => router.back(),
                                    },
                                  ]);
                                }
                              } catch (error) {
                                console.error('Error deleting post:', error);
                                Alert.alert('Error', 'Failed to delete post. Please try again.');
                              }
                            },
                          },
                        ]
                      );
                    },
                    style: 'destructive' as const,
                  },
                ] : [
                  {
                    text: 'Report',
                    onPress: async () => {
                      Alert.alert(
                        'Report Post',
                        'Why are you reporting this post?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Spam',
                            onPress: async () => {
                              try {
                                const result = await reportPost(post.circleId, post.id);
                                if (result?.removed) {
                                  Alert.alert('Post Removed', result.message);
                                  router.back();
                                } else {
                                  Alert.alert('Reported', `Thank you for reporting. This post has ${result?.reportCount || 0} reports.`);
                                }
                              } catch (error) {
                                console.error('Error reporting post:', error);
                                Alert.alert('Error', 'Failed to report post. Please try again.');
                              }
                            },
                          },
                          {
                            text: 'Inappropriate',
                            onPress: async () => {
                              try {
                                const result = await reportPost(post.circleId, post.id);
                                if (result?.removed) {
                                  Alert.alert('Post Removed', result.message);
                                  router.back();
                                } else {
                                  Alert.alert('Reported', `Thank you for reporting. This post has ${result?.reportCount || 0} reports.`);
                                }
                              } catch (error) {
                                console.error('Error reporting post:', error);
                                Alert.alert('Error', 'Failed to report post. Please try again.');
                              }
                            },
                          },
                          {
                            text: 'Other',
                            onPress: async () => {
                              try {
                                const result = await reportPost(post.circleId, post.id);
                                if (result?.removed) {
                                  Alert.alert('Post Removed', result.message);
                                  router.back();
                                } else {
                                  Alert.alert('Reported', `Thank you for reporting. This post has ${result?.reportCount || 0} reports.`);
                                }
                              } catch (error) {
                                console.error('Error reporting post:', error);
                                Alert.alert('Error', 'Failed to report post. Please try again.');
                              }
                            },
                          },
                        ]
                      );
                    },
                    style: 'destructive' as const,
                  },
                ]),
                {
                  text: 'Share to Story',
                  onPress: handleShareToStory,
                },
                {
                  text: 'Share',
                  onPress: handleShare,
                },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
        >
          <MoreHorizontal size={24} color={palette.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.postUserInfo} 
            activeOpacity={0.7}
            onPress={() => router.push(`/user-profile?userId=${post.author.id}`)}
          >
            <Image source={{ uri: post.author.avatar }} style={styles.postAvatar} />
            <View style={styles.authorInfo}>
              <View style={styles.usernameRow}>
                <Text style={styles.postUserName}>{post.author.name}</Text>
                {post.author.isVerified && (
                  <BadgeCheck size={14} color={palette.primary} fill={palette.primary} />
                )}
              </View>
              {post.locationName && (
                <View style={styles.locationRow}>
                  <MapPin size={10} color={palette.textSecondary} />
                  <Text style={styles.postLocation}>{post.locationName}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Post Image */}
        {postImages.length > 0 && (
          <View style={styles.imageContainer}>
            {postImages.length > 1 ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                  setCurrentImageIndex(index);
                }}
                style={styles.imageCarousel}
              >
                {postImages.map((uri, index) => (
                  <Image key={index} source={{ uri }} style={styles.postImage} />
                ))}
              </ScrollView>
            ) : (
              <Image source={{ uri: postImages[0] }} style={styles.postImage} />
            )}
            {postImages.length > 1 && (
              <View style={styles.carouselIndicator}>
                {postImages.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.carouselDot,
                      index === currentImageIndex && styles.carouselDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Post Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.leftActions}>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={async () => {
                try {
                  await reactToPost(post.circleId, post.id, 'love');
                } catch (error) {
                  console.error('Error reacting to post:', error);
                  Alert.alert('Error', 'Failed to react to post. Please try again.');
                }
              }}
              activeOpacity={0.7}
            >
              <Heart 
                color={hasLiked ? palette.danger : palette.textPrimary} 
                size={26} 
                fill={hasLiked ? palette.danger : 'none'}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionBtn} 
              activeOpacity={0.7}
            >
              <MessageCircle color={palette.textPrimary} size={26} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionBtn} 
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(
                  'Share Post',
                  'Choose an option',
                  [
                    {
                      text: 'Share to Story',
                      onPress: handleShareToStory,
                    },
                    {
                      text: 'Share',
                      onPress: handleShare,
                    },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }}
            >
              <Share2 color={palette.textPrimary} size={24} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={async () => {
              try {
                await reactToPost(post.circleId, post.id, 'save');
                if (!hasSaved) {
                  Alert.alert('✨ Saved!', 'Post saved to your collection');
                }
              } catch (error) {
                console.error('Error saving post:', error);
                Alert.alert('Error', 'Failed to save post. Please try again.');
              }
            }}
            activeOpacity={0.7}
          >
            <Bookmark 
              color={hasSaved ? palette.primary : palette.textPrimary} 
              size={24}
              fill={hasSaved ? palette.primary : 'none'}
            />
          </TouchableOpacity>
        </View>

        {/* Post Caption */}
        <View style={styles.captionContainer}>
          <Text style={styles.likesText}>
            {Object.values(post.reactions).reduce((sum, arr) => sum + arr.length, 0)} likes
          </Text>
          <View style={styles.captionRow}>
            <Text style={styles.captionAuthor}>{post.author.name}</Text>
            <Text style={styles.captionText}>{post.caption}</Text>
          </View>
          {post.hashtags && post.hashtags.length > 0 && (
            <View style={styles.hashtagsRow}>
              {post.hashtags.map((tag, i) => (
                <Text key={i} style={styles.hashtag}>#{tag}</Text>
              ))}
            </View>
          )}
          <Text style={styles.timeText}>{formatTimeAgo(post.createdAt)}</Text>
        </View>

        {/* Comments */}
        <View style={styles.commentsContainer}>
          {post.comments.length > 0 ? (
            <>
              <Text style={styles.commentsTitle}>Comments</Text>
              {post.comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Image 
                    source={{ uri: comment.author.avatar }} 
                    style={styles.commentAvatar} 
                  />
                  <View style={styles.commentContent}>
                    <Text style={styles.commentAuthor}>{comment.author.name}</Text>
                    <Text style={styles.commentText}>{comment.text}</Text>
                    <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <Image 
          source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150' }} 
          style={styles.commentInputAvatar} 
        />
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          placeholderTextColor={palette.textMuted}
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity 
          onPress={handleAddComment}
          disabled={!commentText.trim()}
          style={styles.sendCommentBtn}
        >
          <Send 
            color={commentText.trim() ? palette.primary : palette.textMuted} 
            size={20} 
          />
        </TouchableOpacity>
      </View>
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
    fontSize: 18,
    fontWeight: '700' as const,
    color: palette.textPrimary,
  },
  moreButton: {
    padding: spacing.xs,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 18,
    color: palette.textSecondary,
    marginBottom: spacing.lg,
  },
  backButtonText: {
    fontSize: 16,
    color: palette.primary,
    fontWeight: '600' as const,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surfaceElevated,
  },
  authorInfo: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  postUserName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: palette.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  postLocation: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  imageContainer: {
    position: 'relative',
  },
  imageCarousel: {
    width: screenWidth,
    height: screenWidth,
  },
  postImage: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: palette.surfaceElevated,
  },
  carouselIndicator: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  carouselDotActive: {
    backgroundColor: '#FFF',
    width: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionBtn: {
    padding: spacing.xs,
  },
  captionContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  likesText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    marginBottom: spacing.sm,
  },
  captionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  captionAuthor: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    marginRight: spacing.xs,
  },
  captionText: {
    fontSize: 15,
    color: palette.textPrimary,
    flex: 1,
  },
  hashtagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  hashtag: {
    fontSize: 15,
    color: palette.primary,
    fontWeight: '600' as const,
    marginRight: spacing.sm,
  },
  timeText: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: spacing.xs,
  },
  commentsContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    marginBottom: spacing.md,
  },
  commentItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.surfaceElevated,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: palette.textPrimary,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: palette.textMuted,
  },
  noCommentsText: {
    fontSize: 14,
    color: palette.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 0.5,
    borderTopColor: palette.divider,
    backgroundColor: palette.background,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.surfaceElevated,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: palette.textPrimary,
    padding: spacing.sm,
    backgroundColor: palette.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.border,
    maxHeight: 100,
  },
  sendCommentBtn: {
    padding: spacing.sm,
  },
});

