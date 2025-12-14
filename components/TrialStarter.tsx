import React from 'react';

/**
 * TrialStarter - DISABLED
 * 
 * Trial should ONLY start after user adds payment method.
 * No auto-start - this ensures card-required trial flow.
 * 
 * Trial is started via:
 * - app/trial-offer.tsx -> processInAppPurchase() -> RevenueCat
 * - Only after successful payment setup
 */
export default function TrialStarter(): React.ReactElement | null {
  // Trial no longer auto-starts
  // User must complete payment flow to start 7-day trial
  return null;
}
