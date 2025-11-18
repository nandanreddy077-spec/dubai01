import React, { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function TrialStarter(): React.ReactElement | null {
  const { state, startLocalTrial } = useSubscription();
  const startedRef = useRef<boolean>(false);

  useEffect(() => {
    if (startedRef.current) return;
    if (!state.hasStartedTrial) {
      startedRef.current = true;
      (async () => {
        try {
          await startLocalTrial(3);
          if (Platform.OS !== 'web') {
            Alert.alert('Free Trial Started', 'Your 3-day free trial has started. Enjoy full access!');
          } else {
            alert('Your 3-day free trial has started. Enjoy full access!');
          }
          console.log('3-day trial started automatically for new user');
        } catch (e) {
          console.log('Failed to auto-start trial', e);
        }
      })();
    }
  }, [state.hasStartedTrial, startLocalTrial]);

  return null;
}
