import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Check, Sparkles } from "lucide-react-native";
import { router } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getPalette, getGradient, shadow } from "@/constants/theme";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const REASSURANCE_MESSAGES = [
  "You're doing great! 💫",
  "Consistency is key ✨",
  "Your skin thanks you 🌸",
  "Small steps, big glow 🌟",
];

export default function SimpleHomeScreen() {
  const { user } = useUser();
  const { user: authUser } = useAuth();
  const { theme } = useTheme();
  
  const currentStreak = user?.stats.dayStreak || 0;
  const totalScans = user?.stats.analyses || 0;
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [reassuranceIndex, setReassuranceIndex] = useState(0);
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  const userName = useMemo(() => {
    if (authUser?.user_metadata && typeof authUser.user_metadata === 'object') {
      const meta = authUser.user_metadata as { full_name?: string; name?: string };
      return meta.full_name?.split(' ')[0] || meta.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'there';
    }
    return user?.name?.split(' ')[0] || 'there';
  }, [authUser, user]);

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const reassuranceInterval = setInterval(() => {
      setReassuranceIndex((prev) => (prev + 1) % REASSURANCE_MESSAGES.length);
    }, 5000);

    return () => clearInterval(reassuranceInterval);
  }, [pulseAnim, glowAnim]);

  const handleScanPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/glow-analysis");
  };

  const handleQuickAction = (action: 'routine' | 'progress') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (action === 'routine') {
      router.push("/(tabs)/glow-coach");
    } else {
      router.push("/(tabs)/progress");
    }
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const styles = useMemo(() => createStyles(palette), [palette]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[palette.backgroundStart, palette.backgroundEnd]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.loadingDot, { opacity: glowAnim }]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      
      {/* Ambient glow effect */}
      <Animated.View style={[styles.ambientGlow, { opacity: glowOpacity }]} />

      {/* Simple Header - Just greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{timeGreeting}, {userName}</Text>
        <Text style={styles.reassurance}>{REASSURANCE_MESSAGES[reassuranceIndex]}</Text>
      </View>

      {/* Streak Display - Visual progress that feels good */}
      <View style={styles.streakSection}>
        <View style={styles.streakCircle}>
          <LinearGradient
            colors={currentStreak > 0 ? ['#FFD700', '#FFA500'] : [palette.surfaceAlt, palette.surface]}
            style={styles.streakGradient}
          >
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </LinearGradient>
        </View>
        
        {/* Mini stats - simple dots */}
        <View style={styles.miniStats}>
          {[...Array(7)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.streakDot,
                i < Math.min(currentStreak, 7) && styles.streakDotActive
              ]} 
            />
          ))}
        </View>
        <Text style={styles.statsHint}>
          {currentStreak === 0 ? "Start your streak today!" : 
           currentStreak < 7 ? `${7 - currentStreak} more for a perfect week` :
           "Amazing consistency! 🎉"}
        </Text>
      </View>

      {/* ONE PRIMARY ACTION - Big, beautiful, impossible to miss */}
      <View style={styles.mainActionSection}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            onPress={handleScanPress}
            activeOpacity={0.9}
            style={styles.mainButtonWrapper}
            testID="home-scan-button"
          >
            <LinearGradient
              colors={['#1A1A1A', '#000000']}
              style={styles.mainButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Face silhouette visual */}
              <View style={styles.faceVisual}>
                <View style={styles.faceOval}>
                  <Camera color="#FFFFFF" size={40} strokeWidth={1.5} />
                </View>
                <View style={styles.scanLine} />
              </View>
              
              <Text style={styles.mainButtonTitle}>Scan Your Skin</Text>
              <Text style={styles.mainButtonSubtitle}>Takes 30 seconds</Text>
              
              {/* Sparkle indicator */}
              <View style={styles.sparkleIndicator}>
                <Sparkles color="#FFD700" size={16} fill="#FFD700" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Two Simple Secondary Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          onPress={() => handleQuickAction('routine')}
          style={styles.quickActionButton}
          activeOpacity={0.8}
        >
          <View style={styles.quickActionIcon}>
            <Check color={palette.gold} size={24} strokeWidth={2.5} />
          </View>
          <Text style={styles.quickActionText}>Today&apos;s Routine</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleQuickAction('progress')}
          style={styles.quickActionButton}
          activeOpacity={0.8}
        >
          <View style={styles.quickActionIcon}>
            <View style={styles.progressMini}>
              <View style={[styles.progressBar, { width: '60%' }]} />
            </View>
          </View>
          <Text style={styles.quickActionText}>See Progress</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom reassurance */}
      <View style={styles.bottomHint}>
        <Text style={styles.bottomHintText}>
          {totalScans === 0 
            ? "Your first scan unlocks personalized tips"
            : `${totalScans} scan${totalScans > 1 ? 's' : ''} completed`
          }
        </Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: palette.gold,
  },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: SCREEN_WIDTH + 100,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(201, 169, 97, 0.15)',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    letterSpacing: -0.8,
  },
  reassurance: {
    fontSize: 16,
    color: palette.textSecondary,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  streakSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  streakCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    ...shadow.medium,
  },
  streakGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 42,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginTop: -4,
  },
  miniStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  streakDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.border,
  },
  streakDotActive: {
    backgroundColor: palette.gold,
  },
  statsHint: {
    fontSize: 14,
    color: palette.textSecondary,
    marginTop: 12,
    fontWeight: '500' as const,
  },
  mainActionSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  mainButtonWrapper: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 32,
    ...shadow.strong,
  },
  mainButton: {
    width: '100%',
    paddingVertical: 40,
    paddingHorizontal: 32,
    borderRadius: 32,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  faceVisual: {
    marginBottom: 20,
    alignItems: 'center',
  },
  faceOval: {
    width: 80,
    height: 100,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: -20,
    right: -20,
    height: 2,
    backgroundColor: '#FFD700',
    opacity: 0.8,
  },
  mainButtonTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  mainButtonSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    fontWeight: '500' as const,
  },
  sparkleIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    paddingBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: palette.border,
    ...shadow.soft,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.overlayGold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    textAlign: 'center',
  },
  progressMini: {
    width: 28,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.border,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: palette.gold,
    borderRadius: 3,
  },
  bottomHint: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  bottomHintText: {
    fontSize: 13,
    color: palette.textMuted,
    fontWeight: '500' as const,
  },
});
