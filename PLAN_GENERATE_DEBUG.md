# Plan Generation Debugging Guide

## 🔍 Issue: Plan Generation Not Working (While Other Features Work)

Since other OpenAI features work (skin analysis, style check), the `OPENAI_API_KEY` secret is correct. The issue is specific to `plan-generate` Edge Function.

## ✅ Enhanced Logging Added

I've added detailed logging to help debug:

### Client-Side (`contexts/SkincareContext.tsx`):
- ✅ Logs when calling Edge Function
- ✅ Logs request payload details
- ✅ Logs response details (data, error, keys)
- ✅ Better error messages

### Edge Function (`supabase/functions/plan-generate/index.ts`):
- ✅ Logs API key presence and prefix
- ✅ Logs prompt length
- ✅ Logs OpenAI response status
- ✅ Better error handling for fetch errors

## 🐛 How to Debug

### Step 1: Check Supabase Edge Function Logs

1. Go to **Supabase Dashboard** → **Edge Functions** → **plan-generate**
2. Click **"Logs"** tab
3. Look for recent invocations when you try to create a plan
4. Check for these log messages:

**Success indicators:**
- `🚀 plan-generate function invoked`
- `✅ User authenticated`
- `🤖 Calling OpenAI API for plan generation...`
- `🔑 API Key present: true`
- `📥 OpenAI response status: 200`
- `✅ OpenAI API response received`
- `✅ Plan generation complete`

**Error indicators:**
- `❌ Missing authorization header` → User not logged in
- `❌ Authentication failed` → Token invalid
- `❌ OpenAI API key not configured` → Secret missing (unlikely since other features work)
- `❌ OpenAI API error: 401` → API key issue (but other features work, so this is strange)
- `❌ OpenAI API error: 429` → Rate limit
- `❌ OpenAI API error: 500` → OpenAI server error
- `❌ No content in OpenAI response` → Empty response
- `❌ JSON parsing error` → AI returned invalid JSON
- `❌ Invalid plan structure` → AI returned wrong format

### Step 2: Check App Console

Look for these messages when creating a plan:

**Success flow:**
```
📤 Calling plan-generate Edge Function with: {...}
📥 Edge Function response: { hasData: true, ... }
✅ Plan generated via Edge Function
📋 Plan data received: { hasTitle: true, weeklyPlansCount: 4, ... }
```

**Error flow:**
```
📤 Calling plan-generate Edge Function with: {...}
📥 Edge Function response: { hasError: true, ... }
❌ Edge Function error: ...
```

### Step 3: Compare with Working Features

Since `ai-analyze` works, compare:

1. **Request format**: Both use same structure
2. **API key**: Both use `OPENAI_API_KEY` secret
3. **Model**: Both use `gpt-4o-mini`
4. **Response handling**: Both parse JSON

**Key differences:**
- `plan-generate` uses `max_tokens: 3000` (vs 2000 for ai-analyze)
- `plan-generate` has longer prompts
- `plan-generate` expects more complex JSON structure

## 🔧 Possible Issues & Solutions

### Issue 1: Edge Function Not Deployed
**Check:** Supabase Dashboard → Edge Functions → Is `plan-generate` listed?
**Fix:** Deploy the Edge Function

### Issue 2: Edge Function Code Outdated
**Check:** Compare deployed code with `supabase/functions/plan-generate/index.ts`
**Fix:** Update and redeploy

### Issue 3: Request Format Mismatch
**Check:** Edge Function logs show what it receives
**Fix:** Ensure client sends correct format

### Issue 4: Response Too Large
**Check:** Edge Function logs show response size
**Fix:** Reduce `max_tokens` or simplify prompt

### Issue 5: JSON Parsing Failure
**Check:** Edge Function logs show "JSON parsing error"
**Fix:** AI might be returning markdown-wrapped JSON

### Issue 6: Timeout
**Check:** Edge Function logs show timeout
**Fix:** Plan generation might take too long

## 📋 Testing Checklist

1. ✅ Check Edge Function is deployed
2. ✅ Check Edge Function logs for errors
3. ✅ Check app console for errors
4. ✅ Verify user is authenticated
5. ✅ Verify analysis result has all required fields
6. ✅ Check if prompt is too long
7. ✅ Check if response is too large
8. ✅ Verify JSON structure matches expected format

## 🎯 Next Steps

1. **Try creating a plan** and check:
   - Supabase Edge Function logs
   - App console logs
   - What error appears

2. **Share the logs** so we can identify the exact issue:
   - Edge Function log output
   - App console error messages
   - Any specific error codes

3. **Compare with working features**:
   - Check if `ai-analyze` logs show similar patterns
   - See if there's a difference in how they're called

## 💡 Quick Test

Try this in Supabase Edge Function logs:
- Look for `🚀 plan-generate function invoked` - confirms function is called
- Look for `✅ User authenticated` - confirms auth works
- Look for `🤖 Calling OpenAI API` - confirms it reaches OpenAI call
- Look for `📥 OpenAI response status` - shows what OpenAI returns

This will help pinpoint exactly where it's failing!


