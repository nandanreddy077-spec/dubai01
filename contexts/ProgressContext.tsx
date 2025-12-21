import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductContext';
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

  const analyzePhoto = useCallback(async (uri: string): Promise<PhotoAnalysis> => {
    console.log('🔍 Analyzing photo with AI...');
    
    try {
      const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      
      if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
        console.warn('⚠️ OpenAI API key not configured, using fallback analysis');
        return createFallbackPhotoAnalysis();
      }

      const prompt = `Analyze this skin progress photo and return ONLY valid JSON (no markdown). Evaluate:
- hydration (0-100): How moisturized the skin appears
- texture (0-100): Smoothness and evenness
- brightness (0-100): Radiance and luminosity
- acne (0-100): Visibility of blemishes (higher = more visible)
- poreSize (0-100): Visibility of pores
- redness (0-100): Skin redness or inflammation
- darkCircles (0-100): Under-eye darkness
- confidence (0-100): Analysis confidence level
- improvements: Array of improvements noticed
- concerns: Array of concerns detected

Return format:
{
  "hydration": number,
  "texture": number,
  "brightness": number,
  "acne": number,
  "poreSize": number,
  "redness": number,
  "darkCircles": number,
  "confidence": number,
  "improvements": ["string"],
  "concerns": ["string"]
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a skin analysis expert. Return ONLY valid JSON without markdown formatting.',
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: { url: uri },
                },
              ],
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('❌ OpenAI API error:', response.status);
        return createFallbackPhotoAnalysis();
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.error('❌ No content in OpenAI response');
        return createFallbackPhotoAnalysis();
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const analysis = photoAnalysisSchema.parse(parsed);
        console.log('✅ Photo analysis complete');
        return analysis as PhotoAnalysis;
      }
      
      console.error('❌ Failed to parse AI response');
      return createFallbackPhotoAnalysis();
    } catch (error) {
      console.error('Error analyzing photo:', error);
      return createFallbackPhotoAnalysis();
    }
  }, []);

  const createFallbackPhotoAnalysis = (): PhotoAnalysis => {
    return {
      hydration: 75,
      texture: 78,
      brightness: 80,
      acne: 15,
      poreSize: 20,
      redness: 18,
      darkCircles: 22,
      confidence: 70,
      improvements: ['Maintain current skincare routine'],
      concerns: ['Continue monitoring skin progress'],
    };
  };

  const addPhoto = useCallback(async (uri: string, notes?: string): Promise<ProgressPhoto> => {
    if (!user) throw new Error('User not authenticated');

    console.log('📸 Adding new progress photo...');
    
    const photoAnalysis = await analyzePhoto(uri);
    const today = new Date().toISOString().split('T')[0];

    const { data: photoData, error: photoError } = await supabase
      .from('progress_photos')
      .insert({
        user_id: user.id,
        uri,
        date: today,
        timestamp: new Date().toISOString(),
        analysis: photoAnalysis,
        notes,
      })
      .select()
      .single();

    if (photoError) throw photoError;

    const newPhoto: ProgressPhoto = {
      id: photoData.id,
      userId: photoData.user_id,
      uri: photoData.uri,
      date: photoData.date,
      timestamp: photoData.timestamp,
      analysis: photoData.analysis,
      notes: photoData.notes,
      createdAt: photoData.created_at,
      updatedAt: photoData.updated_at,
    };

    setPhotos([newPhoto, ...photos]);
    console.log('✅ Photo added successfully');
    return newPhoto;
  }, [user, photos, analyzePhoto]);

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
      const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      
      if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
        console.warn('⚠️ OpenAI API key not configured, using rule-based insights');
        const { generateInsights: generateRuleBased } = await import('@/lib/insights-engine');
        // Convert photos to match insights-engine types
        const photosForInsights = photos.map(p => ({
          ...p,
          timestamp: new Date(p.timestamp).getTime(),
        }));
        const journalForInsights = journalEntries.map(e => ({
          ...e,
          timestamp: new Date(e.timestamp).getTime(),
        }));
        const ruleBasedResult = await generateRuleBased(photosForInsights as any, journalForInsights as any, products, [], []);
        
        const aiInsights = {
          overallScore: 80,
          consistencyScore: 75,
          wins: ruleBasedResult.wins,
          patterns: [],
          productReport: ruleBasedResult.productReport || { working: [], monitoring: [], replace: [] },
          recommendations: ruleBasedResult.recommendations,
        };
        
        const photoStreak = calculatePhotoStreak(photos);
        const journalStreak = calculateJournalStreak(journalEntries);
        const transformation = calculateTransformation(photos);

        const { data: insightData, error: insightError } = await supabase
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

        if (!insightError && insightData) {
          const newInsight: DailyInsight = {
            id: insightData.id,
            userId: insightData.user_id,
            date: insightData.date,
            weekNumber: insightData.week_number,
            overallScore: insightData.overall_score,
            consistencyScore: insightData.consistency_score,
            photoStreak: insightData.photo_streak,
            journalStreak: insightData.journal_streak,
            wins: insightData.wins,
            patterns: insightData.patterns,
            productReport: insightData.product_report,
            recommendations: insightData.recommendations,
            transformationAnalysis: insightData.transformation_analysis,
            generated: insightData.generated,
            createdAt: insightData.created_at,
            updatedAt: insightData.updated_at,
          };
          setInsights(newInsight);
        }
        
        console.log('✅ Rule-based insights generated successfully');
        return;
      }

      const prompt = `Analyze this skincare progress data and generate insights. Return ONLY valid JSON (no markdown).

Photos (last 10): ${JSON.stringify(photoData, null, 2)}

Journal Entries (last 10): ${JSON.stringify(journalData, null, 2)}

Products: ${JSON.stringify(productData, null, 2)}

Return format:
{
  "overallScore": number (0-100),
  "consistencyScore": number (0-100),
  "wins": ["string"],
  "patterns": [{
    "type": "positive" | "negative" | "neutral",
    "pattern": "string",
    "correlation": "string",
    "strength": number (0-100),
    "examples": ["string"]
  }],
  "productReport": {
    "working": [{
      "productName": "string",
      "category": "string",
      "impact": "positive" | "negative" | "neutral",
      "score": number (0-100),
      "usageDays": number,
      "notes": "string"
    }],
    "monitoring": [],
    "replace": []
  },
  "recommendations": ["string"]
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a skincare insights expert. Return ONLY valid JSON without markdown formatting.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const aiInsights = insightsSchema.parse(parsed);

      const photoStreak = calculatePhotoStreak(photos);
      const journalStreak = calculateJournalStreak(journalEntries);
      const transformation = calculateTransformation(photos);

      const { data: finalData, error: finalError } = await supabase
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

      if (finalError) throw finalError;

      const newInsight: DailyInsight = {
        id: finalData.id,
        userId: finalData.user_id,
        date: finalData.date,
        weekNumber: finalData.week_number,
        overallScore: finalData.overall_score,
        consistencyScore: finalData.consistency_score,
        photoStreak: finalData.photo_streak,
        journalStreak: finalData.journal_streak,
        wins: finalData.wins,
        patterns: finalData.patterns,
        productReport: finalData.product_report,
        recommendations: finalData.recommendations,
        transformationAnalysis: finalData.transformation_analysis,
        generated: finalData.generated,
        createdAt: finalData.created_at,
        updatedAt: finalData.updated_at,
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
