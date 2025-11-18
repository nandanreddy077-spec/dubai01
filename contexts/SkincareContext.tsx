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

  // Utility function for making AI API calls with retry logic
  const makeAIRequest = async (messages: any[], maxRetries = 2): Promise<any> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`AI API attempt ${attempt + 1}/${maxRetries + 1}`);
        
        // Try the original API first
        try {
          const response = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.completion) {
              return data.completion;
            }
          }
        } catch (error) {
          console.log('Primary API failed, trying fallback...');
        }
        
        // Fallback to OpenAI API
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY || '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'}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            max_tokens: 2000,
            temperature: 0.7
          })
        });

        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text().catch(() => 'Unknown error');
          console.error(`OpenAI API Response not OK (attempt ${attempt + 1}):`, openaiResponse.status, errorText);
          
          if (openaiResponse.status === 500 && attempt < maxRetries) {
            lastError = new Error(`AI API error: ${openaiResponse.status}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
          
          throw new Error(`AI API error: ${openaiResponse.status}`);
        }

        const openaiData = await openaiResponse.json();
        if (!openaiData.choices?.[0]?.message?.content) {
          throw new Error('No completion in AI response');
        }
        
        return openaiData.choices[0].message.content;
      } catch (error) {
        console.error(`AI API error (attempt ${attempt + 1}):`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
      }
    }
    
    throw lastError || new Error('AI API request failed after all retries');
  };

  const generateCustomPlan = useCallback(async (analysisResult: AnalysisResult, customGoal?: string): Promise<SkincarePlan> => {
    setIsGenerating(true);
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a professional dermatologist and skincare expert. Create a comprehensive 30-day personalized skincare plan based on the skin analysis results. The plan should be practical, safe, and effective.

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

      let completion;
      try {
        completion = await makeAIRequest(messages);
        console.log('Raw AI response:', completion);
      } catch (error) {
        console.error('AI API failed after retries, using fallback:', error);
        // Use fallback plan immediately if AI fails
        const plan = createFallbackPlan(analysisResult, customGoal);
        await savePlan(plan);
        setCurrentPlan(plan);
        return plan;
      }
      
      // Extract JSON from the response (handle markdown formatting)
      let jsonString = completion;
      
      // Remove markdown code blocks if present
      if (jsonString.includes('```json')) {
        const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonString = jsonMatch[1];
        }
      } else if (jsonString.includes('```')) {
        const jsonMatch = jsonString.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonString = jsonMatch[1];
        }
      }
      
      // Clean up the JSON string
      jsonString = jsonString.trim();
      
      // If the response doesn't start with {, try to find JSON in the response
      if (!jsonString.startsWith('{')) {
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        } else {
          console.error('No valid JSON found in response:', jsonString);
          throw new Error('No valid JSON found in AI response');
        }
      }
      
      console.log('Cleaned JSON string:', jsonString);
      
      let planData;
      try {
        planData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Failed to parse:', jsonString);
        
        // Fallback: Create a basic plan structure
        console.log('Creating fallback plan due to parse error');
        const plan = createFallbackPlan(analysisResult, customGoal);
        await savePlan(plan);
        setCurrentPlan(plan);
        return plan;
      }

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
    } catch (error) {
      console.error('Error generating custom plan:', error);
      // Create fallback plan on any error
      const plan = createFallbackPlan(analysisResult, customGoal);
      await savePlan(plan);
      setCurrentPlan(plan);
      return plan;
    } finally {
      setIsGenerating(false);
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
      const messages = [
        {
          role: 'system',
          content: `You are a professional dermatologist. Create a detailed 30-day skincare plan based on the template "${template.title}" and customize it for the user's specific skin analysis results.

IMPORTANT: Return ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or explanatory text. Just the raw JSON object with the exact structure:
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
          content: `Template: ${template.title} - ${template.description}
Target Concerns: ${template.targetConcerns.join(', ')}

User's Skin Analysis:
- Skin Type: ${analysisResult.skinType}
- Skin Concerns: ${analysisResult.dermatologyInsights.skinConcerns.join(', ')}
- Acne Risk: ${analysisResult.dermatologyInsights.acneRisk}
- Detailed Scores: Hydration ${analysisResult.detailedScores.hydrationLevel}%, Texture ${analysisResult.detailedScores.skinTexture}%, Evenness ${analysisResult.detailedScores.evenness}%

Create a customized 30-day plan with 4 weekly phases following the template focus but adapted to their specific needs.`
        }
      ];

      let completion;
      try {
        completion = await makeAIRequest(messages);
        console.log('Raw AI response for template:', completion);
      } catch (error) {
        console.error('AI API failed for template, using fallback:', error);
        // Use fallback plan immediately if AI fails
        const plan = createFallbackTemplatePlan(template, analysisResult);
        await savePlan(plan);
        setCurrentPlan(plan);
        return plan;
      }
      
      // Extract JSON from the response (handle markdown formatting)
      let jsonString = completion;
      
      // Remove markdown code blocks if present
      if (jsonString.includes('```json')) {
        const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonString = jsonMatch[1];
        }
      } else if (jsonString.includes('```')) {
        const jsonMatch = jsonString.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonString = jsonMatch[1];
        }
      }
      
      // Clean up the JSON string
      jsonString = jsonString.trim();
      
      // If the response doesn't start with {, try to find JSON in the response
      if (!jsonString.startsWith('{')) {
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        } else {
          console.error('No valid JSON found in template response:', jsonString);
          throw new Error('No valid JSON found in AI response');
        }
      }
      
      console.log('Cleaned JSON string for template:', jsonString);
      
      let planData;
      try {
        planData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('JSON parse error for template:', parseError);
        console.error('Failed to parse:', jsonString);
        
        // Fallback: Create a basic plan structure based on template
        console.log('Creating fallback plan from template due to parse error');
        const plan = createFallbackTemplatePlan(template, analysisResult);
        await savePlan(plan);
        setCurrentPlan(plan);
        return plan;
      }

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
      return plan;
    } catch (error) {
      console.error('Error creating plan from template:', error);
      // Create fallback plan on any error
      const plan = createFallbackTemplatePlan(template, analysisResult);
      await savePlan(plan);
      setCurrentPlan(plan);
      return plan;
    } finally {
      setIsGenerating(false);
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