import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { SkincarePlan, PlanTemplate } from '@/types/skincare';
import { AnalysisResult } from './AnalysisContext';
import { Platform } from 'react-native';

// Web-compatible storage wrapper
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
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  }
};

interface SkincareContextType {
  currentPlan: SkincarePlan | null;
  setCurrentPlan: (plan: SkincarePlan | null) => void;
  activePlans: SkincarePlan[];
  planHistory: SkincarePlan[];
  savePlan: (plan: SkincarePlan) => Promise<void>;
  updatePlanProgress: (planId: string, progress: Partial<SkincarePlan['progress']>) => Promise<void>;
  generateCustomPlan: (analysisResult: AnalysisResult, customGoal?: string) => Promise<SkincarePlan>;
  getPresetPlans: () => PlanTemplate[];
  createPlanFromTemplate: (template: PlanTemplate, analysisResult: AnalysisResult) => Promise<SkincarePlan>;
  deletePlan: (planId: string) => Promise<void>;
  activatePlan: (planId: string) => Promise<void>;
  deactivatePlan: (planId: string) => Promise<void>;
  canAddMorePlans: boolean;
  isGenerating: boolean;
}

const STORAGE_KEY = 'glowcheck_skincare_plans';

export const [SkincareProvider, useSkincare] = createContextHook((): SkincareContextType => {
  const [currentPlan, setCurrentPlan] = useState<SkincarePlan | null>(null);
  const [activePlans, setActivePlans] = useState<SkincarePlan[]>([]);
  const [planHistory, setPlanHistory] = useState<SkincarePlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const canAddMorePlans = activePlans.length < 3;

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const stored = await storage.getItem(STORAGE_KEY);
      if (stored) {
        const plans = JSON.parse(stored);
        setPlanHistory(plans);
        
        // Filter active plans (not completed and marked as active)
        const activeList = plans.filter((plan: SkincarePlan) => 
          plan.progress.currentDay < plan.duration && plan.isActive !== false
        ).slice(0, 3); // Limit to 3 active plans
        
        setActivePlans(activeList);
        
        // Set current plan to the most recently accessed active one
        if (activeList.length > 0) {
          const mostRecent = activeList.reduce((latest: SkincarePlan, current: SkincarePlan) => 
            (current.lastAccessedAt || current.createdAt) > (latest.lastAccessedAt || latest.createdAt) ? current : latest
          );
          setCurrentPlan(mostRecent);
        }
      }
    } catch (error) {
      console.error('Error loading skincare plans:', error);
    }
  };

  const savePlan = useCallback(async (plan: SkincarePlan) => {
    try {
      const updatedPlan = {
        ...plan,
        isActive: plan.isActive !== false, // Default to active unless explicitly set to false
        lastAccessedAt: Date.now()
      };
      
      const newHistory = [updatedPlan, ...planHistory.filter(p => p.id !== plan.id)];
      setPlanHistory(newHistory);
      
      // Update active plans list
      if (updatedPlan.isActive && updatedPlan.progress.currentDay < updatedPlan.duration) {
        const newActivePlans = [updatedPlan, ...activePlans.filter(p => p.id !== plan.id)].slice(0, 3);
        setActivePlans(newActivePlans);
      }
      
      await storage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving skincare plan:', error);
    }
  }, [planHistory, activePlans]);

  const updatePlanProgress = useCallback(async (planId: string, progressUpdate: Partial<SkincarePlan['progress']>) => {
    try {
      const updatedHistory = planHistory.map(plan => {
        if (plan.id === planId) {
          const updatedPlan = {
            ...plan,
            progress: { ...plan.progress, ...progressUpdate },
            lastAccessedAt: Date.now()
          };
          
          // Update current plan if it's the same
          if (plan.id === currentPlan?.id) {
            setCurrentPlan(updatedPlan);
          }
          
          return updatedPlan;
        }
        return plan;
      });
      
      // Update active plans list
      const updatedActivePlans = activePlans.map(plan => {
        if (plan.id === planId) {
          return {
            ...plan,
            progress: { ...plan.progress, ...progressUpdate },
            lastAccessedAt: Date.now()
          };
        }
        return plan;
      });
      
      setPlanHistory(updatedHistory);
      setActivePlans(updatedActivePlans);
      await storage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error updating plan progress:', error);
    }
  }, [planHistory, currentPlan, activePlans]);

  // Utility function for making AI API calls via Edge Function
  // NOTE: This should NOT be used for plan generation - use plan-generate Edge Function directly
  // This is kept for backward compatibility but will throw an error
  const makeAIRequest = async (messages: any[], maxRetries = 2): Promise<any> => {
    // Don't use direct API calls - they require client-side API key which is invalid
    // All AI calls should go through Edge Functions
    throw new Error('Direct AI API calls are disabled. Please use Edge Functions (plan-generate) instead.');
  };

  const generateCustomPlan = useCallback(async (analysisResult: AnalysisResult, customGoal?: string): Promise<SkincarePlan> => {
    setIsGenerating(true);
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a beauty and skincare advisor providing cosmetic guidance. Create a comprehensive 30-day personalized skincare plan based on the beauty analysis results. The plan should be practical, safe, and use only over-the-counter products. IMPORTANT: This is for beauty enhancement only, NOT medical treatment. Always recommend consulting a dermatologist for medical concerns.

IMPORTANT: Return ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or explanatory text. Just the raw JSON object with this exact structure:
{
  "title": "string",
  "description": "string",
  "targetGoals": ["goal1", "goal2"],
  "weeklyPlans": [
    {
      "week": 1,
      "focus": "string",
      "description": "string",
      "steps": [
        {
          "id": "unique_id",
          "name": "step_name",
          "description": "detailed_description",
          "products": ["product1", "product2"],
          "timeOfDay": "morning|evening|both",
          "frequency": "daily|weekly|bi-weekly|monthly",
          "order": 1,
          "duration": "optional_duration",
          "instructions": ["instruction1", "instruction2"],
          "benefits": ["benefit1", "benefit2"],
          "warnings": ["warning1"]
        }
      ],
      "expectedResults": ["result1", "result2"],
      "tips": ["tip1", "tip2"]
    }
  ],
  "shoppingList": [
    {
      "category": "Cleansers",
      "items": [
        {
          "name": "Product Name",
          "brand": "Brand Name",
          "price": "$XX",
          "where": "Where to buy",
          "priority": "essential|recommended|optional"
        }
      ]
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Create a 30-day skincare plan based on this analysis:

Skin Analysis Results:
- Overall Score: ${analysisResult.overallScore}/100
- Skin Type: ${analysisResult.skinType}
- Skin Tone: ${analysisResult.skinTone}
- Skin Quality: ${analysisResult.skinQuality}
- Acne Risk: ${analysisResult.dermatologyInsights.acneRisk}
- Aging Signs: ${analysisResult.dermatologyInsights.agingSigns.join(', ')}
- Skin Concerns: ${analysisResult.dermatologyInsights.skinConcerns.join(', ')}
- Recommended Treatments: ${analysisResult.dermatologyInsights.recommendedTreatments.join(', ')}

Detailed Scores:
- Jawline Sharpness: ${analysisResult.detailedScores.jawlineSharpness}%
- Brightness & Glow: ${analysisResult.detailedScores.brightnessGlow}%
- Hydration Level: ${analysisResult.detailedScores.hydrationLevel}%
- Facial Symmetry: ${analysisResult.detailedScores.facialSymmetry}%
- Pore Visibility: ${analysisResult.detailedScores.poreVisibility}%
- Skin Texture: ${analysisResult.detailedScores.skinTexture}%
- Skin Evenness: ${analysisResult.detailedScores.evenness}%
- Skin Elasticity: ${analysisResult.detailedScores.elasticity}%

${customGoal ? `Custom Goal: ${customGoal}` : ''}

Create a progressive 30-day plan with 4 weekly phases. Focus on the lowest scoring areas and address the specific skin concerns. Include morning and evening routines, weekly treatments, and product recommendations with realistic pricing.`
        }
      ];

      let planData;
      try {
        // Try Edge Function first (secure, server-side)
        console.log('🤖 Attempting to generate plan via Edge Function...');
        console.log('📋 Analysis result:', {
          hasAnalysisResult: !!analysisResult,
          overallScore: analysisResult?.overallScore,
          skinType: analysisResult?.skinType,
          customGoal,
        });
        
        const { supabase } = await import('../lib/supabase');
        console.log('✅ Supabase imported');
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('🔐 Auth check result:', {
          hasUser: !!user,
          userId: user?.id,
          hasError: !!userError,
          errorMessage: userError?.message,
        });
        
        if (userError) {
          console.error('❌ User auth error:', userError);
          console.error('⚠️ Will use fallback plan due to auth error');
          throw new Error('User authentication failed');
        }
        
        if (!user) {
          // No user authenticated - use fallback plan
          console.warn('⚠️ No user authenticated, using fallback plan');
          console.warn('💡 User should be logged in to use AI plan generation');
          throw new Error('User not authenticated - cannot generate plan');
        }

        console.log('✅ User authenticated:', user.id);
        
        // Get Supabase instance to check configuration
        const supabaseInstance = (await import('../lib/supabase')).supabase;
        console.log('🔗 Supabase configuration:', {
          hasUrl: !!supabaseInstance.supabaseUrl,
          urlPreview: supabaseInstance.supabaseUrl?.substring(0, 50) + '...',
          hasAnonKey: !!supabaseInstance.supabaseKey,
        });

        // Retry logic for Edge Function (up to 3 attempts)
        const MAX_RETRIES = 3;
        let lastError: any = null;
        
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            console.log(`📤 Calling plan-generate Edge Function (attempt ${attempt}/${MAX_RETRIES})...`);
            console.log('📋 Request payload:', {
              hasAnalysisResult: !!analysisResult,
              overallScore: analysisResult.overallScore,
              skinType: analysisResult.skinType,
              skinTone: analysisResult.skinTone,
              hasCustomGoal: !!customGoal,
              userId: user.id,
            });
            console.log('🌐 About to invoke Edge Function: plan-generate');
            console.log('🔗 Supabase client:', {
              hasSupabase: !!supabase,
              hasFunctions: !!supabase.functions,
              hasInvoke: typeof supabase.functions.invoke === 'function',
            });

            const requestBody = {
              analysisResult: {
                overallScore: analysisResult.overallScore,
                skinType: analysisResult.skinType,
                skinTone: analysisResult.skinTone,
                skinQuality: analysisResult.skinQuality,
                dermatologyInsights: analysisResult.dermatologyInsights,
                detailedScores: analysisResult.detailedScores,
              },
              customGoal,
              userId: user.id,
            };
            
            console.log('📦 Request body size:', JSON.stringify(requestBody).length, 'bytes');
            console.log('📦 Request body preview:', JSON.stringify(requestBody).substring(0, 300));

            console.log('🚀 INVOKING Edge Function NOW...');
            const startTime = Date.now();
            
            const { data, error } = await supabase.functions.invoke('plan-generate', {
              body: requestBody,
            });
            
            const duration = Date.now() - startTime;
            console.log(`🌐 Edge Function invoke completed in ${duration}ms`);
            
            if (error) {
              console.error('❌ Edge Function invoke returned error:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                details: JSON.stringify(error, null, 2),
              });
            } else {
              console.log('✅ Edge Function invoke succeeded (no error object)');
            }

            console.log(`📥 Edge Function response (attempt ${attempt}):`, {
              hasData: !!data,
              hasError: !!error,
              dataType: typeof data,
              errorType: typeof error,
              errorMessage: error?.message,
              errorName: error?.name,
              dataKeys: data ? Object.keys(data) : [],
              dataPreview: data ? JSON.stringify(data).substring(0, 200) : null,
            });

            if (error) {
              console.error(`❌ Edge Function invoke error (attempt ${attempt}):`, error);
              console.error('Error name:', error.name);
              console.error('Error message:', error.message);
              console.error('Error details:', JSON.stringify(error, null, 2));
              
              // Retry on network errors or 5xx errors
              if (attempt < MAX_RETRIES && (
                error.message?.includes('network') ||
                error.message?.includes('timeout') ||
                error.message?.includes('fetch') ||
                error.message?.includes('Failed to fetch')
              )) {
                console.log(`⏳ Retrying in ${attempt * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                lastError = error;
                continue;
              }
              
              throw new Error(`Plan generation failed: ${error.message || 'Unknown error'}`);
            }

            if (data?.error) {
              console.error(`❌ Edge Function returned error in data (attempt ${attempt}):`, data.error);
              console.error('Error details:', data.details || 'No additional details');
              console.error('Full data response:', JSON.stringify(data, null, 2));
              
              // Don't retry on application errors (4xx, validation errors, etc.)
              throw new Error(`Plan generation failed: ${data.error}`);
            }

            if (!data) {
              console.error(`❌ Edge Function returned no data (attempt ${attempt})`);
              
              // Retry if no data (might be a transient issue)
              if (attempt < MAX_RETRIES) {
                console.log(`⏳ Retrying in ${attempt * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                lastError = new Error('No data returned from Edge Function');
                continue;
              }
              
              throw new Error('Plan generation failed: No data returned from Edge Function');
            }

            // Edge Function returns the plan data directly (already parsed JSON by Supabase client)
            console.log('✅ Plan generated via Edge Function');
            console.log('📋 Plan data received:', {
              hasData: !!data,
              dataType: typeof data,
              keys: data ? Object.keys(data) : [],
              hasTitle: !!data?.title,
              hasWeeklyPlans: !!data?.weeklyPlans,
              weeklyPlansCount: data?.weeklyPlans?.length || 0,
            });
            
            // Validate plan structure
            if (!data || typeof data !== 'object') {
              throw new Error('Invalid plan data structure from Edge Function');
            }
            
            if (!data.title || !data.weeklyPlans || !Array.isArray(data.weeklyPlans)) {
              console.error('❌ Plan data missing required fields:', {
                hasTitle: !!data.title,
                hasWeeklyPlans: !!data.weeklyPlans,
                weeklyPlansIsArray: Array.isArray(data.weeklyPlans),
                dataKeys: Object.keys(data),
              });
              throw new Error('Plan data missing required fields (title, weeklyPlans)');
            }
            
            planData = data; // Already parsed JSON from Edge Function
            break; // Success, exit retry loop
          } catch (edgeError: any) {
            console.error(`❌ Edge Function attempt ${attempt} failed:`, edgeError);
            console.error('Error message:', edgeError?.message);
            console.error('Error stack:', edgeError?.stack);
            
            lastError = edgeError;
            
            // Don't retry on validation errors or authentication errors
            if (edgeError?.message?.includes('missing required fields') ||
                edgeError?.message?.includes('Invalid plan') ||
                edgeError?.message?.includes('Unauthorized') ||
                edgeError?.message?.includes('authentication')) {
              throw edgeError; // Don't retry, fail immediately
            }
            
            // If last attempt, throw error
            if (attempt === MAX_RETRIES) {
              throw edgeError;
            }
            
            // Wait before retrying
            console.log(`⏳ Retrying in ${attempt * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          }
        }
        
        if (!planData) {
          throw lastError || new Error('Failed to generate plan after all retries');
        }
      } catch (error: any) {
        console.error('❌ AI API failed after retries:', error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Use fallback plan immediately if AI fails
        console.log('🔄 Creating fallback plan...');
        const plan = createFallbackPlan(analysisResult, customGoal);
        await savePlan(plan);
        setCurrentPlan(plan);
        console.log('✅ Fallback plan created and saved');
        return plan;
      }
      
      // Plan data should already be parsed (from Edge Function) or parsed above (from direct API)
      if (!planData || typeof planData !== 'object') {
        console.error('Invalid plan data received');
        throw new Error('Invalid plan data from AI');
      }
      
      console.log('✅ Plan data parsed successfully, keys:', Object.keys(planData));

      const plan: SkincarePlan = {
        id: `plan_${Date.now()}`,
        duration: 30,
        skinType: analysisResult.skinType,
        skinConcerns: analysisResult.dermatologyInsights.skinConcerns,
        createdAt: Date.now(),
        analysisId: analysisResult.timestamp.toString(),
        customGoal,
        progress: {
          currentDay: 1,
          completedSteps: [],
          photos: [],
          notes: []
        },
        ...planData
      };

      await savePlan(plan);
      setCurrentPlan(plan);
      return plan;
    } catch (error: any) {
      console.error('❌ Error generating custom plan:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('Full error:', JSON.stringify(error, null, 2));
      
      // Create fallback plan on any error
      console.log('🔄 Creating fallback plan due to error...');
      const plan = createFallbackPlan(analysisResult, customGoal);
      await savePlan(plan);
      setCurrentPlan(plan);
      console.log('✅ Fallback plan created and saved');
      return plan;
    } finally {
      setIsGenerating(false);
      console.log('🏁 Plan generation process finished');
    }
  }, [savePlan]);

  // Helper function to create fallback plan
  const createFallbackPlan = (analysisResult: AnalysisResult, customGoal?: string): SkincarePlan => {
    return {
      id: `plan_${Date.now()}`,
      duration: 30,
      skinType: analysisResult.skinType,
      skinConcerns: analysisResult.dermatologyInsights.skinConcerns,
      createdAt: Date.now(),
      analysisId: analysisResult.timestamp.toString(),
      customGoal,
      progress: {
        currentDay: 1,
        completedSteps: [],
        photos: [],
        notes: []
      },
      title: 'Custom Skincare Plan',
      description: 'A personalized skincare routine based on your analysis',
      targetGoals: ['Improve skin health', 'Address skin concerns'],
      weeklyPlans: [
        {
          week: 1,
          focus: 'Foundation Building',
          description: 'Establishing a gentle routine',
          steps: [
            {
              id: 'cleanse_morning',
              name: 'Gentle Cleanser',
              description: 'Start with a gentle cleanser suitable for your skin type',
              products: ['Gentle facial cleanser'],
              timeOfDay: 'morning',
              frequency: 'daily',
              order: 1,
              instructions: ['Apply to damp skin', 'Massage gently', 'Rinse with lukewarm water'],
              benefits: ['Removes impurities', 'Prepares skin for other products']
            },
            {
              id: 'moisturize_morning',
              name: 'Moisturizer',
              description: 'Hydrate and protect your skin',
              products: ['Daily moisturizer'],
              timeOfDay: 'morning',
              frequency: 'daily',
              order: 2,
              instructions: ['Apply to clean skin', 'Massage until absorbed'],
              benefits: ['Maintains hydration', 'Strengthens skin barrier']
            }
          ],
          expectedResults: ['Improved skin texture', 'Better hydration'],
          tips: ['Be consistent with your routine', 'Listen to your skin']
        }
      ],
      shoppingList: [
        {
          category: 'Cleansers',
          items: [
            {
              name: 'Gentle Facial Cleanser',
              brand: 'Various brands available',
              price: '$15-25',
              where: 'Drugstore or online',
              priority: 'essential'
            }
          ]
        }
      ]
    };
  };

  const getPresetPlans = useCallback((): PlanTemplate[] => {
    return [
      {
        id: 'acne_control',
        title: 'Acne Control & Prevention',
        description: 'Comprehensive plan to reduce breakouts and prevent future acne',
        targetConcerns: ['acne', 'blackheads', 'oily skin', 'large pores'],
        difficulty: 'intermediate',
        estimatedCost: 'medium',
        preview: {
          morningSteps: 4,
          eveningSteps: 5,
          weeklyTreatments: 2
        }
      },
      {
        id: 'anti_aging',
        title: 'Anti-Aging & Firming',
        description: 'Target fine lines, wrinkles, and improve skin elasticity',
        targetConcerns: ['fine lines', 'wrinkles', 'loss of elasticity', 'age spots'],
        difficulty: 'advanced',
        estimatedCost: 'high',
        preview: {
          morningSteps: 5,
          eveningSteps: 6,
          weeklyTreatments: 3
        }
      },
      {
        id: 'hydration_glow',
        title: 'Hydration & Glow Boost',
        description: 'Restore moisture and achieve radiant, glowing skin',
        targetConcerns: ['dryness', 'dullness', 'dehydration', 'rough texture'],
        difficulty: 'beginner',
        estimatedCost: 'low',
        preview: {
          morningSteps: 3,
          eveningSteps: 4,
          weeklyTreatments: 1
        }
      },
      {
        id: 'sensitive_repair',
        title: 'Sensitive Skin Repair',
        description: 'Gentle routine to calm irritation and strengthen skin barrier',
        targetConcerns: ['sensitivity', 'redness', 'irritation', 'damaged barrier'],
        difficulty: 'beginner',
        estimatedCost: 'medium',
        preview: {
          morningSteps: 3,
          eveningSteps: 4,
          weeklyTreatments: 1
        }
      },
      {
        id: 'pigmentation_even',
        title: 'Pigmentation & Even Tone',
        description: 'Reduce dark spots and achieve even skin tone',
        targetConcerns: ['dark spots', 'hyperpigmentation', 'uneven tone', 'melasma'],
        difficulty: 'intermediate',
        estimatedCost: 'medium',
        preview: {
          morningSteps: 4,
          eveningSteps: 5,
          weeklyTreatments: 2
        }
      }
    ];
  }, []);

  const createPlanFromTemplate = useCallback(async (template: PlanTemplate, analysisResult: AnalysisResult): Promise<SkincarePlan> => {
    setIsGenerating(true);
    try {
      console.log('📋 Creating personalized plan from template:', template.title);
      console.log('📊 Analysis result:', {
        hasAnalysisResult: !!analysisResult,
        overallScore: analysisResult?.overallScore,
        skinType: analysisResult?.skinType,
        templateId: template.id,
      });

      let planData;
      try {
        // Try Edge Function first (secure, server-side) - personalized based on user's skin analysis
        console.log('🤖 Attempting to generate personalized template plan via Edge Function...');
        const { supabase } = await import('../lib/supabase');
        console.log('✅ Supabase imported');
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('🔐 Auth check result:', {
          hasUser: !!user,
          userId: user?.id,
          hasError: !!userError,
          errorMessage: userError?.message,
        });
        
        if (userError) {
          console.error('❌ User auth error:', userError);
          throw new Error('User authentication failed');
        }
        
        if (!user) {
          console.warn('⚠️ No user authenticated, using fallback plan');
          throw new Error('User not authenticated - cannot generate plan');
        }

        console.log('✅ User authenticated:', user.id);

        // Retry logic for Edge Function (up to 3 attempts)
        const MAX_RETRIES = 3;
        let lastError: any = null;
        
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            console.log(`📤 Calling plan-generate Edge Function for template (attempt ${attempt}/${MAX_RETRIES})...`);
            console.log('📋 Request payload:', {
              hasAnalysisResult: !!analysisResult,
              overallScore: analysisResult.overallScore,
              skinType: analysisResult.skinType,
              templateId: template.id,
              templateTitle: template.title,
              userId: user.id,
            });

            const requestBody = {
              analysisResult: {
                overallScore: analysisResult.overallScore,
                skinType: analysisResult.skinType,
                skinTone: analysisResult.skinTone,
                skinQuality: analysisResult.skinQuality,
                dermatologyInsights: analysisResult.dermatologyInsights,
                detailedScores: analysisResult.detailedScores,
              },
              templateId: template.id,
              templateTitle: template.title,
              templateDescription: template.description,
              templateTargetConcerns: template.targetConcerns,
              userId: user.id,
            };
            
            console.log('🚀 INVOKING Edge Function for template plan...');
            const startTime = Date.now();
            
            const { data, error } = await supabase.functions.invoke('plan-generate', {
              body: requestBody,
            });
            
            const duration = Date.now() - startTime;
            console.log(`🌐 Edge Function invoke completed in ${duration}ms`);

            console.log(`📥 Edge Function response (attempt ${attempt}):`, {
              hasData: !!data,
              hasError: !!error,
              dataType: typeof data,
              errorType: typeof error,
              errorMessage: error?.message,
              errorName: error?.name,
              dataKeys: data ? Object.keys(data) : [],
            });

            if (error) {
              console.error(`❌ Edge Function invoke error (attempt ${attempt}):`, error);
              
              // Retry on network errors
              if (attempt < MAX_RETRIES && (
                error.message?.includes('network') ||
                error.message?.includes('timeout') ||
                error.message?.includes('fetch')
              )) {
                console.log(`⏳ Retrying in ${attempt * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                lastError = error;
                continue;
              }
              
              throw new Error(`Plan generation failed: ${error.message || 'Unknown error'}`);
            }

            if (data?.error) {
              console.error(`❌ Edge Function returned error in data (attempt ${attempt}):`, data.error);
              throw new Error(`Plan generation failed: ${data.error}`);
            }

            if (!data) {
              console.error(`❌ Edge Function returned no data (attempt ${attempt})`);
              
              if (attempt < MAX_RETRIES) {
                console.log(`⏳ Retrying in ${attempt * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                lastError = new Error('No data returned from Edge Function');
                continue;
              }
              
              throw new Error('Plan generation failed: No data returned from Edge Function');
            }

            // Validate plan structure
            if (!data || typeof data !== 'object') {
              throw new Error('Invalid plan data structure from Edge Function');
            }
            
            if (!data.title || !data.weeklyPlans || !Array.isArray(data.weeklyPlans)) {
              console.error('❌ Plan data missing required fields:', {
                hasTitle: !!data.title,
                hasWeeklyPlans: !!data.weeklyPlans,
                weeklyPlansIsArray: Array.isArray(data.weeklyPlans),
                dataKeys: Object.keys(data),
              });
              throw new Error('Plan data missing required fields (title, weeklyPlans)');
            }
            
            planData = data;
            console.log('✅ Personalized template plan generated via Edge Function');
            break; // Success, exit retry loop
          } catch (edgeError: any) {
            console.error(`❌ Edge Function attempt ${attempt} failed:`, edgeError);
            lastError = edgeError;
            
            // Don't retry on validation errors
            if (edgeError?.message?.includes('missing required fields') ||
                edgeError?.message?.includes('Invalid plan') ||
                edgeError?.message?.includes('Unauthorized')) {
              throw edgeError;
            }
            
            if (attempt === MAX_RETRIES) {
              throw edgeError;
            }
            
            console.log(`⏳ Retrying in ${attempt * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          }
        }
        
        if (!planData) {
          throw lastError || new Error('Failed to generate plan after all retries');
        }
      } catch (error: any) {
        console.error('❌ AI plan generation failed:', error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        
        // Use fallback plan if Edge Function fails
        console.log('🔄 Creating fallback template plan...');
        const plan = createFallbackTemplatePlan(template, analysisResult);
        await savePlan(plan);
        setCurrentPlan(plan);
        console.log('✅ Fallback template plan created and saved');
        return plan;
      }
      
      // Plan data should already be parsed (from Edge Function)
      if (!planData || typeof planData !== 'object') {
        console.error('Invalid plan data received');
        throw new Error('Invalid plan data from AI');
      }
      
      console.log('✅ Plan data parsed successfully, keys:', Object.keys(planData));

      const plan: SkincarePlan = {
        id: `plan_${Date.now()}`,
        duration: 30,
        skinType: analysisResult.skinType,
        skinConcerns: analysisResult.dermatologyInsights.skinConcerns,
        createdAt: Date.now(),
        analysisId: analysisResult.timestamp.toString(),
        progress: {
          currentDay: 1,
          completedSteps: [],
          photos: [],
          notes: []
        },
        ...planData
      };

      await savePlan(plan);
      setCurrentPlan(plan);
      console.log('✅ Personalized template plan created and saved');
      return plan;
    } catch (error: any) {
      console.error('❌ Error creating plan from template:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      // Create fallback plan on any error
      console.log('🔄 Creating fallback template plan due to error...');
      const plan = createFallbackTemplatePlan(template, analysisResult);
      await savePlan(plan);
      setCurrentPlan(plan);
      console.log('✅ Fallback template plan created and saved');
      return plan;
    } finally {
      setIsGenerating(false);
      console.log('🏁 Template plan generation process finished');
    }
  }, [savePlan]);

  // Helper function to create fallback template plan
  const createFallbackTemplatePlan = (template: PlanTemplate, analysisResult: AnalysisResult): SkincarePlan => {
    return {
      id: `plan_${Date.now()}`,
      duration: 30,
      skinType: analysisResult.skinType,
      skinConcerns: analysisResult.dermatologyInsights.skinConcerns,
      createdAt: Date.now(),
      analysisId: analysisResult.timestamp.toString(),
      progress: {
        currentDay: 1,
        completedSteps: [],
        photos: [],
        notes: []
      },
      title: template.title,
      description: template.description,
      targetGoals: template.targetConcerns,
      weeklyPlans: [
        {
          week: 1,
          focus: 'Getting Started',
          description: `Beginning your ${template.title.toLowerCase()} journey`,
          steps: [
            {
              id: 'cleanse_morning',
              name: 'Gentle Cleanser',
              description: 'Start with a gentle cleanser',
              products: ['Gentle facial cleanser'],
              timeOfDay: 'morning',
              frequency: 'daily',
              order: 1,
              instructions: ['Apply to damp skin', 'Massage gently', 'Rinse thoroughly'],
              benefits: ['Removes impurities', 'Prepares skin']
            }
          ],
          expectedResults: ['Improved skin condition'],
          tips: ['Be consistent with your routine']
        }
      ],
      shoppingList: [
        {
          category: 'Essentials',
          items: [
            {
              name: 'Basic Cleanser',
              brand: 'Various',
              price: '$15-25',
              where: 'Drugstore',
              priority: 'essential'
            }
          ]
        }
      ]
    };
  };

  const deletePlan = useCallback(async (planId: string) => {
    try {
      const updatedHistory = planHistory.filter(plan => plan.id !== planId);
      const updatedActivePlans = activePlans.filter(plan => plan.id !== planId);
      
      setPlanHistory(updatedHistory);
      setActivePlans(updatedActivePlans);
      
      if (currentPlan?.id === planId) {
        // Set current plan to the next active plan or null
        const nextPlan = updatedActivePlans.length > 0 ? updatedActivePlans[0] : null;
        setCurrentPlan(nextPlan);
      }
      
      await storage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  }, [planHistory, currentPlan, activePlans]);

  const activatePlan = useCallback(async (planId: string) => {
    try {
      if (activePlans.length >= 3) {
        throw new Error('Maximum of 3 active plans allowed');
      }
      
      const planToActivate = planHistory.find(plan => plan.id === planId);
      if (!planToActivate) {
        throw new Error('Plan not found');
      }
      
      const updatedPlan = {
        ...planToActivate,
        isActive: true,
        lastAccessedAt: Date.now()
      };
      
      await savePlan(updatedPlan);
      setCurrentPlan(updatedPlan);
    } catch (error) {
      console.error('Error activating plan:', error);
      throw error;
    }
  }, [planHistory, activePlans, savePlan]);

  const deactivatePlan = useCallback(async (planId: string) => {
    try {
      const planToDeactivate = planHistory.find(plan => plan.id === planId);
      if (!planToDeactivate) {
        throw new Error('Plan not found');
      }
      
      const updatedPlan = {
        ...planToDeactivate,
        isActive: false
      };
      
      const updatedHistory = planHistory.map(plan => 
        plan.id === planId ? updatedPlan : plan
      );
      const updatedActivePlans = activePlans.filter(plan => plan.id !== planId);
      
      setPlanHistory(updatedHistory);
      setActivePlans(updatedActivePlans);
      
      if (currentPlan?.id === planId) {
        // Set current plan to the next active plan or null
        const nextPlan = updatedActivePlans.length > 0 ? updatedActivePlans[0] : null;
        setCurrentPlan(nextPlan);
      }
      
      await storage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error deactivating plan:', error);
      throw error;
    }
  }, [planHistory, activePlans, currentPlan]);

  return useMemo(() => ({
    currentPlan,
    setCurrentPlan,
    activePlans,
    planHistory,
    savePlan,
    updatePlanProgress,
    generateCustomPlan,
    getPresetPlans,
    createPlanFromTemplate,
    deletePlan,
    activatePlan,
    deactivatePlan,
    canAddMorePlans,
    isGenerating
  }), [currentPlan, activePlans, planHistory, savePlan, updatePlanProgress, generateCustomPlan, getPresetPlans, createPlanFromTemplate, deletePlan, activatePlan, deactivatePlan, canAddMorePlans, isGenerating]);
});