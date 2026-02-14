import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// Web-compatible storage wrapper with quota management
const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      // Always limit data size to prevent storage issues
      if (key === STORAGE_KEY) {
        try {
          const parsed = JSON.parse(value);
          // Keep only last 3 analyses with minimal data
          const truncated = parsed.slice(0, 3).map((item: AnalysisResult) => ({
            timestamp: item.timestamp,
            overallScore: item.overallScore,
            rating: item.rating,
            skinType: item.skinType,
            skinPotential: item.skinPotential || '',
            skinQuality: item.skinQuality || '',
            skinTone: item.skinTone || '',
            detailedScores: item.detailedScores || {},
            dermatologyInsights: item.dermatologyInsights || { acneRisk: 'Low', agingSigns: [], skinConcerns: [], recommendedTreatments: [] },
            personalizedTips: item.personalizedTips?.slice(0, 2) || [],
            confidence: item.confidence || 0,
            // Remove large data
            imageUri: undefined,
          }));
          value = JSON.stringify(truncated);
        } catch (parseError) {
          console.error('Error parsing analysis data:', parseError);
          value = '[]'; // Reset to empty array if parsing fails
        }
      }

      if (Platform.OS === 'web') {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Handle quota exceeded error
          console.warn('Storage quota exceeded, clearing old data...');
          await this.clearOldData();
          try {
            localStorage.setItem(key, value);
          } catch (retryError) {
            console.error('Failed to save even after clearing:', retryError);
            // Clear this specific key if it's still failing
            localStorage.removeItem(key);
          }
        }
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
      // Try to clear some space and retry
      if (error instanceof Error && error.message.includes('quota')) {
        await this.clearOldData();
        try {
          if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
          } else {
            await AsyncStorage.setItem(key, value);
          }
        } catch (retryError) {
          console.error('Storage retry failed:', retryError);
        }
      }
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },
  async clearOldData(): Promise<void> {
    try {
      const keysToCheck = [
        'glowcheck_analysis_history',
        'gamification_glow_boosts',
        'gamification_badges',
        'gamification_achievements',
        'gamification_daily_completions'
      ];
      
      for (const key of keysToCheck) {
        const data = await this.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 10) {
              // Keep only the 5 most recent items
              const truncated = parsed.slice(0, 5);
              await this.setItem(key, JSON.stringify(truncated));
            }
          } catch (parseError) {
            console.warn(`Failed to parse data for key ${key}:`, parseError);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing old data:', error);
    }
  }
};

export interface AnalysisResult {
  overallScore: number;
  rating: string;
  skinPotential: string;
  skinQuality: string;
  skinTone: string;
  skinType: string;
  detailedScores: {
    jawlineSharpness: number;
    brightnessGlow: number;
    hydrationLevel: number;
    facialSymmetry: number;
    poreVisibility: number;
    skinTexture: number;
    evenness: number;
    elasticity: number;
  };
  dermatologyInsights: {
    acneRisk: 'Low' | 'Medium' | 'High';
    agingSigns: string[];
    skinConcerns: string[];
    recommendedTreatments: string[];
  };
  personalizedTips: string[];
  imageUri?: string;
  timestamp: number;
  confidence: number;
}

interface AnalysisContextType {
  currentResult: AnalysisResult | null;
  setCurrentResult: (result: AnalysisResult | null) => void;
  analysisHistory: AnalysisResult[];
  saveAnalysis: (result: AnalysisResult) => Promise<void>;
  clearHistory: () => Promise<void>;
  loadHistory: () => Promise<void>;
}

const STORAGE_KEY = 'glowcheck_analysis_history';

export const [AnalysisProvider, useAnalysis] = createContextHook((): AnalysisContextType => {
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      // First, try to load from Supabase if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        try {
          const { data, error } = await supabase
            .from('glow_analyses')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false })
            .limit(10);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            // Convert database format to AnalysisResult format
            const analyses: AnalysisResult[] = data.map((item: any) => ({
              overallScore: item.overall_score || 0,
              rating: item.rating || '',
              skinPotential: item.skin_potential || '',
              skinQuality: item.skin_quality || '',
              skinTone: item.skin_tone || '',
              skinType: item.skin_type || '',
              detailedScores: item.detailed_scores || {},
              dermatologyInsights: item.dermatology_insights || {
                acneRisk: 'Low' as const,
                agingSigns: [],
                skinConcerns: [],
                recommendedTreatments: [],
              },
              personalizedTips: item.personalized_tips || [],
              imageUri: item.image_url,
              timestamp: item.timestamp || Date.now(),
              confidence: item.confidence || 0,
            }));
            
            setAnalysisHistory(analyses);
            // Also save to local storage as backup
            await storage.setItem(STORAGE_KEY, JSON.stringify(analyses));
            return;
          }
        } catch (dbError) {
          console.warn('Error loading from Supabase, falling back to local storage:', dbError);
        }
      }
      
      // Fallback to local storage
      const stored = await storage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setAnalysisHistory(Array.isArray(parsed) ? parsed : []);
        } catch (parseError) {
          console.error('Error parsing analysis history:', parseError);
          await storage.setItem(STORAGE_KEY, JSON.stringify([]));
          setAnalysisHistory([]);
        }
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
      setAnalysisHistory([]);
    }
  }, []);

  // Load history on initialization
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const saveAnalysis = useCallback(async (result: AnalysisResult) => {
    try {
      // Create a lightweight version for storage
      const lightweightResult = {
        ...result,
        imageUri: undefined, // Don't store image URIs to save space
        personalizedTips: result.personalizedTips?.slice(0, 3) || [], // Limit tips
      };
      
      const newHistory = [lightweightResult, ...analysisHistory.slice(0, 4)]; // Keep only last 5 analyses
      setAnalysisHistory(newHistory);
      
      // Save to local storage first (fast)
      await storage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      
      // Also save to Supabase if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        try {
          const { error } = await supabase
            .from('glow_analyses')
            .insert({
              user_id: user.id,
              image_url: result.imageUri,
              overall_score: result.overallScore,
              rating: result.rating,
              skin_potential: result.skinPotential,
              skin_quality: result.skinQuality,
              skin_tone: result.skinTone,
              skin_type: result.skinType,
              detailed_scores: result.detailedScores,
              dermatology_insights: result.dermatologyInsights,
              personalized_tips: result.personalizedTips,
              confidence: result.confidence,
              timestamp: result.timestamp,
              analysis_data: {
                overallScore: result.overallScore,
                rating: result.rating,
                skinType: result.skinType,
              },
            });
          
          if (error) {
            console.warn('Error saving to Supabase:', error);
            // Continue anyway - local storage is saved
          } else {
            console.log('✅ Analysis saved to Supabase');
          }
        } catch (dbError) {
          console.warn('Error saving to Supabase, but local storage is saved:', dbError);
        }
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
      // If save fails, try with even less data
      try {
        const minimalResult = {
          overallScore: result.overallScore,
          rating: result.rating,
          skinType: result.skinType,
          timestamp: result.timestamp,
        };
        const minimalHistory = [minimalResult, ...analysisHistory.slice(0, 2)];
        setAnalysisHistory(minimalHistory as AnalysisResult[]);
        await storage.setItem(STORAGE_KEY, JSON.stringify(minimalHistory));
      } catch (minimalError) {
        console.error('Error saving minimal analysis:', minimalError);
      }
    }
  }, [analysisHistory]);

  const clearHistory = useCallback(async () => {
    try {
      setAnalysisHistory([]);
      await storage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, []);

  return useMemo(() => ({
    currentResult,
    setCurrentResult,
    analysisHistory,
    saveAnalysis,
    clearHistory,
    loadHistory,
  }), [currentResult, analysisHistory, saveAnalysis, clearHistory, loadHistory]);
});


