# 🚀 Edge Function Deployment Instructions

## Problem
Your app is showing this error:
```
❌ Vision Edge Function error: FunctionsFetchError: Failed to send a request to the Edge Function
```

This means the `vision-analyze` and `ai-analyze` Edge Functions are **NOT deployed** to your Supabase project.

## Solution: Deploy Edge Functions

You have **2 options** to deploy:

---

## Option 1: Deploy via Supabase Dashboard (Easiest ✅)

### Step 1: Go to your Supabase Dashboard
1. Open: https://supabase.com/dashboard
2. Select your project
3. Click **"Edge Functions"** in the left sidebar

### Step 2: Deploy `vision-analyze` function
1. Click **"Create a new function"**
2. Function name: `vision-analyze`
3. Copy the ENTIRE contents of `supabase/functions/vision-analyze/index.ts`
4. Paste into the function editor
5. Click **"Deploy function"**
6. Wait for deployment to complete (should take 10-30 seconds)

### Step 3: Deploy `ai-analyze` function
1. Click **"Create a new function"** again
2. Function name: `ai-analyze`
3. Copy the ENTIRE contents of `supabase/functions/ai-analyze/index.ts`
4. Paste into the function editor
5. Click **"Deploy function"**
6. Wait for deployment to complete

### Step 4: Verify Secrets are Set
1. In Supabase Dashboard, go to **Edge Functions → Configuration → Secrets**
2. Verify these secrets exist:
   - ✅ `GOOGLE_VISION_API_KEY` 
   - ✅ `OPENAI_API_KEY`
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`

3. If any are missing, add them:
   - Click **"Add secret"**
   - Enter the name and value
   - Click **"Save"**

---

## Option 2: Deploy via Supabase CLI

### Prerequisites
```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login
```

### Deploy Commands
```bash
# Link your project (replace with your project ref)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy both functions
supabase functions deploy vision-analyze
supabase functions deploy ai-analyze
```

### Set Secrets via CLI (if needed)
```bash
# Set Google Vision API Key
supabase secrets set GOOGLE_VISION_API_KEY=your-actual-key-here

# Set OpenAI API Key  
supabase secrets set OPENAI_API_KEY=your-actual-key-here

# Set Supabase URL
supabase secrets set SUPABASE_URL=your-supabase-url

# Set Service Role Key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## ✅ Verify Deployment

After deploying, test if the functions work:

### Test in your app:
1. Restart your Expo app: `npm start`
2. Try to upload a photo for analysis
3. Check the console logs - you should see:
   ```
   ✅ Vision Edge Function response received
   ✅ AI analysis completed via Edge Function
   ```

### Test via cURL:
```bash
# Test vision-analyze
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/vision-analyze \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"imageData":"data:image/jpeg;base64,...","userId":"test"}'

# Test ai-analyze  
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai-analyze \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"imageData":{"imageUri":"data:image/jpeg;base64,...","analysisType":"glow"},"userId":"test"}'
```

---

## 🔍 Troubleshooting

### Error: "Function not found"
- Make sure the function name is exactly `vision-analyze` and `ai-analyze`
- Check if deployment completed successfully

### Error: "Missing authorization header"
- The function requires authentication
- Make sure your app is logged in before calling the function

### Error: "Google Vision API key not configured"
- Go to Edge Functions → Secrets in Supabase Dashboard
- Add the `GOOGLE_VISION_API_KEY` secret

### Error: "OpenAI API error"
- Go to Edge Functions → Secrets in Supabase Dashboard  
- Add or update the `OPENAI_API_KEY` secret

---

## 📝 Summary

1. **Deploy functions** via Dashboard (Option 1) or CLI (Option 2)
2. **Verify secrets** are set in Edge Functions → Secrets
3. **Test** by uploading a photo in your app
4. **Check logs** to confirm functions are working

Once deployed, the "Failed to send a request to the Edge Function" error will be resolved! ✨

---

## Need Help?

If you still see errors after deployment:
1. Check the Edge Function logs in Supabase Dashboard
2. Check your app console for detailed error messages
3. Verify all secrets are correctly set
4. Make sure your OPENAI_API_KEY and GOOGLE_VISION_API_KEY are valid and have credits
