import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductContext';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import {
  ProgressPhoto,
  JournalEntry,
  DailyInsight,
  PhotoAnalysis,
  TransformationAnalysis,
  WeeklyCalendar,
} from '@/types/progress';

interface ProgressContextType {
  photos: ProgressPhoto[];
  journalEntries: JournalEntry[];
  insights: DailyInsight | null;
  weeklyCalendar: WeeklyCalendar[];
  isLoading: boolean;
  addPhoto: (uri: string, notes?: string) => Promise<ProgressPhoto>;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'userId' | 'timestamp' | 'createdAt' | 'updatedAt'>) => Promise<JournalEntry>;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  generateInsights: () => Promise<void>;
  canUnlockInsights: boolean;
  getPhotoComparison: (days: number) => { before: ProgressPhoto | null; after: ProgressPhoto | null };
  refreshData: () => Promise<void>;
}

const photoAnalysisSchema = z.object({
  hydration: z.number().min(0).max(100).describe('Skin hydration level from 0-100'),
  texture: z.number().min(0).max(100).describe('Skin texture smoothness from 0-100'),
  brightness: z.number().min(0).max(100).describe('Skin brightness and radiance from 0-100'),
  acne: z.number().min(0).max(100).describe('Acne/blemish visibility from 0-100, higher means more visible'),
  poreSize: z.number().min(0).max(100).describe('Pore visibility from 0-100'),
  redness: z.number().min(0).max(100).describe('Skin redness from 0-100'),
  darkCircles: z.number().min(0).max(100).describe('Dark circles visibility from 0-100'),
  confidence: z.number().min(0).max(100).describe('Analysis confidence level'),
  improvements: z.array(z.string()).optional().describe('List of improvements noticed'),
  concerns: z.array(z.string()).optional().describe('List of concerns detected'),
});

const insightsSchema = z.object({
  overallScore: z.number().min(0).max(100).describe('Overall progress score'),
  consistencyScore: z.number().min(0).max(100).describe('Consistency tracking score'),
  wins: z.array(z.string()).describe('Recent wins and achievements from last 5 days'),
  patterns: z.array(z.object({
    type: z.enum(['positive', 'negative', 'neutral']),
    pattern: z.string().describe('Pattern discovered'),
    correlation: z.string().describe('What correlates with this pattern'),
    strength: z.number().min(0).max(100).describe('Strength of correlation'),
    examples: z.array(z.string()).describe('Specific examples'),
  })).describe('Key patterns discovered in the data'),
  productReport: z.object({
    working: z.array(z.object({
      productName: z.string(),
      category: z.string(),
      impact: z.enum(['positive', 'negative', 'neutral']),
      score: z.number().min(0).max(100),
      usageDays: z.number(),
      notes: z.string(),
    })),
    monitoring: z.array(z.object({
      productName: z.string(),
      category: z.string(),
      impact: z.enum(['positive', 'negative', 'neutral']),
      score: z.number().min(0).max(100),
      usageDays: z.number(),
      notes: z.string(),
    })),
    replace: z.array(z.object({
      productName: z.string(),
      category: z.string(),
      impact: z.enum(['positive', 'negative', 'neutral']),
      score: z.number().min(0).max(100),
      usageDays: z.number(),
      notes: z.string(),
    })),
  }).describe('Product performance report'),
  recommendations: z.array(z.string()).describe('Actionable recommendations'),
});

export const [ProgressProvider, useProgress] = createContextHook((): ProgressContextType => {
  const { user } = useAuth();
  const { products } = useProducts();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [insights, setInsights] = useState<DailyInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;

    console.log('📊 Loading progress data for user:', user.id);
    setIsLoading(true);

    try {
      const [photosData, journalData, insightsData] = await Promise.all([
        supabase
          .from('progress_photos')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(30),
        supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(30),
        supabase
          .from('daily_insights')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
      ]);

      if (photosData.data) {
        const formattedPhotos = photosData.data.map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          uri: p.uri,
          date: p.date,
          timestamp: p.timestamp,
          analysis: p.analysis,
          notes: p.notes,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }));
        setPhotos(formattedPhotos);
        console.log('✅ Loaded', formattedPhotos.length, 'photos');
      }

      if (journalData.data) {
        const formattedEntries = journalData.data.map((e: any) => ({
          id: e.id,
          userId: e.user_id,
          date: e.date,
          timestamp: e.timestamp,
          mood: e.mood,
          sleepHours: e.sleep_hours,
          waterIntake: e.water_intake,
          stressLevel: e.stress_level,
          skinFeeling: e.skin_feeling,
          notes: e.notes,
          productsUsed: e.products_used,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        }));
        setJournalEntries(formattedEntries);
        console.log('✅ Loaded', formattedEntries.length, 'journal entries');
      }

      if (insightsData.data) {
        const formattedInsight: DailyInsight = {
          id: insightsData.data.id,
          userId: insightsData.data.user_id,
          date: insightsData.data.date,
          weekNumber: insightsData.data.week_number,
          overallScore: insightsData.data.overall_score,
          consistencyScore: insightsData.data.consistency_score,
          photoStreak: insightsData.data.photo_streak,
          journalStreak: insightsData.data.journal_streak,
          wins: insightsData.data.wins,
          patterns: insightsData.data.patterns,
          productReport: insightsData.data.product_report,
          recommendations: insightsData.data.recommendations,
          transformationAnalysis: insightsData.data.transformation_analysis,
          generated: insightsData.data.generated,
          createdAt: insightsData.data.created_at,
          updatedAt: insightsData.data.updated_at,
        };
        setInsights(formattedInsight);
        console.log('✅ Loaded insights');
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const analyzePhoto = async (uri: string): Promise<PhotoAnalysis> => {
    console.log('🔍 Analyzing photo with AI...');
    
    try {
      const rawAnalysis = await generateObject({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                image: uri,
              },
              {
                type: 'text',
                text: `Analyze this skin progress photo. Evaluate:
- Hydration level (0-100): How moisturized the skin appears
- Texture (0-100): Smoothness and evenness
- Brightness (0-100): Radiance and luminosity
- Acne (0-100): Visibility of blemishes (higher = more visible)
- Pore Size (0-100): Visibility of pores
- Redness (0-100): Skin redness or inflammation
- Dark Circles (0-100): Under-eye darkness
- List any improvements noticed compared to typical skin
- List any concerns that should be addressed

Provide accurate, helpful metrics.`,
              },
            ],
          },
        ],
        schema: photoAnalysisSchema,
      });

      const analysis = rawAnalysis as PhotoAnalysis;
      console.log('✅ Photo analysis complete');
      return analysis;
    } catch (error) {
      console.error('Error analyzing photo:', error);
      throw error;
    }
  };

  const addPhoto = useCallback(async (uri: string, notes?: string): Promise<ProgressPhoto> => {
    if (!user) throw new Error('User not authenticated');

    console.log('📸 Adding new progress photo...');
    
    const analysis = await analyzePhoto(uri);
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('progress_photos')
      .insert({
        user_id: user.id,
        uri,
        date: today,
        timestamp: new Date().toISOString(),
        analysis,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    const newPhoto: ProgressPhoto = {
      id: data.id,
      userId: data.user_id,
      uri: data.uri,
      date: data.date,
      timestamp: data.timestamp,
      analysis: data.analysis,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    setPhotos([newPhoto, ...photos]);
    console.log('✅ Photo added successfully');
    return newPhoto;
  }, [user, photos]);

  const addJournalEntry = useCallback(async (
    entry: Omit<JournalEntry, 'id' | 'userId' | 'timestamp' | 'createdAt' | 'updatedAt'>
  ): Promise<JournalEntry> => {
    if (!user) throw new Error('User not authenticated');

    console.log('📝 Adding journal entry...');

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        date: entry.date,
        timestamp: new Date().toISOString(),
        mood: entry.mood,
        sleep_hours: entry.sleepHours,
        water_intake: entry.waterIntake,
        stress_level: entry.stressLevel,
        skin_feeling: entry.skinFeeling,
        notes: entry.notes,
        products_used: entry.productsUsed,
      })
      .select()
      .single();

    if (error) throw error;

    const newEntry: JournalEntry = {
      id: data.id,
      userId: data.user_id,
      date: data.date,
      timestamp: data.timestamp,
      mood: data.mood,
      sleepHours: data.sleep_hours,
      waterIntake: data.water_intake,
      stressLevel: data.stress_level,
      skinFeeling: data.skin_feeling,
      notes: data.notes,
      productsUsed: data.products_used,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    setJournalEntries([newEntry, ...journalEntries]);
    console.log('✅ Journal entry added successfully');
    return newEntry;
  }, [user, journalEntries]);

  const updateJournalEntry = useCallback(async (id: string, updates: Partial<JournalEntry>) => {
    if (!user) throw new Error('User not authenticated');

    console.log('📝 Updating journal entry:', id);

    const dbUpdates: any = {};
    if (updates.mood) dbUpdates.mood = updates.mood;
    if (updates.sleepHours !== undefined) dbUpdates.sleep_hours = updates.sleepHours;
    if (updates.waterIntake !== undefined) dbUpdates.water_intake = updates.waterIntake;
    if (updates.stressLevel !== undefined) dbUpdates.stress_level = updates.stressLevel;
    if (updates.skinFeeling !== undefined) dbUpdates.skin_feeling = updates.skinFeeling;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.productsUsed !== undefined) dbUpdates.products_used = updates.productsUsed;

    const { error } = await supabase
      .from('journal_entries')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setJournalEntries(journalEntries.map(e => e.id === id ? { ...e, ...updates } : e));
    console.log('✅ Journal entry updated');
  }, [user, journalEntries]);

  const deletePhoto = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    console.log('🗑️ Deleting photo:', id);

    const { error } = await supabase
      .from('progress_photos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setPhotos(photos.filter(p => p.id !== id));
    console.log('✅ Photo deleted');
  }, [user, photos]);

  const deleteJournalEntry = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    console.log('🗑️ Deleting journal entry:', id);

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setJournalEntries(journalEntries.filter(e => e.id !== id));
    console.log('✅ Journal entry deleted');
  }, [user, journalEntries]);

  const generateInsights = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');

    console.log('💡 Generating AI insights...');

    const photoData = photos.slice(0, 10).map(p => ({
      date: p.date,
      analysis: p.analysis,
    }));

    const journalData = journalEntries.slice(0, 10).map(e => ({
      date: e.date,
      mood: e.mood,
      sleepHours: e.sleepHours,
      waterIntake: e.waterIntake,
      stressLevel: e.stressLevel,
      skinFeeling: e.skinFeeling,
      productsUsed: e.productsUsed,
    }));

    const productData = products.map(p => ({
      name: p.name,
      category: p.category,
      brand: p.brand,
    }));

    try {
      const rawInsights = await generateObject({
        messages: [
          {
            role: 'user',
            content: `Analyze this skincare progress data and generate insights:

Photos (last 10): ${JSON.stringify(photoData, null, 2)}

Journal Entries (last 10): ${JSON.stringify(journalData, null, 2)}

Products: ${JSON.stringify(productData, null, 2)}

Generate:
1. Overall progress score (0-100) based on improvements
2. Consistency score (0-100) based on tracking frequency
3. Recent wins (last 5 days achievements)
4. Key patterns (correlations between habits and skin metrics)
5. Product performance report (working, monitoring, replace)
6. Actionable recommendations

Be specific, encouraging, and data-driven.`,
          },
        ],
        schema: insightsSchema,
      });

      const aiInsights = rawInsights as z.infer<typeof insightsSchema>;

      const photoStreak = calculatePhotoStreak(photos);
      const journalStreak = calculateJournalStreak(journalEntries);
      const transformation = calculateTransformation(photos);

      const { data, error } = await supabase
        .from('daily_insights')
        .upsert({
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          week_number: Math.ceil(photos.length / 7),
          overall_score: aiInsights.overallScore,
          consistency_score: aiInsights.consistencyScore,
          photo_streak: photoStreak,
          journal_streak: journalStreak,
          wins: aiInsights.wins,
          patterns: aiInsights.patterns,
          product_report: aiInsights.productReport,
          recommendations: aiInsights.recommendations,
          transformation_analysis: transformation,
          generated: true,
        })
        .select()
        .single();

      if (error) throw error;

      const newInsight: DailyInsight = {
        id: data.id,
        userId: data.user_id,
        date: data.date,
        weekNumber: data.week_number,
        overallScore: data.overall_score,
        consistencyScore: data.consistency_score,
        photoStreak: data.photo_streak,
        journalStreak: data.journal_streak,
        wins: data.wins,
        patterns: data.patterns,
        productReport: data.product_report,
        recommendations: data.recommendations,
        transformationAnalysis: data.transformation_analysis,
        generated: data.generated,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setInsights(newInsight);
      console.log('✅ Insights generated successfully');
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }, [user, photos, journalEntries, products]);

  const calculatePhotoStreak = (photos: ProgressPhoto[]) => {
    let current = 0;
    let allTime = 0;
    const sortedPhotos = [...photos].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const today = new Date().toISOString().split('T')[0];
    const dates = new Set(sortedPhotos.map(p => p.date));

    let currentDate = new Date(today);
    while (dates.has(currentDate.toISOString().split('T')[0])) {
      current++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    allTime = Math.max(current, allTime);
    return { current, allTime };
  };

  const calculateJournalStreak = (entries: JournalEntry[]) => {
    let current = 0;
    let allTime = 0;
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const today = new Date().toISOString().split('T')[0];
    const dates = new Set(sortedEntries.map(e => e.date));

    let currentDate = new Date(today);
    while (dates.has(currentDate.toISOString().split('T')[0])) {
      current++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    allTime = Math.max(current, allTime);
    return { current, allTime };
  };

  const calculateTransformation = (photos: ProgressPhoto[]): TransformationAnalysis | undefined => {
    if (photos.length < 2) return undefined;

    const sorted = [...photos].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const before = sorted[0];
    const after = sorted[sorted.length - 1];

    const improvements = [
      {
        metric: 'Hydration',
        change: after.analysis.hydration - before.analysis.hydration,
        percentage: ((after.analysis.hydration - before.analysis.hydration) / before.analysis.hydration) * 100,
      },
      {
        metric: 'Texture',
        change: after.analysis.texture - before.analysis.texture,
        percentage: ((after.analysis.texture - before.analysis.texture) / before.analysis.texture) * 100,
      },
      {
        metric: 'Brightness',
        change: after.analysis.brightness - before.analysis.brightness,
        percentage: ((after.analysis.brightness - before.analysis.brightness) / before.analysis.brightness) * 100,
      },
      {
        metric: 'Clear Skin',
        change: before.analysis.acne - after.analysis.acne,
        percentage: ((before.analysis.acne - after.analysis.acne) / before.analysis.acne) * 100,
      },
    ].filter(i => Math.abs(i.change) > 5);

    const duration = Math.ceil(
      (new Date(after.timestamp).getTime() - new Date(before.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      duration,
      photoCount: photos.length,
      journalCount: 0,
      beforeMetrics: before.analysis,
      afterMetrics: after.analysis,
      improvements,
      summary: `After ${duration} days of tracking, you've seen ${improvements.length} significant improvements!`,
    };
  };

  const canUnlockInsights = useMemo(() => {
    return photos.length >= 5 && journalEntries.length >= 5;
  }, [photos.length, journalEntries.length]);

  const getPhotoComparison = useCallback((days: number) => {
    const now = Date.now();

    const after = photos[0] || null;
    const before = photos.find(p => {
      const photoTime = new Date(p.timestamp).getTime();
      const daysDiff = (now - photoTime) / (1000 * 60 * 60 * 24);
      return daysDiff >= days - 2 && daysDiff <= days + 2;
    }) || null;

    return { before, after };
  }, [photos]);

  const weeklyCalendar = useMemo(() => {
    const calendar: WeeklyCalendar[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const hasPhoto = photos.some(p => p.date === dateStr);
      const hasJournal = journalEntries.some(e => e.date === dateStr);

      calendar.push({
        date: dateStr,
        hasPhoto,
        hasJournal,
        completed: hasPhoto && hasJournal,
      });
    }

    return calendar;
  }, [photos, journalEntries]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return useMemo(() => ({
    photos,
    journalEntries,
    insights,
    weeklyCalendar,
    isLoading,
    addPhoto,
    addJournalEntry,
    updateJournalEntry,
    deletePhoto,
    deleteJournalEntry,
    generateInsights,
    canUnlockInsights,
    getPhotoComparison,
    refreshData,
  }), [
    photos,
    journalEntries,
    insights,
    weeklyCalendar,
    isLoading,
    addPhoto,
    addJournalEntry,
    updateJournalEntry,
    deletePhoto,
    deleteJournalEntry,
    generateInsights,
    canUnlockInsights,
    getPhotoComparison,
    refreshData,
  ]);
});
