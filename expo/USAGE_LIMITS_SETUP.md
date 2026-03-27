# Usage Limits Setup Guide

## Quick Setup (5 minutes)

### Step 1: Run Database Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of:
   ```
   supabase/migrations/20250101000000_usage_limits.sql
   ```
5. Click **Run**

### Step 2: Verify Setup

Run this query to verify tables were created:

```sql
SELECT 
  'daily_usage_limits' as table_name, COUNT(*) as row_count 
FROM daily_usage_limits
UNION ALL
SELECT 
  'monthly_cost_tracking' as table_name, COUNT(*) as row_count 
FROM monthly_cost_tracking
UNION ALL
SELECT 
  'photo_hash_cache' as table_name, COUNT(*) as row_count 
FROM photo_hash_cache;
```

You should see all three tables with 0 rows (or existing data).

### Step 3: Test Functions

Test the usage limit function:

```sql
-- Replace with your actual user ID
SELECT check_and_increment_usage(
  'your-user-id-here'::uuid,
  'progress_photo',
  0.028
);
```

Expected result:
```json
{
  "allowed": true,
  "current_count": 1,
  "limit": 3,
  "remaining": 2
}
```

### Step 4: Deploy App

The client-side code is already updated. Just rebuild and deploy:

```bash
# For iOS
eas build --platform ios --profile production

# For Android
eas build --platform android --profile production
```

## What's Implemented

✅ **Daily Limits**
- Progress Photos: 3/day
- Glow Analysis: 10/day
- Style Check: 5/day
- Skincare Plan: 3/day
- AI Insights: 4/day
- AI Coach: 20/day

✅ **Smart Caching**
- Duplicate photo detection
- 7-day cache duration
- Automatic cache cleanup

✅ **Cost Tracking**
- Daily cost per feature
- Monthly cost aggregation
- Per-user cost monitoring

✅ **UI Updates**
- Usage limit indicator
- Remaining count display
- Disabled state when limit reached

## Testing

### Test Daily Limits

1. Open the app
2. Go to **Progress Studio** tab
3. Take 3 progress photos
4. Try to take a 4th photo
5. Should see "Daily Limit Reached" message

### Test Duplicate Detection

1. Take a progress photo
2. Take the same photo again (or very similar)
3. Should use cached result (no API call)
4. Check console logs for "Using cached analysis"

### Test Cost Tracking

```sql
-- View your costs
SELECT 
  feature_type,
  usage_count,
  cost_usd,
  usage_date
FROM daily_usage_limits
WHERE user_id = 'your-user-id'::uuid
ORDER BY usage_date DESC;
```

## Monitoring Costs

### View Monthly Costs

```sql
SELECT 
  user_id,
  total_cost_usd,
  progress_photos_cost,
  glow_analysis_cost,
  style_check_cost
FROM monthly_cost_tracking
WHERE month_year = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY total_cost_usd DESC
LIMIT 10;
```

### Find High-Cost Users

```sql
SELECT 
  user_id,
  total_cost_usd
FROM monthly_cost_tracking
WHERE month_year = DATE_TRUNC('month', CURRENT_DATE)
  AND total_cost_usd > 2.0
ORDER BY total_cost_usd DESC;
```

## Troubleshooting

### Issue: "Function does not exist"
**Solution**: Make sure you ran the migration SQL file completely.

### Issue: "Permission denied"
**Solution**: Check RLS policies are set correctly. The functions use `SECURITY DEFINER` so they should work.

### Issue: Limits not working
**Solution**: 
1. Check user is authenticated
2. Verify function is being called
3. Check Supabase logs for errors

### Issue: Cache not working
**Solution**:
1. Verify `photo_hash_cache` table exists
2. Check photo hash is being calculated correctly
3. Verify cache lookup is happening

## Next Steps

1. **Set up cost alerts** (optional)
   - Create a cron job to check for high-cost users
   - Send email alerts if user exceeds $2/month

2. **Add analytics dashboard** (optional)
   - Create a dashboard to visualize costs
   - Track usage patterns
   - Identify optimization opportunities

3. **Optimize further** (optional)
   - Add image compression before API calls
   - Batch process multiple photos
   - Use cheaper models for routine tasks

## Support

If you encounter issues:
1. Check Supabase logs
2. Verify database migration completed
3. Test functions manually in SQL Editor
4. Check client-side console logs

