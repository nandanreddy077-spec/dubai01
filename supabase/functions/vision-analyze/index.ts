/**
 * Supabase Edge Function for Google Vision API
 * Handles image analysis with Google Vision API
 * SECURE: API key is stored server-side only
 * SUPPORTS: Both authenticated and guest users
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY');
const GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

interface VisionRequest {
  imageData: string; // Base64 encoded image
  features?: Array<{
    type: string;
    maxResults?: number;
  }>;
  userId: string;
}

// Rate limiting: 20 requests per minute per user
const RATE_LIMIT = {
  maxRequests: 20,
  windowMs: 60000,
};

// In-memory cache for rate limiting
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

serve(async (req) => {
  // Health check endpoint
  if (req.method === 'GET' && req.url.includes('/health')) {
    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        function: 'vision-analyze',
        timestamp: new Date().toISOString(),
        hasApiKey: !!GOOGLE_VISION_API_KEY
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Get authorization header (optional - supports guest access)
    const authHeader = req.headers.get('Authorization');
    let user: any = null;
    let userId: string = 'guest';

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          hint: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to verify user if auth header exists (optional authentication)
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
        
        if (!authError && authUser) {
          user = authUser;
          userId = authUser.id;
          console.log('✅ User authenticated:', userId);
        } else {
          console.warn('⚠️ Auth token invalid, continuing as guest:', authError?.message);
        }
      } catch (authErr) {
        console.warn('⚠️ Auth verification failed, continuing as guest:', authErr);
      }
    } else {
      console.log('ℹ️ No auth header, processing as guest');
    }

    // Parse request body
    let body: VisionRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { imageData, features, userId: requestUserId } = body;

    // Use request userId if provided and valid, otherwise use authenticated user id or 'guest'
    const finalUserId = (requestUserId && requestUserId !== 'guest' && user && requestUserId === user.id) 
      ? requestUserId 
      : (user ? userId : (requestUserId || 'guest'));

    // If user is authenticated and requestUserId is provided, verify it matches
    if (user && requestUserId && requestUserId !== 'guest' && requestUserId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'User ID mismatch' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate image data
    if (!imageData || typeof imageData !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid image data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    if (!checkRateLimit(finalUserId)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before trying again.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check Google Vision API key
    if (!GOOGLE_VISION_API_KEY) {
      console.error('❌ Google Vision API key not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Google Vision API key not configured',
          hint: 'Set GOOGLE_VISION_API_KEY in Supabase Edge Function secrets'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare image data (remove data URL prefix if present)
    let base64Image = imageData;
    if (imageData.includes(',')) {
      base64Image = imageData.split(',')[1];
    }

    // Default features if not provided
    const defaultFeatures = features || [
      { type: 'FACE_DETECTION', maxResults: 10 },
      { type: 'LANDMARK_DETECTION', maxResults: 10 },
      { type: 'LABEL_DETECTION', maxResults: 10 },
      { type: 'SAFE_SEARCH_DETECTION' },
    ];

    console.log('📤 Calling Google Vision API:', {
      userId: finalUserId,
      featuresCount: defaultFeatures.length,
      imageSize: base64Image.length,
    });

    // Call Google Vision API
    const visionResponse = await fetch(
      `${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: defaultFeatures,
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('❌ Google Vision API error:', visionResponse.status, errorText);
      
      let errorMessage = `Google Vision API error: ${visionResponse.status}`;
      let errorDetails = 'API request failed';
      
      if (visionResponse.status === 400) {
        errorDetails = 'Invalid image format or size';
      } else if (visionResponse.status === 403) {
        errorDetails = 'API key invalid or quota exceeded';
      } else if (visionResponse.status === 429) {
        errorDetails = 'API quota exceeded, please try again later';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorDetails
        }),
        { 
          status: visionResponse.status >= 500 ? 500 : 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    const visionData = await visionResponse.json();
    const responses = visionData.responses?.[0];

    if (!responses) {
      return new Response(
        JSON.stringify({ error: 'No response from Google Vision API' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for errors in response
    if (responses.error) {
      return new Response(
        JSON.stringify({ 
          error: 'Google Vision API error',
          details: responses.error.message 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Vision analysis successful:', {
      userId: finalUserId,
      hasFaceAnnotations: !!responses.faceAnnotations,
      faceCount: responses.faceAnnotations?.length || 0,
    });

    return new Response(
      JSON.stringify(responses),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('❌ Error in Vision analysis:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
        hint: 'Please check Edge Function logs for more details'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
});
