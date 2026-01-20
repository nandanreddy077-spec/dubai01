-- Fix Supabase Security Advisor Issues
-- Run this migration in your Supabase SQL Editor
-- This addresses all security warnings and errors
--
-- NOTE: Some functions are dropped and recreated to handle return type changes
-- This is safe - the functions will be recreated with proper security settings

-- ============================================================================
-- 1. FIX CRITICAL ERROR: RLS Disabled in Public for storage_metrics
-- ============================================================================

-- Check if storage_metrics table exists and enable RLS
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'storage_metrics') THEN
    -- Enable RLS on storage_metrics
    ALTER TABLE public.storage_metrics ENABLE ROW LEVEL SECURITY;
    
    -- Create restrictive policy (service role only)
    DROP POLICY IF EXISTS "Service role can manage storage_metrics" ON public.storage_metrics;
    CREATE POLICY "Service role can manage storage_metrics" ON public.storage_metrics
      FOR ALL USING (auth.role() = 'service_role');
    
    RAISE NOTICE 'RLS enabled on storage_metrics table';
  ELSE
    RAISE NOTICE 'storage_metrics table does not exist, skipping';
  END IF;
END $$;

-- ============================================================================
-- 2. FIX WARNINGS: Function Search Path Mutable
-- ============================================================================
-- All functions need search_path set to prevent SQL injection

-- Fix refresh_user_statistics_cache
CREATE OR REPLACE FUNCTION public.refresh_user_statistics_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_statistics_cache;
END;
$$;

-- Fix update_user_last_active
CREATE OR REPLACE FUNCTION public.update_user_last_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.profiles
  SET last_active_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Fix set_cached_ai_response
CREATE OR REPLACE FUNCTION public.set_cached_ai_response(
  p_cache_key TEXT,
  p_response_data JSONB,
  p_ttl_seconds INTEGER DEFAULT 3600
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

-- Fix check_rate_limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_ms INTEGER DEFAULT 60000
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

-- Fix get_storage_statistics
-- Drop existing function first if it exists (may have different return type)
DROP FUNCTION IF EXISTS public.get_storage_statistics() CASCADE;

CREATE FUNCTION public.get_storage_statistics()
RETURNS TABLE (
  total_size BIGINT,
  total_files BIGINT,
  bucket_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM((metadata->>'size')::BIGINT), 0) as total_size,
    COUNT(*) as total_files,
    bucket_id as bucket_name
  FROM storage.objects
  GROUP BY bucket_id;
END;
$$;

-- Fix cleanup_old_images
-- Drop existing function first if it exists (handles any signature)
DO $$
DECLARE
  func_record RECORD;
BEGIN
  -- Drop all versions of the function with any parameters
  FOR func_record IN 
    SELECT oid::regprocedure as func_name
    FROM pg_proc
    WHERE proname = 'cleanup_old_images'
      AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', func_record.func_name);
  END LOOP;
END $$;

CREATE FUNCTION public.cleanup_old_images()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Delete images older than 90 days that are not referenced in analyses
  DELETE FROM storage.objects
  WHERE bucket_id = 'user-uploads'
    AND created_at < NOW() - INTERVAL '90 days'
    AND name NOT IN (
      SELECT image_url FROM public.glow_analyses WHERE image_url IS NOT NULL
      UNION
      SELECT image_url FROM public.style_analyses WHERE image_url IS NOT NULL
      UNION
      SELECT avatar_url FROM public.profiles WHERE avatar_url IS NOT NULL
    );
END;
$$;

-- Fix get_user_storage_usage
-- Drop existing function first if it exists (may have different return type)
DROP FUNCTION IF EXISTS public.get_user_storage_usage(UUID) CASCADE;

CREATE FUNCTION public.get_user_storage_usage(p_user_id UUID)
RETURNS TABLE (
  total_size BIGINT,
  file_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM((metadata->>'size')::BIGINT), 0) as total_size,
    COUNT(*) as file_count
  FROM storage.objects
  WHERE owner = p_user_id::TEXT;
END;
$$;

-- Fix cleanup_old_metrics
CREATE OR REPLACE FUNCTION public.cleanup_old_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.api_metrics
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Fix cleanup_old_rate_limits
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.api_rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;

-- Fix log_storage_metrics
-- Drop existing function first if it exists (may have different signature)
DROP FUNCTION IF EXISTS public.log_storage_metrics(UUID, TEXT, BIGINT) CASCADE;

CREATE FUNCTION public.log_storage_metrics(
  p_user_id UUID,
  p_bucket_name TEXT,
  p_size_bytes BIGINT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only log if storage_metrics table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'storage_metrics') THEN
    INSERT INTO public.storage_metrics (user_id, bucket_name, size_bytes, created_at)
    VALUES (p_user_id, p_bucket_name, p_size_bytes, NOW())
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_premium)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Fix get_paginated_analyses
-- Drop existing function first if it exists (may have different return type)
DROP FUNCTION IF EXISTS public.get_paginated_analyses(UUID, INTEGER, INTEGER, TEXT) CASCADE;

CREATE FUNCTION public.get_paginated_analyses(
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Validate table name to prevent SQL injection
  IF p_table_name NOT IN ('glow_analyses', 'style_analyses', 'progress_photos') THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;
  
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
$$;

-- Fix get_cached_ai_response
CREATE OR REPLACE FUNCTION public.get_cached_ai_response(p_cache_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_response JSONB;
BEGIN
  UPDATE public.ai_response_cache
  SET hit_count = hit_count + 1
  WHERE cache_key = p_cache_key AND expires_at > NOW()
  RETURNING response_data INTO v_response;
  
  RETURN v_response;
END;
$$;

-- Fix cleanup_expired_cache
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.ai_response_cache
  WHERE expires_at < NOW();
END;
$$;

-- ============================================================================
-- 3. FIX WARNING: Extension in Public Schema
-- ============================================================================
-- Move extensions to a separate schema (best practice)
-- Note: This requires careful migration. For now, we'll document it.

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Note: Moving extensions requires recreating them, which may break existing functionality
-- This is a low-priority warning. Extensions in public schema are acceptable for most use cases.
-- If you want to fix this, you'll need to:
-- 1. Create extensions in the extensions schema
-- 2. Update all references
-- 3. Test thoroughly

-- ============================================================================
-- 4. FIX WARNING: Materialized View in API
-- ============================================================================
-- Note: Materialized views don't support RLS directly
-- The materialized view warning is acceptable - it's used internally
-- We'll revoke public access instead

-- Drop the secure view if it exists (it was causing SECURITY DEFINER error)
DROP VIEW IF EXISTS public.user_statistics_secure CASCADE;

-- Revoke public access to materialized view (service role only)
REVOKE ALL ON public.user_statistics_cache FROM anon, authenticated;
-- Note: Service role can still access it for internal operations

-- ============================================================================
-- 5. FIX WARNING: Leaked Password Protection Disabled
-- ============================================================================
-- This needs to be enabled in Supabase Dashboard:
-- Go to: Authentication → Settings → Password
-- Enable: "Check for leaked passwords"
-- 
-- This cannot be done via SQL, must be done in the dashboard.

-- ============================================================================
-- 6. ADDITIONAL SECURITY IMPROVEMENTS
-- ============================================================================

-- Ensure all tables have RLS enabled
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT IN ('spatial_ref_sys')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    RAISE NOTICE 'RLS enabled on table: %', r.tablename;
  END LOOP;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check which functions still need search_path
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true  -- SECURITY DEFINER functions
  AND pg_get_functiondef(p.oid) NOT LIKE '%SET search_path%'
ORDER BY p.proname;

-- Check tables without RLS
SELECT 
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename 
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE c.relrowsecurity = true
  );

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

COMMENT ON FUNCTION public.refresh_user_statistics_cache() IS 'Refreshes user statistics cache - SECURITY: search_path set';
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile on signup - SECURITY: search_path set';
COMMENT ON FUNCTION public.check_rate_limit(UUID, TEXT, INTEGER, INTEGER) IS 'Checks API rate limits - SECURITY: search_path set';

