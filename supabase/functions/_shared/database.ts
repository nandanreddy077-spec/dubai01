/**
 * Database utilities for Supabase Edge Functions
 * Optimized for 50k+ users with connection pooling
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Create service role client for admin operations
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public',
  },
})

// Rate limiting helper
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  maxRequests: number = 100
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
    p_user_id: userId,
    p_endpoint: endpoint,
    p_max_requests: maxRequests,
    p_window_ms: 60000
  })
  
  if (error) {
    console.error('Rate limit check error:', error)
    return true // Allow on error
  }
  
  return data === true
}

// Cache helper
export async function getCachedResponse(cacheKey: string): Promise<any | null> {
  const { data, error } = await supabaseAdmin.rpc('get_cached_ai_response', {
    p_cache_key: cacheKey
  })
  
  if (error || !data) {
    return null
  }
  
  return data
}

export async function setCachedResponse(
  cacheKey: string,
  responseData: any,
  ttlSeconds: number = 3600
): Promise<void> {
  await supabaseAdmin.rpc('set_cached_ai_response', {
    p_cache_key: cacheKey,
    p_response_data: responseData,
    p_ttl_seconds: ttlSeconds
  })
}

// Log API metrics
export async function logApiMetric(
  endpoint: string,
  userId: string | null,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  errorMessage?: string
): Promise<void> {
  await supabaseAdmin.from('api_metrics').insert({
    endpoint,
    user_id: userId,
    method,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
    error_message: errorMessage
  })
}

// Get paginated data
export async function getPaginatedData(
  tableName: string,
  userId: string,
  page: number = 0,
  pageSize: number = 20
) {
  const { data, error } = await supabaseAdmin.rpc('get_paginated_analyses', {
    p_user_id: userId,
    p_page: page,
    p_page_size: pageSize,
    p_table_name: tableName
  })
  
  if (error) {
    throw error
  }
  
  return data
}



























