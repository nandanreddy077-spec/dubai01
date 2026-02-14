/**
 * Supabase Edge Function for Skincare Plan Generation
 * Handles OpenAI API calls for generating personalized skincare plans
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface PlanRequest {
  analysisResult: {
    overallScore: number;
    skinType: string;
    skinTone: string;
    skinQuality: string;
    dermatologyInsights: {
      acneRisk: string;
      agingSigns: string[];
      skinConcerns: string[];
      recommendedTreatments: string[];
    };
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
  };
  customGoal?: string;
  templateId?: string; // Template plan ID (e.g., 'acne_control', 'anti_aging')
  templateTitle?: string; // Template plan title
  templateDescription?: string; // Template plan description
  templateTargetConcerns?: string[]; // Template target concerns
  userId: string;
}

serve(async (req) => {
  console.log('🚀 plan-generate function invoked', {
    method: req.method,
    url: req.url,
    hasAuth: !!req.headers.get('Authorization'),
  });

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request');
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Authorization header present');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ Supabase client initialized');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    console.log('🔐 Verifying user token...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Parse request body
    console.log('📥 Parsing request body...');
    const body: PlanRequest = await req.json();
    const { analysisResult, customGoal, templateId, templateTitle, templateDescription, templateTargetConcerns, userId } = body;
    
    console.log('📋 Request received:', {
      hasAnalysisResult: !!analysisResult,
      hasCustomGoal: !!customGoal,
      hasTemplate: !!templateId,
      templateId,
      templateTitle,
      userId,
      userMatches: userId === user.id,
    });

    // Verify userId matches authenticated user
    if (userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'User ID mismatch' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check OpenAI API key
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ OpenAI API key configured');

    // Build prompt for plan generation
    let planContext = '';
    if (templateId && templateTitle) {
      // Template-based plan - personalize based on template focus + user's skin analysis
      planContext = `Create a comprehensive 30-day personalized skincare plan based on the "${templateTitle}" template, but CUSTOMIZE it specifically for this user's unique skin analysis results. 

Template Focus: ${templateTitle}
${templateDescription ? `Template Description: ${templateDescription}` : ''}
${templateTargetConcerns && templateTargetConcerns.length > 0 ? `Template Target Concerns: ${templateTargetConcerns.join(', ')}` : ''}

IMPORTANT: While following the template's focus (${templateTitle}), you MUST personalize every aspect of the plan based on the user's actual skin analysis below. The plan should address their specific skin type, concerns, scores, and needs. Make it feel genuinely tailored to them, not generic.`;
    } else {
      // Custom plan
      planContext = `Create a comprehensive 30-day personalized skincare plan based on the beauty analysis results.`;
    }

    const prompt = `You are a board-certified dermatologist and skincare expert with 20+ years of clinical experience. You're creating a personalized 30-day skincare routine based on comprehensive skin analysis. This is for BEAUTY ENHANCEMENT and SKINCARE GUIDANCE ONLY - NOT medical diagnosis or treatment.

🎯 YOUR EXPERTISE:
- Evidence-based skincare recommendations
- Product ingredient efficacy and safety
- Skin barrier health and repair
- Progressive treatment protocols
- Realistic timeline expectations
- Product compatibility and layering

📋 ANALYSIS DATA PROVIDED:
Skin Type: ${analysisResult.skinType}
Skin Quality: ${analysisResult.skinQuality}
Acne Risk: ${analysisResult.dermatologyInsights.acneRisk}
Aging Signs: ${analysisResult.dermatologyInsights.agingSigns.join(', ')}
Skin Concerns: ${analysisResult.dermatologyInsights.skinConcerns.join(', ')}
Recommended Treatments: ${analysisResult.dermatologyInsights.recommendedTreatments.join(', ')}

Detailed Scores (Focus on areas below 80%):
- Hydration: ${analysisResult.detailedScores.hydrationLevel}%
- Texture: ${analysisResult.detailedScores.skinTexture}%
- Pore Visibility: ${analysisResult.detailedScores.poreVisibility}%
- Brightness: ${analysisResult.detailedScores.brightnessGlow}%
- Evenness: ${analysisResult.detailedScores.evenness}%
- Elasticity: ${analysisResult.detailedScores.elasticity}%

${customGoal ? `User's Primary Goal: ${customGoal}` : ''}

🔬 EVIDENCE-BASED REQUIREMENTS:

1. INGREDIENT SELECTION:
   - Use ONLY proven, research-backed ingredients
   - Specify exact ingredient names and typical concentrations
   - For acne: Salicylic Acid (0.5-2%), Niacinamide (2-10%), Benzoyl Peroxide (2.5-5%)
   - For anti-aging: Retinol (0.025-1%), Peptides, Vitamin C (5-20%), Niacinamide
   - For hydration: Hyaluronic Acid (0.1-2%), Ceramides, Glycerin
   - For brightening: Niacinamide, Vitamin C, Alpha Arbutin, Kojic Acid
   - AVOID: Unproven ingredients, high alcohol content, harsh fragrances

2. PROGRESSIVE PROTOCOL:
   - Week 1-2: Gentle introduction, barrier repair focus
   - Week 3-4: Introduce actives gradually
   - Week 5-6: Full routine with active treatments
   - Week 7-8: Maintenance and optimization
   - Include "skin barrier check" points

3. PRODUCT LAYERING (Correct Order):
   - Morning: Cleanser → Toner → Serum → Moisturizer → SPF
   - Evening: Cleanser → Exfoliant (2-3x/week) → Treatment Serum → Moisturizer
   - Wait times between actives (pH-dependent products)

4. SAFETY & COMPATIBILITY:
   - NO mixing: Retinol + Vitamin C (use at different times)
   - NO mixing: Retinol + AHA/BHA (alternate days)
   - YES pairing: Niacinamide + most actives (very compatible)
   - Include patch testing instructions
   - Include irritation warning signs

5. REALISTIC TIMELINES:
   - Hydration improvements: 1-2 weeks
   - Texture improvements: 4-6 weeks
   - Acne reduction: 6-8 weeks
   - Hyperpigmentation: 8-12 weeks
   - Fine lines: 12-16 weeks
   - Set realistic expectations in each week's description

6. PRODUCT SPECIFICITY:
   - Recommend specific product TYPES with key ingredients
   - Include price ranges (Budget: $5-20, Mid: $20-60, Luxury: $60+)
   - Explain WHY each product is recommended for THIS user
   - Include alternatives for different budgets

7. SKIN BARRIER PROTECTION:
   - Always include barrier repair steps
   - Recommend ceramides, niacinamide, fatty acids
   - Include "rest days" if using strong actives
   - Monitor for over-exfoliation

${templateId && templateTitle ? `
TEMPLATE FOCUS: ${templateTitle}
While following this template's approach, personalize EVERY step based on the user's actual analysis.
Focus on their lowest scores: ${Object.entries(analysisResult.detailedScores).sort((a, b) => a[1] - b[1]).slice(0, 3).map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}%`).join(', ')}
` : ''}

⚠️ CRITICAL SAFETY RULES:
- NO prescription medications (OTC only)
- NO medical claims or diagnoses
- Always recommend dermatologist consultation for persistent issues
- Include patch testing for new products
- Warn about potential irritation with actives
- Include "stop if irritation occurs" warnings

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
          "description": "Detailed description explaining WHY this step helps THIS user's specific concerns (${analysisResult.dermatologyInsights.skinConcerns.join(', ')}) and how it addresses their lowest scores. Must be at least 100 characters and genuinely personalized.",
          "products": ["Product type with key ingredients (e.g., 'Niacinamide 10% serum')"],
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
          "name": "Product Type with Key Ingredients",
          "brand": "Look for brands with [specific ingredients]",
          "price": "$XX-XX (Budget/Mid/Luxury range)",
          "where": "Where to buy",
          "priority": "essential|recommended|optional",
          "keyIngredients": ["Ingredient1", "Ingredient2"],
          "why": "Explains why this product addresses THIS user's specific concerns"
        }
      ]
    }
  ]
}

📊 CREATE THE PLAN:

Create a progressive 30-day plan with 4 weekly phases. ${templateId ? 'While following the template focus, ' : ''}Focus on the lowest scoring areas and address the specific skin concerns. Include morning and evening routines, weekly treatments, and product recommendations with realistic pricing.

CRITICAL REQUIREMENTS FOR EACH STEP:
- Every step must explain WHY it helps THIS user's specific concerns
- Include specific ingredient names and concentrations when possible
- Set realistic expectations (not promises)
- Focus on their lowest scoring areas: ${Object.entries(analysisResult.detailedScores).sort((a, b) => a[1] - b[1]).slice(0, 3).map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}%`).join(', ')}
- Make it feel genuinely personalized, not generic
- Include safety warnings where appropriate
- Explain the science behind each recommendation
- Each step description should be at least 100 characters explaining the benefit for THIS user`;

    // Call OpenAI API
    console.log('🤖 Calling OpenAI API for plan generation...');
    console.log('📋 Prompt length:', prompt.length);
    console.log('🔑 API Key present:', !!OPENAI_API_KEY);
    console.log('🔑 API Key prefix:', OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 7) : 'N/A');
    
    let openaiResponse;
    try {
      openaiResponse = await fetch(OPENAI_API_URL, {
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
              content: `You are a board-certified dermatologist creating evidence-based skincare routines. 

CRITICAL RULES:
1. Always return valid JSON without markdown code blocks
2. Every step must be personalized to THIS user's specific analysis
3. Include specific ingredient names and concentrations
4. Explain WHY each step helps their specific concerns
5. Set realistic timelines (not false promises)
6. Include safety warnings where appropriate
7. Focus on their lowest scoring areas
8. Make descriptions at least 100 characters explaining benefits

Your response must be ONLY the JSON object, no additional text.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 4000, // More tokens for detailed, helpful routines
          temperature: 0.3, // Lower for more consistent, accurate results
        }),
      });

      console.log('📥 OpenAI response status:', openaiResponse.status);
      console.log('📥 OpenAI response ok:', openaiResponse.ok);

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('❌ OpenAI API error:', openaiResponse.status);
        console.error('❌ Error response:', errorText);
        return new Response(
          JSON.stringify({ 
            error: `OpenAI API error: ${openaiResponse.status}`,
            details: errorText.substring(0, 500) // Limit error text length
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (fetchError) {
      console.error('❌ Fetch error calling OpenAI:', fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to call OpenAI API',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
      }

      console.log('✅ OpenAI API response received');
      const openaiData = await openaiResponse.json();
      const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      console.error('❌ No content in OpenAI response');
      return new Response(
        JSON.stringify({ error: 'No response from OpenAI' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ OpenAI content received, length:', content.length);

    // Parse JSON response
    let planData;
    try {
      console.log('📝 Parsing OpenAI response...');
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        console.log('✅ Found JSON in code block');
        planData = JSON.parse(jsonMatch[1]);
      } else {
        // Try parsing the content directly
        try {
          planData = JSON.parse(content);
          console.log('✅ Parsed JSON directly');
        } catch (directParseError) {
          // Fallback: try to find any JSON object
          console.log('⚠️ Direct parse failed, trying to extract JSON object...');
          const objectMatch = content.match(/\{[\s\S]*\}/);
          if (objectMatch) {
            planData = JSON.parse(objectMatch[0]);
            console.log('✅ Extracted and parsed JSON object');
          } else {
            console.error('❌ No JSON object found in response');
            console.error('Response content (first 500 chars):', content.substring(0, 500));
            return new Response(
              JSON.stringify({ 
                error: 'Failed to parse AI response',
                details: 'No valid JSON found in OpenAI response',
                responsePreview: content.substring(0, 200)
              }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      }
      console.log('✅ JSON parsed successfully, keys:', Object.keys(planData || {}));
      
      // Validate plan helpfulness and specificity
      if (planData.weeklyPlans && Array.isArray(planData.weeklyPlans)) {
        planData.weeklyPlans.forEach((week: any, weekIndex: number) => {
          if (week.steps && Array.isArray(week.steps)) {
            week.steps.forEach((step: any, stepIndex: number) => {
              // Ensure descriptions are specific, not generic
              if (!step.description || step.description.length < 50) {
                console.warn(`⚠️ Step ${stepIndex} in week ${weekIndex + 1} has generic description (${step.description?.length || 0} chars)`);
              }
              
              // Ensure benefits are explained
              if (!step.benefits || step.benefits.length === 0) {
                console.warn(`⚠️ Step ${stepIndex} in week ${weekIndex + 1} missing benefits`);
              }
              
              // Ensure products are specific
              if (!step.products || step.products.length === 0) {
                console.warn(`⚠️ Step ${stepIndex} in week ${weekIndex + 1} missing product recommendations`);
              }
              
              // Ensure instructions are provided
              if (!step.instructions || step.instructions.length === 0) {
                console.warn(`⚠️ Step ${stepIndex} in week ${weekIndex + 1} missing instructions`);
              }
            });
          }
        });
        console.log('✅ Plan helpfulness validation complete');
      }
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      console.error('Response content (first 500 chars):', content.substring(0, 500));
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
          responsePreview: content.substring(0, 200)
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate plan structure before returning
    if (!planData.title || !planData.weeklyPlans || !Array.isArray(planData.weeklyPlans)) {
      console.error('❌ Invalid plan structure:', {
        hasTitle: !!planData.title,
        hasWeeklyPlans: !!planData.weeklyPlans,
        weeklyPlansIsArray: Array.isArray(planData.weeklyPlans),
        planKeys: Object.keys(planData || {}),
      });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid plan structure from AI',
          details: 'Plan missing required fields: title or weeklyPlans',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Plan generation complete, returning result');
    console.log('📋 Plan structure validated:', {
      title: planData.title,
      weeklyPlansCount: planData.weeklyPlans?.length || 0,
      hasShoppingList: !!planData.shoppingList,
      hasTargetGoals: !!planData.targetGoals,
    });
    
    return new Response(
      JSON.stringify(planData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('❌ Error in plan generation:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});




