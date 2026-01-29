import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  Platform,
} from "react-native";
import * as Haptics from 'expo-haptics';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Search,
  PlusCircle,
  X,
} from "lucide-react-native";
import { useCommunity } from "@/contexts/CommunityContext";
import type { Post } from "@/types/community";
import * as ImagePicker from 'expo-image-picker';
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shadow } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { user: authUser } = useAuth();

  const {
    posts,
    isLoading,
    reactToPost,
    createPost,
    addComment,
  } = useCommunity();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showCreatePost, setShowCreatePost] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [postCaption, setPostCaption] = useState<string>('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const selectedCircleId = 'global';

  const allPosts = useMemo(() => {
    return Object.values(posts).flat().filter(p => !p.isRemoved).sort((a, b) => b.createdAt - a.createdAt);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return allPosts;
    const query = searchQuery.toLowerCase();
    return allPosts.filter(p => 
      p.caption?.toLowerCase().includes(query) ||
      p.author.name.toLowerCase().includes(query)
    );
  }, [allPosts, searchQuery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleCreatePost = useCallback(async () => {
    if (!postCaption.trim() && !postImage) {
      Alert.alert('Empty Post', 'Add a caption or photo to post.');
      return;
    }
    
    setIsPosting(true);
    try {
      const newPost = await createPost({
        circleId: selectedCircleId,
        caption: postCaption.trim(),
        imageUrl: postImage,
      });
      
      if (newPost) {
        Alert.alert('Posted!', 'Your post is live.');
        setShowCreatePost(false);
        setPostCaption('');
        setPostImage(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not post. Try again.');
    } finally {
      setIsPosting(false);
    }
  }, [postCaption, postImage, createPost, selectedCircleId]);

  const handlePickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setPostImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  }, []);

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim() || !selectedPost) return;
    
    try {
      await addComment(selectedCircleId, selectedPost.id, commentText.trim());
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, [commentText, selectedPost, addComment, selectedCircleId]);

  const likeOverlay = useRef<Record<string, Animated.Value>>({}).current;
  const lastTapRef = useRef<Record<string, number>>({});

  const ensurePostAnim = (id: string) => {
    if (!likeOverlay[id]) likeOverlay[id] = new Animated.Value(0);
    return likeOverlay[id];
  };

  const handleDoubleTap = (postId: string) => {
    const now = Date.now();
    const last = lastTapRef.current[postId] ?? 0;
    if (now - last < 280) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      reactToPost(selectedCircleId, postId, 'love');
      const v = ensurePostAnim(postId);
      v.setValue(0);
      Animated.sequence([
        Animated.spring(v, { toValue: 1, friction: 3, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
    lastTapRef.current[postId] = now;
  };

  const renderPost = (post: Post) => {
    if (post.isRemoved) return null;
    
    const overlay = ensurePostAnim(post.id);
    const userId = user?.id ?? authUser?.id ?? 'guest';
    const totalLikes = (post.reactions.love?.length || 0) + (post.reactions.like?.length || 0);
    const hasLiked = post.reactions.love?.includes(userId) || post.reactions.like?.includes(userId);
    const hasSaved = post.reactions.save?.includes(userId);

    return (
      <View key={post.id} style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.author.name}</Text>
            <Text style={styles.postTime}>{formatTimeAgo(post.createdAt)}</Text>
          </View>
        </View>

        {post.imageUrl && (
          <TouchableOpacity 
            activeOpacity={0.95} 
            onPress={() => handleDoubleTap(post.id)}
          >
            <View>
              <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
              <Animated.View pointerEvents="none" style={[styles.likeOverlay, {
                opacity: overlay,
                transform: [{ scale: overlay.interpolate({ inputRange:[0,1], outputRange:[0.6, 1.2] }) }]
              }]}>
                <Heart size={80} color="#FFF" fill="#FFF" />
              </Animated.View>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.actionsRow}>
          <View style={styles.leftActions}>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                reactToPost(selectedCircleId, post.id, 'love');
              }}
            >
              <Heart 
                color={hasLiked ? "#EF4444" : "#1a1a1a"} 
                size={26} 
                fill={hasLiked ? "#EF4444" : 'none'}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => {
                setSelectedPost(post);
                setShowComments(true);
              }}
            >
              <MessageCircle color="#1a1a1a" size={26} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => reactToPost(selectedCircleId, post.id, 'save')}
          >
            <Bookmark 
              color={hasSaved ? "#D97706" : "#1a1a1a"} 
              size={24}
              fill={hasSaved ? "#D97706" : 'none'}
            />
          </TouchableOpacity>
        </View>

        {totalLikes > 0 && (
          <Text style={styles.likesText}>{totalLikes} {totalLikes === 1 ? 'like' : 'likes'}</Text>
        )}
        
        {post.caption && (
          <View style={styles.captionRow}>
            <Text style={styles.captionText}>
              <Text style={styles.captionUsername}>{post.author.name} </Text>
              {post.caption}
            </Text>
          </View>
        )}

        {post.comments.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              setSelectedPost(post);
              setShowComments(true);
            }}
          >
            <Text style={styles.viewComments}>
              View {post.comments.length} comment{post.comments.length > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feed}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#D97706"
          />
        }
      >
        {filteredPosts.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>Be the first to share something!</Text>
          </View>
        )}
        
        {filteredPosts.map(renderPost)}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity 
        style={[styles.fabButton, { bottom: insets.bottom + 90 }]}
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowCreatePost(true);
        }}
        activeOpacity={0.9}
      >
        <PlusCircle color="#FFF" size={28} fill="#FFF" />
      </TouchableOpacity>

      <Modal
        visible={showCreatePost}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreatePost(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreatePost(false)}>
              <X size={24} color="#1a1a1a" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Post</Text>
            <TouchableOpacity 
              onPress={handleCreatePost}
              disabled={isPosting || (!postCaption.trim() && !postImage)}
            >
              <Text style={[
                styles.postBtn,
                { color: (isPosting || (!postCaption.trim() && !postImage)) ? '#D1D5DB' : '#D97706' }
              ]}>
                {isPosting ? 'Posting...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.createPostContent}>
            <View style={styles.userRow}>
              <Image 
                source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150' }} 
                style={styles.createAvatar} 
              />
              <Text style={styles.createUsername}>{user?.name || 'You'}</Text>
            </View>
            
            <TextInput
              style={styles.captionInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#9CA3AF"
              value={postCaption}
              onChangeText={setPostCaption}
              multiline
              textAlignVertical="top"
            />

            {postImage && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: postImage }} style={styles.previewImg} />
                <TouchableOpacity 
                  style={styles.removeImgBtn}
                  onPress={() => setPostImage(null)}
                >
                  <X size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickImage}>
              <PlusCircle color="#D97706" size={24} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showComments}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowComments(false);
          setSelectedPost(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={() => {
              setShowComments(false);
              setSelectedPost(null);
            }}>
              <X size={24} color="#1a1a1a" />
            </TouchableOpacity>
          </View>
          
          {selectedPost && (
            <>
              <ScrollView style={styles.commentsContent}>
                {selectedPost.comments.length === 0 ? (
                  <View style={styles.noComments}>
                    <Text style={styles.noCommentsEmoji}>💬</Text>
                    <Text style={styles.noCommentsText}>No comments yet</Text>
                    <Text style={styles.noCommentsSub}>Be the first to comment!</Text>
                  </View>
                ) : (
                  selectedPost.comments.map((comment) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <Image source={{ uri: comment.author.avatar }} style={styles.commentAvatar} />
                      <View style={styles.commentBubble}>
                        <Text style={styles.commentAuthor}>{comment.author.name}</Text>
                        <Text style={styles.commentText}>{comment.text}</Text>
                        <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={styles.commentInputRow}>
                <Image 
                  source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150' }} 
                  style={styles.commentInputAvatar} 
                />
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor="#9CA3AF"
                  value={commentText}
                  onChangeText={setCommentText}
                />
                <TouchableOpacity 
                  onPress={handleAddComment}
                  disabled={!commentText.trim()}
                >
                  <Send color={commentText.trim() ? "#D97706" : "#D1D5DB"} size={22} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  header: { 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  feed: { 
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 16,
  },
  postHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  avatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: { 
    fontSize: 16, 
    fontWeight: '700',
    color: '#1a1a1a',
  },
  postTime: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  postImage: { 
    width: screenWidth, 
    height: screenWidth,
    backgroundColor: '#F3F4F6',
  },
  likeOverlay: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center', 
    justifyContent: 'center',
  },
  actionsRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
  likesText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  captionRow: {
    paddingHorizontal: 20,
    marginTop: 6,
  },
  captionText: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  captionUsername: {
    fontWeight: '700',
  },
  viewComments: {
    fontSize: 14,
    color: '#9CA3AF',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.medium,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  postBtn: {
    fontSize: 16,
    fontWeight: '700',
  },
  createPostContent: {
    flex: 1,
    padding: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  createAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
  },
  createUsername: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  captionInput: {
    minHeight: 100,
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImg: {
    width: '100%',
    height: 250,
    backgroundColor: '#F3F4F6',
  },
  removeImgBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
  },
  commentsContent: {
    flex: 1,
    padding: 20,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCommentsEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  noCommentsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  noCommentsSub: {
    fontSize: 14,
    color: '#6B7280',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
  },
  commentBubble: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 16,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  commentInputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
  },
  commentInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
});
