-- Supabase Storage Setup for Image Uploads
-- Run this in your Supabase SQL Editor

-- 1. Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for user uploads
-- Users can upload their own files
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own files
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Create function to automatically clean up old images
CREATE OR REPLACE FUNCTION public.cleanup_old_images()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Schedule cleanup job (runs daily at 2 AM)
-- Note: Requires pg_cron extension
-- SELECT cron.schedule('cleanup-old-images', '0 2 * * *', 'SELECT public.cleanup_old_images();');

COMMENT ON FUNCTION public.cleanup_old_images IS 'Removes old unused images from storage';















