# Plan Generation Error Debugging Guide

## 🔍 Common Issues & Solutions

### Issue 1: "API Error" when clicking "Start Your Glow Journey"

**Symptoms:**
- User clicks "Start Your Glow Journey" after skin analysis
- Error message appears: "Failed to generate custom plan"
- Plan is not created

**Possible Causes:**

1. **Edge Function Not Deployed**
   - Check Supabase Dashboard → Edge Functions
   - Verify `plan-generate` function exists and is deployed
   - Check deployment status (should show "Active")

2. **Missing OpenAI API Key**
   - Go to Supabase Dashboard → Edge Functions → Secrets
   - Verify `OPENAI_API_KEY` is set
   - If missing, add it with your OpenAI API key

3. **Authentication Error**
   - User might not be logged in
   - Token might be expired
   - Check if user is authenticated before calling Edge Function

4. **Request Format Mismatch**
   - Edge Function expects specific data structure
   - Check if `analysisResult` has all required fields

5. **OpenAI API Error**
   - OpenAI API might be down
   - Rate limit might be exceeded
   - API key might be invalid

---

## 🐛 Debugging Steps

### Step 1: Check Supabase Edge Function Logs

1. Go to **Supabase Dashboard** → **Edge Functions** → **plan-generate**
2. Click **"Logs"** tab
3. Look for recent invocations
4. Check for error messages:
   - `❌ Missing authorization header` → User not logged in
   - `❌ OpenAI API key not configured` → Secret not set
   - `❌ Authentication failed` → Token invalid
   - `❌ Invalid plan structure` → AI returned invalid data

### Step 2: Check App Console Logs

1. Open your app's developer console
2. Look for these log messages:
   - `🤖 Attempting to generate plan via Edge Function...`
   - `✅ Plan generated via Edge Function` → Success!
   - `❌ Edge Function error:` → Check error details
   - `⚠️ Falling back to direct API...` → Edge Function failed, using fallback

### Step 3: Verify Edge Function is Deployed

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Look for `plan-generate` in the list
3. Check:
   - ✅ Function exists
   - ✅ Status is "Active"
   - ✅ Last deployment was recent
   - ✅ No deployment errors

### Step 4: Verify Secrets

1. Go to **Supabase Dashboard** → **Edge Functions** → **Secrets**
2. Verify these secrets exist:
   - ✅ `OPENAI_API_KEY` - Your OpenAI API key
   - ✅ `SUPABASE_URL` - Should be auto-set
   - ✅ `SUPABASE_SERVICE_ROLE_KEY` - Should be auto-set

### Step 5: Test Edge Function Directly

You can test the Edge Function using curl:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/plan-generate \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "analysisResult": {
      "overallScore": 85,
      "skinType": "Normal",
      "skinTone": "Medium",
      "skinQuality": "Good",
      "dermatologyInsights": {
        "acneRisk": "Low",
        "agingSigns": ["Fine lines"],
        "skinConcerns": ["Pores"],
        "recommendedTreatments": ["Cleanser", "Moisturizer"]
      },
      "detailedScores": {
        "jawlineSharpness": 80,
        "brightnessGlow": 85,
        "hydrationLevel": 75,
        "facialSymmetry": 90,
        "poreVisibility": 70,
        "skinTexture": 80,
        "evenness": 85,
        "elasticity": 75
      }
    },
    "customGoal": "Clear, glowing skin",
    "userId": "YOUR_USER_ID"
  }'
```

---

## ✅ Expected Flow

### Successful Plan Generation:

```
User clicks "Start Your Glow Journey"
  ↓
Navigates to plan selection screen
  ↓
User selects template OR enters custom goal
  ↓
App calls generateCustomPlan()
  ↓
App calls plan-generate Edge Function
  ↓
Edge Function authenticates user
  ↓
Edge Function calls OpenAI API
  ↓
Edge Function validates response
  ↓
Edge Function returns plan data
  ↓
App validates plan structure
  ↓
Plan saved to local storage
  ↓
User navigated to Glow Coach
  ↓
Plan displayed ✅
```

### Error Flow:

```
User clicks "Start Your Glow Journey"
  ↓
Navigates to plan selection screen
  ↓
User selects template OR enters custom goal
  ↓
App calls generateCustomPlan()
  ↓
App calls plan-generate Edge Function
  ↓
❌ Error occurs (auth, API, validation, etc.)
  ↓
App catches error
  ↓
App shows error message to user
  ↓
OR App creates fallback plan (if error is recoverable)
```

---

## 🔧 Quick Fixes

### Fix 1: Edge Function Not Deployed
**Solution:** Deploy the Edge Function in Supabase Dashboard

### Fix 2: Missing OpenAI API Key
**Solution:** 
1. Go to Edge Functions → Secrets
2. Add `OPENAI_API_KEY` with your OpenAI API key

### Fix 3: User Not Authenticated
**Solution:** 
- Make sure user is logged in before generating plan
- Check if auth token is valid

### Fix 4: Invalid Request Data
**Solution:**
- Check if `analysisResult` has all required fields
- Verify data structure matches Edge Function expectations

### Fix 5: OpenAI API Error
**Solution:**
- Check OpenAI API status
- Verify API key is valid
- Check rate limits
- Wait and retry

---

## 📝 Error Messages Reference

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Missing authorization header" | User not logged in | Ensure user is authenticated |
| "OpenAI API key not configured" | Secret not set | Add `OPENAI_API_KEY` secret |
| "Authentication failed" | Invalid token | Re-login user |
| "User ID mismatch" | User ID doesn't match | Check userId in request |
| "Invalid plan structure" | AI returned invalid data | Check Edge Function logs |
| "Failed to parse AI response" | AI response not JSON | Check OpenAI API response |
| "Plan data missing required fields" | Plan missing title/weeklyPlans | Check AI response structure |

---

## 🧪 Testing Checklist

- [ ] Edge Function `plan-generate` is deployed
- [ ] `OPENAI_API_KEY` secret is set
- [ ] User is logged in
- [ ] Analysis result exists and has all required fields
- [ ] Edge Function logs show successful invocation
- [ ] App console shows plan generation success
- [ ] Plan appears in Glow Coach after generation

---

## 💡 Tips

1. **Always check Edge Function logs first** - They show the exact error
2. **Check app console logs** - They show what the app is doing
3. **Test with a simple request** - Use curl to test Edge Function directly
4. **Verify secrets are set** - Missing secrets cause silent failures
5. **Check OpenAI API status** - External API might be down

---

## 🆘 Still Having Issues?

1. Check Supabase Edge Function logs for detailed error messages
2. Check app console for client-side errors
3. Verify all secrets are configured
4. Test Edge Function directly with curl
5. Check if fallback plan is being created (indicates AI failure but app recovery)




