/**
 * Centralized API Service for Backend Communication
 * Handles all API calls with rate limiting, caching, and error handling
 */

import { supabase } from './supabase';
import { trackApiMetric } from './monitoring';

// Use Supabase Edge Functions for API calls
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
};

// In-memory rate limit tracking (for client-side throttling)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

/**
 * Check and update rate limit
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const key = `rate_limit_${userId}`;
  const cached = rateLimitCache.get(key);

  if (!cached || now > cached.resetAt) {
    rateLimitCache.set(key, { count: 1, resetAt: now + RATE_LIMIT_CONFIG.windowMs });
    return true;
  }

  if (cached.count >= RATE_LIMIT_CONFIG.maxRequests) {
    return false;
  }

  cached.count++;
  return true;
}

/**
 * Make API request with error handling and retry logic
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 2,
  userId?: string
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  let lastError: Error | null = null;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const responseTime = Date.now() - startTime;

      // Track metric
      trackApiMetric({
        endpoint,
        method: options.method || 'GET',
        statusCode: response.status,
        responseTimeMs: responseTime,
        userId,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        
        // Retry on server errors (5xx)
        if (response.status >= 500 && attempt < retries) {
          lastError = new Error(`API error: ${response.status}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }

        // Don't retry on client errors (4xx)
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Track error metric
      trackApiMetric({
        endpoint,
        method: options.method || 'GET',
        statusCode: 500,
        responseTimeMs: responseTime,
        userId,
      });

      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  throw lastError || new Error('API request failed');
}

/**
 * Paginated database query helper
 */
export async function paginatedQuery<T>(
  table: string,
  params: PaginationParams & {
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    select?: string;
  }
): Promise<PaginatedResponse<T>> {
  const {
    page = 0,
    pageSize = 20,
    filters = {},
    orderBy = { column: 'created_at', ascending: false },
    select = '*',
  } = params;

  const offset = page * pageSize;
  const limit = pageSize;

  let query = supabase
    .from(table)
    .select(select, { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order(orderBy.column, { ascending: orderBy.ascending ?? false });

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
  });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  return {
    data: (data || []) as T[],
    page,
    pageSize,
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  };
}

/**
 * AI Analysis API - calls Supabase Edge Function
 */
export async function analyzeImageWithAI(
  imageData: {
    imageUri: string;
    analysisType: 'glow' | 'style';
    occasion?: string;
    multiAngle?: boolean;
  },
  userId: string
): Promise<any> {
  // Check rate limit
  if (!checkRateLimit(userId)) {
    throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
  }

  // Get auth token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Call Supabase Edge Function
  const response = await fetch(`${API_BASE_URL}/ai-analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    body: JSON.stringify({
      imageData,
      userId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait before trying again.');
    }
    throw new Error(`AI analysis failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Get paginated analysis history
 */
export async function getAnalysisHistory(
  userId: string,
  params: PaginationParams = {}
): Promise<PaginatedResponse<any>> {
  const result = await paginatedQuery('glow_analyses', {
    ...params,
    filters: { user_id: userId },
    orderBy: { column: 'created_at', ascending: false },
  });
  
  // Track metric
  trackApiMetric({
    endpoint: 'getAnalysisHistory',
    method: 'GET',
    statusCode: 200,
    responseTimeMs: 0, // Will be measured by query
    userId,
  });
  
  return result;
}

/**
 * Get paginated style analysis history
 */
export async function getStyleAnalysisHistory(
  userId: string,
  params: PaginationParams = {}
): Promise<PaginatedResponse<any>> {
  return paginatedQuery('style_analyses', {
    ...params,
    filters: { user_id: userId },
    orderBy: { column: 'created_at', ascending: false },
  });
}

/**
 * Get paginated skincare plans
 */
export async function getSkincarePlans(
  userId: string,
  params: PaginationParams = {}
): Promise<PaginatedResponse<any>> {
  return paginatedQuery('skincare_plans', {
    ...params,
    filters: { user_id: userId },
    orderBy: { column: 'created_at', ascending: false },
  });
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(
  file: Blob | File,
  path: string,
  userId: string
): Promise<string> {
  const fileExt = path.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const filePath = `images/${fileName}`;

  const { data, error } = await supabase.storage
    .from('user-uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('user-uploads')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Delete image from storage
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  // Extract path from URL
  const url = new URL(imageUrl);
  const pathParts = url.pathname.split('/');
  const filePath = pathParts.slice(pathParts.indexOf('user-uploads') + 1).join('/');

  const { error } = await supabase.storage
    .from('user-uploads')
    .remove([filePath]);

  if (error) {
    throw new Error(`Image deletion failed: ${error.message}`);
  }
}

/**
 * Save analysis to database
 */
export async function saveAnalysis(
  userId: string,
  analysisData: {
    imageUrl?: string;
    overallScore: number;
    analysisData: any;
    recommendations?: any;
  }
): Promise<any> {
  const { data, error } = await supabase
    .from('glow_analyses')
    .insert({
      user_id: userId,
      image_url: analysisData.imageUrl,
      overall_score: analysisData.overallScore,
      analysis_data: analysisData.analysisData,
      recommendations: analysisData.recommendations,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save analysis: ${error.message}`);
  }

  return data;
}

/**
 * Save style analysis to database
 */
export async function saveStyleAnalysis(
  userId: string,
  analysisData: {
    imageUrl?: string;
    occasion: string;
    overallScore: number;
    analysisData: any;
  }
): Promise<any> {
  const { data, error } = await supabase
    .from('style_analyses')
    .insert({
      user_id: userId,
      image_url: analysisData.imageUrl,
      occasion: analysisData.occasion,
      overall_score: analysisData.overallScore,
      analysis_data: analysisData.analysisData,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save style analysis: ${error.message}`);
  }

  return data;
}

/**
 * Get user profile with caching
 */
export async function getUserProfile(userId: string): Promise<any> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to get profile: ${error.message}`);
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<{
    full_name: string;
    avatar_url: string;
    is_premium: boolean;
  }>
): Promise<any> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return data;
}

