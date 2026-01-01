# Plan Generation Flow Debugging Guide

## 🔍 Issue: Plan Not Being Created - Edge Function Never Called

The user reports that when clicking "Start Your Glow Journey" and entering a goal, the plan is not being created and the Edge Function is never called (Supabase logs show "No results found").

## 📋 Flow Analysis

### Expected Flow:
1. User completes skin analysis → sees results
2. User clicks **"Start Your Glow Journey"** button
3. Navigates to `/skincare-plan-selection` screen
4. User enters custom goal in text input
5. User clicks button to create custom plan
6. `handleCustomPlan()` is called
7. `generateCustomPlan()` is called
8. Edge Function `plan-generate` is invoked
9. AI generates 30-day plan
10. Plan is saved and user navigates to Glow Coach

### Current Issue:
Step 8 (Edge Function call) is never happening.

## 🔧 Enhanced Logging Added

I've added comprehensive logging at every step:

### 1. UI Level (`app/skincare-plan-selection.tsx`):
- ✅ Logs when `handleCustomPlan` is called
- ✅ Logs request details (hasResult, overallScore, skinType, customGoal)
- ✅ Logs success/failure

### 2. Context Level (`contexts/SkincareContext.tsx`):
- ✅ Logs when `generateCustomPlan` starts
- ✅ Logs analysis result details
- ✅ Logs Supabase import
- ✅ Logs authentication check (user, userId, errors)
- ✅ Logs each Edge Function attempt (1/3, 2/3, 3/3)
- ✅ Logs request payload
- ✅ Logs response details (data, error, keys)
- ✅ Logs validation results
- ✅ Logs fallback plan creation
- ✅ Logs final status

## 🐛 Most Likely Causes

### 1. User Not Authenticated (MOST LIKELY)
**Symptom:** Edge Function never called, goes straight to fallback
**Check:** 
- Look for log: `⚠️ No user authenticated, using fallback plan`
- Look for log: `❌ User auth error:`
- Verify user is logged in

**Fix:** User must be logged in to use AI plan generation

### 2. Analysis Result Missing
**Symptom:** Early return before Edge Function call
**Check:**
- Look for log: `❌ No analysis result available`
- Verify `currentResult` exists

### 3. Custom Goal Empty
**Symptom:** Alert shown, function returns early
**Check:**
- User must enter a goal in the text input
- Look for: `Please enter your skincare goal` alert

### 4. Edge Function Not Deployed
**Symptom:** Edge Function call fails with 404 or function not found
**Check:**
- Supabase Dashboard → Edge Functions → Is `plan-generate` listed?
- Is it deployed to production?

### 5. Network Error
**Symptom:** Edge Function call fails with network error
**Check:**
- Look for: `❌ Edge Function invoke error` with network-related message
- Should retry automatically (up to 3 times)

## 📊 How to Debug

### Step 1: Check App Console Logs

When you click "Start Your Glow Journey" and create a plan, look for these logs in order:

```
🚀 Starting custom plan generation...
📋 Plan generation request: {...}
🤖 Attempting to generate plan via Edge Function...
📋 Analysis result: {...}
✅ Supabase imported
🔐 Auth check result: {...}
```

**If you see:**
- `⚠️ No user authenticated` → User needs to log in
- `❌ User auth error` → Authentication issue
- `✅ User authenticated: [userId]` → Good, continue checking

**Then you should see:**
```
📤 Calling plan-generate Edge Function (attempt 1/3)...
📋 Request payload: {...}
📥 Edge Function response (attempt 1): {...}
```

**If you DON'T see the Edge Function call logs:**
- Check if user is authenticated
- Check if there's an error before the call
- Check if `currentResult` exists

### Step 2: Check Supabase Edge Function Logs

1. Go to **Supabase Dashboard** → **Edge Functions** → **plan-generate** → **Logs**
2. Look for: `🚀 plan-generate function invoked`
3. If you see nothing → Edge Function is never being called

**Possible reasons:**
- User not authenticated (code returns early)
- Error before Edge Function call
- Network issue preventing call

### Step 3: Verify User Authentication

The code requires user authentication to call the Edge Function:

```typescript
const { data: { user }, error: userError } = await supabase.auth.getUser();

if (!user) {
  // Goes straight to fallback plan
  throw new Error('User not authenticated - cannot generate plan');
}
```

**To fix:** Ensure user is logged in before trying to create a plan.

## ✅ What I Fixed

1. **Enhanced Logging:** Added detailed logs at every step
2. **Better Error Messages:** More descriptive error messages
3. **Retry Logic:** Already had retry logic for network errors
4. **UI Error Handling:** Better error handling in UI component

## 🎯 Next Steps

1. **Test the flow:**
   - Complete a skin analysis
   - Click "Start Your Glow Journey"
   - Enter a custom goal
   - Click to create plan
   - **Check the console logs**

2. **Share the logs:**
   - Copy all console logs from the plan generation attempt
   - Share them so we can see exactly where it's failing

3. **Check authentication:**
   - Verify user is logged in
   - If not, log in and try again

4. **Check Supabase:**
   - Verify `plan-generate` Edge Function is deployed
   - Check Edge Function logs for any invocations

## 💡 Quick Test

Run this in your app console after clicking "Start Your Glow Journey":

```javascript
// Check if user is authenticated
const { supabase } = await import('./lib/supabase');
const { data: { user } } = await supabase.auth.getUser();
console.log('User authenticated:', !!user, user?.id);
```

If `user` is `null`, that's why the Edge Function is never called!


