import { useCallback, useEffect, useMemo, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Circle, Comment, CreateCircleInput, CreatePostInput, Post, ReactionType, UserMembership, Challenge, UserChallenge, Story, Leaderboard } from '@/types/community';
import { useUser } from '@/contexts/UserContext';

const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Community storage getItem error:', error);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        try {
          localStorage.setItem(key, value);
        } catch {
          console.warn('LocalStorage quota exceeded. Trimming community history.');
          const parsed = JSON.parse(value ?? '[]');
          if (Array.isArray(parsed) && parsed.length > 50) {
            localStorage.setItem(key, JSON.stringify(parsed.slice(-50)));
            return;
          }
        }
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Community storage setItem error:', error);
    }
  },
};

const CIRCLES_KEY = 'glow_community_circles_v1';
const POSTS_KEY = 'glow_community_posts_v1';
const MEMBERSHIPS_KEY = 'glow_community_memberships_v1';
const CHALLENGES_KEY = 'glow_community_challenges_v1';
const USER_CHALLENGES_KEY = 'glow_community_user_challenges_v1';
const STORIES_KEY = 'glow_community_stories_v1';
const LEADERBOARD_KEY = 'glow_community_leaderboard_v1';

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export const [CommunityProvider, useCommunity] = createContextHook(() => {
  const { user } = useUser();

  const [circles, setCircles] = useState<Circle[]>([]);
  const [posts, setPosts] = useState<Record<string, Post[]>>({});
  const [memberships, setMemberships] = useState<UserMembership[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [rawCircles, rawPosts, rawMemberships, rawChallenges, rawUserChallenges, rawStories, rawLeaderboard] = await Promise.all([
        storage.getItem(CIRCLES_KEY),
        storage.getItem(POSTS_KEY),
        storage.getItem(MEMBERSHIPS_KEY),
        storage.getItem(CHALLENGES_KEY),
        storage.getItem(USER_CHALLENGES_KEY),
        storage.getItem(STORIES_KEY),
        storage.getItem(LEADERBOARD_KEY),
      ]);

      let nextCircles: Circle[] = createDefaultCircles();
      let nextPosts: Record<string, Post[]> = {};
      let nextMemberships: UserMembership[] = [];
      let nextChallenges: Challenge[] = createDefaultChallenges();
      let nextUserChallenges: UserChallenge[] = [];
      let nextStories: Story[] = [];
      let nextLeaderboard: Leaderboard[] = createDefaultLeaderboard();
      
      // Parse circles with error handling
      if (rawCircles) {
        try {
          const parsed = JSON.parse(rawCircles);
          nextCircles = Array.isArray(parsed) ? parsed : createDefaultCircles();
        } catch (parseError) {
          console.error('Error parsing circles data:', parseError);
          await storage.setItem(CIRCLES_KEY, JSON.stringify(createDefaultCircles()));
          nextCircles = createDefaultCircles();
        }
      }
      
      // Parse posts with error handling
      if (rawPosts) {
        try {
          const parsed = JSON.parse(rawPosts);
          nextPosts = typeof parsed === 'object' && parsed !== null ? parsed : createDefaultPosts(nextCircles);
        } catch (parseError) {
          console.error('Error parsing posts data:', parseError);
          nextPosts = createDefaultPosts(nextCircles);
          await storage.setItem(POSTS_KEY, JSON.stringify(nextPosts));
        }
      } else {
        nextPosts = createDefaultPosts(nextCircles);
      }
      
      // Parse memberships with error handling
      if (rawMemberships) {
        try {
          const parsed = JSON.parse(rawMemberships);
          nextMemberships = Array.isArray(parsed) ? parsed : [];
        } catch (parseError) {
          console.error('Error parsing memberships data:', parseError);
          await storage.setItem(MEMBERSHIPS_KEY, JSON.stringify([]));
          nextMemberships = [];
        }
      }

      if (rawChallenges) {
        try {
          const parsed = JSON.parse(rawChallenges);
          nextChallenges = Array.isArray(parsed) ? parsed : createDefaultChallenges();
        } catch {
          nextChallenges = createDefaultChallenges();
        }
      }
      
      if (rawUserChallenges) {
        try {
          const parsed = JSON.parse(rawUserChallenges);
          nextUserChallenges = Array.isArray(parsed) ? parsed : [];
        } catch {
          nextUserChallenges = [];
        }
      }
      
      if (rawStories) {
        try {
          const parsed = JSON.parse(rawStories);
          nextStories = Array.isArray(parsed) ? parsed : [];
        } catch {
          nextStories = [];
        }
      }
      
      if (rawLeaderboard) {
        try {
          const parsed = JSON.parse(rawLeaderboard);
          nextLeaderboard = Array.isArray(parsed) ? parsed : createDefaultLeaderboard();
        } catch {
          nextLeaderboard = createDefaultLeaderboard();
        }
      }

      setCircles(nextCircles);
      setPosts(nextPosts);
      setMemberships(nextMemberships);
      setChallenges(nextChallenges);
      setUserChallenges(nextUserChallenges);
      setStories(nextStories);
      setLeaderboard(nextLeaderboard);
      setError(null);
    } catch (e) {
      console.error('Failed to load community data', e);
      setError('Failed to load community data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const persist = useCallback(async (
    next: Partial<{ 
      circles: Circle[]; 
      posts: Record<string, Post[]>; 
      memberships: UserMembership[];
      challenges: Challenge[];
      userChallenges: UserChallenge[];
      stories: Story[];
      leaderboard: Leaderboard[];
    }>
  ) => {
    try {
      if (next.circles) await storage.setItem(CIRCLES_KEY, JSON.stringify(next.circles));
      if (next.posts) await storage.setItem(POSTS_KEY, JSON.stringify(next.posts));
      if (next.memberships) await storage.setItem(MEMBERSHIPS_KEY, JSON.stringify(next.memberships));
      if (next.challenges) await storage.setItem(CHALLENGES_KEY, JSON.stringify(next.challenges));
      if (next.userChallenges) await storage.setItem(USER_CHALLENGES_KEY, JSON.stringify(next.userChallenges));
      if (next.stories) await storage.setItem(STORIES_KEY, JSON.stringify(next.stories));
      if (next.leaderboard) await storage.setItem(LEADERBOARD_KEY, JSON.stringify(next.leaderboard));
    } catch (e) {
      console.error('Failed to persist community data', e);
    }
  }, []);

  const createCircle = useCallback(async (input: CreateCircleInput) => {
    const ownerId = user?.id ?? 'guest';
    const newCircle: Circle = {
      id: generateId('circle'),
      name: input.name,
      description: input.description ?? '',
      coverImage: input.coverImage ?? 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1200',
      creatorId: ownerId,
      memberCount: 1,
      createdAt: Date.now(),
      isPrivate: input.isPrivate ?? false,
      tags: input.tags ?? [],
      locationName: input.locationName ?? null,
    };

    const nextCircles = [newCircle, ...circles];
    setCircles(nextCircles);

    const nextMemberships: UserMembership[] = [
      ...memberships,
      { userId: ownerId, circleId: newCircle.id, role: 'owner', joinedAt: Date.now() } as UserMembership,
    ];
    setMemberships(nextMemberships);

    const nextPosts = { ...posts, [newCircle.id]: [] };
    setPosts(nextPosts);

    await persist({ circles: nextCircles, memberships: nextMemberships as UserMembership[], posts: nextPosts });
    return newCircle;
  }, [circles, memberships, posts, persist, user?.id]);

  const joinCircle = useCallback(async (circleId: string) => {
    const userId = user?.id ?? 'guest';
    if (memberships.some(m => m.userId === userId && m.circleId === circleId)) return;
    const nextMemberships: UserMembership[] = [...memberships, { userId, circleId, role: 'member', joinedAt: Date.now() } as UserMembership];
    setMemberships(nextMemberships);
    const nextCircles = circles.map(c => (c.id === circleId ? { ...c, memberCount: c.memberCount + 1 } : c));
    setCircles(nextCircles);
    await persist({ memberships: nextMemberships as UserMembership[], circles: nextCircles });
  }, [memberships, user?.id, circles, persist]);

  const leaveCircle = useCallback(async (circleId: string) => {
    const userId = user?.id ?? 'guest';
    const nextMemberships: UserMembership[] = memberships.filter(m => !(m.userId === userId && m.circleId === circleId));
    setMemberships(nextMemberships);
    const nextCircles = circles.map(c => (c.id === circleId ? { ...c, memberCount: Math.max(0, c.memberCount - 1) } : c));
    setCircles(nextCircles);
    await persist({ memberships: nextMemberships as UserMembership[], circles: nextCircles });
  }, [memberships, user?.id, circles, persist]);

  const createPost = useCallback(async (input: CreatePostInput) => {
    const author = {
      id: user?.id ?? 'guest',
      name: user?.name ?? 'Guest',
      avatar: user?.avatar ?? 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      isVerified: false,
      glowScore: 85,
    };
    const p: Post = {
      id: generateId('post'),
      circleId: input.circleId,
      author,
      caption: input.caption,
      imageUrl: input.imageUrl ?? null,
      images: input.images,
      locationName: input.locationName ?? null,
      coords: input.coords ?? null,
      createdAt: Date.now(),
      reactions: {},
      comments: [],
      hashtags: input.hashtags,
      isBeforeAfter: input.isBeforeAfter,
      beforeImage: input.beforeImage,
      afterImage: input.afterImage,
      products: input.products,
      tips: input.tips,
      duration: input.duration,
      saves: 0,
      shareCount: 0,
      viewCount: 0,
      challengeId: input.challengeId,
    };
    const circlePosts = posts[input.circleId] ?? [];
    const nextPosts = { ...posts, [input.circleId]: [p, ...circlePosts].slice(0, 200) };
    setPosts(nextPosts);
    await persist({ posts: nextPosts });
    return p;
  }, [user, posts, persist]);

  const reactToPost = useCallback(async (circleId: string, postId: string, type: ReactionType) => {
    const userId = user?.id ?? 'guest';
    const nextPosts = { ...posts };
    const list = nextPosts[circleId] ?? [];
    const idx = list.findIndex(p => p.id === postId);
    if (idx === -1) return;
    const target = list[idx];
    const userExisting = Object.entries(target.reactions).find(([t, users]) => users.includes(userId));
    if (userExisting) {
      const [prevType] = userExisting as [ReactionType, string[]];
      if (prevType === type) {
        nextPosts[circleId][idx] = {
          ...target,
          reactions: { ...target.reactions, [type]: (target.reactions[type] ?? []).filter(id => id !== userId) },
        };
      } else {
        nextPosts[circleId][idx] = {
          ...target,
          reactions: {
            ...target.reactions,
            [prevType]: (target.reactions[prevType] ?? []).filter(id => id !== userId),
            [type]: [...(target.reactions[type] ?? []), userId],
          },
        };
      }
    } else {
      nextPosts[circleId][idx] = {
        ...target,
        reactions: { ...target.reactions, [type]: [...(target.reactions[type] ?? []), userId] },
      };
    }
    setPosts(nextPosts);
    await persist({ posts: nextPosts });
  }, [posts, user?.id, persist]);

  const addComment = useCallback(async (circleId: string, postId: string, text: string) => {
    const author = {
      id: user?.id ?? 'guest',
      name: user?.name ?? 'Guest',
      avatar: user?.avatar ?? 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    };
    const comment: Comment = {
      id: generateId('cmt'),
      text,
      author,
      createdAt: Date.now(),
    };
    const nextPosts = { ...posts };
    nextPosts[circleId] = (nextPosts[circleId] ?? []).map(p => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p));
    setPosts(nextPosts);
    await persist({ posts: nextPosts });
    return comment;
  }, [posts, user, persist]);

  const getCircleById = useCallback((id: string) => circles.find(c => c.id === id) ?? null, [circles]);
  const getPostsForCircle = useCallback((id: string) => posts[id] ?? [], [posts]);
  const getUserMembership = useCallback((circleId: string) => {
    const userId = user?.id ?? 'guest';
    return memberships.find(m => m.userId === userId && m.circleId === circleId) ?? null;
  }, [memberships, user?.id]);

  const joinChallenge = useCallback(async (challengeId: string) => {
    const userId = user?.id ?? 'guest';
    if (userChallenges.some(uc => uc.userId === userId && uc.challengeId === challengeId)) return;
    const nextUserChallenges: UserChallenge[] = [...userChallenges, {
      userId,
      challengeId,
      status: 'participating' as const,
      progress: 0,
    }];
    setUserChallenges(nextUserChallenges);
    const nextChallenges = challenges.map(c => c.id === challengeId ? { ...c, participants: c.participants + 1 } : c);
    setChallenges(nextChallenges);
    await persist({ userChallenges: nextUserChallenges, challenges: nextChallenges });
  }, [userChallenges, challenges, user?.id, persist]);

  const completeChallenge = useCallback(async (challengeId: string, postId?: string) => {
    const userId = user?.id ?? 'guest';
    const nextUserChallenges = userChallenges.map(uc => 
      uc.userId === userId && uc.challengeId === challengeId
        ? { ...uc, status: 'completed' as const, progress: 100, completedAt: Date.now(), postId }
        : uc
    );
    setUserChallenges(nextUserChallenges);
    
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge) {
      const nextLeaderboard = leaderboard.map(l => 
        l.userId === userId
          ? { ...l, points: l.points + challenge.reward.points, challengesCompleted: l.challengesCompleted + 1 }
          : l
      );
      setLeaderboard(nextLeaderboard);
      await persist({ userChallenges: nextUserChallenges, leaderboard: nextLeaderboard });
    } else {
      await persist({ userChallenges: nextUserChallenges });
    }
  }, [userChallenges, challenges, leaderboard, user?.id, persist]);

  const createStory = useCallback(async (mediaUrl: string, mediaType: 'image' | 'video') => {
    const userId = user?.id ?? 'guest';
    const story: Story = {
      id: generateId('story'),
      userId,
      userName: user?.name ?? 'Guest',
      userAvatar: user?.avatar ?? 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      mediaUrl,
      mediaType,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      views: [],
    };
    const nextStories = [story, ...stories.filter(s => s.expiresAt > Date.now())].slice(0, 100);
    setStories(nextStories);
    await persist({ stories: nextStories });
    return story;
  }, [user, stories, persist]);

  const viewStory = useCallback(async (storyId: string) => {
    const userId = user?.id ?? 'guest';
    const nextStories = stories.map(s => 
      s.id === storyId && !s.views.includes(userId)
        ? { ...s, views: [...s.views, userId] }
        : s
    );
    setStories(nextStories);
    await persist({ stories: nextStories });
  }, [stories, user?.id, persist]);

  const getUserChallenges = useCallback(() => {
    const userId = user?.id ?? 'guest';
    return userChallenges.filter(uc => uc.userId === userId);
  }, [userChallenges, user?.id]);

  const getTrendingPosts = useCallback(() => {
    const allPosts = Object.values(posts).flat();
    return allPosts
      .sort((a, b) => {
        const aScore = Object.values(a.reactions).reduce((sum, arr) => sum + arr.length, 0);
        const bScore = Object.values(b.reactions).reduce((sum, arr) => sum + arr.length, 0);
        return bScore - aScore;
      })
      .slice(0, 20);
  }, [posts]);

  return useMemo(() => ({
    isLoading,
    error,
    circles,
    posts,
    memberships,
    challenges,
    userChallenges,
    stories,
    leaderboard,
    createCircle,
    joinCircle,
    leaveCircle,
    createPost,
    reactToPost,
    addComment,
    getCircleById,
    getPostsForCircle,
    getUserMembership,
    joinChallenge,
    completeChallenge,
    createStory,
    viewStory,
    getUserChallenges,
    getTrendingPosts,
  }), [
    isLoading,
    error,
    circles,
    posts,
    memberships,
    challenges,
    userChallenges,
    stories,
    leaderboard,
    createCircle,
    joinCircle,
    leaveCircle,
    createPost,
    reactToPost,
    addComment,
    getCircleById,
    getPostsForCircle,
    getUserMembership,
    joinChallenge,
    completeChallenge,
    createStory,
    viewStory,
    getUserChallenges,
    getTrendingPosts,
  ]);
});

function createDefaultCircles(): Circle[] {
  return [
    {
      id: 'global',
      name: 'Global Glow',
      description: 'Share your glow with everyone',
      coverImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200',
      creatorId: 'system',
      memberCount: 2400,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
      isPrivate: false,
      tags: ['inspiration', 'daily'],
      locationName: null,
    },
    {
      id: 'city-style',
      name: 'City Style',
      description: 'Urban routines and tips',
      coverImage: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1200',
      creatorId: 'system',
      memberCount: 847,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
      isPrivate: false,
      tags: ['style', 'routine'],
      locationName: null,
    },
  ];
}

function createDefaultPosts(cs: Circle[]): Record<string, Post[]> {
  const byCircle: Record<string, Post[]> = {};
  cs.forEach(c => (byCircle[c.id] = []));
  byCircle['global'] = [
    {
      id: generateId('post'),
      circleId: 'global',
      author: {
        id: 'isabella',
        name: 'Isabella Rose',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        isVerified: true,
        glowScore: 95,
      },
      caption: 'My morning glow routine is everything ✨ Loving how my skin looks!',
      imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
      locationName: 'Beverly Hills, CA',
      coords: null,
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
      reactions: { love: ['u1', 'u2', 'u3', 'u4', 'u5'], fire: ['u6', 'u7'] },
      comments: [
        {
          id: 'c1',
          text: 'Your skin is literally glowing! 😍',
          author: {
            id: 'u1',
            name: 'Emma',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          },
          createdAt: Date.now() - 1000 * 60 * 60,
        },
      ],
      hashtags: ['morningglow', 'skincare', 'glowup'],
      saves: 42,
      shareCount: 18,
      viewCount: 1245,
    },
    {
      id: generateId('post'),
      circleId: 'global',
      author: {
        id: 'sophia',
        name: 'Sophia Chen',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        isVerified: true,
        glowScore: 92,
      },
      caption: '30-day transformation! Consistency is key 💪',
      imageUrl: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800',
      locationName: 'Los Angeles',
      coords: null,
      createdAt: Date.now() - 1000 * 60 * 60 * 5,
      reactions: { love: ['u1', 'u2', 'u3', 'u8', 'u9', 'u10'], sparkle: ['u11', 'u12', 'u13'] },
      comments: [],
      hashtags: ['beforeandafter', 'transformation', 'glowjourney'],
      isBeforeAfter: true,
      duration: '30 days',
      saves: 128,
      shareCount: 45,
      viewCount: 3542,
    },
    {
      id: generateId('post'),
      circleId: 'global',
      author: {
        id: 'olivia',
        name: 'Olivia Martinez',
        avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150',
        isVerified: false,
        glowScore: 88,
      },
      caption: 'Sunday self-care vibes 🧖\u200d♀️ Taking time for me',
      imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800',
      locationName: null,
      coords: null,
      createdAt: Date.now() - 1000 * 60 * 60 * 8,
      reactions: { love: ['u1', 'u2'], sparkle: ['u3'] },
      comments: [],
      hashtags: ['selfcare', 'sunday', 'metime'],
      saves: 34,
      shareCount: 12,
      viewCount: 892,
    },
  ];
  return byCircle;
}

function createDefaultChallenges(): Challenge[] {
  const now = Date.now();
  return [
    {
      id: 'daily_glow',
      title: '✨ Daily Glow Challenge',
      description: 'Share your morning routine and earn 50 points!',
      type: 'daily' as const,
      status: 'active' as const,
      icon: '☀️',
      reward: { points: 50, badge: '🌟' },
      participants: 2847,
      endsAt: now + 24 * 60 * 60 * 1000,
      createdAt: now - 2 * 60 * 60 * 1000,
      tags: ['morning', 'routine'],
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800',
    },
    {
      id: 'before_after',
      title: '📸 Before & After Transformation',
      description: 'Show your glow up journey! 100 points + exclusive badge',
      type: 'trending' as const,
      status: 'active' as const,
      icon: '💫',
      reward: { points: 100, badge: '👑' },
      participants: 5634,
      endsAt: now + 7 * 24 * 60 * 60 * 1000,
      createdAt: now - 12 * 60 * 60 * 1000,
      tags: ['transformation', 'trending'],
      image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800',
    },
    {
      id: 'skincare_sunday',
      title: '🧴 Self-Care Sunday',
      description: 'Share your Sunday skincare ritual - 75 points!',
      type: 'weekly' as const,
      status: 'active' as const,
      icon: '🌸',
      reward: { points: 75, badge: '🎀' },
      participants: 3921,
      endsAt: now + 3 * 24 * 60 * 60 * 1000,
      createdAt: now - 6 * 60 * 60 * 1000,
      tags: ['selfcare', 'sunday'],
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800',
    },
    {
      id: 'no_makeup',
      title: '🌿 Natural Beauty Challenge',
      description: 'Rock your natural look! 60 points',
      type: 'trending' as const,
      status: 'active' as const,
      icon: '🌱',
      reward: { points: 60, badge: '💚' },
      participants: 4156,
      endsAt: now + 5 * 24 * 60 * 60 * 1000,
      createdAt: now - 8 * 60 * 60 * 1000,
      tags: ['natural', 'nomakeup'],
      image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800',
    },
  ];
}

function createDefaultLeaderboard(): Leaderboard[] {
  return [
    {
      userId: 'top1',
      userName: 'Emma Wilson',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      points: 2450,
      rank: 1,
      badges: ['👑', '💎', '✨', '🔥'],
      postsCount: 127,
      challengesCompleted: 24,
    },
    {
      userId: 'top2',
      userName: 'Sophia Chen',
      userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      points: 2280,
      rank: 2,
      badges: ['💎', '✨', '🔥'],
      postsCount: 98,
      challengesCompleted: 19,
    },
    {
      userId: 'top3',
      userName: 'Olivia Martinez',
      userAvatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150',
      points: 2150,
      rank: 3,
      badges: ['💎', '✨'],
      postsCount: 84,
      challengesCompleted: 17,
    },
  ];
}
