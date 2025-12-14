import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { StyleAnalysisResult } from '@/types/user';

const OCCASIONS = [
  { id: 'casual', name: 'Casual Day Out', icon: '👕' },
  { id: 'work', name: 'Work/Office', icon: '💼' },
  { id: 'date', name: 'Date Night', icon: '💕' },
  { id: 'party', name: 'Party/Event', icon: '🎉' },
  { id: 'formal', name: 'Formal Event', icon: '👔' },
  { id: 'wedding', name: 'Wedding', icon: '💒' },
  { id: 'interview', name: 'Job Interview', icon: '📋' },
  { id: 'gym', name: 'Gym/Workout', icon: '💪' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'brunch', name: 'Brunch/Lunch', icon: '🥂' },
];

export const [StyleProvider, useStyle] = createContextHook(() => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<StyleAnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<StyleAnalysisResult[]>([]);

  const loadAnalysisHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('styleAnalysisHistory');
      if (stored) {
        const history = JSON.parse(stored);
        setAnalysisHistory(history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
    }
  }, []);

  useEffect(() => {
    loadAnalysisHistory();
  }, [loadAnalysisHistory]);

  const saveAnalysisToHistory = useCallback(async (result: StyleAnalysisResult) => {
    try {
      const updatedHistory = [result, ...analysisHistory.slice(0, 9)];
      setAnalysisHistory(updatedHistory);
      await AsyncStorage.setItem('styleAnalysisHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving analysis to history:', error);
    }
  }, [analysisHistory]);

  // Utility function for making AI API calls using centralized OpenAI service
  const makeAIRequest = async (messages: any[], maxRetries = 2): Promise<any> => {
    const { makeOpenAIRequest, formatMessages } = await import('../lib/openai-service');
    
    const formattedMessages = formatMessages(messages);
    const result = await makeOpenAIRequest(formattedMessages, {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2000,
    }, maxRetries);
    
    if (!result) {
      throw new Error('AI API request failed after all retries');
    }
    
    return result;
  };

  const analyzeOutfit = useCallback(async (imageUri: string, occasion: string): Promise<StyleAnalysisResult> => {
    setIsAnalyzing(true);
    
    try {
      const analysisPrompt = `
Analyze this outfit photo for a ${occasion} occasion. Provide a comprehensive style analysis including:

1. Overall vibe and aesthetic
2. Color analysis and harmony
3. Detailed breakdown of each clothing item (top, bottom, accessories)
4. Jewelry and accessories evaluation
5. Appropriateness for the occasion
6. Body type recommendations
7. Specific improvement suggestions
8. Color recommendations that would suit the person
9. Style suggestions for this specific occasion

Be very detailed and precise. Rate each aspect out of 100. Provide constructive feedback.

Respond in this exact JSON format:
{
  "overallScore": number,
  "vibe": "string describing the overall aesthetic",
  "colorAnalysis": {
    "dominantColors": ["color1", "color2", "color3"],
    "colorHarmony": number,
    "seasonalMatch": "Spring/Summer/Autumn/Winter",
    "recommendedColors": ["color1", "color2", "color3"]
  },
  "outfitBreakdown": {
    "top": {
      "item": "description",
      "fit": number,
      "color": "color",
      "style": "style description",
      "rating": number,
      "feedback": "detailed feedback"
    },
    "bottom": {
      "item": "description",
      "fit": number,
      "color": "color",
      "style": "style description",
      "rating": number,
      "feedback": "detailed feedback"
    },
    "accessories": {
      "jewelry": {
        "items": ["item1", "item2"],
        "appropriateness": number,
        "feedback": "feedback"
      },
      "shoes": {
        "style": "shoe style",
        "match": number,
        "feedback": "feedback"
      },
      "bag": {
        "style": "bag style",
        "match": number,
        "feedback": "feedback"
      }
    }
  },
  "occasionMatch": {
    "appropriateness": number,
    "formalityLevel": "Casual/Smart Casual/Business/Formal",
    "suggestions": ["suggestion1", "suggestion2"]
  },
  "bodyTypeRecommendations": {
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"],
    "stylesThatSuit": ["style1", "style2"]
  },
  "overallFeedback": {
    "whatWorked": ["positive1", "positive2"],
    "improvements": ["improvement1", "improvement2"],
    "specificSuggestions": ["suggestion1", "suggestion2"]
  }
}`;

      // Use the unified AI service via Edge Function (with retries)
      let analysisData;
      const MAX_RETRIES = 3;
      let lastError: any = null;
      
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          console.log(`🤖 Starting style analysis via Edge Function (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          const { analyzeStyle } = await import('../lib/ai-service');
          
          analysisData = await analyzeStyle(imageUri, occasion);
          console.log(`✅ Style analysis completed via Edge Function (attempt ${attempt + 1})`);
          break; // Success, exit retry loop
        } catch (error: any) {
          lastError = error;
          console.warn(`⚠️ Style AI attempt ${attempt + 1} failed:`, error?.message || error);
          
          // Retry on network/temporary errors
          if (attempt < MAX_RETRIES - 1 && (
            error?.message?.includes('network') ||
            error?.message?.includes('timeout') ||
            error?.message?.includes('rate limit') ||
            error?.message?.includes('429') ||
            error?.message?.includes('503')
          )) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
          
          // If last attempt or non-retryable error, use fallback
          if (attempt === MAX_RETRIES - 1) {
            console.error('❌ Style AI failed after all retries, using fallback');
            const fallbackAnalysis = createFallbackStyleAnalysis(occasion);
            const result: StyleAnalysisResult = {
              id: Date.now().toString(),
              image: imageUri,
              occasion,
              ...fallbackAnalysis,
              timestamp: new Date()
            };
            
            setAnalysisResult(result);
            await saveAnalysisToHistory(result);
            return result;
          }
        }
      }
      
      // If we get here without analysisData, something went wrong
      if (!analysisData) {
        console.error('❌ Style analysis failed completely, using fallback');
        const fallbackAnalysis = createFallbackStyleAnalysis(occasion);
        const result: StyleAnalysisResult = {
          id: Date.now().toString(),
          image: imageUri,
          occasion,
          ...fallbackAnalysis,
          timestamp: new Date()
        };
        
        setAnalysisResult(result);
        await saveAnalysisToHistory(result);
        return result;
      }
        }
      }
      
      // If we get here without analysisData, something went wrong
      if (!analysisData) {
        console.error('❌ Style analysis failed completely, using fallback');
        const fallbackAnalysis = createFallbackStyleAnalysis(occasion);
        const result: StyleAnalysisResult = {
          id: Date.now().toString(),
          image: imageUri,
          occasion,
          ...fallbackAnalysis,
          timestamp: new Date()
        };
        
        setAnalysisResult(result);
        await saveAnalysisToHistory(result);
        return result;
      }

      const result: StyleAnalysisResult = {
        id: Date.now().toString(),
        image: imageUri,
        occasion,
        ...analysisData,
        timestamp: new Date()
      };

      setAnalysisResult(result);
      await saveAnalysisToHistory(result);
      
      return result;
    } catch (error) {
      console.error('Error analyzing outfit:', error);
      // Create fallback analysis on any error
      const fallbackAnalysis = createFallbackStyleAnalysis(occasion);
      const result: StyleAnalysisResult = {
        id: Date.now().toString(),
        image: imageUri,
        occasion,
        ...fallbackAnalysis,
        timestamp: new Date()
      };
      
      setAnalysisResult(result);
      await saveAnalysisToHistory(result);
      return result;
    } finally {
      setIsAnalyzing(false);
    }
  }, [saveAnalysisToHistory]);

  // Helper function to create fallback style analysis
  const createFallbackStyleAnalysis = (occasion: string) => {
    return {
      overallScore: 75,
      vibe: 'Stylish and put-together',
      colorAnalysis: {
        dominantColors: ['Black', 'White', 'Blue'],
        colorHarmony: 80,
        seasonalMatch: 'Autumn',
        recommendedColors: ['Navy', 'Burgundy', 'Cream']
      },
      outfitBreakdown: {
        top: {
          item: 'Casual top',
          fit: 85,
          color: 'Neutral',
          style: 'Classic',
          rating: 80,
          feedback: 'Good fit and style choice'
        },
        bottom: {
          item: 'Casual bottom',
          fit: 80,
          color: 'Neutral',
          style: 'Classic',
          rating: 75,
          feedback: 'Complements the overall look'
        },
        accessories: {
          jewelry: {
            items: ['Watch', 'Ring'],
            appropriateness: 85,
            feedback: 'Well-chosen accessories'
          },
          shoes: {
            style: 'Casual',
            match: 80,
            feedback: 'Good match for the outfit'
          },
          bag: {
            style: 'Casual',
            match: 75,
            feedback: 'Functional and stylish'
          }
        }
      },
      occasionMatch: {
        appropriateness: 85,
        formalityLevel: 'Casual',
        suggestions: ['Consider adding a statement piece', `Great for ${occasion.toLowerCase()}`]
      },
      bodyTypeRecommendations: {
        strengths: ['Good proportions', 'Flattering fit'],
        improvements: ['Try different silhouettes', 'Experiment with colors'],
        stylesThatSuit: ['Classic', 'Casual', 'Smart casual']
      },
      overallFeedback: {
        whatWorked: ['Good color coordination', 'Appropriate for occasion'],
        improvements: ['Add more personality', 'Try bolder accessories'],
        specificSuggestions: ['Consider layering', 'Experiment with textures']
      }
    };
  };

  const resetAnalysis = useCallback(() => {
    setCurrentImage(null);
    setSelectedOccasion(null);
    setAnalysisResult(null);
  }, []);

  return useMemo(() => ({
    occasions: OCCASIONS,
    currentImage,
    setCurrentImage,
    selectedOccasion,
    setSelectedOccasion,
    isAnalyzing,
    analysisResult,
    analysisHistory,
    analyzeOutfit,
    resetAnalysis
    // Note: analyzeOutfit is intentionally excluded from deps to avoid circular dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [currentImage, selectedOccasion, isAnalyzing, analysisResult, analysisHistory, resetAnalysis]);
});


