# Quick Storage Setup Guide

## Option 1: Run SQL in Dashboard (Recommended - 2 minutes)

1. **Open SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/pmroozitldbgnchainxv/sql/new

2. **Copy and paste this SQL:**

```sql
-- User uploads bucket (photos, images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic'];

-- Analysis results bucket
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
```

3. **Click "Run"**

4. **Then run the policies SQL** (copy from `supabase/storage-optimized.sql` lines 44-92)

## Option 2: Use Service Role Key (Automated)

1. Get your service role key from: Supabase Dashboard → Settings → API
2. Add to `env` file: `SUPABASE_SERVICE_ROLE_KEY=your_key_here`
3. Run: `npm run setup-storage`

## Verify Setup

After running the SQL, verify with:
```bash
npm run verify-backend
```

Or check in Supabase Dashboard → Storage → Buckets





