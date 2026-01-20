-- Quick Fix for Remaining Security Issues
-- Run this after the main migration
-- Fixes: log_storage_metrics function and removes problematic view

-- ============================================================================
-- 1. Fix log_storage_metrics function (drop and recreate with search_path)
-- ============================================================================

-- Drop existing function first
DROP FUNCTION IF EXISTS public.log_storage_metrics(UUID, TEXT, BIGINT) CASCADE;

-- Recreate with proper search_path
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

-- ============================================================================
-- 2. Remove problematic SECURITY DEFINER view
-- ============================================================================

-- Drop the view that's causing the SECURITY DEFINER error
DROP VIEW IF EXISTS public.user_statistics_secure CASCADE;

-- ============================================================================
-- END
-- ============================================================================

