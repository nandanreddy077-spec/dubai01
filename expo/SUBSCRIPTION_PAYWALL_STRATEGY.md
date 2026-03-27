# Hard Paywall Implementation Strategy

## Overview
This document outlines the hard paywall strategy for the Glow Check app, ensuring users must subscribe to access premium features.

## Subscription Tiers

### Free Tier (Limited Access)
- **1 free skin analysis scan** (to hook users)
- Basic app navigation
- View blurred results from free scan

### Premium Tier (Subscription Required)
- **Monthly**: $8.99/month (3-day free trial)
- **Yearly**: $99/year (3-day free trial, save 89%)
- Unlimited skin analysis scans
- Full access to all features

## Paywall Placement Strategy

### 1. **Scan/Analysis Flow** (Critical Entry Point)
**Location**: `app/glow-analysis.tsx` and `app/analysis-results.tsx`

**Strategy**:
- Allow users to complete 1 free scan
- Show results (blurred if needed) for free scan
- After 1 scan, show hard paywall before allowing another scan
- Paywall appears when user tries to start a new scan after free one

**Implementation**:
```tsx
// In glow-analysis.tsx - Check before allowing scan
const { canScan, scansLeft } = useSubscription();
if (!canScan && scansLeft === 0) {
  // Show paywall modal
}
```

### 2. **Analysis Results Screen** (After Free Scan)
**Location**: `app/analysis-results.tsx`

**Strategy**:
- Show results from free scan
- After viewing results, show paywall for:
  - Detailed insights
  - Product recommendations
  - Routine generation
  - Progress tracking

**Implementation**:
- Use `SubscriptionGuard` around premium features
- Show `HardPaywall` modal when user tries to access premium features

### 3. **Routine/Coach Screen** (Core Feature)
**Location**: `app/(tabs)/glow-coach.tsx`

**Strategy**:
- Hard paywall - no access without subscription
- Show paywall immediately if not subscribed
- Allow viewing but block:
  - Creating new routines
  - Accessing AI coach features
  - Progress tracking

**Implementation**:
```tsx
<SubscriptionGuard requiresPremium={true} feature="Personalized Routines">
  {/* Routine content */}
</SubscriptionGuard>
```

### 4. **Product Recommendations** (Monetization Feature)
**Location**: `app/(tabs)/home.tsx` and `app/product-tracking.tsx`

**Strategy**:
- Show paywall when user tries to:
  - View detailed product recommendations
  - Access product tracking
  - See personalized matches

**Implementation**:
- Wrap recommendation sections in `SubscriptionGuard`
- Show paywall on product detail screens

### 5. **AI Advisor** (Premium Feature)
**Location**: `app/ai-advisor.tsx`

**Strategy**:
- Hard paywall - completely blocked without subscription
- Show paywall immediately on screen load

**Implementation**:
```tsx
<SubscriptionGuard requiresPremium={true} feature="AI Beauty Advisor">
  {/* AI Advisor content */}
</SubscriptionGuard>
```

### 6. **Progress Tracking** (Engagement Feature)
**Location**: `app/(tabs)/progress.tsx`

**Strategy**:
- Show paywall for:
  - Historical progress data
  - Advanced analytics
  - Trend analysis

## Implementation Checklist

### Phase 1: Core Paywalls ✅
- [x] Create `HardPaywall` component
- [x] Update `SubscriptionGuard` to enforce paywalls
- [ ] Add paywall to scan flow (after 1 free scan)
- [ ] Add paywall to analysis results (premium features)
- [ ] Add paywall to routine/coach screen

### Phase 2: Feature Paywalls
- [ ] Add paywall to product recommendations
- [ ] Add paywall to AI advisor
- [ ] Add paywall to progress tracking
- [ ] Add paywall to product tracking

### Phase 3: Testing & Optimization
- [ ] Test subscription flow end-to-end
- [ ] Test paywall dismissal after subscription
- [ ] Test restore purchases functionality
- [ ] Optimize paywall conversion rates

## Paywall UX Best Practices

1. **Clear Value Proposition**
   - Show what users get with premium
   - Highlight exclusive features
   - Use social proof if available

2. **Non-Intrusive but Clear**
   - Don't block basic navigation
   - Show paywall at natural breakpoints
   - Make it easy to subscribe

3. **Trial Period**
   - 3-day free trial with payment method
   - Clear messaging about trial
   - Easy cancellation

4. **Multiple Entry Points**
   - Paywall appears at multiple touchpoints
   - Consistent messaging across all paywalls
   - Easy to subscribe from anywhere

## RevenueCat Integration

### Product IDs
- Monthly: `com.glowcheck.monthly.premium`
- Yearly: `com.glowcheck.yearly1.premium`

### Entitlement
- `premium_access` - Grants access to all premium features

### Subscription Status Check
```tsx
const { state, hasAnyAccess } = useSubscription();
const isPremium = state?.isPremium || hasAnyAccess;
```

## Testing Strategy

1. **Free User Flow**
   - Complete 1 free scan
   - View results
   - Try to scan again → Paywall appears
   - Try to access premium features → Paywall appears

2. **Trial User Flow**
   - Start trial
   - Access all features
   - Trial expires → Paywall appears

3. **Premium User Flow**
   - Subscribe
   - Access all features
   - No paywalls appear

4. **Restore Purchases**
   - Test restore functionality
   - Verify subscription status syncs

## Conversion Optimization

1. **Paywall Timing**
   - Show after user sees value (after first scan)
   - Don't show too early (let them explore)
   - Show at natural breakpoints

2. **Messaging**
   - Focus on benefits, not features
   - Use urgency sparingly
   - Highlight savings (yearly plan)

3. **Design**
   - Beautiful, premium feel
   - Clear pricing
   - Easy to subscribe

## Support & Legal

- Terms of Service link
- Privacy Policy link
- Restore Purchases option
- Support contact
- Clear cancellation policy

