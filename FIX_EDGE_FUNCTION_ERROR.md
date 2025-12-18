# Fix Edge Function "Failed to send a request" Error

## The Problem
You're seeing: `FunctionsFetchError: Failed to send a request to the Edge Function`

This means your app can't reach the deployed Edge Function. Let's fix it step by step.

---

## Step 1: Verify Edge Function is Deployed ✅

1. **Go to Supabase Dashboard:**
   - Open: https://supabase.com/dashboard
   - Select your project (pmroozitldbgnchainxv)

2. **Navigate to Edge Functions:**
   - Click **"Edge Functions"** in left sidebar
   - You should see: `vision-analyze` and `ai-analyze`

3. **Check Deployment Status:**
   - If functions show as **deployed** ✅ → Continue to Step 2
   - If functions **don't exist** ❌ → Go to **Step 1A: Deploy Functions**

### Step 1A: Deploy Functions (if not deployed)

**Option A: Deploy via Supabase CLI (Recommended)**

```bash
# Make sure you're logged in
supabase login

# Link your project
supabase link --project-ref pmroozitldbgnchainxv

# Deploy vision-analyze
supabase functions deploy vision-analyze

# Deploy ai-analyze
supabase functions deploy ai-analyze
```

**Option B: Deploy via Dashboard**

1. Click **"Create a new function"**
2. Name: `vision-analyze`
3. Copy entire contents from `supabase/functions/vision-analyze/index.ts`
4. Paste in editor
5. Click **"Deploy"**
6. Repeat for `ai-analyze`

---

## Step 2: Verify Edge Function Secrets 🔑

1. **In Supabase Dashboard:**
   - Go to **Edge Functions** → **Secrets**

2. **Ensure these secrets exist:**
   - `GOOGLE_VISION_API_KEY` (for vision-analyze)
   - `OPENAI_API_KEY` (for ai-analyze)
   - `SUPABASE_URL` (auto-set by Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY` (auto-set by Supabase)

3. **If missing, add them:**
   - Click **"Add secret"**
   - Name: `GOOGLE_VISION_API_KEY`
   - Value: Your Google Vision API key
   - Click **"Save"**

---

## Step 3: Verify Your App Configuration 📱

Check your environment variables are correct:

```bash
# Print your current env vars
echo $EXPO_PUBLIC_SUPABASE_URL
echo $EXPO_PUBLIC_SUPABASE_ANON_KEY
```

**Expected format:**
- URL: `https://pmroozitldbgnchainxv.supabase.co`
- Anon Key: Long string starting with `eyJ...`

**If they're wrong:**
1. Update in your `.env` or environment
2. Restart your app: `npx expo start -c`

---

## Step 4: Test Edge Function 🧪

Run the diagnostic script:

```bash
npx tsx scripts/test-edge-function.ts
```

**Expected output:**
```
✅ Authenticated as: your@email.com
✅ Edge Function Response received
✅ Edge Function is working correctly!
```

**If it fails:**
- Read the error message carefully
- Check the "Common causes" section in the output
- Go back to Steps 1-3

---

## Step 5: Test in Your App 📲

After confirming the function works:

1. **Restart your app:**
   ```bash
   npx expo start -c
   ```

2. **Try the Glow Analysis feature**
3. **Check console logs** for any errors

---

## Common Issues & Solutions

### Issue: "Function not found"
**Solution:** Function name mismatch
- Check spelling: `vision-analyze` (not `vision-analysis`)
- Verify in dashboard: Function name must match exactly

### Issue: "Missing authorization header"
**Solution:** User not logged in
- Log in to the app first
- Edge Functions require authentication

### Issue: "Rate limit exceeded"
**Solution:** Too many requests
- Wait 1 minute
- Rate limit: 20 requests per minute per user

### Issue: "Google Vision API error: 400"
**Solution:** Invalid image format
- Image must be valid base64
- Max size: 15MB (after base64 encoding)

### Issue: "Unauthorized"
**Solution:** Token expired or invalid
- Log out and log back in
- Check Supabase auth status

---

## Still Not Working?

1. **Check Edge Function Logs:**
   - Dashboard → Edge Functions → Select function → Logs
   - Look for errors in real-time

2. **Verify Project ID:**
   - Your Supabase URL should contain: `pmroozitldbgnchainxv`
   - If different, update `EXPO_PUBLIC_SUPABASE_URL`

3. **Test with curl:**
   ```bash
   curl -X POST \
     'https://pmroozitldbgnchainxv.supabase.co/functions/v1/vision-analyze' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"imageData":"base64...", "userId":"user-id"}'
   ```

4. **Check Network:**
   - Firewall blocking Supabase?
   - VPN interfering?
   - Try different network

---

## Quick Checklist

Before you proceed, verify:

- [ ] Edge Functions deployed in Supabase Dashboard
- [ ] Secrets configured (GOOGLE_VISION_API_KEY, OPENAI_API_KEY)
- [ ] Environment variables correct in app
- [ ] User is logged in
- [ ] Test script passes
- [ ] App restarted with `-c` flag

---

## Next Steps

Once Edge Functions work:

1. The Glow Analysis will work correctly
2. AI insights will generate properly
3. Progress tracking will analyze photos

Need help? Check the logs in:
- **App console:** Real-time errors
- **Supabase Dashboard → Edge Functions → Logs:** Server-side errors
