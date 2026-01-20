import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Users,
  Gift,
  Clock,
  Flame,
  Send,
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  X,
  Camera,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Award,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useCommunity } from '@/contexts/CommunityContext';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { getPalette, shadow, spacing, radii } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import type { Post, ReactionType } from '@/types/community';
import * as ImagePicker from 'expo-image-picker';

const { width: screenWidth } = Dimensions.get('window');

const formatTimeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

export default function ChallengeDetailScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const params = useLocalSearchParams<{ challengeId: string }>();
  const { user } = useUser();
  const { user: authUser } = useAuth();
  
  const {
    challenges,
    posts,
    createPost,
    reactToPost,
    userChallenges,
    joinChallenge,
    getUserChallenges,
  } = useCommunity();

  const [refreshing, setRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postCaption, setPostCaption] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const challengeId = params.challengeId;
  const challenge = useMemo(() => challenges.find(c => c.id === challengeId), [challenges, challengeId]);
  
  const userChallengeData = useMemo(() => {
    const userId = user?.id || authUser?.id || 'guest';
    return userChallenges.find(uc => uc.userId === userId && uc.challengeId === challengeId);
  }, [userChallenges, challengeId, user?.id, authUser?.id]);

  // Get user's streak and stats for this challenge
  const challengeStreak = useMemo(() => {
    return user?.stats?.challengeStreak || 0;
  }, [user?.stats?.challengeStreak]);

  const lastChallengePostDate = useMemo(() => {
    return user?.stats?.lastChallengePostDate;
  }, [user?.stats?.lastChallengePostDate]);

  // Calculate if streak is active (posted today or yesterday)
  const isStreakActive = useMemo(() => {
    if (!lastChallengePostDate) return false;
    const today = new Date().toDateString();
    const lastPost = new Date(lastChallengePostDate).toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    return lastPost === today || lastPost === yesterdayStr;
  }, [lastChallengePostDate]);

  // Get all posts for this challenge
  const challengePosts = useMemo(() => {
    return Object.values(posts)
      .flat()
      .filter(post => post.challengeId === challengeId && !post.isRemoved)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, challengeId]);

  const isParticipating = !!userChallengeData;
  const timeRemaining = challenge ? challenge.endsAt - Date.now() : 0;
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

  const handleJoin = useCallback(async () => {
    if (challengeId) {
      await joinChallenge(challengeId);
      Alert.alert('Joined!', `You've joined ${challenge?.title}. Start posting to earn ${challenge?.reward.points} points!`);
    }
  }, [challengeId, challenge, joinChallenge]);

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      setPostImage(result.assets[0].uri);
    }
  }, []);

  const handleCreatePost = useCallback(async () => {
    if (!postCaption.trim() && !postImage) {
      Alert.alert('Empty Post', 'Please add a caption or image to create a post.');
      return;
    }

    if (!isParticipating) {
      Alert.alert('Join First', 'Please join the challenge before posting.');
      return;
    }

    setIsPosting(true);
    try {
      await createPost({
        circleId: 'global', // Use global circle for challenges
        caption: postCaption,
        imageUrl: postImage,
        challengeId: challengeId,
      });
      
      setPostCaption('');
      setPostImage(null);
      setShowCreatePost(false);
      
      Alert.alert(
        'Posted! 🎉',
        `You earned ${challenge?.reward.points} points for posting to this challenge!`
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  }, [postCaption, postImage, isParticipating, challengeId, challenge, createPost]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Refresh logic would go here
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (!challenge) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Challenge not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.primary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Challenge Header */}
        <View style={styles.challengeHeader}>
          <Image source={{ uri: challenge.image }} style={styles.challengeHeaderImage} />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
            style={styles.challengeHeaderOverlay}
          />
          
          {/* Transparent Header Overlay */}
          <View style={styles.headerOverlay}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButtonOverlay}>
              <View style={styles.backButtonBackground}>
                <ArrowLeft color="#FFF" size={22} />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitleOverlay}>Challenge</Text>
            <View style={styles.headerRightOverlay} />
          </View>
          
          <View style={styles.challengeHeaderContent}>
            {/* Top Section */}
            <View style={styles.challengeHeaderTopSection}>
              <View style={styles.challengeHeaderTop}>
                <View style={styles.challengeHeaderBadge}>
                  <Text style={styles.challengeHeaderIcon}>{challenge.icon}</Text>
                </View>
                <View style={styles.challengeTypeBadge}>
                  <Sparkles size={12} color="#FFD700" />
                  <Text style={styles.challengeTypeText}>CHALLENGE</Text>
                </View>
              </View>
              
              <Text style={styles.challengeHeaderTitle}>{challenge.title}</Text>
              <Text style={styles.challengeHeaderDescription}>{challenge.description}</Text>
            </View>
            
            {/* Bottom Section - Stats and Actions */}
            <View style={styles.challengeHeaderBottomSection}>
              <View style={styles.challengeHeaderStats}>
              <View style={styles.challengeHeaderStatCard}>
                <View style={styles.challengeHeaderStatIconContainer}>
                  <Users size={18} color="#60A5FA" />
                </View>
                <View style={styles.challengeHeaderStatContent}>
                  <Text style={styles.challengeHeaderStatNumber}>
                    {challenge.participants.toLocaleString()}
                  </Text>
                  <Text style={styles.challengeHeaderStatLabel}>participants</Text>
                </View>
              </View>
              <View style={styles.challengeHeaderStatCard}>
                <View style={[styles.challengeHeaderStatIconContainer, { backgroundColor: 'rgba(255, 215, 0, 0.2)' }]}>
                  <Gift size={18} color="#FFD700" />
                </View>
                <View style={styles.challengeHeaderStatContent}>
                  <Text style={styles.challengeHeaderStatNumber}>
                    {challenge.reward.points}
                  </Text>
                  <Text style={styles.challengeHeaderStatLabel}>points</Text>
                </View>
              </View>
              <View style={styles.challengeHeaderStatCard}>
                <View style={[styles.challengeHeaderStatIconContainer, { backgroundColor: 'rgba(255, 107, 53, 0.2)' }]}>
                  <Clock size={18} color="#FF6B35" />
                </View>
                <View style={styles.challengeHeaderStatContent}>
                  <Text style={styles.challengeHeaderStatNumber}>
                    {daysRemaining}
                  </Text>
                  <Text style={styles.challengeHeaderStatLabel}>days left</Text>
                </View>
              </View>
            </View>

            {!isParticipating ? (
              <TouchableOpacity style={styles.joinButton} onPress={handleJoin} activeOpacity={0.8}>
                <LinearGradient
                  colors={[palette.primary, palette.primary + 'DD']}
                  style={styles.joinButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Sparkles size={16} color="#FFF" />
                  <Text style={styles.joinButtonText}>Join Challenge</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <>
                {/* Streak Display */}
                <View style={styles.streakContainer}>
                  <View style={styles.streakCard}>
                    <LinearGradient
                      colors={isStreakActive ? ['#FF6B35', '#FF8C42'] : ['rgba(255, 107, 53, 0.1)', 'rgba(255, 140, 66, 0.1)']}
                      style={styles.streakCardGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.streakIconContainer}>
                        <Flame 
                          size={28} 
                          color={isStreakActive ? '#FFF' : '#FF6B35'} 
                          fill={isStreakActive ? '#FFF' : 'none'} 
                        />
                      </View>
                      <View style={styles.streakInfo}>
                        <Text style={styles.streakLabel}>Your Streak</Text>
                        <Text style={[styles.streakNumber, isStreakActive && styles.streakNumberActive]}>
                          {challengeStreak} {challengeStreak === 1 ? 'day' : 'days'}
                        </Text>
                        {isStreakActive ? (
                          <Text style={styles.streakStatus}>Keep it going! 🔥</Text>
                        ) : challengeStreak > 0 ? (
                          <Text style={styles.streakStatusWarning}>Post today to keep your streak!</Text>
                        ) : (
                          <Text style={styles.streakStatusNew}>Start your streak today!</Text>
                        )}
                      </View>
                    </LinearGradient>
                  </View>
                  
                  <View style={styles.pointsCard}>
                    <LinearGradient
                      colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.25)']}
                      style={styles.pointsCardGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.pointsIconContainer}>
                        <Gift size={24} color="#FFD700" fill="#FFD700" />
                      </View>
                      <View style={styles.pointsInfo}>
                        <Text style={styles.pointsLabel}>Total Points</Text>
                        <Text style={styles.pointsNumber}>
                          {user?.stats?.totalPoints || 0}
                        </Text>
                        <Text style={styles.pointsSubtext}>Earned in challenges</Text>
                      </View>
                    </LinearGradient>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.postButton} 
                  onPress={() => setShowCreatePost(true)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#FFFFFF', '#F9FAFB']}
                    style={styles.postButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Camera size={18} color={palette.primary} />
                    <Text style={styles.postButtonText}>Share & Earn {challenge.reward.points} pts</Text>
                    <TrendingUp size={16} color={palette.primary} />
                  </LinearGradient>
                </TouchableOpacity>
              </>
              )}
            </View>
          </View>
        </View>

        {/* Posts Feed */}
        <View style={styles.postsSection}>
          <View style={styles.postsSectionHeader}>
            <Text style={styles.postsSectionTitle}>
              Recent Posts ({challengePosts.length})
            </Text>
            {isParticipating && challengePosts.length > 0 && (
              <TouchableOpacity 
                style={styles.quickPostButton}
                onPress={() => setShowCreatePost(true)}
                activeOpacity={0.7}
              >
                <Camera size={18} color={palette.primary} />
                <Text style={styles.quickPostButtonText}>Post</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {challengePosts.length === 0 ? (
            <View style={styles.emptyState}>
              <Camera color={palette.textMuted} size={48} />
              <Text style={styles.emptyStateText}>No posts yet</Text>
              <Text style={styles.emptyStateSubtext}>
                {isParticipating 
                  ? `Be the first to post and earn ${challenge.reward.points} points! Start your streak today! 🔥`
                  : 'Join the challenge to start posting and earn points!'}
              </Text>
              {isParticipating && (
                <TouchableOpacity 
                  style={styles.emptyStatePostButton}
                  onPress={() => setShowCreatePost(true)}
                >
                  <Camera size={20} color={palette.textLight} />
                  <Text style={styles.emptyStatePostButtonText}>Post Now & Earn {challenge.reward.points} pts</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            challengePosts.map(post => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Image source={{ uri: post.author.avatar }} style={styles.postAvatar} />
                  <View style={styles.postAuthorInfo}>
                    <Text style={styles.postAuthorName}>{post.author.name}</Text>
                    <Text style={styles.postTime}>{formatTimeAgo(post.createdAt)}</Text>
                  </View>
                  <View style={styles.postEarnedBadge}>
                    <Gift size={14} color="#FFD700" />
                    <Text style={styles.postEarnedText}>+{challenge.reward.points}pts</Text>
                  </View>
                </View>
                
                {post.caption && (
                  <Text style={styles.postCaption}>{post.caption}</Text>
                )}
                
                {post.imageUrl && (
                  <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
                )}
                
                <View style={styles.postFooter}>
                  <TouchableOpacity style={styles.postAction}>
                    <Heart size={18} color={palette.textSecondary} />
                    <Text style={styles.postActionText}>
                      {Object.values(post.reactions || {}).flat().length}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.postAction}>
                    <MessageCircle size={18} color={palette.textSecondary} />
                    <Text style={styles.postActionText}>{post.comments.length}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {isParticipating && !showCreatePost && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreatePost(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[palette.primary, palette.primary + 'CC']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Camera size={24} color={palette.textLight} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowCreatePost(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Share to Challenge</Text>
                <Text style={styles.modalSubtitle}>
                  Earn {challenge.reward.points} points + build your streak! 🔥
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCreatePost(false)}
              >
                <X size={24} color={palette.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Instructions */}
              <View style={styles.postInstructions}>
                <Text style={styles.postInstructionsTitle}>💡 What to share:</Text>
                <Text style={styles.postInstructionsText}>
                  • Your morning routine{'\n'}
                  • Before & after photos{'\n'}
                  • Skincare products you're using{'\n'}
                  • Tips and tricks{'\n'}
                  • Progress updates
                </Text>
              </View>
              
              {postImage && (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: postImage }} style={styles.imagePreviewImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => setPostImage(null)}
                  >
                    <X size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}
              
              <Text style={styles.modalLabel}>What's your update?</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Share your morning routine, tips, or progress..."
                placeholderTextColor={palette.textMuted}
                value={postCaption}
                onChangeText={setPostCaption}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              
              <TouchableOpacity 
                style={[styles.imageButton, postImage && styles.imageButtonActive]} 
                onPress={handlePickImage}
              >
                <Camera size={20} color={postImage ? palette.textLight : palette.primary} />
                <Text style={[styles.imageButtonText, postImage && styles.imageButtonTextActive]}>
                  {postImage ? 'Change Photo' : 'Add Photo'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitButton, (isPosting || (!postCaption.trim() && !postImage)) && styles.submitButtonDisabled]}
                onPress={handleCreatePost}
                disabled={isPosting || (!postCaption.trim() && !postImage)}
              >
                {isPosting ? (
                  <ActivityIndicator color={palette.textLight} />
                ) : (
                  <>
                    <Send size={18} color={palette.textLight} />
                    <Text style={styles.submitButtonText}>
                      Post & Earn {challenge.reward.points} pts
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  challengeHeader: {
    minHeight: 420,
    height: 420,
    position: 'relative',
    marginBottom: 0,
  },
  challengeHeaderImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  challengeHeaderOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    zIndex: 10,
  },
  backButtonOverlay: {
    padding: spacing.xs,
  },
  backButtonBackground: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  headerTitleOverlay: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerRightOverlay: {
    width: 32,
  },
  challengeHeaderContent: {
    ...StyleSheet.absoluteFillObject,
    padding: spacing.md,
    paddingTop: 60,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  challengeHeaderTopSection: {
    flex: 0,
    justifyContent: 'flex-start',
    paddingBottom: spacing.md,
    minHeight: 140,
  },
  challengeHeaderBottomSection: {
    flex: 0,
    justifyContent: 'flex-end',
    gap: spacing.sm,
    minHeight: 200,
    paddingTop: spacing.md,
  },
  challengeHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  challengeHeaderBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  challengeHeaderIcon: {
    fontSize: 24,
  },
  challengeTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  challengeTypeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  challengeHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
    lineHeight: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  challengeHeaderDescription: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: spacing.sm,
    marginTop: 0,
    opacity: 0.9,
    lineHeight: 20,
    paddingRight: spacing.xs,
  },
  challengeHeaderStats: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginTop: 0,
  },
  challengeHeaderStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radii.md,
    padding: spacing.xs,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  challengeHeaderStatIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  challengeHeaderStatContent: {
    alignItems: 'center',
  },
  challengeHeaderStatNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 2,
  },
  challengeHeaderStatLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  challengeHeaderStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  challengeHeaderStatText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  joinButton: {
    borderRadius: radii.lg,
    marginTop: spacing.xs,
    overflow: 'hidden',
    ...shadow.card,
  },
  joinButtonGradient: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  joinButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  postButton: {
    borderRadius: radii.lg,
    marginTop: spacing.sm,
    overflow: 'hidden',
    ...shadow.card,
    borderWidth: 2,
    borderColor: palette.primary,
  },
  postButtonGradient: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  postButtonText: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  streakContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 0,
  },
  streakCard: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadow.card,
    minHeight: 100,
  },
  streakCardGradient: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 100,
  },
  streakIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    flexShrink: 0,
  },
  streakInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  streakNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FF6B35',
    marginBottom: 2,
    lineHeight: 26,
  },
  streakNumberActive: {
    color: '#FFF',
  },
  streakStatus: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  streakStatusWarning: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFD700',
    marginTop: 2,
  },
  streakStatusNew: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  pointsCard: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadow.card,
    minHeight: 100,
  },
  pointsCardGradient: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 100,
  },
  pointsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    flexShrink: 0,
  },
  pointsInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  pointsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pointsNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFD700',
    marginBottom: 2,
    lineHeight: 26,
  },
  pointsSubtext: {
    fontSize: 10,
    fontWeight: '500',
    color: palette.textSecondary,
    marginTop: 2,
  },
  postsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
    backgroundColor: palette.backgroundStart,
    marginTop: 0,
  },
  postsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  postsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  quickPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.backgroundStart,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  quickPostButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyStateText: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  postCard: {
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.elevated,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  postTime: {
    fontSize: 12,
    color: palette.textSecondary,
    marginTop: 2,
  },
  postEarnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: '#FFD700',
  },
  postEarnedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.3,
  },
  postCaption: {
    fontSize: 15,
    color: palette.textPrimary,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    resizeMode: 'cover',
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  postActionText: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  postPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: 'auto',
    backgroundColor: palette.backgroundStart,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  postPointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '90%',
    zIndex: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: palette.textSecondary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  postInstructions: {
    backgroundColor: palette.backgroundStart,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.primary,
    borderStyle: 'dashed',
  },
  postInstructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.primary,
    marginBottom: spacing.xs,
  },
  postInstructionsText: {
    fontSize: 13,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  modalBody: {
    padding: spacing.lg,
    maxHeight: 400,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  imagePreviewImage: {
    width: '100%',
    height: 200,
    borderRadius: radii.md,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: spacing.xs,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: spacing.sm,
  },
  modalInput: {
    backgroundColor: palette.backgroundStart,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 16,
    color: palette.textPrimary,
    minHeight: 100,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: palette.primary,
    borderRadius: radii.md,
    borderStyle: 'dashed',
    marginTop: spacing.sm,
  },
  imageButtonActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
    borderStyle: 'solid',
  },
  imageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primary,
  },
  imageButtonTextActive: {
    color: palette.textLight,
  },
  emptyStatePostButton: {
    backgroundColor: palette.primary,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    ...shadow.elevated,
    borderWidth: 2,
    borderColor: palette.primary,
  },
  emptyStatePostButtonText: {
    color: palette.textLight,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.elevated,
    elevation: 8,
    zIndex: 100,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.borderLight,
  },
  submitButton: {
    backgroundColor: palette.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: palette.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    ...shadow.elevated,
    elevation: 12,
    zIndex: 1000,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

