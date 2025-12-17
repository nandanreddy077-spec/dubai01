# Backend Scalability Setup for 50,000+ Users

This document outlines the complete backend infrastructure setup to support 50,000+ concurrent users.

## 📋 Table of Contents

1. [Database Setup](#database-setup)
2. [Connection Pooling](#connection-pooling)
3. [Caching Strategy](#caching-strategy)
4. [Rate Limiting](#rate-limiting)
5. [File Storage](#file-storage)
6. [Background Jobs](#background-jobs)
7. [Monitoring](#monitoring)
8. [Performance Optimization](#performance-optimization)

---

## 🗄️ Database Setup

### Step 1: Run Database Migrations

1. Go to your Supabase Dashboard → SQL Editor
2. Run the migration file: `supabase/migrations/20240102000000_complete_backend_setup.sql`
3. This creates:
   - All core tables with partitioning
   - Optimized indexes
   - Materialized views for caching
   - Rate limiting tables
   - Background job queue
   - Performance functions

### Step 2: Enable Extensions

The migration automatically enables:
- `uuid-ossp` - UUID generation
- `pgcrypto` - Encryption
- `pg_trgm` - Text search
- `btree_gin` - GIN indexes

### Step 3: Enable pg_cron (Optional)

For scheduled jobs, enable pg_cron in Supabase Dashboard:
1. Go to Database → Extensions
2. Enable `pg_cron`
3. Schedule jobs (see Background Jobs section)

---

## 🔌 Connection Pooling

### Supabase Connection Pooling

1. Go to **Settings → Database → Connection Pooling**
2. Enable **Transaction Mode** pooling
3. Use the connection pooler URL for server-side operations:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### Recommended Pool Settings

- **Max Connections**: 100-200 (Supabase manages this)
- **Connection Timeout**: 30 seconds
- **Idle Timeout**: 10 minutes

### Client Configuration

Update your Supabase client to use connection pooling:

```typescript
// For server-side operations
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  // Use pooler URL for better performance
})
```

---

## 💾 Caching Strategy

### 1. Database-Level Caching

**Materialized Views:**
- `user_statistics_cache` - Refreshed hourly
- Caches user statistics to avoid expensive aggregations

**Refresh Schedule:**
```sql
-- Run this via pg_cron or scheduled job
SELECT cron.schedule('refresh-user-statistics', '0 * * * *', 
  'SELECT public.refresh_user_statistics_cache();');
```

### 2. AI Response Caching

**Cache Table:** `ai_response_cache`

**Usage:**
```typescript
// Check cache first
const cached = await getCachedResponse(cacheKey);
if (cached) return cached;

// Generate response
const response = await generateAIResponse();

// Cache for 1 hour
await setCachedResponse(cacheKey, response, 3600);
```

**Cache Key Strategy:**
- Use hash of input parameters
- Include user context if personalized
- Example: `glow_analysis_${hash(imageUrl + userId)}`

### 3. Application-Level Caching (Recommended)

For even better performance, add Redis:

1. **Set up Redis** (Upstash, Redis Cloud, or self-hosted)
2. **Cache frequently accessed data:**
   - User profiles
   - Recent analyses
   - Product recommendations
   - Statistics

**Example Redis Setup:**
```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
})

// Cache user profile
await redis.setex(`user:${userId}`, 3600, JSON.stringify(profile))

// Get cached profile
const cached = await redis.get(`user:${userId}`)
```

---

## 🚦 Rate Limiting

### Database Rate Limiting

The `api_rate_limits` table tracks requests per user/endpoint.

**Default Limits:**
- **Analysis Endpoints**: 100 requests/minute
- **General API**: 200 requests/minute
- **File Uploads**: 20 requests/minute

### Implementation

```typescript
// Check rate limit before processing
const allowed = await checkRateLimit(userId, '/api/analyze', 100);
if (!allowed) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

### Edge Function Rate Limiting

Add to your Supabase Edge Functions:

```typescript
import { checkRateLimit } from '../_shared/database.ts'

Deno.serve(async (req) => {
  const userId = getUserId(req);
  const allowed = await checkRateLimit(userId, '/analyze', 100);
  
  if (!allowed) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
  
  // Process request...
})
```

---

## 📁 File Storage

### Supabase Storage Setup

1. **Run Storage Migration:**
   ```sql
   -- Run supabase/storage-setup.sql
   ```

2. **Storage Buckets:**
   - `user-uploads` - User photos (5MB limit)
   - `analyses` - Analysis results
   - `avatars` - Profile pictures

3. **CDN Configuration:**
   - Enable CDN in Supabase Dashboard
   - Set cache headers for static assets
   - Use image transformations for thumbnails

### Storage Optimization

**Image Compression:**
- Compress images before upload
- Use WebP format when possible
- Generate thumbnails server-side

**Cleanup Strategy:**
- Delete unused images after 90 days
- Archive old analyses to cold storage
- Use lifecycle policies

---

## 🔄 Background Jobs

### Job Queue Setup

The `background_jobs` table handles async processing.

**Job Types:**
- `analyze_image` - AI analysis
- `generate_recommendations` - Product recommendations
- `send_notification` - Push notifications
- `cleanup_old_data` - Data cleanup

### Processing Jobs

Create a worker function:

```typescript
// supabase/functions/process-jobs/index.ts
async function processJobs() {
  // Get pending jobs
  const { data: jobs } = await supabaseAdmin
    .from('background_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('scheduled_at', { ascending: true })
    .limit(10);
  
  for (const job of jobs) {
    await processJob(job);
  }
}

// Schedule via pg_cron or external scheduler
```

### Scheduled Jobs

**Via pg_cron:**
```sql
-- Refresh statistics cache hourly
SELECT cron.schedule('refresh-stats', '0 * * * *', 
  'SELECT public.refresh_user_statistics_cache();');

-- Cleanup expired cache daily
SELECT cron.schedule('cleanup-cache', '0 2 * * *', 
  'SELECT public.cleanup_expired_cache();');

-- Cleanup old metrics weekly
SELECT cron.schedule('cleanup-metrics', '0 3 * * 0', 
  'SELECT public.cleanup_old_metrics();');
```

---

## 📊 Monitoring

### API Metrics

The `api_metrics` table tracks:
- Endpoint performance
- Response times
- Error rates
- User activity

### Monitoring Dashboard

**Create a monitoring dashboard:**

1. **Query slow endpoints:**
   ```sql
   SELECT 
     endpoint,
     AVG(response_time_ms) as avg_time,
     COUNT(*) as request_count,
     COUNT(*) FILTER (WHERE status_code >= 400) as error_count
   FROM api_metrics
   WHERE created_at > NOW() - INTERVAL '1 hour'
   GROUP BY endpoint
   ORDER BY avg_time DESC;
   ```

2. **Track user activity:**
   ```sql
   SELECT 
     DATE_TRUNC('hour', created_at) as hour,
     COUNT(DISTINCT user_id) as active_users,
     COUNT(*) as total_requests
   FROM api_metrics
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY hour
   ORDER BY hour;
   ```

### Alerts

Set up alerts for:
- High error rates (>5%)
- Slow response times (>2s)
- Rate limit violations
- Database connection issues

---

## ⚡ Performance Optimization

### 1. Database Indexes

All critical indexes are created in the migration:
- User-based queries: `idx_*_user_created`
- Time-based queries: `idx_*_created_at`
- Score-based queries: `idx_*_scores`

### 2. Query Optimization

**Use pagination:**
```typescript
// Use the paginated function
const data = await getPaginatedData('glow_analyses', userId, page, 20);
```

**Limit result sets:**
```typescript
// Always use LIMIT
const { data } = await supabase
  .from('glow_analyses')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(20);
```

**Use select specific columns:**
```typescript
// Don't select all columns
.select('id, image_url, overall_score, created_at')
```

### 3. Partitioning

Tables are partitioned by month:
- `glow_analyses` - Monthly partitions
- `style_analyses` - Monthly partitions
- `progress_photos` - Monthly partitions
- `api_metrics` - Monthly partitions

**Benefits:**
- Faster queries on recent data
- Easier data archival
- Better index performance

### 4. Batch Operations

**Batch inserts:**
```typescript
// Insert multiple records at once
await supabaseAdmin
  .from('glow_analyses')
  .insert(analyses);
```

**Batch updates:**
```typescript
// Update multiple records
await supabaseAdmin
  .from('profiles')
  .update({ last_active_at: new Date() })
  .in('id', userIds);
```

---

## 🚀 Scaling Checklist

### For 10,000 Users
- ✅ Database indexes
- ✅ Connection pooling
- ✅ Basic caching
- ✅ Rate limiting

### For 50,000 Users
- ✅ All above
- ✅ Redis caching
- ✅ Background job processing
- ✅ Database partitioning
- ✅ CDN for static assets
- ✅ Monitoring and alerts

### For 100,000+ Users
- ✅ All above
- ✅ Read replicas
- ✅ Horizontal scaling
- ✅ Advanced caching strategies
- ✅ Database sharding (if needed)
- ✅ Load balancing

---

## 📝 Environment Variables

Add to your `.env` file:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis (Optional but recommended)
UPSTASH_REDIS_URL=https://your-redis.upstash.io
UPSTASH_REDIS_TOKEN=your-redis-token

# OpenAI
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
```

---

## 🔧 Maintenance

### Daily
- Monitor API metrics
- Check error rates
- Review rate limit violations

### Weekly
- Refresh materialized views
- Cleanup expired cache
- Review slow queries

### Monthly
- Archive old data
- Review and optimize indexes
- Update partitions

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

## 🆘 Troubleshooting

### High Database Load
1. Check slow queries in `api_metrics`
2. Review index usage
3. Enable query logging
4. Consider read replicas

### Rate Limit Issues
1. Review rate limit settings
2. Check for abuse patterns
3. Adjust limits per endpoint
4. Implement user-based limits

### Cache Misses
1. Review cache TTL settings
2. Check cache key strategy
3. Monitor cache hit rates
4. Consider Redis for better performance

---

**Last Updated:** January 2024
**Maintained By:** Backend Team

















