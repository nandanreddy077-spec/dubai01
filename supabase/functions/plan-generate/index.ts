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
    const { analysisResult, customGoal, userId } = body;
    
    console.log('📋 Request received:', {
      hasAnalysisResult: !!analysisResult,
      hasCustomGoal: !!customGoal,
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
    const prompt = `You are a beauty and skincare advisor providing cosmetic guidance. Create a comprehensive 30-day personalized skincare plan based on the beauty analysis results. The plan should be practical, safe, and use only over-the-counter products. IMPORTANT: This is for beauty enhancement only, NOT medical treatment. Always recommend consulting a dermatologist for medical concerns.

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
}

Create a 30-day skincare plan based on this analysis:

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

Create a progressive 30-day plan with 4 weekly phases. Focus on the lowest scoring areas and address the specific skin concerns. Include morning and evening routines, weekly treatments, and product recommendations with realistic pricing.`;

    // Call OpenAI API
    console.log('🤖 Calling OpenAI API for plan generation...');
    const openaiResponse = await fetch(OPENAI_API_URL, {
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
            content: 'You are an expert beauty and skincare advisor. Always return valid JSON without markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 3000,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API error:', openaiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${openaiResponse.status} - ${errorText}` }),
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

    console.log('✅ Plan generation complete, returning result');
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

