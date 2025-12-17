/**
 * Supabase Edge Function for Google Vision API
 * Handles image analysis with Google Vision API
 * SECURE: API key is stored server-side only
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
  // Handle CORS
  if (req.method === 'OPTIONS') {
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
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: VisionRequest = await req.json();
    const { imageData, features, userId } = body;

    // Verify userId matches authenticated user
    if (userId !== user.id) {
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
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before trying again.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check Google Vision API key
    if (!GOOGLE_VISION_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Google Vision API key not configured' }),
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
      console.error('Google Vision API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: `Google Vision API error: ${visionResponse.status}`,
          details: visionResponse.status === 400 ? 'Invalid image format or size' : 'API request failed'
        }),
        { status: visionResponse.status >= 500 ? 500 : 400, headers: { 'Content-Type': 'application/json' } }
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
    console.error('Error in Vision analysis:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

















