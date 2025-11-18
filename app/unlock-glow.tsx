import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Heart, Camera, Sparkles, Palette, Users, Star } from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function UnlockGlowScreen() {
  const { state } = useSubscription();
  const insets = useSafeAreaInsets();



  const handleChoosePlan = useCallback(() => {
    router.replace('/plan-selection');
  }, []);

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
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <LinearGradient 
              colors={['#FFB6C1', '#FFA07A']}
              style={styles.heroIcon}
            >
              <Heart color="#FFFFFF" size={32} fill="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
            <Text style={styles.heroTitle}>
              Start Your Beauty Journey
            </Text>
            <Text style={styles.heroSubtitle}>
              3-day free trial, then choose your perfect plan
            </Text>
          </View>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <LinearGradient colors={['#D4A574', '#C8956D']} style={styles.featureIconBg}>
                <Camera color="#FFFFFF" size={20} strokeWidth={2.5} />
              </LinearGradient>
              <Text style={styles.featureTitle}>Unlimited Scans</Text>
              <Text style={styles.featureDesc}>Analyze your glow anytime</Text>
            </View>
            
            <View style={styles.featureCard}>
              <LinearGradient colors={['#FFB6C1', '#FFA07A']} style={styles.featureIconBg}>
                <Sparkles color="#FFFFFF" size={20} strokeWidth={2.5} />
              </LinearGradient>
              <Text style={styles.featureTitle}>AI Coach</Text>
              <Text style={styles.featureDesc}>Personal beauty guide</Text>
            </View>
            
            <View style={styles.featureCard}>
              <LinearGradient colors={['#DDA0DD', '#DA70D6']} style={styles.featureIconBg}>
                <Palette color="#FFFFFF" size={20} strokeWidth={2.5} />
              </LinearGradient>
              <Text style={styles.featureTitle}>Style Check</Text>
              <Text style={styles.featureDesc}>Perfect looks daily</Text>
            </View>
            
            <View style={styles.featureCard}>
              <LinearGradient colors={['#D4A574', '#C8956D']} style={styles.featureIconBg}>
                <Users color="#FFFFFF" size={20} strokeWidth={2.5} />
              </LinearGradient>
              <Text style={styles.featureTitle}>Community</Text>
              <Text style={styles.featureDesc}>Connect & share</Text>
            </View>
          </View>

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
            
            <TouchableOpacity 
              style={styles.planButton}
              onPress={handleChoosePlan}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={['#D4A574', '#C8956D']}
                style={styles.planButtonGradient}
              >
                <Text style={styles.planButtonText}>View Plans</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 40,
  },
  featureCard: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  featureIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  trialStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
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
    marginBottom: 24,
  },
  planSectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1A1A1A',
  },
  planButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  planButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  planButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});