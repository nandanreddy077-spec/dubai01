# Tiered Usage Limits Implementation

## Overview
This document describes the implementation of tiered usage limits that differentiate between free and premium users.

## Limits Configuration

### Free Users
| Feature | Daily Limit |
|---------|-------------|
| **Progress Photos** | 1/day |
| **Glow Analysis** | 3/day |
| **Style Check** | 3/day |
| **Skincare Plan** | 3/day |
| **AI Insights** | 4/day |
| **AI Coach** | 20/day |

### Premium Users ($8.99/month)
| Feature | Daily Limit |
|---------|-------------|
| **Progress Photos** | Unlimited (999,999) |
| **Glow Analysis** | Unlimited (999,999) |
| **Style Check** | Unlimited (999,999) |
| **Skincare Plan** | Unlimited (999,999) |
| **AI Insights** | Unlimited (999,999) |
| **AI Coach** | Unlimited (999,999) |

## Implementation Details

### Database Function (`check_and_increment_usage`)

The function now:
1. **Checks subscription status** by querying the `subscriptions` table
2. **Sets limits based on subscription**:
   - Premium users: 999,999 (effectively unlimited)
   - Free users: Specific limits per feature
3. **Returns premium status** in the result JSON

### Subscription Check Logic

```sql
-- Check if user has active subscription
SELECT EXISTS (
  SELECT 1 
  FROM public.subscriptions 
  WHERE user_id = p_user_id 
    AND status = 'active' 
    AND (expires_at IS NULL OR expires_at > NOW())
) INTO v_is_premium;
```

### Client-Side Updates

1. **`lib/usage-tracking.ts`**:
   - Added `isPremium` to `UsageCheckResult` interface
   - Returns `Infinity` for limit/remaining when user is premium

2. **`app/(tabs)/progress.tsx`**:
   - Shows "Unlimited" for premium users
   - Shows upgrade button when free users hit limits
   - Premium badge display
   - Disabled state only for free users

3. **`app/glow-analysis.tsx`**:
   - Checks usage limit before starting analysis
   - Shows upgrade prompt when limit reached
   - Works for both single and multi-angle analysis

4. **`contexts/StyleContext.tsx`**:
   - Checks usage limit before style analysis
   - Shows upgrade prompt when limit reached

## User Experience

### Free Users
- See usage limit indicator (e.g., "2 / 3 remaining")
- Get upgrade prompts when limits reached
- Clear messaging about daily limits

### Premium Users
- See "Premium: Unlimited Access" badge
- No usage limit indicators
- No restrictions on any features

## Upgrade Flow

When free users hit limits:
1. Alert shows: "You've reached your daily limit of X. Upgrade to Premium for unlimited access!"
2. Two buttons:
   - "Cancel" - Dismisses alert
   - "Upgrade to Premium" - Navigates to `/subscribe`

## Database Migration

The migration file (`20250101000000_usage_limits.sql`) has been updated to:
- Check subscription status in the function
- Apply different limits based on subscription
- Return premium status in the result

## Testing

### Test Free User Limits
1. Create a test user without subscription
2. Try to use features beyond limits
3. Verify limits are enforced
4. Verify upgrade prompts appear

### Test Premium User
1. Create a test user with active subscription
2. Use features multiple times
3. Verify no limits are enforced
4. Verify "Unlimited" badge appears

## SQL to Test

```sql
-- Test as free user (no subscription)
SELECT check_and_increment_usage(
  'user-id-without-subscription'::uuid,
  'glow_analysis',
  0.015
);

-- Test as premium user (with active subscription)
SELECT check_and_increment_usage(
  'user-id-with-subscription'::uuid,
  'glow_analysis',
  0.015
);

-- Check user's subscription status
SELECT 
  user_id,
  status,
  expires_at,
  CASE 
    WHEN status = 'active' AND (expires_at IS NULL OR expires_at > NOW()) 
    THEN 'Premium' 
    ELSE 'Free' 
  END as user_tier
FROM subscriptions
WHERE user_id = 'your-user-id'::uuid;
```

## Next Steps

1. **Test the implementation** with real users
2. **Monitor usage patterns** to optimize limits
3. **Adjust limits** if needed based on user feedback
4. **Add analytics** to track conversion from free to premium

## Profitability Impact

### Free Users
- Average cost: ~$0.50/month (with limits)
- Revenue: $0
- Net: -$0.50/month (loss leader)

### Premium Users
- Average cost: ~$1.06/month (unlimited)
- Revenue: $8.99/month
- Net: **$7.93/month profit (88% margin)**

**Key Insight**: Free users are loss leaders to convert to premium. The limits encourage upgrades while keeping costs controlled.

