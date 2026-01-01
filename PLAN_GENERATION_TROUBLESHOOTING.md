# Plan Generation Troubleshooting Guide

## 🔍 Issue: Plan Not Being Created - No Supabase Logs

If you see nothing in Supabase logs, the Edge Function is **never being called**. Here's how to debug:

## 📋 Step-by-Step Debugging

### Step 1: Check Which Option You're Using

**Template Plans (Curated Plans):**
- These do NOT call the Edge Function
- They use fallback plans directly
- If you select "Acne Control", "Anti-Aging", etc. → No Edge Function call

**Custom Plan:**
- This SHOULD call the Edge Function
- Requires entering a custom goal
- Click "Begin Your Story" → Enter goal → Click "Create Plan"

### Step 2: Check Console Logs

When you try to create a plan, look for these logs in order:

#### For Custom Plan:
```
🚀 Starting custom plan generation...
📋 Plan generation request: {...}
🤖 Attempting to generate plan via Edge Function...
✅ Supabase imported
🔐 Auth check result: { hasUser: true/false, ... }
✅ User authenticated: [userId]
🔗 Supabase configuration: {...}
📤 Calling plan-generate Edge Function (attempt 1/3)...
🌐 About to invoke Edge Function: plan-generate
🔗 Supabase client: {...}
📦 Request body size: ... bytes
🌐 Edge Function invoke completed
📥 Edge Function response (attempt 1): {...}
```

#### If You See:
- `⚠️ No user authenticated` → **User needs to log in**
- `❌ User auth error` → **Authentication failed**
- No logs after "About to invoke" → **Edge Function call failed silently**

### Step 3: Common Issues

#### Issue 1: User Not Authenticated
**Symptom:** Logs show `⚠️ No user authenticated`
**Fix:** User must be logged in to use AI plan generation

#### Issue 2: Template Plan Selected
**Symptom:** No Edge Function logs at all
**Fix:** Use "Custom Plan" option instead of template plans

#### Issue 3: Custom Goal Not Entered
**Symptom:** Alert says "Please enter your skincare goal"
**Fix:** Enter a goal in the text input before creating plan

#### Issue 4: Edge Function Not Deployed
**Symptom:** Error in logs about function not found
**Fix:** Deploy `plan-generate` Edge Function in Supabase

#### Issue 5: Network Error
**Symptom:** Error about network/fetch
**Fix:** Check internet connection, Supabase URL configuration

## 🎯 Quick Test

1. **Complete skin analysis**
2. **Click "Start Your Glow Journey"**
3. **Click "Begin Your Story" (NOT a template plan)**
4. **Enter a custom goal** (e.g., "I want glowing, radiant skin")
5. **Click "Create Plan"**
6. **Check console logs** - you should see all the logs above
7. **Check Supabase logs** - you should see `🚀 plan-generate function invoked`

## ✅ Expected Behavior

When working correctly:
1. User enters custom goal
2. App calls `generateCustomPlan()`
3. App checks user authentication
4. App calls `supabase.functions.invoke('plan-generate', ...)`
5. Supabase Edge Function receives request
6. Edge Function calls OpenAI API
7. Edge Function returns plan data
8. App creates and saves plan
9. User navigates to Glow Coach

## 🐛 If Still Not Working

Share these logs:
1. All console logs from when you click "Create Plan"
2. Any error messages
3. Whether you're using template or custom plan
4. Whether user is logged in

