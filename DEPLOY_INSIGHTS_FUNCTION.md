# Deploy Insights Generate Edge Function

## Current Status
❌ **Missing**: `insights-generate` Edge Function is not deployed in your Supabase dashboard

You have:
- ✅ `ai-analyze` (8 deployments)
- ✅ `plan-generate` (1 deployment)  
- ✅ `vision-analyze` (7 deployments)
- ❌ `insights-generate` (NOT DEPLOYED)

## Quick Deploy

### Option 1: Deploy via Supabase CLI (Recommended)

1. **Make sure you're logged in:**
   ```bash
   supabase login
   ```

2. **Link to your project:**
   ```bash
   supabase link --project-ref pmroozitldbgnchainxv
   ```

3. **Deploy the function:**
   ```bash
   supabase functions deploy insights-generate
   ```

### Option 2: Deploy via Supabase Dashboard

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/pmroozitldbgnchainxv
2. Navigate to **Edge Functions** → **Functions**
3. Click **"Deploy a new function"**
4. Select **"Deploy from local files"** or **"Create from template"**
5. If deploying from local:
   - Function name: `insights-generate`
   - Upload the folder: `supabase/functions/insights-generate/`

### Option 3: Deploy via Git (if using Supabase Git integration)

If you have Git integration set up, push your code and it will auto-deploy.

## Verify Secrets Are Set

The function needs `OPENAI_API_KEY` secret. Check if it's set:

```bash
supabase secrets list
```

If not set, add it:

```bash
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here
```

Or set it in the dashboard:
1. Go to **Edge Functions** → **Secrets**
2. Add secret: `OPENAI_API_KEY` = `your-key-here`

## Verify Deployment

After deploying:

1. Check the dashboard - you should see `insights-generate` in the list
2. Test the function:
   ```bash
   curl -X POST https://pmroozitldbgnchainxv.supabase.co/functions/v1/insights-generate \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "test", "userId": "test-user-id"}'
   ```

## Troubleshooting

### "Function not found" error
- Make sure you deployed with the exact name: `insights-generate`
- Check the function appears in your dashboard

### "OpenAI API key not configured" error
- Set the secret: `supabase secrets set OPENAI_API_KEY=your-key`
- Or set it in the dashboard under Edge Functions → Secrets

### "Unauthorized" error
- Make sure you're passing the Authorization header with your anon key
- Verify the user is authenticated in your app

## After Deployment

Once deployed, the insights AI will work correctly:
1. Users with 5+ photos OR 5+ journal entries can generate insights
2. The function will securely call OpenAI API
3. Rate limiting: 10 requests per hour per user
4. Falls back to rule-based insights if Edge Function fails

---

**Status**: Ready to deploy - function code is fixed and ready!



