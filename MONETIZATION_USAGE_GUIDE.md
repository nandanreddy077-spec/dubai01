# 💎 Monetization Components - Usage Guide

## Overview

This guide shows you how to use the monetization components in your app to maximize conversions and provide a great user experience.

## 🎯 Components Available

### 1. Trial Offer Screen (`/app/trial-offer.tsx`)
**When to use**: Right after onboarding (automatic)
**Purpose**: Convert new users to trial subscribers

Already integrated! Shows automatically after onboarding.

---

### 2. Trial Status Banner (`/components/TrialStatusBanner.tsx`)
**When to use**: Top of main screens during trial
**Purpose**: Remind users of trial status and encourage upgrade

#### Usage Example:

```tsx
import TrialStatusBanner from '@/components/TrialStatusBanner';

export default function HomeScreen() {
  return (
    <View>
      <TrialStatusBanner />
      {/* Your screen content */}
    </View>
  );
}
```

**Best placement**:
- Home/Dashboard screen
- Progress tracking screen
- Before key features

**Behavior**:
- Shows during trial period
- Hides when user is premium (paid)
- Shows urgency colors (gold → yellow → red) as trial ends
- Tappable to upgrade

---

### 3. Upgrade Prompt Modal (`/components/UpgradePrompt.tsx`)
**When to use**: When users try to access premium features
**Purpose**: Block access and convert to trial/paid

#### Usage Example:

```tsx
import { useState } from 'react';
import UpgradePrompt from '@/components/UpgradePrompt';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function FeatureScreen() {
  const { needsPremium } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleFeatureClick = () => {
    if (needsPremium) {
      setShowUpgrade(true);
      return;
    }
    // Proceed with feature
  };

  return (
    <View>
      <Button onPress={handleFeatureClick} title="Use Premium Feature" />
      
      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="AI Style Analysis"
        message="Get personalized style recommendations powered by AI"
      />
    </View>
  );
}
```

**Props**:
- `visible` (boolean): Show/hide modal
- `onClose` (function): Called when user closes modal
- `feature` (string, optional): Name of feature being blocked
- `message` (string, optional): Custom message

---

## 🔐 Checking Subscription Status

Use the `useSubscription` hook to check user status:

```tsx
import { useSubscription } from '@/contexts/SubscriptionContext';

const {
  state,           // Full subscription state
  inTrial,         // Boolean: is user in trial?
  daysLeft,        // Days left in trial
  hoursLeft,       // Hours left in trial
  canScan,         // Can user perform scans?
  scansLeft,       // Scans remaining (Infinity if premium)
  isTrialExpired,  // Has trial expired?
  canViewResults,  // Can view analysis results?
  needsPremium,    // Should show paywall?
} = useSubscription();
```

---

## 🎨 Implementation Examples

### Example 1: Gating a Feature

```tsx
import { useSubscription } from '@/contexts/SubscriptionContext';
import UpgradePrompt from '@/components/UpgradePrompt';

export default function AICoachScreen() {
  const { needsPremium } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (needsPremium) {
      setShowUpgrade(true);
    }
  }, [needsPremium]);

  if (needsPremium && !showUpgrade) {
    return <LoadingSpinner />;
  }

  return (
    <View>
      {/* Your feature content */}
      
      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="AI Coach"
      />
    </View>
  );
}
```

### Example 2: Scan Limit Check

```tsx
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function ScanButton() {
  const { canScan, scansLeft, needsPremium } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleScan = () => {
    if (!canScan) {
      setShowUpgrade(true);
      return;
    }
    // Proceed with scan
    performScan();
  };

  return (
    <>
      <Button 
        onPress={handleScan}
        title={`Scan (${scansLeft === Infinity ? '∞' : scansLeft} left)`}
      />
      
      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="unlimited scans"
        message="You've used your free scans. Start your 7-day trial for unlimited access!"
      />
    </>
  );
}
```

### Example 3: Trial Status Display

```tsx
import { useSubscription } from '@/contexts/SubscriptionContext';
import TrialStatusBanner from '@/components/TrialStatusBanner';

export default function DashboardScreen() {
  const { inTrial, daysLeft, state } = useSubscription();

  return (
    <ScrollView>
      {/* Show trial banner if in trial */}
      <TrialStatusBanner />
      
      {/* Show trial info */}
      {inTrial && (
        <View style={styles.trialInfo}>
          <Text>✨ Trial Active: {daysLeft} days left</Text>
        </View>
      )}
      
      {/* Show premium badge if paid */}
      {state.isPremium && !inTrial && (
        <View style={styles.premiumBadge}>
          <Text>👑 Premium Member</Text>
        </View>
      )}
      
      {/* Your content */}
    </ScrollView>
  );
}
```

### Example 4: Blurred Content Preview

```tsx
import { useSubscription } from '@/contexts/SubscriptionContext';
import { BlurView } from 'expo-blur';

export default function AnalysisResults() {
  const { canViewResults } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <View style={styles.container}>
      {/* Analysis results */}
      <View style={styles.results}>
        <Text>Your beauty score: 85</Text>
        {/* More results... */}
      </View>
      
      {/* Blur overlay if no access */}
      {!canViewResults && (
        <>
          <BlurView 
            intensity={50} 
            style={StyleSheet.absoluteFillObject}
            tint="light"
          />
          <View style={styles.unlockButton}>
            <Button 
              title="Unlock Results" 
              onPress={() => setShowUpgrade(true)}
            />
          </View>
        </>
      )}
      
      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="detailed results"
      />
    </View>
  );
}
```

---

## 📊 Recommended Gating Strategy

### Free Users (No Trial)
- ❌ Can't scan
- ❌ Can't view results
- ❌ No AI coach
- ❌ No community posting
- ✅ Can browse (to see value)

### Trial Users (7 days)
- ✅ Unlimited scans
- ✅ Full results
- ✅ AI coach access
- ✅ Community access
- ✅ All features

### Paid Premium Users
- ✅ Everything unlimited
- ✅ Priority support
- ✅ Early access to new features

---

## 🎯 Where to Add Trial Status Banner

Add `<TrialStatusBanner />` to these screens:

1. **Home/Dashboard** (`app/(tabs)/index.tsx`)
   ```tsx
   <TrialStatusBanner />
   ```

2. **Progress Screen** (`app/(tabs)/progress.tsx`)
   ```tsx
   <TrialStatusBanner />
   ```

3. **AI Coach** (`app/(tabs)/glow-coach.tsx`)
   ```tsx
   <TrialStatusBanner />
   ```

4. **Community** (`app/(tabs)/community.tsx`)
   ```tsx
   <TrialStatusBanner />
   ```

---

## 🚀 Where to Add Upgrade Prompts

### Critical Touch Points:

1. **Before AI Analysis**
   - Check `canScan` before allowing scan
   - Show prompt if no scans left

2. **Viewing Results**
   - Check `canViewResults` before showing
   - Blur and prompt if no access

3. **AI Coach Messages**
   - Check `needsPremium` on screen load
   - Show prompt immediately if needed

4. **Community Posting**
   - Check before allowing posts
   - Prompt to upgrade for posting rights

5. **Style Check**
   - Gate the feature
   - Show value in prompt

---

## 💡 Best Practices

### 1. **Show Value First**
```tsx
// ❌ Bad: Block immediately
if (needsPremium) return <Paywall />;

// ✅ Good: Show preview, then upgrade prompt
return (
  <View>
    <Preview />
    {needsPremium && <UpgradePrompt />}
  </View>
);
```

### 2. **Clear Messaging**
```tsx
// ❌ Bad: Generic
<UpgradePrompt feature="this" />

// ✅ Good: Specific
<UpgradePrompt 
  feature="AI Skin Analysis"
  message="Get detailed insights about your skin health, concerns, and personalized recommendations"
/>
```

### 3. **Strategic Timing**
```tsx
// ✅ Good: After user shows interest
const handleViewMore = () => {
  if (needsPremium) {
    setShowUpgrade(true);
  } else {
    navigateToDetail();
  }
};
```

### 4. **Trial Urgency**
```tsx
// Show urgency for trial users
{inTrial && daysLeft <= 2 && (
  <Text>⏰ Only {daysLeft} days left! Upgrade now to keep access</Text>
)}
```

---

## 🎨 Customization

### Change Trial Duration
In `contexts/SubscriptionContext.tsx`:
```tsx
const startLocalTrial = useCallback(async (days: number = 7) => {
  // Change 7 to desired number of days
```

### Change Pricing Display
In `app/trial-offer.tsx`:
```tsx
// Update prices in the plan cards
```

### Change Feature List
In `app/trial-offer.tsx`:
```tsx
const PREMIUM_FEATURES: Feature[] = [
  // Add/remove/edit features
];
```

---

## 📈 Analytics Events to Track

Track these events for optimization:

```tsx
// When trial offer is shown
trackEvent('trial_offer_viewed');

// When user starts trial
trackEvent('trial_started', { plan: 'yearly' });

// When upgrade prompt is shown
trackEvent('upgrade_prompt_shown', { 
  feature: 'ai_coach',
  trigger: 'feature_gate' 
});

// When user upgrades
trackEvent('user_upgraded', { 
  plan: 'yearly',
  from: 'trial'
});

// When trial expires
trackEvent('trial_expired', {
  converted: false
});
```

---

## 🔧 Troubleshooting

### User can't access features during trial
Check subscription state:
```tsx
const { state, inTrial, canScan } = useSubscription();
console.log('State:', state);
console.log('In trial:', inTrial);
console.log('Can scan:', canScan);
```

### Trial banner not showing
Ensure:
1. User is in trial (`inTrial === true`)
2. Component is imported correctly
3. Component is in render tree

### Upgrade prompt not closing
Ensure you're calling `onClose()` prop:
```tsx
<UpgradePrompt
  visible={showUpgrade}
  onClose={() => setShowUpgrade(false)} // Important!
/>
```

---

## 🎉 Quick Start Checklist

- [ ] Add `<TrialStatusBanner />` to main screens
- [ ] Add `<UpgradePrompt />` to gated features
- [ ] Check `canScan` before scans
- [ ] Check `canViewResults` before showing results
- [ ] Check `needsPremium` for premium features
- [ ] Test trial flow (start trial, use features, expire)
- [ ] Test upgrade flow (click upgrade, complete purchase)
- [ ] Add analytics tracking
- [ ] Test on both iOS and Android

---

## 📞 Support

If you need help:
1. Check subscription state with `useSubscription()`
2. Look at console logs for subscription events
3. Verify RevenueCat configuration in production
4. Test with TestFlight/Internal Testing

---

**Remember**: The goal is to show value during the trial so users want to keep their subscription. Make the trial experience amazing! 🚀

