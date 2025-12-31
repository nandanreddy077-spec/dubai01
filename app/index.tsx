import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from '@/components/Logo';
import { getPalette, getGradient } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function Index() {
  const { user, session, loading } = useAuth();
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation for premium feel
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const determineInitialRoute = async () => {
      try {
        console.log('🚀 Determining initial route...');
        
        if (loading) {
          console.log('⏳ Auth still loading...');
          return;
        }

        if (user && session) {
          console.log('✅ User authenticated, navigating to tabs');
          router.replace('/(tabs)/home');
          return;
        }

        const hasCompletedOnboarding = await AsyncStorage.getItem('@onboarding_completed');
        
        if (hasCompletedOnboarding === 'true') {
          console.log('✅ Onboarding completed, navigating to login');
          router.replace('/login');
        } else {
          console.log('✅ First time user, navigating to onboarding');
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('❌ Error determining initial route:', error);
        router.replace('/onboarding');
      }
    };

    determineInitialRoute();
  }, [user, session, loading]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradient.hero}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Animated.View 
        style={[
          styles.content,
          { opacity: fadeAnim }
        ]}
      >
        <Logo size={120} />
        <ActivityIndicator 
          size="large" 
          color={palette.textAccent || "#D4A574"} 
          style={styles.loader} 
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginTop: 24,
  },
});
