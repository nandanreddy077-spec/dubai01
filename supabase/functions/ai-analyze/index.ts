/**
 * Supabase Edge Function for AI Analysis
 * Handles OpenAI API calls with rate limiting and caching
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface AnalysisRequest {
  imageData: {
    imageUri: string;
    analysisType: 'glow' | 'style';
    occasion?: string;
    multiAngle?: boolean;
    visionData?: any; // Optional Google Vision data for glow analysis
  };
  userId: string;
}

// Rate limiting: 10 requests per minute per user
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60000,
};

// In-memory cache for rate limiting (in production, use Redis)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const cached = rateLimitCache.get(userId);

  if (!cached || now > cached.resetAt) {
    rateLimitCache.set(userId, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return true;
  }

  if (cached.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  cached.count++;
  return true;
}

// Response cache (in production, use Redis)
const responseCache = new Map<string, { data: any; expiresAt: number }>();

function getCachedResponse(cacheKey: string): any | null {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  responseCache.delete(cacheKey);
  return null;
}

function setCachedResponse(cacheKey: string, data: any, ttl: number = 3600000): void {
  responseCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

serve(async (req) => {
  console.log('🚀 ai-analyze function invoked', {
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
    const body: AnalysisRequest = await req.json();
    const { imageData, userId } = body;
    
    console.log('📋 Request received:', {
      analysisType: imageData?.analysisType,
      hasImageUri: !!imageData?.imageUri,
      imageUriLength: imageData?.imageUri?.length || 0,
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

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before trying again.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check cache (use image hash as key in production)
    const cacheKey = `${userId}_${imageData.analysisType}_${imageData.imageUri.substring(0, 50)}`;
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return new Response(
        JSON.stringify(cached),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Cache': 'HIT',
          },
        }
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

    // Build prompt based on analysis type
    let prompt = '';
    console.log('📝 Building prompt for analysis type:', imageData.analysisType);
    
    if (imageData.analysisType === 'glow') {
      const analysisType = imageData.multiAngle ? 'multi-angle professional' : 'single-angle';
      let visionContext = '';
      
      if (imageData.visionData) {
        const visionDataStr = typeof imageData.visionData === 'string' 
          ? imageData.visionData 
          : JSON.stringify(imageData.visionData, null, 2);
        
        visionContext = `\n\nGOOGLE VISION ANALYSIS DATA:\n${visionDataStr}\n\nUse this vision data to enhance your analysis accuracy. Consider facial landmarks, face detection confidence, and any detected features when providing your analysis.`;
      }
      
      prompt = `You are a beauty and skincare advisor providing cosmetic guidance. Perform a ${analysisType} comprehensive facial beauty analysis. IMPORTANT: This is for beauty enhancement purposes only, NOT medical diagnosis or treatment.

BEAUTY ANALYSIS REQUIREMENTS:
1. Cosmetic skin analysis (texture, pores, pigmentation, appearance)
2. Beauty concerns assessment (acne appearance, skin tone, aging appearance)
3. Facial structure analysis ${imageData.multiAngle ? '(3D symmetry, profile proportions)' : '(frontal symmetry)'}
4. Beauty scoring for cosmetic purposes
5. General skincare product recommendations (over-the-counter only)
6. Beauty enhancement tips and suggestions (provide exactly 7 specific, actionable recommendations)

CRITICAL: This is cosmetic/beauty guidance only. Do NOT provide medical diagnoses, prescription treatments, or medical procedures. Always recommend consulting a licensed dermatologist for medical concerns.
${visionContext}

Respond with ONLY a valid JSON object with this exact structure:
{
  "skinAnalysis": {
    "skinType": "Normal/Dry/Oily/Combination/Sensitive",
    "skinTone": "Very Light/Light/Medium Light/Medium/Medium Dark/Dark/Very Dark + Warm/Cool/Neutral undertone",
    "skinQuality": "Poor/Fair/Good/Very Good/Excellent",
    "textureScore": 85,
    "clarityScore": 90,
    "hydrationLevel": 80,
    "poreVisibility": 75,
    "elasticity": 88,
    "pigmentationEvenness": 82
  },
  "dermatologyAssessment": {
    "acneRisk": "Low/Medium/High",
    "agingSigns": ["Fine lines", "Loss of elasticity", "Volume loss", "Pigmentation"],
    "skinConcerns": ["Enlarged pores", "Uneven texture", "Dark spots"],
    "recommendedProducts": ["Over-the-counter skincare products only - no prescription treatments"],
    "skinConditions": ["Any detected conditions like rosacea, melasma, etc."],
    "preventiveMeasures": ["SPF 30+ daily", "Antioxidant serums", "Gentle cleansing"]
  },
  "beautyScores": {
    "overallScore": 88,
    "facialSymmetry": 92,
    "skinGlow": 85,
    "jawlineDefinition": 78,
    "eyeArea": 90,
    "lipArea": 85,
    "cheekboneDefinition": 87,
    "skinTightness": 83,
    "facialHarmony": 89
  },
  "beautyRecommendations": ["Provide exactly 7 specific, actionable beauty enhancement recommendations tailored to the user's skin analysis. Include product suggestions, routine tips, and lifestyle advice. Always recommend consulting a dermatologist for medical treatments"],
  "confidence": 0.95,
  "analysisAccuracy": "${imageData.multiAngle ? 'Professional-grade (multi-angle)' : 'Standard (single-angle)'}"
}`;
    } else if (imageData.analysisType === 'style') {
      console.log('👔 Building style analysis prompt for occasion:', imageData.occasion);
      prompt = `Analyze this outfit photo for a ${imageData.occasion || 'general'} occasion. Provide a comprehensive style analysis including:

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
    }

    // Call OpenAI API
    console.log('🤖 Calling OpenAI API...');
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
            content: 'You are an expert beauty and style advisor. Always return valid JSON without markdown formatting.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { 
                  url: imageData.imageUri.startsWith('data:') 
                    ? imageData.imageUri 
                    : `data:image/jpeg;base64,${imageData.imageUri}`
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
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
    console.log('📋 Analysis type:', imageData.analysisType);

    // Parse JSON response
    let analysisResult: any;
    try {
      console.log('📝 Parsing OpenAI response...');
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        console.log('✅ Found JSON in code block');
        analysisResult = JSON.parse(jsonMatch[1]);
      } else {
        // Try parsing the content directly
        try {
          analysisResult = JSON.parse(content);
          console.log('✅ Parsed JSON directly');
        } catch (directParseError) {
          // Fallback: try to find any JSON object
          console.log('⚠️ Direct parse failed, trying to extract JSON object...');
          const objectMatch = content.match(/\{[\s\S]*\}/);
          if (objectMatch) {
            analysisResult = JSON.parse(objectMatch[0]);
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
      
      // Validate response structure based on analysis type
      if (imageData.analysisType === 'style') {
        console.log('👔 Validating style analysis response structure...');
        const requiredStyleFields = ['overallScore', 'vibe', 'colorAnalysis', 'outfitBreakdown', 'occasionMatch', 'bodyTypeRecommendations', 'overallFeedback'];
        const missingFields = requiredStyleFields.filter(field => !(field in analysisResult));
        if (missingFields.length > 0) {
          console.warn('⚠️ Missing style analysis fields:', missingFields);
        } else {
          console.log('✅ Style analysis response structure is valid');
        }
      } else if (imageData.analysisType === 'glow') {
        console.log('✨ Validating glow analysis response structure...');
        const requiredGlowFields = ['skinAnalysis', 'beautyScores', 'beautyRecommendations'];
        const missingFields = requiredGlowFields.filter(field => !(field in analysisResult));
        if (missingFields.length > 0) {
          console.warn('⚠️ Missing glow analysis fields:', missingFields);
        } else {
          console.log('✅ Glow analysis response structure is valid');
        }
      }
      
      console.log('✅ JSON parsed successfully, keys:', Object.keys(analysisResult || {}));
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

    // Cache response for 1 hour
    setCachedResponse(cacheKey, analysisResult, 3600000);

    console.log('✅ Analysis complete, returning result');
    return new Response(
      JSON.stringify(analysisResult),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'MISS',
        },
      }
    );
  } catch (error) {
    console.error('❌ Error in AI analysis:', error);
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

