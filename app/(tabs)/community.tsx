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
  ActivityIndicator,
  RefreshControl,
  Modal,
  Share,
} from "react-native";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Search,
  PlusCircle,
  Flame,
  Zap,
  TrendingUp,
  Star,
  Sparkles,
  BadgeCheck,
  Crown,
  Award,
  Target,
  Users,
  X,
  Clock,
  MapPin,
  ThumbsUp,
  Lightbulb,
  ChevronRight,
  Gift,
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { getPalette, shadow, spacing, radii } from "@/constants/theme";
import { useCommunity } from "@/contexts/CommunityContext";
import type { Post, ReactionType, Challenge, ViewMode } from "@/types/community";
import * as ImagePicker from 'expo-image-picker';
import { useUser } from "@/contexts/UserContext";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

type FilterType = 'all' | 'tips' | 'reviews' | 'transformations';

export default function CommunityScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { user } = useUser();

  const {
    posts,
    stories,
    circles,
    challenges,
    isLoading,
    reactToPost,
    createStory,
    viewStory,
    getTrendingPosts,
    getUserChallenges,
    joinChallenge,
  } = useCommunity();

  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showCreatePost, setShowCreatePost] = useState<boolean>(false);
  const [showCircles, setShowCircles] = useState<boolean>(false);
  const [showChallenges, setShowChallenges] = useState<boolean>(false);
  const selectedCircleId = 'global';

  const userChallenges = getUserChallenges();

  const allPosts = useMemo(() => {
    let feedPosts = Object.values(posts).flat();
    
    switch (viewMode) {
      case 'trending':
        return getTrendingPosts();
      case 'glowups':
        return feedPosts.filter(p => p.isBeforeAfter || p.type === 'transformation');
      case 'challenges':
        return feedPosts.filter(p => p.challengeId);
      default:
        return feedPosts;
    }
  }, [posts, viewMode, getTrendingPosts]);

  const filteredPosts = useMemo(() => {
    let filtered = allPosts;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(p => {
        switch (filterType) {
          case 'tips':
            return p.type === 'tip';
          case 'reviews':
            return p.type === 'review';
          case 'transformations':
            return p.isBeforeAfter || p.type === 'transformation';
          default:
            return true;
        }
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.caption?.toLowerCase().includes(query) ||
        p.author.name.toLowerCase().includes(query) ||
        p.hashtags?.some(h => h.toLowerCase().includes(query))
      );
    }

    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }, [allPosts, filterType, searchQuery]);

  const activeStories = useMemo(() => 
    stories.filter(s => s.expiresAt > Date.now()),
    [stories]
  );

  const activeChallenges = useMemo(() => 
    challenges.filter(c => c.status === 'active' && c.endsAt > Date.now()),
    [challenges]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleCreateStory = useCallback(async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uri = res.assets[0]?.uri ?? null;
        if (uri) {
          await createStory(uri, 'image');
        }
      }
    } catch (e) {
      console.log('Create story failed', e);
    }
  }, [createStory]);

  const likeOverlay = useRef<Record<string, Animated.Value>>({}).current;
  const lastTapRef = useRef<Record<string, number>>({});

  const ensurePostAnim = (id: string) => {
    if (!likeOverlay[id]) likeOverlay[id] = new Animated.Value(0);
    return likeOverlay[id];
  };

  const handlePostImageTap = (postId: string) => {
    const now = Date.now();
    const last = lastTapRef.current[postId] ?? 0;
    if (now - last < 280) {
      reactToPost(selectedCircleId, postId, 'love');
      const v = ensurePostAnim(postId);
      v.setValue(0);
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
    lastTapRef.current[postId] = now;
  };

  const handleShare = async (post: Post) => {
    try {
      await Share.share({
        message: `Check out this post on Glow: ${post.caption}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const renderReactionIcon = (type: ReactionType, size: number = 20) => {
    switch (type) {
      case 'love':
        return <Heart size={size} fill={palette.danger} color={palette.danger} />;
      case 'fire':
        return <Flame size={size} fill="#FF6B35" color="#FF6B35" />;
      case 'sparkle':
        return <Sparkles size={size} fill={palette.primary} color={palette.primary} />;
      case 'wow':
        return <Star size={size} fill="#FFD700" color="#FFD700" />;
      case 'queen':
        return <Crown size={size} fill="#9333EA" color="#9333EA" />;
      default:
        return <ThumbsUp size={size} color={palette.textSecondary} />;
    }
  };

  const renderPostTypeIndicator = (post: Post) => {
    if (post.type === 'tip') {
      return (
        <View style={[styles.typeIndicator, { backgroundColor: '#10B981' }]}>
          <Lightbulb size={12} color="#FFF" />
          <Text style={styles.typeText}>TIP</Text>
        </View>
      );
    }
    if (post.type === 'review') {
      return (
        <View style={[styles.typeIndicator, { backgroundColor: '#F59E0B' }]}>
          <Star size={12} color="#FFF" fill="#FFF" />
          <Text style={styles.typeText}>REVIEW</Text>
        </View>
      );
    }
    if (post.isBeforeAfter || post.type === 'transformation') {
      return (
        <View style={[styles.typeIndicator, { backgroundColor: '#8B5CF6' }]}>
          <Zap size={12} color="#FFF" fill="#FFF" />
          <Text style={styles.typeText}>B/A</Text>
        </View>
      );
    }
    if (post.challengeId) {
      return (
        <View style={[styles.typeIndicator, { backgroundColor: '#EC4899' }]}>
          <Target size={12} color="#FFF" />
          <Text style={styles.typeText}>CHALLENGE</Text>
        </View>
      );
    }
    return null;
  };

  const renderPost = (post: Post) => {
    const overlay = ensurePostAnim(post.id);
    const userId = user?.id ?? 'guest';
    const totalReactions = Object.values(post.reactions).reduce((sum, arr) => sum + arr.length, 0);
    const hasLiked = post.reactions.love?.includes(userId) || post.reactions.like?.includes(userId);
    const hasSaved = post.reactions.save?.includes(userId);
    
    const topReactions = Object.entries(post.reactions)
      .filter(([type]) => type !== 'save')
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 3);

    return (
      <View key={post.id} style={styles.postCard}>
        {post.isPinned && (
          <View style={styles.pinnedBadge}>
            <Award size={14} color={palette.primary} fill={palette.primary} />
            <Text style={styles.pinnedText}>Pinned Post</Text>
          </View>
        )}

        <View style={styles.postHeader}>
          <TouchableOpacity style={styles.postUserInfo} activeOpacity={0.7}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: post.author.avatar }} style={styles.postAvatar} />
              {post.author.isVerified && (
                <View style={styles.verifiedBadge}>
                  <BadgeCheck size={16} color="#FFF" fill={palette.primary} />
                </View>
              )}
            </View>
            <View style={styles.authorInfo}>
              <View style={styles.usernameRow}>
                <Text style={styles.postUserName}>{post.author.name}</Text>
                {post.author.glowScore && (
                  <View style={styles.glowScoreBadge}>
                    <Sparkles size={10} color={palette.primary} />
                    <Text style={styles.glowScoreText}>{post.author.glowScore}</Text>
                  </View>
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
          <TouchableOpacity style={styles.moreBtn}>
            <MoreHorizontal color={palette.textPrimary} size={22} />
          </TouchableOpacity>
        </View>

        {post.imageUrl && (
          <TouchableOpacity activeOpacity={0.95} onPress={() => handlePostImageTap(post.id)}>
            <View>
              <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
              
              {renderPostTypeIndicator(post)}
              
              {post.duration && (
                <View style={styles.durationBadge}>
                  <Clock size={10} color="#FFF" />
                  <Text style={styles.durationText}>{post.duration}</Text>
                </View>
              )}
              
              <Animated.View pointerEvents="none" style={[styles.likeOverlay, {
                opacity: overlay,
                transform: [{ scale: overlay.interpolate({ inputRange:[0,1], outputRange:[0.6, 1.2] }) }]
              }]}>
                <Heart size={100} color="#FFF" fill="#FFF" />
              </Animated.View>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.actionsRow}>
          <View style={styles.leftActions}>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => reactToPost(selectedCircleId, post.id, 'love')}
              activeOpacity={0.7}
            >
              <Heart 
                color={hasLiked ? palette.danger : palette.textPrimary} 
                size={26} 
                fill={hasLiked ? palette.danger : 'none'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
              <MessageCircle color={palette.textPrimary} size={26} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionBtn} 
              activeOpacity={0.7}
              onPress={() => handleShare(post)}
            >
              <Send color={palette.textPrimary} size={24} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => reactToPost(selectedCircleId, post.id, 'save')}
            activeOpacity={0.7}
          >
            <Bookmark 
              color={hasSaved ? palette.textPrimary : palette.textPrimary} 
              size={24}
              fill={hasSaved ? palette.textPrimary : 'none'}
            />
          </TouchableOpacity>
        </View>

        {totalReactions > 0 && (
          <TouchableOpacity style={styles.reactionsRow} activeOpacity={0.8}>
            <View style={styles.reactionIcons}>
              {topReactions.map(([type], idx) => (
                <View key={type} style={[styles.reactionIconWrapper, { marginLeft: idx > 0 ? -6 : 0 }]}>
                  {renderReactionIcon(type as ReactionType, 16)}
                </View>
              ))}
            </View>
            <Text style={styles.reactionsText}>
              {totalReactions.toLocaleString()} {totalReactions === 1 ? 'reaction' : 'reactions'}
            </Text>
          </TouchableOpacity>
        )}
        
        {post.caption && (
          <View style={styles.captionRow}>
            <Text style={styles.captionText}>
              <Text style={styles.captionUsername}>{post.author.name} </Text>
              {post.caption}
            </Text>
          </View>
        )}

        {post.hashtags && post.hashtags.length > 0 && (
          <View style={styles.hashtagsRow}>
            {post.hashtags.slice(0, 5).map((tag, i) => (
              <TouchableOpacity key={i} activeOpacity={0.7}>
                <Text style={styles.hashtag}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {post.comments.length > 0 && (
          <TouchableOpacity style={styles.commentsPreview} activeOpacity={0.8}>
            <Text style={styles.viewCommentsText}>
              View all {post.comments.length} comments
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.postFooter}>
          <Text style={styles.postTime}>{formatTimeAgo(post.createdAt)}</Text>
          {(post.saves ?? 0) > 0 && (
            <View style={styles.savesIndicator}>
              <Bookmark size={10} color={palette.textMuted} />
              <Text style={styles.savesText}>{post.saves} saves</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderChallenge = (challenge: Challenge) => {
    const isParticipating = userChallenges.some(uc => uc.challengeId === challenge.id);
    const timeRemaining = challenge.endsAt - Date.now();
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
    
    return (
      <TouchableOpacity 
        key={challenge.id} 
        style={styles.challengeCard}
        activeOpacity={0.8}
      >
        <Image source={{ uri: challenge.image }} style={styles.challengeImage} />
        <View style={styles.challengeOverlay} />
        <View style={styles.challengeContent}>
          <View style={styles.challengeHeader}>
            <View style={styles.challengeBadge}>
              <Text style={styles.challengeIcon}>{challenge.icon}</Text>
            </View>
            {isParticipating && (
              <View style={styles.participatingBadge}>
                <BadgeCheck size={12} color="#FFF" fill="#10B981" />
                <Text style={styles.participatingText}>Joined</Text>
              </View>
            )}
          </View>
          <Text style={styles.challengeTitle} numberOfLines={2}>{challenge.title}</Text>
          <Text style={styles.challengeDescription} numberOfLines={2}>
            {challenge.description}
          </Text>
          <View style={styles.challengeFooter}>
            <View style={styles.challengeStats}>
              <View style={styles.challengeStat}>
                <Users size={12} color="#FFF" />
                <Text style={styles.challengeStatText}>
                  {challenge.participants.toLocaleString()}
                </Text>
              </View>
              <View style={styles.challengeStat}>
                <Gift size={12} color="#FFD700" />
                <Text style={styles.challengeStatText}>
                  {challenge.reward.points} pts
                </Text>
              </View>
              <View style={styles.challengeStat}>
                <Clock size={12} color="#FFF" />
                <Text style={styles.challengeStatText}>
                  {daysRemaining}d left
                </Text>
              </View>
            </View>
            {!isParticipating && (
              <TouchableOpacity 
                style={styles.joinChallengeBtn}
                onPress={() => joinChallenge(challenge.id)}
              >
                <Text style={styles.joinChallengeBtnText}>Join</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  console.log('showCreatePost:', showCreatePost);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>Beauty Circle</Text>
          <TouchableOpacity 
            style={styles.circleSelector}
            onPress={() => setShowCircles(true)}
          >
            <Users size={16} color={palette.textSecondary} />
            <ChevronRight size={16} color={palette.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIcon} 
            activeOpacity={0.7}
            onPress={() => setShowChallenges(true)}
          >
            <Target color={palette.textPrimary} size={22} />
            {activeChallenges.length > 0 && (
              <View style={styles.notificationDot} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIcon} 
            activeOpacity={0.7} 
            onPress={() => setShowCreatePost(true)}
          >
            <PlusCircle color={palette.textPrimary} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={palette.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts, people, hashtags..."
            placeholderTextColor={palette.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={palette.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.viewModeSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['feed', 'trending', 'glowups', 'challenges'] as ViewMode[]).map(mode => (
            <TouchableOpacity
              key={mode}
              style={[styles.viewModeBtn, viewMode === mode && styles.viewModeBtnActive]}
              onPress={() => setViewMode(mode)}
              activeOpacity={0.7}
            >
              {mode === 'feed' && <Sparkles size={16} color={viewMode === mode ? '#FFF' : palette.textSecondary} />}
              {mode === 'trending' && <TrendingUp size={16} color={viewMode === mode ? '#FFF' : palette.textSecondary} />}
              {mode === 'glowups' && <Zap size={16} color={viewMode === mode ? '#FFF' : palette.textSecondary} />}
              {mode === 'challenges' && <Target size={16} color={viewMode === mode ? '#FFF' : palette.textSecondary} />}
              <Text style={[styles.viewModeText, viewMode === mode && styles.viewModeTextActive]}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'tips', 'reviews', 'transformations'] as FilterType[]).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, filterType === filter && styles.filterChipActive]}
              onPress={() => setFilterType(filter)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filterType === filter && styles.filterChipTextActive]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={palette.primary}
          />
        }
      >
        {activeStories.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.storiesContainer}
          >
            <TouchableOpacity style={styles.storyItem} activeOpacity={0.8} onPress={handleCreateStory}>
              <View style={[styles.storyRing, { borderColor: palette.divider }]}>
                <Image 
                  source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150' }} 
                  style={styles.storyImage} 
                />
                <View style={styles.addStoryIcon}>
                  <PlusCircle color="#FFF" size={16} fill={palette.primary} />
                </View>
              </View>
              <Text style={styles.storyName}>Your story</Text>
            </TouchableOpacity>
            
            {activeStories.slice(0, 15).map((story, idx) => (
              <TouchableOpacity 
                key={story.id} 
                style={styles.storyItem} 
                onPress={() => viewStory(story.id)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.storyRing, 
                  story.views.includes(user?.id ?? 'guest') && styles.storyViewed
                ]}>
                  <Image source={{ uri: story.userAvatar }} style={styles.storyImage} />
                </View>
                <Text style={styles.storyName} numberOfLines={1}>
                  {story.userName.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {viewMode === 'challenges' && activeChallenges.length > 0 && (
          <View style={styles.challengesSection}>
            <Text style={styles.sectionTitle}>Active Challenges</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.challengesList}
            >
              {activeChallenges.map(renderChallenge)}
            </ScrollView>
          </View>
        )}

        <View style={styles.feed}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={palette.primary} size="large" />
            </View>
          )}
          
          {!isLoading && filteredPosts.length === 0 && (
            <View style={styles.emptyState}>
              <Sparkles color={palette.textSecondary} size={48} />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No posts match your search' : 'Start following circles to see posts!'}
              </Text>
            </View>
          )}
          
          {filteredPosts.map(renderPost)}
        </View>
      </ScrollView>

      <Modal
        visible={showCircles}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCircles(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Circles</Text>
            <TouchableOpacity onPress={() => setShowCircles(false)}>
              <X size={24} color={palette.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {circles.map(circle => (
              <TouchableOpacity 
                key={circle.id} 
                style={styles.circleItem}
                activeOpacity={0.7}
              >
                <Image source={{ uri: circle.coverImage }} style={styles.circleImage} />
                <View style={styles.circleInfo}>
                  <View style={styles.circleNameRow}>
                    <Text style={styles.circleName}>{circle.name}</Text>
                    {circle.isOfficial && (
                      <BadgeCheck size={16} color={palette.primary} fill={palette.primary} />
                    )}
                  </View>
                  <Text style={styles.circleDescription} numberOfLines={1}>
                    {circle.description}
                  </Text>
                  <View style={styles.circleStats}>
                    <Users size={12} color={palette.textSecondary} />
                    <Text style={styles.circleStatsText}>
                      {circle.memberCount.toLocaleString()} members
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.joinCircleBtn}>
                  <Text style={styles.joinCircleBtnText}>Join</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showChallenges}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChallenges(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Challenges</Text>
            <TouchableOpacity onPress={() => setShowChallenges(false)}>
              <X size={24} color={palette.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {activeChallenges.map(renderChallenge)}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function formatTimeAgo(timestamp: number): string {
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
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: palette.background 
  },
  
  header: { 
    height: 54,
    paddingHorizontal: spacing.lg, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: palette.divider,
    backgroundColor: palette.background
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  appTitle: { 
    fontSize: 22, 
    fontWeight: '800' as const,
    color: palette.textPrimary,
    letterSpacing: -0.5
  },
  circleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  headerIcon: {
    padding: spacing.xs,
    position: 'relative' as const
  },
  notificationDot: {
    position: 'absolute' as const,
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.danger
  },

  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: palette.background,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.divider
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.divider
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: palette.textPrimary,
    paddingVertical: 0
  },

  viewModeSelector: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.divider,
    backgroundColor: palette.background
  },
  viewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: palette.surface
  },
  viewModeBtnActive: {
    backgroundColor: palette.primary
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: palette.textSecondary
  },
  viewModeTextActive: {
    color: '#FFF'
  },

  filterSelector: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: palette.background
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginRight: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.divider,
    backgroundColor: 'transparent'
  },
  filterChipActive: {
    backgroundColor: palette.surfaceElevated,
    borderColor: palette.primary
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: palette.textSecondary
  },
  filterChipTextActive: {
    color: palette.primary
  },

  storiesContainer: { 
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: palette.background,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.divider
  },
  storyItem: { 
    alignItems: 'center',
    width: 72
  },
  storyRing: { 
    width: 72, 
    height: 72, 
    borderRadius: 36,
    padding: 2,
    borderWidth: 2.5,
    borderColor: palette.primary,
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative' as const
  },
  storyViewed: {
    borderColor: palette.divider,
    opacity: 0.6
  },
  storyImage: { 
    width: 65, 
    height: 65, 
    borderRadius: 32.5,
    backgroundColor: palette.surfaceElevated
  },
  addStoryIcon: {
    position: 'absolute' as const,
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.background
  },
  storyName: { 
    fontSize: 11, 
    color: palette.textSecondary,
    marginTop: 6,
    fontWeight: '600' as const,
    textAlign: 'center' as const
  },

  challengesSection: {
    paddingVertical: spacing.lg,
    backgroundColor: palette.background,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.divider
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md
  },
  challengesList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md
  },
  challengeCard: {
    width: 280,
    height: 180,
    borderRadius: radii.lg,
    overflow: 'hidden' as const,
    position: 'relative' as const,
    ...shadow.elevated
  },
  challengeImage: {
    width: '100%',
    height: '100%',
    position: 'absolute' as const
  },
  challengeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)'
  },
  challengeContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between'
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  challengeBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  challengeIcon: {
    fontSize: 20
  },
  participatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(16, 185, 129, 0.9)'
  },
  participatingText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFF'
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFF',
    lineHeight: 22
  },
  challengeDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18
  },
  challengeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  challengeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  challengeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  challengeStatText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFF'
  },
  joinChallengeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: '#FFF'
  },
  joinChallengeBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#000'
  },

  feed: { 
    gap: spacing.xs 
  },
  postCard: {
    backgroundColor: palette.background,
    marginBottom: spacing.xs
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: palette.surfaceElevated,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.divider
  },
  pinnedText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: palette.primary
  },
  postHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 54
  },
  postUserInfo: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1
  },
  avatarContainer: {
    position: 'relative' as const
  },
  postAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20,
    backgroundColor: palette.surfaceElevated
  },
  verifiedBadge: {
    position: 'absolute' as const,
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  authorInfo: {
    flex: 1
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  postUserName: { 
    fontSize: 15, 
    fontWeight: '700' as const,
    color: palette.textPrimary 
  },
  glowScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.primary
  },
  glowScoreText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: palette.primary
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2
  },
  postLocation: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '500' as const
  },
  moreBtn: {
    padding: spacing.xs
  },

  postImage: { 
    width: screenWidth, 
    height: screenWidth,
    backgroundColor: palette.surfaceElevated 
  },
  typeIndicator: {
    position: 'absolute' as const,
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6
  },
  typeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5
  },
  durationBadge: {
    position: 'absolute' as const,
    bottom: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6
  },
  durationText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700' as const
  },
  likeOverlay: { 
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center', 
    justifyContent: 'center'
  },

  actionsRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    height: 48
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  actionBtn: {
    padding: spacing.xs
  },

  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs
  },
  reactionIcons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  reactionIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: palette.background
  },
  reactionsText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: palette.textPrimary,
    marginLeft: 4
  },

  captionRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs
  },
  captionText: {
    fontSize: 14,
    color: palette.textPrimary,
    lineHeight: 18
  },
  captionUsername: {
    fontWeight: '700' as const
  },

  hashtagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap' as const,
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs
  },
  hashtag: {
    fontSize: 14,
    color: palette.primary,
    fontWeight: '600' as const
  },

  commentsPreview: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs
  },
  viewCommentsText: {
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '500' as const
  },

  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md
  },
  postTime: {
    fontSize: 11,
    color: palette.textMuted,
    textTransform: 'uppercase' as const
  },
  savesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  savesText: {
    fontSize: 11,
    color: palette.textMuted,
    fontWeight: '600' as const
  },

  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyState: {
    padding: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    marginTop: spacing.md
  },
  emptyText: {
    fontSize: 14,
    color: palette.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center' as const
  },

  modalContainer: {
    flex: 1,
    backgroundColor: palette.background
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.divider
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: palette.textPrimary
  },

  circleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.divider
  },
  circleImage: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceElevated
  },
  circleInfo: {
    flex: 1
  },
  circleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  circleName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: palette.textPrimary
  },
  circleDescription: {
    fontSize: 13,
    color: palette.textSecondary,
    marginTop: 2
  },
  circleStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4
  },
  circleStatsText: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '500' as const
  },
  joinCircleBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: palette.primary
  },
  joinCircleBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFF'
  },
});
