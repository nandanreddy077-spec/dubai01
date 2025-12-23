# Production Testing Guide - Glow Check App

## Overview
This guide provides comprehensive testing procedures to ensure all AI features work correctly with Edge Functions before production launch.

## Pre-Testing Checklist

### 1. Environment Setup
- [ ] Verify `EXPO_PUBLIC_SUPABASE_URL` is set correctly
- [ ] Verify `EXPO_PUBLIC_SUPABASE_ANON_KEY` is set correctly
- [ ] Verify `EXPO_PUBLIC_OPENAI_API_KEY` is set correctly (fallback)
- [ ] Verify Edge Function `OPENAI_API_KEY` secret is set in Supabase Dashboard
- [ ] Verify Edge Function `GOOGLE_VISION_API_KEY` secret is set (if using Vision API)
- [ ] Verify Edge Functions are deployed: `ai-analyze` and `vision-analyze`

### 2. Edge Function Verification
Run these commands to verify Edge Functions are deployed:

```bash
# Check if Edge Functions are accessible
curl -X POST https://pmroozitldbgnchainxv.supabase.co/functions/v1/ai-analyze \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

Expected: Should return an error about missing auth/user, but NOT a 404 (which would mean function doesn't exist).

## Testing Procedures

### Test 1: Glow Analysis (Single Angle)
**Time: 5 minutes**

1. **Navigate to Glow Analysis**
   - Open app → Tap "Glow Analysis"
   - Select "Single Angle" option

2. **Upload Image**
   - Take a front-facing selfie or select from gallery
   - Ensure good lighting and clear face visibility

3. **Monitor Console Logs**
   - Look for: `🔄 Edge Function attempt 1/3...`
   - Should see: `✅ AI analysis completed via Edge Function (attempt 1)`
   - If retry occurs, should see attempt 2/3 or 3/3

4. **Verify Results**
   - Check that analysis results appear (scores, recommendations)
   - Verify no error messages shown to user
   - Results should include:
     - Skin analysis (type, tone, quality)
     - Beauty scores (overall, symmetry, glow, etc.)
     - Recommendations

5. **Expected Behavior**
   - ✅ Edge Function should succeed on first attempt (90% target)
   - ✅ If Edge Function fails, should retry up to 3 times
   - ✅ If all retries fail, should fallback to direct OpenAI API
   - ✅ User should always see results (never a blank screen)

**Success Criteria:**
- Analysis completes successfully
- Results are displayed correctly
- No crashes or error screens

---

### Test 2: Glow Analysis (Multi-Angle)
**Time: 5 minutes**

1. **Navigate to Glow Analysis**
   - Open app → Tap "Glow Analysis"
   - Select "Multi-Angle" option

2. **Upload Images**
   - Take/select front-facing photo
   - Take/select left profile photo
   - Take/select right profile photo

3. **Monitor Console Logs**
   - Should see Edge Function call with `multiAngle: true`
   - Should see `analysisAccuracy: "Professional-grade (multi-angle)"` in response

4. **Verify Results**
   - Check that multi-angle analysis appears
   - Verify 3D symmetry scores are present
   - Check profile proportions are analyzed

**Success Criteria:**
- Multi-angle analysis completes
- All three angles are processed
- Results show enhanced accuracy

---

### Test 3: Style Guide Analysis
**Time: 5 minutes**

1. **Navigate to Style Check**
   - Open app → Tap "Style Check"
   - Select an occasion (e.g., "Casual", "Formal", "Date Night")

2. **Upload Outfit Photo**
   - Take/select a full-body outfit photo
   - Ensure good lighting and full outfit visible

3. **Monitor Console Logs**
   - Look for: `🤖 Starting style analysis via Edge Function (attempt 1/3)...`
   - Should see: `✅ Style analysis completed via Edge Function (attempt 1)`

4. **Verify Results**
   - Check that style analysis appears:
     - Overall score
     - Color analysis
     - Outfit breakdown (top, bottom, accessories)
     - Occasion match
     - Body type recommendations
     - Overall feedback

**Success Criteria:**
- Style analysis completes successfully
- All sections are populated
- Recommendations are relevant to occasion

---

### Test 4: Glow Coach Plan Generation
**Time: 5 minutes**

1. **Prerequisites**
   - Complete a Glow Analysis first (Test 1 or 2)

2. **Navigate to Glow Coach**
   - Open app → Tap "Glow Coach"
   - Tap "Create Custom Plan" or select a template

3. **Monitor Console Logs**
   - Look for OpenAI API calls (this uses direct API, not Edge Function)
   - Should see: `Raw AI response:` with JSON plan data

4. **Verify Results**
   - Check that a 30-day plan is generated
   - Verify plan includes:
     - Daily routine steps
     - Product recommendations
     - Custom goal (if specified)
   - Plan should be saved and accessible

**Success Criteria:**
- Plan is generated successfully
- Plan is saved and can be accessed later
- Daily steps are actionable

---

### Test 5: Insights Generation
**Time: 5 minutes**

1. **Prerequisites**
   - Have at least 3-5 progress photos
   - Have some journal entries
   - Have active products tracked

2. **Navigate to Insights**
   - Open app → Tap "Insights" tab
   - Wait for insights to load

3. **Monitor Console Logs**
   - Look for: `Generating AI insights...`
   - Should see either AI-generated insights or rule-based fallback

4. **Verify Results**
   - Check that insights appear:
     - Photo trends (hydration, texture, brightness, acne)
     - Habit correlations
     - Product impact analysis
     - Consistency score
   - Insights should be personalized to user's data

**Success Criteria:**
- Insights are generated (AI or rule-based)
- Insights are relevant to user's data
- No errors or crashes

---

### Test 6: Edge Function Retry Logic
**Time: 5 minutes**

**Note:** This test simulates network issues to verify retry logic works.

1. **Simulate Network Issues**
   - Use network throttling in development tools
   - Or temporarily disconnect/reconnect network during analysis

2. **Start Glow Analysis**
   - Upload an image
   - Watch console logs

3. **Verify Retry Behavior**
   - Should see multiple attempts: `attempt 1/3`, `attempt 2/3`, `attempt 3/3`
   - Should see exponential backoff delays (1s, 2s, 3s)
   - Should eventually succeed or fallback gracefully

**Success Criteria:**
- Retry logic activates on network errors
- Exponential backoff is working
- Fallback to direct API if Edge Function fails completely

---

### Test 7: Rate Limiting
**Time: 3 minutes**

1. **Rapid Requests**
   - Make 10+ rapid analysis requests (within 1 minute)
   - Use the same user account

2. **Verify Rate Limit**
   - Should see rate limit error after 10 requests
   - Error message: "Rate limit exceeded. Please wait before trying again."
   - Should return 429 status code

3. **Wait and Retry**
   - Wait 1 minute
   - Should be able to make requests again

**Success Criteria:**
- Rate limiting works (10 requests/minute)
- Error message is user-friendly
- Rate limit resets after window

---

### Test 8: Error Handling & Fallbacks
**Time: 5 minutes**

1. **Test Fallback Scenarios**
   - Disable Edge Function temporarily (or use invalid API key)
   - Attempt Glow Analysis

2. **Verify Fallback**
   - Should attempt Edge Function 3 times
   - Should fallback to direct OpenAI API
   - Should still return results (not error screen)

3. **Test Invalid Image**
   - Upload corrupted/invalid image
   - Should show appropriate error message
   - Should not crash app

**Success Criteria:**
- Fallbacks work correctly
- Users always see results or helpful error messages
- No crashes on errors

---

## Performance Testing

### Test 9: Response Times
**Time: 5 minutes**

1. **Measure Edge Function Response**
   - Start timer when analysis begins
   - Stop when results appear
   - Record time for 5 analyses

2. **Expected Performance**
   - Edge Function: 3-8 seconds (first call)
   - Cached Edge Function: < 1 second
   - Direct OpenAI API fallback: 5-12 seconds

**Success Criteria:**
- Average response time < 10 seconds
- Cached responses are fast (< 1 second)
- No timeouts or hanging requests

---

### Test 10: Concurrent Users
**Time: 5 minutes**

1. **Simulate Multiple Users**
   - Use 2-3 devices/accounts simultaneously
   - All perform Glow Analysis at the same time

2. **Verify Behavior**
   - All requests should complete successfully
   - No rate limiting issues between different users
   - Results are accurate for each user

**Success Criteria:**
- Multiple concurrent requests work
- No interference between users
- Each user gets correct results

---

## Edge Function Integration Verification

### Checklist for Edge Function Setup

- [ ] **Edge Function `ai-analyze` is deployed**
  - Location: `supabase/functions/ai-analyze/index.ts`
  - Verify in Supabase Dashboard → Edge Functions

- [ ] **Edge Function `vision-analyze` is deployed**
  - Location: `supabase/functions/vision-analyze/index.ts`
  - Verify in Supabase Dashboard → Edge Functions

- [ ] **Environment Secrets are Set**
  - `OPENAI_API_KEY` in Supabase Dashboard → Edge Functions → Secrets
  - `GOOGLE_VISION_API_KEY` (if using Vision API)
  - `SUPABASE_URL` (auto-set)
  - `SUPABASE_SERVICE_ROLE_KEY` (auto-set)

- [ ] **Edge Function Code Verification**
  - ✅ Uses `Deno.env.get('OPENAI_API_KEY')` to get API key
  - ✅ Validates API key before making requests
  - ✅ Implements rate limiting (10 requests/minute)
  - ✅ Implements response caching (1 hour TTL)
  - ✅ Handles CORS properly
  - ✅ Validates user authentication
  - ✅ Returns proper error messages

- [ ] **Client-Side Integration Verification**
  - ✅ `lib/ai-service.ts` calls Edge Function with retry logic
  - ✅ Retries up to 3 times on recoverable errors
  - ✅ Falls back to direct OpenAI API if Edge Function fails
  - ✅ Proper error handling and user feedback

---

## Testing Results Template

```
Date: ___________
Tester: ___________
Build Version: ___________

Test Results:
[ ] Test 1: Glow Analysis (Single Angle) - PASS / FAIL
[ ] Test 2: Glow Analysis (Multi-Angle) - PASS / FAIL
[ ] Test 3: Style Guide Analysis - PASS / FAIL
[ ] Test 4: Glow Coach Plan Generation - PASS / FAIL
[ ] Test 5: Insights Generation - PASS / FAIL
[ ] Test 6: Edge Function Retry Logic - PASS / FAIL
[ ] Test 7: Rate Limiting - PASS / FAIL
[ ] Test 8: Error Handling & Fallbacks - PASS / FAIL
[ ] Test 9: Response Times - PASS / FAIL
[ ] Test 10: Concurrent Users - PASS / FAIL

Issues Found:
1. ___________
2. ___________
3. ___________

Edge Function Success Rate: _____% (target: 90%+)
Average Response Time: _____ seconds
```

---

## Quick Test Script (30 minutes)

For a quick end-to-end test, run these in sequence:

1. **Glow Analysis (Single)** - 3 min
2. **Style Guide** - 3 min
3. **Glow Coach Plan** - 3 min
4. **Insights** - 3 min
5. **Multi-Angle Analysis** - 5 min
6. **Error Handling** - 5 min
7. **Performance Check** - 5 min
8. **Final Verification** - 3 min

**Total: ~30 minutes**

---

## Production Readiness Criteria

Before launching to production, ensure:

- ✅ All 10 tests pass
- ✅ Edge Function success rate > 90%
- ✅ Average response time < 10 seconds
- ✅ No crashes or critical errors
- ✅ Fallbacks work correctly
- ✅ Rate limiting is functional
- ✅ Error messages are user-friendly
- ✅ All AI features return results (never blank screens)

---

## Troubleshooting

### Edge Function Not Responding
1. Check Supabase Dashboard → Edge Functions → Logs
2. Verify `OPENAI_API_KEY` secret is set correctly
3. Check function is deployed (not just saved)
4. Verify network connectivity

### High Failure Rate
1. Check OpenAI API key is valid and has credits
2. Verify rate limits aren't being hit
3. Check Supabase Edge Function logs for errors
4. Verify request format matches Edge Function expectations

### Slow Response Times
1. Check Edge Function logs for bottlenecks
2. Verify caching is working (subsequent requests should be faster)
3. Check OpenAI API response times
4. Consider upgrading Edge Function resources if needed

---

## Support

If issues persist:
1. Check Supabase Edge Function logs
2. Review client-side console logs
3. Verify all environment variables are set
4. Test Edge Function directly via curl/Postman
5. Check OpenAI API status and credits






