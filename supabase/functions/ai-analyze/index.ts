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
      let visionInstructions = '';
      
      // Extract and format Vision API data for AI
      if (imageData.visionData) {
        const vision = imageData.visionData;
        const frontFace = vision.front?.faceAnnotations?.[0];
        const leftFace = vision.left?.faceAnnotations?.[0];
        const rightFace = vision.right?.faceAnnotations?.[0];
        const imageProps = vision.front?.imagePropertiesAnnotation;
        
        // Build detailed vision context
        const visionDetails: string[] = [];
        
        if (frontFace) {
          visionDetails.push(`FRONT VIEW ANALYSIS:
- Face Detection Confidence: ${(frontFace.detectionConfidence * 100).toFixed(1)}%
- Facial Landmarks Detected: ${frontFace.landmarks?.map((l: any) => l.type).join(', ') || 'None'}
- Face Angles: Roll ${frontFace.rollAngle?.toFixed(1)}°, Pan ${frontFace.panAngle?.toFixed(1)}°, Tilt ${frontFace.tiltAngle?.toFixed(1)}°
- Face Position: ${frontFace.boundingPoly ? 'Centered' : 'Not detected'}
- Joy Likelihood: ${frontFace.joyLikelihood || 'UNKNOWN'}
- Sorrow Likelihood: ${frontFace.sorrowLikelihood || 'UNKNOWN'}
- Anger Likelihood: ${frontFace.angerLikelihood || 'UNKNOWN'}
- Surprise Likelihood: ${frontFace.surpriseLikelihood || 'UNKNOWN'}
- Under Exposed: ${frontFace.underExposedLikelihood || 'UNKNOWN'}
- Blurred: ${frontFace.blurredLikelihood || 'UNKNOWN'}
- Headwear: ${frontFace.headwearLikelihood || 'UNKNOWN'}`);
        }
        
        if (imageData.multiAngle && leftFace && rightFace) {
          visionDetails.push(`LEFT PROFILE ANALYSIS:
- Face Detection Confidence: ${(leftFace.detectionConfidence * 100).toFixed(1)}%
- Pan Angle: ${leftFace.panAngle?.toFixed(1)}° (negative = left turn)
- Key Landmarks: ${leftFace.landmarks?.filter((l: any) => ['NOSE_TIP', 'LEFT_EYE', 'CHIN'].includes(l.type)).map((l: any) => l.type).join(', ') || 'None'}`);

          visionDetails.push(`RIGHT PROFILE ANALYSIS:
- Face Detection Confidence: ${(rightFace.detectionConfidence * 100).toFixed(1)}%
- Pan Angle: ${rightFace.panAngle?.toFixed(1)}° (positive = right turn)
- Key Landmarks: ${rightFace.landmarks?.filter((l: any) => ['NOSE_TIP', 'RIGHT_EYE', 'CHIN'].includes(l.type)).map((l: any) => l.type).join(', ') || 'None'}`);
        }
        
        if (imageProps?.dominantColors?.colors) {
          const colors = imageProps.dominantColors.colors.slice(0, 5);
          visionDetails.push(`IMAGE PROPERTIES:
- Dominant Colors: ${colors.map((c: any) => `RGB(${c.color?.red || 0},${c.color?.green || 0},${c.color?.blue || 0}) ${(c.score * 100).toFixed(1)}% coverage`).join('; ')}
- Color Analysis: Use these color values to assess skin tone, brightness, and overall complexion`);
        }
        
        visionContext = `\n\n=== GOOGLE VISION API ANALYSIS DATA ===\n${visionDetails.join('\n\n')}\n\n=== END VISION DATA ===\n`;
        
        visionInstructions = `\n\nCRITICAL: Use the Vision API data above to enhance your analysis:
1. FACE DETECTION CONFIDENCE: Higher confidence (>0.7) = more reliable analysis. Lower confidence = be more cautious.
2. FACIAL LANDMARKS: Use detected landmarks (eyes, nose, mouth, chin) to assess symmetry, proportions, and facial structure accurately.
3. FACE ANGLES: 
   - Roll angle (head tilt): Use to assess if face is straight or tilted
   - Pan angle (left/right turn): For profiles, expect -30° to -60° (left) or +30° to +60° (right)
   - Tilt angle (up/down): Use to assess if looking up/down
4. IMAGE QUALITY INDICATORS:
   - Under Exposed: If VERY_LIKELY or LIKELY, mention lighting limitations
   - Blurred: If VERY_LIKELY or LIKELY, note that texture analysis may be less accurate
   - Headwear: If detected, note any obstruction
5. EMOTION LIKELIHOODS: Use to assess facial expression (neutral is best for analysis)
6. COLOR DATA: Use dominant colors to assess skin tone, brightness, and complexion characteristics
7. MULTI-ANGLE DATA: If available, use left/right profiles to assess facial symmetry and 3D structure

INTEGRATE THIS DATA: Don't just mention it - USE it to make your scores and assessments more accurate. For example:
- If confidence is 0.9+ and landmarks are complete, you can be more confident in symmetry scores
- If pan angle shows proper profile (45-60°), use that angle's data for side analysis
- If colors show warm undertones, factor that into skin tone assessment
- If blur is detected, lower texture/clarity scores appropriately`;
      }
      
      prompt = `You are a board-certified dermatologist and aesthetic medicine expert with 20+ years of experience. You're analyzing ${analysisType} facial photographs to provide evidence-based skincare and beauty assessments. This is for BEAUTY ENHANCEMENT and SKINCARE GUIDANCE ONLY - NOT medical diagnosis.

🎯 YOUR EXPERTISE:
- Dermatological skin analysis (acne, aging, texture, pigmentation)
- Aesthetic medicine (facial symmetry, proportions, skin quality)
- Evidence-based skincare recommendations
- Product ingredient efficacy and safety
- Multi-angle facial structure assessment

📋 ANALYSIS METHODOLOGY:
1. VISUAL INSPECTION: Examine the image(s) systematically:
   - Skin texture and pore visibility
   - Pigmentation and evenness
   - Hydration indicators (plumpness, glow, fine lines)
   - Acne, blemishes, or skin concerns
   - Facial symmetry and proportions
   - Jawline definition and facial contours
   - Eye area (dark circles, fine lines, puffiness)
   - Overall skin radiance and brightness

2. USE VISION API DATA: ${visionContext ? 'The Vision API has provided detailed facial analysis data. You MUST use this data to enhance your assessment:' : 'No Vision API data available - rely on visual inspection only.'}
${visionInstructions}

3. DERMATOLOGICAL ASSESSMENT:
   - Skin Type: Determine from visible characteristics (oiliness, dryness, combination patterns)
   - Skin Concerns: Identify specific issues (acne, hyperpigmentation, fine lines, texture, pores)
   - Aging Signs: Assess visible signs (fine lines, loss of elasticity, volume changes)
   - Acne Risk: Evaluate based on visible blemishes, pore size, and skin texture
   - Skin Quality: Overall health indicators (radiance, evenness, texture smoothness)

4. BEAUTY SCORING (0-100 scale):
   - Overall Score: Weighted average considering all factors
   - Facial Symmetry: ${imageData.multiAngle ? 'Use multi-angle data for 3D symmetry assessment' : 'Assess from front view only'}
   - Skin Glow: Radiance, brightness, healthy appearance
   - Jawline Definition: Clarity and sharpness of jawline
   - Eye Area: Brightness, lack of dark circles, minimal fine lines
   - Lip Area: Fullness, definition, hydration
   - Cheekbone Definition: Prominence and structure
   - Skin Tightness: Firmness, lack of sagging
   - Facial Harmony: Overall balance and proportions

5. EVIDENCE-BASED RECOMMENDATIONS:
   - Base recommendations on VISIBLE characteristics
   - Include specific ingredients (e.g., "Niacinamide 10% for pore visibility")
   - Provide realistic timelines ("Visible improvement typically seen in 4-6 weeks with consistent use")
   - Consider skin type and concerns identified
   - Recommend OTC products only (no prescriptions)
   - Include preventive measures (SPF, antioxidants)

⚠️ IMPORTANT LIMITATIONS:
- Photo analysis has limitations (lighting, angles, camera quality)
- Cannot diagnose medical conditions
- Cannot assess internal skin health
- Results are estimates based on visual appearance
- Always recommend dermatologist consultation for medical concerns

📊 OUTPUT REQUIREMENTS:
You MUST return a valid JSON object with this EXACT structure. All scores are 0-100 integers. All arrays must contain specific, actionable items:

{
  "skinAnalysis": {
    "skinType": "Normal" | "Dry" | "Oily" | "Combination" | "Sensitive" (choose ONE based on visible characteristics),
    "skinTone": "Very Light/Warm" | "Light/Cool" | "Medium/Warm" | "Medium Dark/Neutral" | "Dark/Warm" | "Very Dark/Cool" (include undertone),
    "skinQuality": "Poor" | "Fair" | "Good" | "Very Good" | "Excellent",
    "textureScore": 0-100 (smoothness, roughness, visible texture),
    "clarityScore": 0-100 (lack of blemishes, evenness),
    "hydrationLevel": 0-100 (plumpness, lack of fine lines, glow),
    "poreVisibility": 0-100 (lower = more visible pores, higher = less visible),
    "elasticity": 0-100 (firmness, lack of sagging),
    "pigmentationEvenness": 0-100 (uniformity of skin tone, lack of dark spots)
  },
  "dermatologyAssessment": {
    "acneRisk": "Low" | "Medium" | "High" (based on visible blemishes and pore characteristics),
    "agingSigns": ["Specific signs like 'Fine lines around eyes'", "Loss of cheek volume", "Nasolabial folds", "Crow's feet"] (be SPECIFIC),
    "skinConcerns": ["Enlarged pores in T-zone", "Hyperpigmentation on cheeks", "Uneven texture", "Dullness"] (be SPECIFIC and location-based),
    "recommendedTreatments": ["Niacinamide 10% serum for pore visibility", "Vitamin C 20% for brightening", "Retinol 0.5% for fine lines"] (include specific ingredients and percentages),
    "skinConditions": ["Rosacea (mild redness on cheeks)", "Melasma (brown patches)", etc.] (only if clearly visible, otherwise empty array),
    "preventiveMeasures": ["SPF 30+ daily", "Antioxidant serum (Vitamin C/E/Ferulic)", "Gentle cleanser pH 5.5", "Hydrating moisturizer with ceramides"]
  },
  "beautyScores": {
    "overallScore": 0-100 (weighted average of all factors),
    "facialSymmetry": 0-100 ${imageData.multiAngle ? '(use multi-angle data for 3D assessment)' : '(assess from front view)'},
    "skinGlow": 0-100 (radiance, brightness, healthy appearance),
    "jawlineDefinition": 0-100 (clarity, sharpness, definition),
    "eyeArea": 0-100 (brightness, lack of dark circles/puffiness, minimal fine lines),
    "lipArea": 0-100 (fullness, definition, hydration, lack of fine lines),
    "cheekboneDefinition": 0-100 (prominence, structure, visibility),
    "skinTightness": 0-100 (firmness, lack of sagging, elasticity),
    "facialHarmony": 0-100 (overall balance, proportions, aesthetic appeal)
  },
  "beautyRecommendations": [
    "EXACTLY 7 SPECIFIC recommendations. Each must:",
    "1. Be specific and actionable ('Apply niacinamide 10% serum to T-zone morning and evening')",
    "2. Include ingredient names and percentages when relevant",
    "3. Reference visible characteristics ('Based on visible pore size in your T-zone...')",
    "4. Include timeline ('Most users see improvement in 4-6 weeks')",
    "5. Be evidence-based and realistic",
    "6. Address specific concerns identified in analysis",
    "7. Include tracking advice ('Take weekly photos to monitor progress')"
  ],
  "confidence": 0.0-1.0 (0.7 = good photo quality and complete data, 0.5 = limitations present, 0.9+ = excellent quality with multi-angle),
  "analysisAccuracy": "Description of analysis quality and limitations",
  "trackingTip": "Specific advice on how to track progress effectively"
}

CRITICAL: 
- Use Vision API data to INFORM your scores (don't ignore it)
- Be SPECIFIC in recommendations (ingredients, percentages, application methods)
- Base scores on VISIBLE characteristics, not assumptions
- If Vision data shows low confidence or poor quality, reflect that in confidence score
- For multi-angle: Use profile data to assess symmetry and 3D structure
- All recommendations must be actionable and evidence-based`;
    } else if (imageData.analysisType === 'style') {
      console.log('👔 Building style analysis prompt for occasion:', imageData.occasion);
      prompt = `You are a supportive style coach helping someone develop their personal style for a ${imageData.occasion || 'general'} occasion. You're providing helpful feedback based on this photo, while being honest about what you can see.

🎯 YOUR MISSION: Give specific, actionable style feedback that helps them feel confident and know exactly what to do next.

BE SPECIFIC AND OBSERVANT:
1. Overall vibe - describe the exact aesthetic you see (e.g., "Modern minimalist with relaxed tailoring" not just "casual")
2. Color analysis - identify the specific colors visible, how they work together, suggest complementary options
3. Each visible item - describe what you see: the top, bottom, shoes, accessories with specific details
4. What's working well - celebrate specific choices that are flattering or on-point
5. Occasion fit - honestly assess if this works for ${imageData.occasion || 'the occasion'} and explain why
6. Specific improvements - actionable swaps ("Try a silk blouse instead of cotton for a dressier feel" or "Add a belt to define the waist")
7. Color palette - suggest 5-7 colors that would work with their visible coloring
8. Complete outfit ideas for this occasion

YOUR TONE:
- Specific and detailed (mention what you actually see)
- Constructive and kind (praise what works, gently suggest improvements)
- Actionable (they should know exactly what to shop for or change)
- Honest but encouraging (if something doesn't work, explain why and offer better options)

Be very detailed and precise. Rate each aspect out of 100 with clear reasoning. Provide constructive, actionable feedback.

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
            content: `You are a board-certified dermatologist and aesthetic medicine expert. You analyze facial photographs using Google Vision API data to provide evidence-based skincare assessments. 

CRITICAL RULES:
1. Always return valid JSON without markdown code blocks
2. Use the Vision API data provided to enhance your analysis accuracy
3. Base all scores on visible characteristics in the image(s)
4. Be specific in recommendations (include ingredient names, percentages, application methods)
5. All scores must be integers between 0-100
6. All arrays must contain specific, actionable items
7. If Vision API data indicates poor image quality, reflect that in confidence score
8. For multi-angle analysis, use profile data to assess 3D facial structure

Your response must be ONLY the JSON object, no additional text.`,
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
        max_tokens: 3000, // Increased for more detailed responses
        temperature: 0.3, // Lower for more consistent, accurate results
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
        } catch {
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
        
        // Check required fields
        const requiredGlowFields = ['skinAnalysis', 'dermatologyAssessment', 'beautyScores', 'beautyRecommendations'];
        const missingFields = requiredGlowFields.filter(field => !(field in analysisResult));
        if (missingFields.length > 0) {
          console.warn('⚠️ Missing glow analysis fields:', missingFields);
        }
        
        // Validate score ranges
        if (analysisResult.beautyScores) {
          const scores = analysisResult.beautyScores;
          Object.keys(scores).forEach(key => {
            if (typeof scores[key] === 'number') {
              if (scores[key] < 0 || scores[key] > 100) {
                console.warn(`⚠️ Score ${key} out of range: ${scores[key]}, clamping to 0-100`);
                scores[key] = Math.max(0, Math.min(100, Math.round(scores[key])));
              } else {
                scores[key] = Math.round(scores[key]); // Ensure integer
              }
            }
          });
        }
        
        // Validate skin analysis scores
        if (analysisResult.skinAnalysis) {
          const skinScores = ['textureScore', 'clarityScore', 'hydrationLevel', 'poreVisibility', 'elasticity', 'pigmentationEvenness'];
          skinScores.forEach(key => {
            if (analysisResult.skinAnalysis[key] !== undefined) {
              const value = analysisResult.skinAnalysis[key];
              if (typeof value === 'number') {
                analysisResult.skinAnalysis[key] = Math.max(0, Math.min(100, Math.round(value)));
              }
            }
          });
        }
        
        // Validate skin type enum
        const validSkinTypes = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'];
        if (analysisResult.skinAnalysis?.skinType && !validSkinTypes.includes(analysisResult.skinAnalysis.skinType)) {
          console.warn(`⚠️ Invalid skin type: ${analysisResult.skinAnalysis.skinType}, defaulting to Normal`);
          analysisResult.skinAnalysis.skinType = 'Normal';
        }
        
        // Validate skin quality enum
        const validSkinQualities = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
        if (analysisResult.skinAnalysis?.skinQuality && !validSkinQualities.includes(analysisResult.skinAnalysis.skinQuality)) {
          console.warn(`⚠️ Invalid skin quality: ${analysisResult.skinAnalysis.skinQuality}, defaulting to Good`);
          analysisResult.skinAnalysis.skinQuality = 'Good';
        }
        
        // Validate acne risk enum
        const validAcneRisks = ['Low', 'Medium', 'High'];
        if (analysisResult.dermatologyAssessment?.acneRisk && !validAcneRisks.includes(analysisResult.dermatologyAssessment.acneRisk)) {
          console.warn(`⚠️ Invalid acne risk: ${analysisResult.dermatologyAssessment.acneRisk}, defaulting to Low`);
          analysisResult.dermatologyAssessment.acneRisk = 'Low';
        }
        
        // Ensure exactly 7 recommendations
        if (analysisResult.beautyRecommendations) {
          if (!Array.isArray(analysisResult.beautyRecommendations)) {
            console.warn('⚠️ beautyRecommendations is not an array, converting...');
            analysisResult.beautyRecommendations = [analysisResult.beautyRecommendations];
          }
          if (analysisResult.beautyRecommendations.length !== 7) {
            console.warn(`⚠️ Expected 7 recommendations, got ${analysisResult.beautyRecommendations.length}`);
            // Pad or trim to 7
            while (analysisResult.beautyRecommendations.length < 7) {
              analysisResult.beautyRecommendations.push('Continue tracking your progress weekly to see improvements');
            }
            analysisResult.beautyRecommendations = analysisResult.beautyRecommendations.slice(0, 7);
          }
        }
        
        // Ensure arrays exist and are arrays
        if (!Array.isArray(analysisResult.dermatologyAssessment?.agingSigns)) {
          analysisResult.dermatologyAssessment.agingSigns = [];
        }
        if (!Array.isArray(analysisResult.dermatologyAssessment?.skinConcerns)) {
          analysisResult.dermatologyAssessment.skinConcerns = [];
        }
        if (!Array.isArray(analysisResult.dermatologyAssessment?.recommendedTreatments)) {
          analysisResult.dermatologyAssessment.recommendedTreatments = [];
        }
        if (!Array.isArray(analysisResult.dermatologyAssessment?.skinConditions)) {
          analysisResult.dermatologyAssessment.skinConditions = [];
        }
        if (!Array.isArray(analysisResult.dermatologyAssessment?.preventiveMeasures)) {
          analysisResult.dermatologyAssessment.preventiveMeasures = [];
        }
        
        // Validate confidence score
        if (analysisResult.confidence !== undefined) {
          analysisResult.confidence = Math.max(0, Math.min(1, parseFloat(analysisResult.confidence)));
        } else {
          analysisResult.confidence = 0.75; // Default confidence
        }
        
        console.log('✅ Glow analysis response validated and normalized');
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

