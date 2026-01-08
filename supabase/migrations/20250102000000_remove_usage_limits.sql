-- Rollback migration: Remove usage limits and cost tracking
-- This removes all tables, functions, and policies created by 20250101000000_usage_limits.sql

-- Drop functions first (they depend on tables)
DROP FUNCTION IF EXISTS public.check_and_increment_usage(UUID, TEXT, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS public.check_photo_cache(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.store_photo_cache(UUID, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_monthly_cost(UUID, DATE) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_cache() CASCADE;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view own daily usage" ON public.daily_usage_limits;
DROP POLICY IF EXISTS "Service role can manage daily usage" ON public.daily_usage_limits;
DROP POLICY IF EXISTS "Users can view own monthly costs" ON public.monthly_cost_tracking;
DROP POLICY IF EXISTS "Service role can manage monthly costs" ON public.monthly_cost_tracking;
DROP POLICY IF EXISTS "Users can view own photo cache" ON public.photo_hash_cache;
DROP POLICY IF EXISTS "Service role can manage photo cache" ON public.photo_hash_cache;

-- Drop indexes
DROP INDEX IF EXISTS public.idx_daily_usage_user_date;
DROP INDEX IF EXISTS public.idx_daily_usage_feature;
DROP INDEX IF EXISTS public.idx_monthly_cost_user_month;
DROP INDEX IF EXISTS public.idx_photo_hash_lookup;
DROP INDEX IF EXISTS public.idx_photo_hash_expires;

-- Drop tables (CASCADE will handle any remaining dependencies)
DROP TABLE IF EXISTS public.daily_usage_limits CASCADE;
DROP TABLE IF EXISTS public.monthly_cost_tracking CASCADE;
DROP TABLE IF EXISTS public.photo_hash_cache CASCADE;




