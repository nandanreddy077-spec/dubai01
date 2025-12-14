import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  MoreHorizontal,
  Grid3x3,
  Bookmark,
  UserPlus,
  UserMinus,
  MessageCircle,
  BadgeCheck,
  Sparkles,
  MapPin,
  Link as LinkIcon,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useCommunity } from '@/contexts/CommunityContext';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { getPalette, getGradient, shadow, spacing, radii } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import type { Post } from '@/types/community';

const { width: screenWidth } = Dimensions.get('window');
const POST_SIZE = (screenWidth - spacing.lg * 2 - spacing.sm * 2) / 3;

export default function UserProfileScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const params = useLocalSearchParams<{ userId?: string }>();
  const { user: currentUser } = useUser();
  const { user: authUser } = useAuth();
  
  const {
    posts,
    followUser,
    unfollowUser,
    isFollowing,
    getFollowers,
    getFollowing,
    getUserCollections,
  } = useCommunity();
  
  const allPosts = useMemo(() => Object.values(posts).flat(), [posts]);

  const userId = params.userId || currentUser?.id || 'guest';
  const isOwnProfile = userId === currentUser?.id;
  const following = isFollowing(userId);
  const followersCount = getFollowers(userId);
  const followingCount = getFollowing(userId);

  // Get user's posts (excluding removed posts)
  const userPosts = useMemo(() => {
    return Object.values(posts)
      .flat()
      .filter(post => post.author.id === userId && !post.isRemoved)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, userId]);

  // Get user data (in real app, fetch from API)
  const profileUser = useMemo(() => {
    if (isOwnProfile && currentUser) {
      // Get name from auth metadata first, then user context, then email
      const authName = authUser?.user_metadata && typeof authUser.user_metadata === 'object' 
        ? (authUser.user_metadata as { full_name?: string; name?: string }).full_name 
          ?? (authUser.user_metadata as { full_name?: string; name?: string }).name 
        : undefined;
      const displayName = authName || currentUser.name || currentUser.email?.split('@')[0] || 'You';
      const username = currentUser.email?.split('@')[0] || currentUser.name?.toLowerCase().replace(/\s+/g, '') || authUser?.email?.split('@')[0] || 'user';
      return {
        id: currentUser.id,
        name: displayName,
        username: username,
        avatar: currentUser.avatar || '',
        bio: 'Beauty enthusiast ✨',
        isVerified: false,
        glowScore: currentUser.stats?.glowScore || 85,
        website: '',
      };
    }
    
    // For other users, get from first post or find in all posts
    const firstPost = userPosts[0];
    if (firstPost) {
      const authorName = firstPost.author.name;
      return {
        id: firstPost.author.id,
        name: authorName,
        username: authorName.toLowerCase().replace(/\s+/g, '') || 'user',
        avatar: firstPost.author.avatar,
        bio: 'Beauty lover sharing my glow journey 💫',
        isVerified: firstPost.author.isVerified || false,
        glowScore: firstPost.author.glowScore || 85,
        website: '',
      };
    }
    
    // If no posts, try to find user from any post
    const userPost = allPosts.find(p => p.author.id === userId);
    if (userPost) {
      const authorName = userPost.author.name;
      return {
        id: userPost.author.id,
        name: authorName,
        username: authorName.toLowerCase().replace(/\s+/g, '') || 'user',
        avatar: userPost.author.avatar,
        bio: 'Beauty lover sharing my glow journey 💫',
        isVerified: userPost.author.isVerified || false,
        glowScore: userPost.author.glowScore || 85,
        website: '',
      };
    }
    
    // Fallback
    return {
      id: userId,
      name: userId === 'guest' ? 'Guest User' : 'User',
      username: userId === 'guest' ? 'guest' : 'user',
      avatar: '',
      bio: '',
      isVerified: false,
      glowScore: 85,
      website: '',
    };
  }, [isOwnProfile, currentUser, authUser, userPosts, userId, posts]);

  const handleFollow = async () => {
    if (following) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postThumbnail}
      activeOpacity={0.9}
      onPress={() => {
        router.push({
          pathname: '/post-detail',
          params: { postId: item.id, circleId: item.circleId },
        });
      }}
    >
      <Image 
        source={{ uri: item.imageUrl || item.images?.[0] || '' }} 
        style={styles.postImage} 
      />
      {item.images && item.images.length > 1 && (
        <View style={styles.multipleImagesIndicator}>
          <Grid3x3 size={12} color="#FFF" />
        </View>
      )}
      <View style={styles.postOverlay}>
        <View style={styles.postStats}>
          <View style={styles.postStatItem}>
            <Text style={styles.postStatText}>
              {Object.values(item.reactions).reduce((sum, arr) => sum + arr.length, 0)}
            </Text>
          </View>
          <View style={styles.postStatItem}>
            <Text style={styles.postStatText}>{item.comments.length}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerUsername}>{profileUser.name || profileUser.username}</Text>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => {
            if (isOwnProfile) {
              Alert.alert(
                'Options',
                'Choose an option',
                [
                  {
                    text: 'Edit Profile',
                    onPress: () => router.push('/(tabs)/profile'),
                  },
                  {
                    text: 'Share Profile',
                    onPress: () => {
                      // Share profile functionality
                      Alert.alert('Share', 'Profile sharing coming soon!');
                    },
                  },
                  {
                    text: 'Settings',
                    onPress: () => router.push('/(tabs)/profile'),
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            } else {
              Alert.alert(
                'Options',
                'Choose an option',
                [
                  {
                    text: 'Report',
                    onPress: () => {
                      Alert.alert('Report', 'Report functionality coming soon!');
                    },
                    style: 'destructive' as const,
                  },
                  {
                    text: 'Block',
                    onPress: () => {
                      Alert.alert('Block', 'Block functionality coming soon!');
                    },
                    style: 'destructive' as const,
                  },
                  {
                    text: 'Share Profile',
                    onPress: () => {
                      Alert.alert('Share', 'Profile sharing coming soon!');
                    },
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }
          }}
        >
          <MoreHorizontal size={24} color={palette.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileTop}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: profileUser.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150' }}
                style={styles.avatar}
              />
              {profileUser.isVerified && (
                <View style={styles.verifiedBadge}>
                  <BadgeCheck size={20} color="#FFF" fill={palette.primary} />
                </View>
              )}
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userPosts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>{followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>{followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>{profileUser.name}</Text>
              {profileUser.glowScore && (
                <View style={styles.glowScoreBadge}>
                  <Sparkles size={12} color={palette.primary} />
                  <Text style={styles.glowScoreText}>{profileUser.glowScore}</Text>
                </View>
              )}
            </View>
            {profileUser.bio && (
              <Text style={styles.bio}>{profileUser.bio}</Text>
            )}
            {profileUser.website && (
              <TouchableOpacity style={styles.websiteRow}>
                <LinkIcon size={14} color={palette.primary} />
                <Text style={styles.website}>{profileUser.website}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          {isOwnProfile ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
              style={[styles.actionButton, styles.shareButton]}
              onPress={async () => {
                try {
                  await Share.share({
                    message: `Check out ${profileUser.name}'s profile on GlowCheck!`,
                    url: `glowcheck://user/${userId}`,
                  });
                } catch (error) {
                  console.error('Error sharing profile:', error);
                }
              }}
            >
                <Text style={styles.shareButtonText}>Share Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, following ? styles.followingButton : styles.followButton]}
                onPress={handleFollow}
              >
                {following ? (
                  <>
                    <UserMinus size={18} color={palette.textPrimary} />
                    <Text style={styles.followButtonText}>Following</Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} color="#FFF" />
                    <Text style={[styles.followButtonText, { color: '#FFF' }]}>Follow</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.messageButton]}>
                <MessageCircle size={18} color={palette.textPrimary} />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Highlights/Collections */}
          {getUserCollections(userId).length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.highlightsContainer}>
              {getUserCollections(userId).map(collection => (
                <TouchableOpacity 
                  key={collection.id} 
                  style={styles.highlightItem}
                  onPress={() => {
                    // Navigate to saved posts filtered by collection
                    router.push({
                      pathname: '/(tabs)/community',
                      params: { viewMode: 'saved', collectionId: collection.id },
                    });
                  }}
                >
                  {collection.coverImage ? (
                    <Image source={{ uri: collection.coverImage }} style={styles.highlightImage} />
                  ) : (
                    <View style={[styles.highlightImage, { backgroundColor: palette.surfaceElevated }]}>
                      <Bookmark size={24} color={palette.primary} />
                    </View>
                  )}
                  <Text style={styles.highlightName} numberOfLines={1}>{collection.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Posts Grid */}
        <View style={styles.postsSection}>
          <View style={styles.postsHeader}>
            <TouchableOpacity style={[styles.postsTab, styles.postsTabActive]}>
              <Grid3x3 size={18} color={palette.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.postsTab}
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/community',
                  params: { viewMode: 'saved' },
                });
              }}
            >
              <Bookmark size={18} color={palette.textSecondary} />
            </TouchableOpacity>
          </View>

          {userPosts.length === 0 ? (
            <View style={styles.emptyState}>
              <Grid3x3 size={48} color={palette.textMuted} />
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          ) : (
            <FlatList
              data={userPosts}
              renderItem={renderPost}
              keyExtractor={item => item.id}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={styles.postsGrid}
            />
          )}
        </View>
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
  headerUsername: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: palette.textPrimary,
  },
  moreButton: {
    padding: spacing.xs,
  },
  profileSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.xl,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 2,
    borderColor: palette.border,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '500' as const,
  },
  profileInfo: {
    marginBottom: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: palette.textPrimary,
  },
  glowScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  glowScoreText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: palette.primary,
  },
  bio: {
    fontSize: 14,
    color: palette.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  website: {
    fontSize: 14,
    color: palette.primary,
    fontWeight: '600' as const,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: palette.textPrimary,
  },
  shareButton: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: palette.textPrimary,
  },
  followButton: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  followingButton: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: palette.textPrimary,
  },
  messageButton: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    marginLeft: 4,
  },
  highlightsContainer: {
    marginBottom: spacing.lg,
  },
  highlightItem: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 70,
  },
  highlightImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  highlightName: {
    fontSize: 12,
    color: palette.textPrimary,
    textAlign: 'center',
  },
  postsSection: {
    borderTopWidth: 0.5,
    borderTopColor: palette.divider,
    paddingTop: spacing.md,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.divider,
  },
  postsTab: {
    padding: spacing.sm,
    marginHorizontal: spacing.xl,
  },
  postsTabActive: {
    borderBottomWidth: 1,
    borderBottomColor: palette.textPrimary,
  },
  postsGrid: {
    padding: spacing.sm,
  },
  postThumbnail: {
    width: POST_SIZE,
    height: POST_SIZE,
    margin: spacing.xs / 2,
    backgroundColor: palette.surfaceElevated,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  multipleImagesIndicator: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 4,
  },
  postOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    opacity: 0,
  },
  postStats: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  postStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    fontSize: 16,
    color: palette.textSecondary,
    marginTop: spacing.md,
    fontWeight: '600' as const,
  },
});

