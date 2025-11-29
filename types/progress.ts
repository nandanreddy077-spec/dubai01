export interface ProgressPhoto {
  id: string;
  userId: string;
  uri: string;
  date: string;
  timestamp: string;
  analysis: PhotoAnalysis;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoAnalysis {
  hydration: number;
  texture: number;
  brightness: number;
  acne: number;
  poreSize: number;
  redness: number;
  darkCircles: number;
  confidence: number;
  improvements?: string[];
  concerns?: string[];
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  timestamp: string;
  mood: Mood;
  sleepHours: number;
  waterIntake: number;
  stressLevel: number;
  skinFeeling?: string;
  notes?: string;
  productsUsed?: string[];
  createdAt: string;
  updatedAt: string;
}

export type Mood = 'great' | 'good' | 'okay' | 'bad';

export interface DailyInsight {
  id: string;
  userId: string;
  date: string;
  weekNumber: number;
  overallScore: number;
  consistencyScore: number;
  photoStreak: {
    current: number;
    allTime: number;
  };
  journalStreak: {
    current: number;
    allTime: number;
  };
  wins: string[];
  patterns: InsightPattern[];
  productReport: ProductReport;
  recommendations: string[];
  transformationAnalysis?: TransformationAnalysis;
  generated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InsightPattern {
  type: 'positive' | 'negative' | 'neutral';
  pattern: string;
  correlation: string;
  strength: number;
  examples: string[];
}

export interface ProductReport {
  working: ProductPerformance[];
  monitoring: ProductPerformance[];
  replace: ProductPerformance[];
}

export interface ProductPerformance {
  productId?: string;
  productName: string;
  category: string;
  impact: 'positive' | 'negative' | 'neutral';
  score: number;
  usageDays: number;
  metrics: {
    hydration?: number;
    texture?: number;
    brightness?: number;
    acne?: number;
  };
  notes: string;
}

export interface TransformationAnalysis {
  duration: number;
  photoCount: number;
  journalCount: number;
  beforeMetrics: Partial<PhotoAnalysis>;
  afterMetrics: Partial<PhotoAnalysis>;
  improvements: {
    metric: string;
    change: number;
    percentage: number;
  }[];
  summary: string;
}

export interface WeeklyCalendar {
  date: string;
  hasPhoto: boolean;
  hasJournal: boolean;
  completed: boolean;
}
