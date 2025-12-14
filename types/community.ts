export type ReactionType = 'like' | 'love' | 'sparkle' | 'wow' | 'fire' | 'queen' | 'save';
export type PostType = 'normal' | 'transformation' | 'tip' | 'review' | 'challenge';
export type ViewMode = 'feed' | 'trending' | 'glowups' | 'challenges' | 'saved';

export type ChallengeType = 'daily' | 'weekly' | 'trending';
export type ChallengeStatus = 'active' | 'completed' | 'expired';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  status: ChallengeStatus;
  icon: string;
  reward: {
    points: number;
    badge?: string;
  };
  participants: number;
  endsAt: number;
  createdAt: number;
  tags: string[];
  image: string;
  duration?: string;
}

export interface UserChallenge {
  userId: string;
  challengeId: string;
  status: 'participating' | 'completed';
  progress: number;
  completedAt?: number;
  postId?: string;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: number;
  expiresAt: number;
  views: string[];
}

export interface Leaderboard {
  userId: string;
  userName: string;
  userAvatar: string;
  points: number;
  rank: number;
  badges: string[];
  postsCount: number;
  challengesCompleted: number;
  followers?: number;
  glowScore?: number;
  streak?: number;
  isVerified?: boolean;
}

export interface BeforeAfter {
  id: string;
  postId: string;
  beforeImage: string;
  afterImage: string;
  duration: string;
  products?: string[];
  tips?: string[];
}

export interface AuthorRef {
  id: string;
  name: string;
  avatar: string;
}

export interface Comment {
  id: string;
  text: string;
  author: AuthorRef;
  createdAt: number;
  reactions?: Partial<Record<ReactionType, string[]>>;
  replies?: Comment[];
}

export interface Post {
  id: string;
  circleId: string;
  author: AuthorRef & { isVerified?: boolean; glowScore?: number };
  caption: string;
  imageUrl: string | null;
  images?: string[];
  locationName: string | null;
  coords: { latitude: number; longitude: number } | null;
  createdAt: number;
  reactions: Partial<Record<ReactionType, string[]>>;
  comments: Comment[];
  hashtags?: string[];
  isBeforeAfter?: boolean;
  beforeImage?: string;
  afterImage?: string;
  products?: string[];
  tips?: string[];
  duration?: string;
  saves?: number;
  shareCount?: number;
  viewCount?: number;
  challengeId?: string;
  type?: PostType;
  isPinned?: boolean;
  reviewRating?: number;
  tipCategory?: string;
  reports?: string[]; // Array of user IDs who reported this post
  isRemoved?: boolean; // Whether post was removed due to reports
}

export interface Circle {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  creatorId: string;
  memberCount: number;
  createdAt: number;
  isPrivate: boolean;
  tags: string[];
  locationName: string | null;
  postCount?: number;
  isOfficial?: boolean;
  category?: string;
}

export interface UserMembership {
  userId: string;
  circleId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: number;
}

export interface CreateCircleInput {
  name: string;
  description?: string;
  coverImage?: string;
  isPrivate?: boolean;
  tags?: string[];
  locationName?: string | null;
  category?: string;
}

export interface CreatePostInput {
  circleId: string;
  caption: string;
  imageUrl?: string | null;
  images?: string[];
  locationName?: string | null;
  coords?: { latitude: number; longitude: number } | null;
  hashtags?: string[];
  isBeforeAfter?: boolean;
  beforeImage?: string;
  afterImage?: string;
  products?: string[];
  tips?: string[];
  duration?: string;
  challengeId?: string;
  type?: PostType;
  reviewRating?: number;
  tipCategory?: string;
}

export interface SavedCollection {
  id: string;
  userId: string;
  name: string;
  coverImage: string;
  posts: string[];
  createdAt: number;
  isPrivate: boolean;
}

export interface HashtagTrend {
  tag: string;
  postCount: number;
  growth: number;
}

export interface BeautyStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivity: number;
}

export interface UserFollow {
  followerId: string;
  followingId: string;
  createdAt: number;
}

export interface UserProfile {
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar: string;
  isVerified: boolean;
  glowScore: number;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isPrivate: boolean;
  website?: string;
  highlights?: StoryHighlight[];
}

export interface StoryHighlight {
  id: string;
  title: string;
  coverImage: string;
  stories: string[]; // story IDs
  createdAt: number;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  coverImage: string | null;
  postIds: string[];
  isPrivate: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ProductTag {
  id: string;
  name: string;
  brand?: string;
  image?: string;
  price?: number;
  link?: string;
  category: 'skincare' | 'makeup' | 'haircare' | 'fragrance' | 'tools' | 'other';
}

export interface PostTag {
  postId: string;
  productId: string;
  x: number; // position on image (0-1)
  y: number; // position on image (0-1)
}
