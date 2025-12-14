# Quick Start: Scalability Setup

## 🚀 5-Minute Setup

### 1. Database Setup (2 minutes)

1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/migrations/20240101000000_scalability_optimizations.sql`
3. Run `supabase/storage-setup.sql`
4. Go to Settings → Database → Enable Connection Pooling

### 2. Storage Setup (1 minute)

1. Go to Storage → Verify `user-uploads` bucket exists
2. If not, run `supabase/storage-setup.sql` again

### 3. Edge Function Setup (2 minutes)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy function
supabase functions deploy ai-analyze
```

4. Set environment variables in Supabase Dashboard:
   - Edge Functions → ai-analyze → Settings
   - Add `OPENAI_API_KEY`
   - Add `SUPABASE_SERVICE_ROLE_KEY`

### 4. Environment Variables

Update `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## ✅ Verification

1. **Test AI Analysis**:
   ```typescript
   import { analyzeImageWithAI } from '@/lib/api-service';
   const result = await analyzeImageWithAI({...}, userId);
   ```

2. **Test Image Upload**:
   ```typescript
   import { uploadImage } from '@/lib/api-service';
   const url = await uploadImage(blob, 'test.jpg', userId);
   ```

3. **Test Pagination**:
   ```typescript
   import { useAnalysisHistory } from '@/lib/api-hooks';
   const { data, fetchNextPage } = useAnalysisHistory();
   ```

## 📚 Next Steps

- Read `SCALABILITY_SETUP.md` for detailed setup
- Read `MIGRATION_GUIDE.md` to update existing code
- Read `SCALABILITY_SUMMARY.md` for overview

## 🆘 Troubleshooting

**Edge function not working?**
- Check environment variables
- Verify function is deployed
- Check Supabase logs

**Database slow?**
- Verify indexes are created
- Check connection pooling is enabled
- Review query performance

**Images not uploading?**
- Verify storage bucket exists
- Check storage policies
- Verify file size limits















