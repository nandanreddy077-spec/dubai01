# Deploy Edge Functions - Alternative Method

Since the CLI project linking has permission issues, here's how to deploy via Supabase Dashboard:

## Option 1: Deploy via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard:**
   - Navigate to: https://supabase.com/dashboard/project/pmroozitldbgnchainxv

2. **Go to Edge Functions:**
   - Click on "Edge Functions" in the left sidebar
   - Click on "Functions"

3. **Create/Deploy vision-analyze:**
   - Click "Create a new function" or find `vision-analyze` if it exists
   - Name: `vision-analyze`
   - Copy the entire contents of `supabase/functions/vision-analyze/index.ts`
   - Paste into the function editor
   - Click "Deploy"

4. **Create/Deploy ai-analyze:**
   - Click "Create a new function" or find `ai-analyze` if it exists
   - Name: `ai-analyze`
   - Copy the entire contents of `supabase/functions/ai-analyze/index.ts`
   - Paste into the function editor
   - Click "Deploy"

5. **Verify Secrets:**
   - Go to Edge Functions → Secrets
   - Ensure both `GOOGLE_VISION_API_KEY` and `OPENAI_API_KEY` are set (✅ Already done!)

## Option 2: Fix CLI and Deploy

If you want to use CLI, you need to:

1. **Make sure you're logged in with the correct account:**
   ```bash
   supabase login
   ```

2. **Select the correct project from the interactive menu:**
   - When you run `supabase functions deploy vision-analyze`
   - Use arrow keys to select the project that matches `pmroozitldbgnchainxv`
   - If it doesn't appear, the project might be in a different organization

3. **Or link directly:**
   ```bash
   supabase link --project-ref pmroozitldbgnchainxv
   ```

## Quick Test After Deployment

Once deployed, test the function:

```typescript
// In your app, this should now work:
const { data, error } = await supabase.functions.invoke('vision-analyze', {
  body: {
    imageData: base64Image,
    userId: user.id,
  },
});
```

## Current Status

✅ Secrets configured: `GOOGLE_VISION_API_KEY`, `OPENAI_API_KEY`
⏳ Edge Functions: Need to be deployed
✅ Code ready: Both functions are in `supabase/functions/`




















