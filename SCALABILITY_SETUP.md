# Scalability Setup Guide - 50,000 Users

This guide will help you set up your app to handle 50,000+ concurrent users.

## Prerequisites

1. Supabase Pro plan or higher (for connection pooling)
2. OpenAI API key with sufficient credits
3. Supabase CLI installed (`npm install -g supabase`)

## Step 1: Database Optimizations

1. Run the scalability migration:
   ```sql
   -- Copy contents of supabase/migrations/20240101000000_scalability_optimizations.sql
   -- Run in Supabase SQL Editor
   ```

2. Enable Connection Pooling:
   - Go to Supabase Dashboard → Settings → Database
   - Enable Connection Pooling
   - Use the pooled connection string for production

3. Enable pg_cron extension (for scheduled jobs):
   - Go to Database → Extensions
   - Enable `pg_cron`

## Step 2: Storage Setup

1. Run storage setup:
   ```sql
   -- Copy contents of supabase/storage-setup.sql
   -- Run in Supabase SQL Editor
   ```

2. Verify bucket creation:
   - Go to Storage → Buckets
   - Confirm `user-uploads` bucket exists

## Step 3: Deploy Edge Functions

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Deploy the AI analysis function:
   ```bash
   supabase functions deploy ai-analyze
   ```

5. Set environment variables:
   - Go to Supabase Dashboard → Edge Functions → ai-analyze
   - Set `OPENAI_API_KEY`
   - Set `SUPABASE_URL`
   - Set `SUPABASE_SERVICE_ROLE_KEY`

## Step 4: Environment Variables

Update your `.env` file:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (for edge function)
OPENAI_API_KEY=your-openai-key

# API Configuration
EXPO_PUBLIC_API_URL=https://your-project.supabase.co/functions/v1
```

## Step 5: Update App Code

The following files have been updated to use the new scalable architecture:

1. **lib/api-service.ts** - Centralized API service with pagination
2. **lib/api-hooks.ts** - React Query hooks for data fetching
3. **lib/image-utils.ts** - Image optimization utilities
4. **app/_layout.tsx** - Optimized React Query configuration

## Step 6: Migration Checklist

### Database
- [ ] Run scalability migration
- [ ] Enable connection pooling
- [ ] Enable pg_cron extension
- [ ] Verify indexes are created

### Storage
- [ ] Create user-uploads bucket
- [ ] Set up storage policies
- [ ] Test image upload

### Edge Functions
- [ ] Deploy ai-analyze function
- [ ] Set environment variables
- [ ] Test function endpoint

### Code Updates
- [ ] Update contexts to use new API hooks
- [ ] Replace direct OpenAI calls with API service
- [ ] Implement pagination in all list views
- [ ] Update image uploads to use Supabase Storage

## Step 7: Monitoring

1. Set up Supabase monitoring:
   - Go to Dashboard → Logs
   - Monitor API metrics table
   - Set up alerts for high error rates

2. Monitor OpenAI usage:
   - Track API calls in OpenAI dashboard
   - Set up usage alerts

3. Database performance:
   - Monitor query performance
   - Check connection pool usage
   - Review slow queries

## Performance Targets

With this setup, you should achieve:

- **Response Time**: < 2s for AI analysis (with caching)
- **Concurrent Users**: 50,000+ supported
- **Database Queries**: < 100ms average
- **Image Upload**: < 3s for optimized images
- **Rate Limiting**: 10 requests/minute per user

## Cost Estimates (50,000 users)

- **Supabase Pro**: $25/month (up to 8GB database, 100GB bandwidth)
- **OpenAI API**: ~$2,000-5,000/month (depends on usage)
- **Storage**: ~$0.021/GB/month
- **Edge Functions**: Included in Supabase Pro

## Troubleshooting

### Rate Limit Errors
- Check rate limit table in database
- Verify edge function rate limiting
- Monitor API metrics

### Slow Queries
- Check database indexes
- Review query plans
- Enable query logging

### Image Upload Failures
- Verify storage bucket permissions
- Check file size limits
- Review storage policies

## Next Steps

1. Test with a small user base first
2. Monitor performance metrics
3. Scale up gradually
4. Optimize based on real usage patterns

























