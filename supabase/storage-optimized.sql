-- Optimized Storage Setup for 50,000+ Users
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. STORAGE BUCKETS
-- ============================================================================

-- User uploads bucket (photos, images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  10485760, -- 10MB limit (increased for better quality)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic'];

-- Analysis results bucket (processed images, thumbnails)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'analyses',
  'analyses',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/json']
)
ON CONFLICT (id) DO NOTHING;

-- Avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. STORAGE POLICIES
-- ============================================================================

-- User Uploads Policies
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('user-uploads', 'analyses', 'avatars') AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    bucket_id = 'avatars' -- Avatars are public
  )
);

DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('user-uploads', 'avatars') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('user-uploads', 'avatars') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read access for analyses (for sharing)
DROP POLICY IF EXISTS "Public can view analyses" ON storage.objects;
CREATE POLICY "Public can view analyses"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'analyses');

-- ============================================================================
-- 3. STORAGE OPTIMIZATION FUNCTIONS
-- ============================================================================

-- Function to get storage usage per user
CREATE OR REPLACE FUNCTION public.get_user_storage_usage(p_user_id UUID)
RETURNS TABLE (
  bucket_id TEXT,
  file_count BIGINT,
  total_size BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.bucket_id,
    COUNT(*) as file_count,
    SUM(o.metadata->>'size')::BIGINT as total_size
  FROM storage.objects o
  WHERE (storage.foldername(o.name))[1] = p_user_id::text
  GROUP BY o.bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old unused images
CREATE OR REPLACE FUNCTION public.cleanup_old_images()
RETURNS TABLE (
  deleted_count INTEGER,
  freed_space BIGINT
) AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_freed_space BIGINT := 0;
BEGIN
  -- Delete images older than 90 days that are not referenced
  WITH deleted AS (
    DELETE FROM storage.objects
    WHERE bucket_id = 'user-uploads'
      AND created_at < NOW() - INTERVAL '90 days'
      AND name NOT IN (
        SELECT image_url FROM public.glow_analyses 
        WHERE image_url IS NOT NULL
        UNION
        SELECT image_url FROM public.style_analyses 
        WHERE image_url IS NOT NULL
        UNION
        SELECT avatar_url FROM public.profiles 
        WHERE avatar_url IS NOT NULL
        UNION
        SELECT jsonb_array_elements_text(image_urls)::TEXT 
        FROM public.glow_analyses 
        WHERE image_urls IS NOT NULL
      )
    RETURNING (metadata->>'size')::BIGINT as size
  )
  SELECT 
    COUNT(*)::INTEGER,
    COALESCE(SUM(size), 0)
  INTO v_deleted_count, v_freed_space
  FROM deleted;
  
  RETURN QUERY SELECT v_deleted_count, v_freed_space;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get storage statistics
CREATE OR REPLACE FUNCTION public.get_storage_statistics()
RETURNS TABLE (
  bucket_id TEXT,
  total_files BIGINT,
  total_size BIGINT,
  avg_file_size BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.bucket_id,
    COUNT(*) as total_files,
    SUM((o.metadata->>'size')::BIGINT) as total_size,
    AVG((o.metadata->>'size')::BIGINT) as avg_file_size
  FROM storage.objects o
  GROUP BY o.bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. STORAGE MONITORING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.storage_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_id TEXT NOT NULL,
  total_files BIGINT,
  total_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storage_metrics_bucket_created ON public.storage_metrics(bucket_id, created_at DESC);

-- Function to log storage metrics
CREATE OR REPLACE FUNCTION public.log_storage_metrics()
RETURNS void AS $$
BEGIN
  INSERT INTO public.storage_metrics (bucket_id, total_files, total_size)
  SELECT * FROM public.get_storage_statistics();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.get_user_storage_usage IS 'Get storage usage statistics per user';
COMMENT ON FUNCTION public.cleanup_old_images IS 'Removes old unused images from storage';
COMMENT ON FUNCTION public.get_storage_statistics IS 'Get overall storage statistics';
COMMENT ON FUNCTION public.log_storage_metrics IS 'Log storage metrics for monitoring';

-- ============================================================================
-- 6. SCHEDULED JOBS (via pg_cron)
-- ============================================================================

-- Schedule cleanup job (runs daily at 2 AM)
-- SELECT cron.schedule('cleanup-old-images', '0 2 * * *', 
--   'SELECT * FROM public.cleanup_old_images();');

-- Schedule metrics logging (runs hourly)
-- SELECT cron.schedule('log-storage-metrics', '0 * * * *', 
--   'SELECT public.log_storage_metrics();');

















