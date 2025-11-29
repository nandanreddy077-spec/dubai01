import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Star, Shield, TrendingUp } from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function PlanSelectionScreen() {
  const { state, processInAppPurchase } = useSubscription();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = useCallback(async () => {
    if (isProcessing) return;
    
    if (Platform.OS === 'web') {
      Alert.alert(
        'Mobile App Required',
        'Subscriptions are only available in the mobile app. Please download our app from the App Store or Google Play to subscribe.',
        [{ text: 'Got it', style: 'default' }]
      );
      return;
    }
    
    setIsProcessing(true);
    console.log(`Starting ${selectedPlan} subscription process...`);
    
    try {
      const result = await processInAppPurchase(selectedPlan);
      console.log('Purchase result:', result);
      
      if (result.success) {
        Alert.alert(
          '🎉 Welcome to Premium!', 
          `Your ${selectedPlan} subscription is now active. Enjoy unlimited access to all premium features!`,
          [{ 
            text: 'Start Your Journey ✨', 
            style: 'default', 
            onPress: () => {
              console.log('User confirmed premium activation');
              router.back();
            }
          }]
        );
      } else {
        const errorMessage = result.error || 'We couldn\'t process your purchase. Please try again.';
        console.log('Purchase failed:', errorMessage);
        Alert.alert(
          'Purchase Failed', 
          errorMessage,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', style: 'default', onPress: () => handleSubscribe() }
          ]
        );
      }
    } catch (err) {
      console.error('Subscription error:', err);
      Alert.alert(
        'Connection Error', 
        'Unable to connect to the payment service. Please check your internet connection and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', style: 'default', onPress: () => handleSubscribe() }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPlan, processInAppPurchase, isProcessing]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const trialDaysLeft = state.trialStartedAt 
    ? Math.max(0, 3 - Math.floor((Date.now() - Number(new Date(state.trialStartedAt))) / (1000 * 60 * 60 * 24)))
    : 3;

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#F8F9FA', '#FFFFFF']} 
        style={StyleSheet.absoluteFillObject} 
      />
      
      <Stack.Screen options={{ 
        title: '', 
        headerShown: false
      }} />
      
      {/* Custom Header */}
      <View style={[styles.safeHeader, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color="#1A1A1A" size={24} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Unlock Your Glow</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Trial Status */}
          <View style={styles.trialStatus}>
            <LinearGradient colors={['#D4A574', '#C8956D']} style={styles.trialBadge}>
              <Star color="#FFFFFF" size={16} strokeWidth={2.5} />
            </LinearGradient>
            <View style={styles.trialContent}>
              <Text style={styles.trialTitle}>Trial Active</Text>
              <Text style={styles.trialText}>
                {state.scanCount}/3 scans used • {trialDaysLeft > 0 ? `${trialDaysLeft} days left` : 'NaN days left'}
              </Text>
            </View>
          </View>

          {/* Choose Your Plan Section */}
          <View style={styles.planSection}>
            <Text style={styles.planSectionTitle}>Choose Your Plan</Text>
            
            {/* Yearly Plan */}
            <TouchableOpacity 
              style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('yearly')}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={selectedPlan === 'yearly' ? ['#D4A574', '#C8956D'] : ['#FFFFFF', '#FFFFFF']}
                style={styles.planGradient}
              >
                {selectedPlan === 'yearly' && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}
                <View style={styles.planContent}>
                  <View style={styles.planHeader}>
                    <View style={[styles.planRadio, { borderColor: selectedPlan === 'yearly' ? '#FFFFFF' : '#D4A574' }]}>
                      {selectedPlan === 'yearly' && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={[styles.planName, { color: selectedPlan === 'yearly' ? '#FFFFFF' : '#1A1A1A' }]}>
                        Yearly Glow
                      </Text>
                      <Text style={[styles.planSaving, { color: selectedPlan === 'yearly' ? '#FFFFFF' : '#D4A574' }]}>
                        Save $7.80
                      </Text>
                    </View>
                  </View>
                  <View style={styles.planPricing}>
                    <Text style={[styles.planPrice, { color: selectedPlan === 'yearly' ? '#FFFFFF' : '#1A1A1A' }]}>
                      $99
                    </Text>
                    <Text style={[styles.planPeriod, { color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.8)' : '#666666' }]}>
                      /year
                    </Text>
                  </View>
                  <Text style={[styles.planEquivalent, { color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.8)' : '#666666' }]}>
                    Just $8.25/month
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Monthly Plan */}
            <TouchableOpacity 
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.8}
            >
              <View style={[styles.planGradient, { backgroundColor: '#FFFFFF' }]}>
                <View style={styles.planContent}>
                  <View style={styles.planHeader}>
                    <View style={[styles.planRadio, { borderColor: selectedPlan === 'monthly' ? '#D4A574' : '#CCCCCC' }]}>
                      {selectedPlan === 'monthly' && (
                        <View style={[styles.radioInner, { backgroundColor: '#D4A574' }]} />
                      )}
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>Monthly Glow</Text>
                      <Text style={styles.planFlexible}>Flexible billing</Text>
                    </View>
                  </View>
                  <View style={styles.planPricing}>
                    <Text style={styles.planPrice}>$8.90</Text>
                    <Text style={styles.planPeriod}>/month</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Continue Button */}
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleSubscribe}
            disabled={isProcessing || state.isPremium}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={state.isPremium ? ['#CCCCCC', '#CCCCCC'] : ['#D4A574', '#C8956D']}
              style={styles.continueGradient}
            >
              <Text style={[styles.continueText, { color: state.isPremium ? '#666666' : '#FFFFFF' }]}>
                {state.isPremium ? 'Already Premium' : isProcessing ? 'Processing...' : 'Continue'}
              </Text>
              {!state.isPremium && !isProcessing && (
                <Text style={styles.continuePrice}>
                  {selectedPlan === 'yearly' ? '$99/year after trial' : '$8.90/month after trial'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Benefits */}
          <View style={styles.benefits}>
            <View style={styles.benefitItem}>
              <Shield color="#4CAF50" size={16} strokeWidth={2.5} />
              <Text style={styles.benefitText}>Secure payment</Text>
            </View>
            <View style={styles.benefitItem}>
              <TrendingUp color="#9C27B0" size={16} strokeWidth={2.5} />
              <Text style={styles.benefitText}>Cancel anytime</Text>
            </View>
          </View>

          {/* Legal Text */}
          <Text style={styles.legalText}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  safeHeader: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  trialStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 32,
  },
  trialBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trialContent: {
    flex: 1,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: '#1A1A1A',
  },
  trialText: {
    fontSize: 14,
    color: '#666666',
  },
  planSection: {
    marginBottom: 32,
  },
  planSectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1A1A1A',
  },
  planCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: '#D4A574',
  },
  planGradient: {
    padding: 20,
    borderRadius: 20,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planContent: {
    paddingTop: 8,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1A1A1A',
  },
  planSaving: {
    fontSize: 14,
    fontWeight: '600',
  },
  planFlexible: {
    fontSize: 14,
    color: '#666666',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
    color: '#666666',
  },
  planEquivalent: {
    fontSize: 14,
    color: '#666666',
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  continueGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  continuePrice: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  benefits: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  legalText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});