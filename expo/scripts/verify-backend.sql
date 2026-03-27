-- ============================================================================
-- Comprehensive Backend Verification SQL
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. CHECK CORE TABLES
-- ============================================================================
SELECT 
  '1. Core Tables' as check_type,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND table_name = t.table_name) as column_count,
  CASE 
    WHEN table_name IN (
      'profiles', 'glow_analyses', 'style_analyses', 'skincare_plans',
      'progress_photos', 'tracked_products', 'user_stats', 'subscriptions',
      'trial_tracking', 'usage_tracking', 'subscription_events',
      'api_rate_limits', 'ai_response_cache', 'api_metrics', 'background_jobs'
    ) THEN '✅ REQUIRED'
    ELSE '⚠️  OPTIONAL'
  END as status
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY status DESC, table_name;

-- 2. CHECK STORAGE BUCKETS
-- ============================================================================
SELECT 
  '2. Storage Buckets' as check_type,
  id as bucket_name,
  public as is_public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as allowed_types_count,
  CASE 
    WHEN id IN ('user-uploads', 'analyses', 'avatars') THEN '✅ REQUIRED'
    ELSE '⚠️  OPTIONAL'
  END as status
FROM storage.buckets
ORDER BY status DESC, id;

-- 3. CHECK STORAGE POLICIES
-- ============================================================================
SELECT 
  '3. Storage Policies' as check_type,
  policyname,
  bucket_id,
  cmd as command,
  array_length(roles, 1) as roles_count
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY bucket_id, policyname;

-- 4. CHECK DATABASE FUNCTIONS
-- ============================================================================
SELECT 
  '4. Database Functions' as check_type,
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name IN (
      'handle_new_user', 'has_active_subscription', 'is_in_trial_period',
      'increment_trial_usage', 'increment_usage', 'update_subscription_status',
      'check_rate_limit', 'get_cached_ai_response', 'set_cached_ai_response',
      'refresh_user_statistics_cache', 'cleanup_expired_cache',
      'update_updated_at_column'
    ) THEN '✅ REQUIRED'
    ELSE '⚠️  OPTIONAL'
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY status DESC, routine_name;

-- 5. CHECK TRIGGERS
-- ============================================================================
SELECT 
  '5. Triggers' as check_type,
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 6. CHECK ROW LEVEL SECURITY (RLS)
-- ============================================================================
SELECT 
  '6. RLS Status' as check_type,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count,
  CASE 
    WHEN rowsecurity = true AND 
         (SELECT COUNT(*) FROM pg_policies 
          WHERE schemaname = 'public' AND tablename = t.tablename) > 0 
    THEN '✅ SECURED'
    WHEN rowsecurity = false THEN '❌ RLS DISABLED'
    ELSE '⚠️  NO POLICIES'
  END as status
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'glow_analyses', 'style_analyses', 'skincare_plans',
    'subscriptions', 'trial_tracking', 'usage_tracking', 'user_stats'
  )
ORDER BY status, tablename;

-- 7. CHECK INDEXES
-- ============================================================================
SELECT 
  '7. Indexes' as check_type,
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname
LIMIT 30;

-- 8. CHECK MATERIALIZED VIEWS
-- ============================================================================
SELECT 
  '8. Materialized Views' as check_type,
  matviewname,
  (SELECT COUNT(*) FROM pg_indexes 
   WHERE schemaname = 'public' AND tablename = matviewname) as index_count
FROM pg_matviews
WHERE schemaname = 'public';

-- 9. CHECK EXTENSIONS
-- ============================================================================
SELECT 
  '9. Extensions' as check_type,
  extname,
  extversion,
  CASE 
    WHEN extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm', 'btree_gin', 'pg_cron')
    THEN '✅ RECOMMENDED'
    ELSE '⚠️  OPTIONAL'
  END as status
FROM pg_extension
ORDER BY status DESC, extname;

-- 10. OVERALL HEALTH SUMMARY
-- ============================================================================
SELECT 
  '10. Health Summary' as check_type,
  'Tables' as metric,
  COUNT(*)::text as count,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✅ GOOD'
    WHEN COUNT(*) >= 10 THEN '⚠️  PARTIAL'
    ELSE '❌ INCOMPLETE'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'profiles', 'glow_analyses', 'style_analyses', 'skincare_plans',
    'progress_photos', 'tracked_products', 'user_stats', 'subscriptions',
    'trial_tracking', 'usage_tracking', 'subscription_events',
    'api_rate_limits', 'ai_response_cache', 'api_metrics', 'background_jobs'
  )

UNION ALL

SELECT 
  '10. Health Summary' as check_type,
  'Functions' as metric,
  COUNT(*)::text as count,
  CASE 
    WHEN COUNT(*) >= 10 THEN '✅ GOOD'
    WHEN COUNT(*) >= 5 THEN '⚠️  PARTIAL'
    ELSE '❌ INCOMPLETE'
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_user', 'has_active_subscription', 'is_in_trial_period',
    'increment_trial_usage', 'check_rate_limit', 'get_cached_ai_response',
    'set_cached_ai_response', 'refresh_user_statistics_cache'
  )

UNION ALL

SELECT 
  '10. Health Summary' as check_type,
  'Storage Buckets' as metric,
  COUNT(*)::text as count,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ GOOD'
    WHEN COUNT(*) >= 1 THEN '⚠️  PARTIAL'
    ELSE '❌ INCOMPLETE'
  END as status
FROM storage.buckets
WHERE id IN ('user-uploads', 'analyses', 'avatars')

UNION ALL

SELECT 
  '10. Health Summary' as check_type,
  'Indexes' as metric,
  COUNT(*)::text as count,
  CASE 
    WHEN COUNT(*) >= 20 THEN '✅ GOOD'
    WHEN COUNT(*) >= 10 THEN '⚠️  PARTIAL'
    ELSE '❌ INCOMPLETE'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';

-- ============================================================================
-- END OF VERIFICATION
-- ============================================================================
-- Review the results above. All items marked with ✅ REQUIRED should exist.
-- If any are missing, run the corresponding migration files:
--   - supabase/migrations/20240102000000_complete_backend_setup.sql
--   - supabase/migrations/20240101000000_scalability_optimizations.sql
--   - complete-supabase-setup.sql
--   - subscription-setup.sql
--   - supabase/storage-optimized.sql
-- ============================================================================





