-- Complete Backend Setup for 50,000+ Users
-- Run this migration in your Supabase SQL Editor
-- This creates all necessary tables, indexes, functions, and optimizations

-- ============================================================================
-- 1. ENABLE EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For GIN indexes

-- ============================================================================
-- 2. CORE TABLES WITH OPTIMIZED SCHEMA
-- ============================================================================

-- Profiles table (already exists, but adding optimizations)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT TRUE, -- All features free now
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON public.profiles(is_premium) WHERE is_premium = TRUE;

-- Glow Analyses table with partitioning support
CREATE TABLE IF NOT EXISTS public.glow_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT,
  image_urls JSONB, -- For multi-angle analysis
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  skin_score INTEGER CHECK (skin_score >= 0 AND skin_score <= 100),
  makeup_score INTEGER CHECK (makeup_score >= 0 AND makeup_score <= 100),
  hair_score INTEGER CHECK (hair_score >= 0 AND hair_score <= 100),
  recommendations JSONB,
  analysis_data JSONB,
  vision_data JSONB, -- Google Vision API data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for glow_analyses (better performance)
CREATE TABLE IF NOT EXISTS public.glow_analyses_2024_01 PARTITION OF public.glow_analyses
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE IF NOT EXISTS public.glow_analyses_2024_02 PARTITION OF public.glow_analyses
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- Add more partitions as needed

-- Indexes for glow_analyses
CREATE INDEX IF NOT EXISTS idx_glow_analyses_user_created ON public.glow_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_glow_analyses_created_at ON public.glow_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_glow_analyses_scores ON public.glow_analyses(overall_score DESC) WHERE overall_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_glow_analyses_user_id_gin ON public.glow_analyses USING GIN(user_id, analysis_data);

-- Style Analyses table
CREATE TABLE IF NOT EXISTS public.style_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  occasion TEXT,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  analysis_data JSONB NOT NULL,
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS public.style_analyses_2024_01 PARTITION OF public.style_analyses
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE INDEX IF NOT EXISTS idx_style_analyses_user_created ON public.style_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_style_analyses_occasion ON public.style_analyses(occasion) WHERE occasion IS NOT NULL;

-- Skincare Plans table
CREATE TABLE IF NOT EXISTS public.skincare_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  plan_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  progress JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skincare_plans_user_active ON public.skincare_plans(user_id, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skincare_plans_active ON public.skincare_plans(is_active) WHERE is_active = TRUE;

-- Progress Photos table
CREATE TABLE IF NOT EXISTS public.progress_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  notes TEXT,
  analysis_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS public.progress_photos_2024_01 PARTITION OF public.progress_photos
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE INDEX IF NOT EXISTS idx_progress_photos_user_created ON public.progress_photos(user_id, created_at DESC);

-- Product Tracking table
CREATE TABLE IF NOT EXISTS public.tracked_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  amazon_url TEXT,
  affiliate_taps INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracked_products_user ON public.tracked_products(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracked_products_category ON public.tracked_products(category) WHERE category IS NOT NULL;

-- ============================================================================
-- 3. CACHING AND PERFORMANCE TABLES
-- ============================================================================

-- AI Response Cache
CREATE TABLE IF NOT EXISTS public.ai_response_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  response_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON public.ai_response_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON public.ai_response_cache(expires_at) WHERE expires_at > NOW();

-- User Statistics Cache (Materialized View)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_statistics_cache AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.is_premium,
  COUNT(DISTINCT ga.id) as total_glow_analyses,
  COUNT(DISTINCT sa.id) as total_style_analyses,
  COUNT(DISTINCT sp.id) as total_skincare_plans,
  COUNT(DISTINCT pp.id) as total_progress_photos,
  MAX(ga.created_at) as last_glow_analysis,
  MAX(sa.created_at) as last_style_analysis,
  COALESCE(MAX(ga.overall_score), 0) as best_glow_score,
  COALESCE(AVG(ga.overall_score), 0) as avg_glow_score,
  p.last_active_at
FROM public.profiles p
LEFT JOIN public.glow_analyses ga ON p.id = ga.user_id
LEFT JOIN public.style_analyses sa ON p.id = sa.user_id
LEFT JOIN public.skincare_plans sp ON p.id = sp.user_id
LEFT JOIN public.progress_photos pp ON p.id = pp.user_id
GROUP BY p.id, p.full_name, p.is_premium, p.last_active_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_statistics_cache_user_id ON public.user_statistics_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_user_statistics_cache_last_active ON public.user_statistics_cache(last_active_at DESC);

-- ============================================================================
-- 4. RATE LIMITING AND API METRICS
-- ============================================================================

-- API Rate Limits
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON public.api_rate_limits(user_id, endpoint, window_start DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON public.api_rate_limits(window_start) WHERE window_start < NOW() - INTERVAL '1 hour';

-- API Metrics
CREATE TABLE IF NOT EXISTS public.api_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS public.api_metrics_2024_01 PARTITION OF public.api_metrics
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint_created ON public.api_metrics(endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_user_created ON public.api_metrics(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_metrics_status ON public.api_metrics(status_code) WHERE status_code >= 400;

-- ============================================================================
-- 5. BACKGROUND JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.background_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL,
  job_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON public.background_jobs(status, priority DESC, scheduled_at) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_background_jobs_type ON public.background_jobs(job_type, status);
CREATE INDEX IF NOT EXISTS idx_background_jobs_cleanup ON public.background_jobs(created_at) WHERE created_at < NOW() - INTERVAL '30 days' AND status IN ('completed', 'failed');

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glow_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skincare_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_products ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Glow Analyses policies
DROP POLICY IF EXISTS "Users can view own analyses" ON public.glow_analyses;
CREATE POLICY "Users can view own analyses" ON public.glow_analyses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analyses" ON public.glow_analyses;
CREATE POLICY "Users can insert own analyses" ON public.glow_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own analyses" ON public.glow_analyses;
CREATE POLICY "Users can update own analyses" ON public.glow_analyses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own analyses" ON public.glow_analyses;
CREATE POLICY "Users can delete own analyses" ON public.glow_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Style Analyses policies (similar pattern)
DROP POLICY IF EXISTS "Users can manage own style analyses" ON public.style_analyses;
CREATE POLICY "Users can manage own style analyses" ON public.style_analyses
  FOR ALL USING (auth.uid() = user_id);

-- Skincare Plans policies
DROP POLICY IF EXISTS "Users can manage own skincare plans" ON public.skincare_plans;
CREATE POLICY "Users can manage own skincare plans" ON public.skincare_plans
  FOR ALL USING (auth.uid() = user_id);

-- Progress Photos policies
DROP POLICY IF EXISTS "Users can manage own progress photos" ON public.progress_photos;
CREATE POLICY "Users can manage own progress photos" ON public.progress_photos
  FOR ALL USING (auth.uid() = user_id);

-- Tracked Products policies
DROP POLICY IF EXISTS "Users can manage own tracked products" ON public.tracked_products;
CREATE POLICY "Users can manage own tracked products" ON public.tracked_products
  FOR ALL USING (auth.uid() = user_id);

-- Cache and metrics (service role only)
ALTER TABLE public.ai_response_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage cache" ON public.ai_response_cache
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage rate limits" ON public.api_rate_limits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage metrics" ON public.api_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage jobs" ON public.background_jobs
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 7. PERFORMANCE FUNCTIONS
-- ============================================================================

-- Refresh user statistics cache
CREATE OR REPLACE FUNCTION public.refresh_user_statistics_cache()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_statistics_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paginated queries function
CREATE OR REPLACE FUNCTION public.get_paginated_analyses(
  p_user_id UUID,
  p_page INTEGER DEFAULT 0,
  p_page_size INTEGER DEFAULT 20,
  p_table_name TEXT DEFAULT 'glow_analyses'
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
  EXECUTE format('
    WITH total AS (
      SELECT COUNT(*) as count
      FROM public.%I
      WHERE user_id = $1
    )
    SELECT 
      t.id,
      t.user_id,
      t.image_url,
      t.overall_score,
      t.created_at,
      (SELECT count FROM total) as total_count
    FROM public.%I t
    WHERE t.user_id = $1
    ORDER BY t.created_at DESC
    LIMIT $2
    OFFSET $3
  ', p_table_name, p_table_name)
  USING p_user_id, p_page_size, p_page * p_page_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_ms INTEGER DEFAULT 60000
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := date_trunc('minute', NOW());
  
  INSERT INTO public.api_rate_limits (user_id, endpoint, window_start, request_count)
  VALUES (p_user_id, p_endpoint, v_window_start, 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET request_count = api_rate_limits.request_count + 1
  RETURNING request_count INTO v_count;
  
  -- Cleanup old records
  DELETE FROM public.api_rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
  
  RETURN v_count <= p_max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cache functions
CREATE OR REPLACE FUNCTION public.get_cached_ai_response(p_cache_key TEXT)
RETURNS JSONB AS $$
DECLARE
  v_response JSONB;
BEGIN
  UPDATE public.ai_response_cache
  SET hit_count = hit_count + 1
  WHERE cache_key = p_cache_key AND expires_at > NOW()
  RETURNING response_data INTO v_response;
  
  RETURN v_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    expires_at = EXCLUDED.expires_at,
    hit_count = 0;
  
  -- Cleanup expired entries
  DELETE FROM public.ai_response_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update last active timestamp
CREATE OR REPLACE FUNCTION public.update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET last_active_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_active_at
CREATE TRIGGER update_last_active_on_analysis
  AFTER INSERT ON public.glow_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_last_active();

-- ============================================================================
-- 8. AUTOMATIC CLEANUP FUNCTIONS
-- ============================================================================

-- Cleanup expired cache
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.ai_response_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.api_rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old metrics (keep last 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM public.api_metrics
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profiles with metadata';
COMMENT ON TABLE public.glow_analyses IS 'Beauty analysis results - partitioned by month';
COMMENT ON TABLE public.style_analyses IS 'Style/outfit analysis results';
COMMENT ON TABLE public.skincare_plans IS 'Personalized skincare plans';
COMMENT ON TABLE public.progress_photos IS 'User progress photos - partitioned by month';
COMMENT ON TABLE public.tracked_products IS 'User tracked beauty products';
COMMENT ON TABLE public.ai_response_cache IS 'Caches AI responses to reduce API calls';
COMMENT ON TABLE public.api_rate_limits IS 'Tracks API rate limits per user/endpoint';
COMMENT ON TABLE public.api_metrics IS 'API performance metrics - partitioned by month';
COMMENT ON TABLE public.background_jobs IS 'Background job queue for async processing';

-- ============================================================================
-- 10. INITIAL DATA SETUP
-- ============================================================================

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_premium)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    TRUE -- All features free
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================















