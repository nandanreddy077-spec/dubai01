-- Scalability Optimizations for 50,000+ Users
-- Run this migration in your Supabase SQL Editor

-- 1. Add connection pooling configuration
-- Note: Connection pooling is configured at the Supabase project level
-- Go to Settings > Database > Connection Pooling to enable

-- 2. Create additional indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_glow_analyses_user_created ON public.glow_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_style_analyses_user_created ON public.style_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skincare_plans_user_active ON public.skincare_plans(user_id, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active_expires ON public.subscriptions(user_id, status, expires_at) WHERE status = 'active';

-- 3. Create materialized view for user statistics (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_statistics_cache AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.is_premium,
  COUNT(DISTINCT ga.id) as total_glow_analyses,
  COUNT(DISTINCT sa.id) as total_style_analyses,
  COUNT(DISTINCT sp.id) as total_skincare_plans,
  MAX(ga.created_at) as last_glow_analysis,
  MAX(sa.created_at) as last_style_analysis,
  COALESCE(MAX(ga.overall_score), 0) as best_glow_score,
  COALESCE(AVG(ga.overall_score), 0) as avg_glow_score
FROM public.profiles p
LEFT JOIN public.glow_analyses ga ON p.id = ga.user_id
LEFT JOIN public.style_analyses sa ON p.id = sa.user_id
LEFT JOIN public.skincare_plans sp ON p.id = sp.user_id
GROUP BY p.id, p.full_name, p.is_premium;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_statistics_cache_user_id ON public.user_statistics_cache(user_id);

-- 4. Create function to refresh materialized view
CREATE OR REPLACE FUNCTION public.refresh_user_statistics_cache()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_statistics_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function for paginated queries with better performance
CREATE OR REPLACE FUNCTION public.get_paginated_analyses(
  p_user_id UUID,
  p_page INTEGER DEFAULT 0,
  p_page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  image_url TEXT,
  overall_score INTEGER,
  created_at TIMESTAMPTZ,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH total AS (
    SELECT COUNT(*) as count
    FROM public.glow_analyses
    WHERE user_id = p_user_id
  )
  SELECT 
    ga.id,
    ga.user_id,
    ga.image_url,
    ga.overall_score,
    ga.created_at,
    (SELECT count FROM total) as total_count
  FROM public.glow_analyses ga
  WHERE ga.user_id = p_user_id
  ORDER BY ga.created_at DESC
  LIMIT p_page_size
  OFFSET p_page * p_page_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create table for API rate limiting (server-side)
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_user_endpoint ON public.api_rate_limits(user_id, endpoint, window_start);

-- 7. Create function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_ms INTEGER DEFAULT 60000
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Calculate window start (current minute)
  v_window_start := date_trunc('minute', NOW());
  
  -- Get or create rate limit record
  INSERT INTO public.api_rate_limits (user_id, endpoint, window_start, request_count)
  VALUES (p_user_id, p_endpoint, v_window_start, 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET request_count = api_rate_limits.request_count + 1
  RETURNING request_count INTO v_count;
  
  -- Clean up old records (older than 1 hour)
  DELETE FROM public.api_rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
  
  -- Return true if under limit
  RETURN v_count <= p_max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create table for caching AI responses
CREATE TABLE IF NOT EXISTS public.ai_response_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  response_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_response_cache_key ON public.ai_response_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_expires ON public.ai_response_cache(expires_at);

-- 9. Create function to get cached response
CREATE OR REPLACE FUNCTION public.get_cached_ai_response(p_cache_key TEXT)
RETURNS JSONB AS $$
DECLARE
  v_response JSONB;
BEGIN
  SELECT response_data INTO v_response
  FROM public.ai_response_cache
  WHERE cache_key = p_cache_key
    AND expires_at > NOW();
  
  RETURN v_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to set cached response
CREATE OR REPLACE FUNCTION public.set_cached_ai_response(
  p_cache_key TEXT,
  p_response_data JSONB,
  p_ttl_seconds INTEGER DEFAULT 3600
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.ai_response_cache (cache_key, response_data, expires_at)
  VALUES (p_cache_key, p_response_data, NOW() + (p_ttl_seconds || ' seconds')::INTERVAL)
  ON CONFLICT (cache_key)
  DO UPDATE SET
    response_data = EXCLUDED.response_data,
    expires_at = EXCLUDED.expires_at;
  
  -- Clean up expired cache entries
  DELETE FROM public.ai_response_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Enable RLS on new tables
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_response_cache ENABLE ROW LEVEL SECURITY;

-- 12. Create policies for rate limits (only service role can access)
CREATE POLICY "Service role can manage rate limits" ON public.api_rate_limits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage cache" ON public.ai_response_cache
  FOR ALL USING (auth.role() = 'service_role');

-- 13. Create scheduled job to refresh materialized view (runs every hour)
-- Note: This requires pg_cron extension. Enable it in Supabase dashboard.
-- SELECT cron.schedule('refresh-user-statistics', '0 * * * *', 'SELECT public.refresh_user_statistics_cache();');

-- 14. Create table for monitoring and analytics
CREATE TABLE IF NOT EXISTS public.api_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint_created ON public.api_metrics(endpoint, created_at);
CREATE INDEX IF NOT EXISTS idx_api_metrics_user_created ON public.api_metrics(user_id, created_at);

-- 15. Partition api_metrics table by month for better performance
-- Note: This is a simplified version. For production, use proper partitioning.
CREATE INDEX IF NOT EXISTS idx_api_metrics_created_month ON public.api_metrics(date_trunc('month', created_at));

COMMENT ON TABLE public.api_metrics IS 'Stores API metrics for monitoring and analytics';
COMMENT ON TABLE public.api_rate_limits IS 'Tracks API rate limits per user and endpoint';
COMMENT ON TABLE public.ai_response_cache IS 'Caches AI responses to reduce API calls';


















