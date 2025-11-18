export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isPremium: boolean;
  stats: {
    analyses: number;
    dayStreak: number;
    glowScore: number;
    totalPoints: number;
    level: number;
    lastAnalysisDate?: string;
    bestGlowScore: number;
    improvementStreak: number;
  };
  badges: Badge[];
  achievements: Achievement[];
  glowBoosts: GlowBoost[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: string;
  category: 'analysis' | 'streak' | 'improvement' | 'social' | 'special' | 'routine';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt?: string;
  points: number;
  category: 'daily' | 'weekly' | 'milestone' | 'special' | 'legendary';
}

export interface GlowBoost {
  id: string;
  type: 'score_improvement' | 'streak_milestone' | 'first_analysis' | 'perfect_score' | 'comeback' | 'daily_completion';
  title: string;
  message: string;
  points: number;
  timestamp: string;
  seen: boolean;
}

export interface Quote {
  text: string;
  author: string;
}

export interface AnalysisResult {
  id: string;
  type: 'glow' | 'style';
  score: number;
  timestamp: Date;
  image?: string;
}

export interface StyleAnalysisResult {
  id: string;
  image: string;
  occasion: string;
  overallScore: number;
  vibe: string;
  colorAnalysis: {
    dominantColors: string[];
    colorHarmony: number;
    seasonalMatch: string;
    recommendedColors: string[];
  };
  outfitBreakdown: {
    top: {
      item: string;
      fit: number;
      color: string;
      style: string;
      rating: number;
      feedback: string;
    };
    bottom: {
      item: string;
      fit: number;
      color: string;
      style: string;
      rating: number;
      feedback: string;
    };
    accessories?: {
      jewelry?: {
        items: string[];
        appropriateness: number;
        feedback: string;
      };
      shoes?: {
        style: string;
        match: number;
        feedback: string;
      };
      bag?: {
        style: string;
        match: number;
        feedback: string;
      };
    };
  };
  occasionMatch: {
    appropriateness: number;
    formalityLevel: string;
    suggestions: string[];
  };
  bodyTypeRecommendations: {
    strengths: string[];
    improvements: string[];
    stylesThatSuit: string[];
  };
  overallFeedback: {
    whatWorked: string[];
    improvements: string[];
    specificSuggestions: string[];
  };
  timestamp: Date;
}

export interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateAvatar: (uri: string) => void;
  logout: () => void;
  isFirstTime: boolean;
  setIsFirstTime: (value: boolean) => void;
}