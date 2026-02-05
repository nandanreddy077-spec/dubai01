import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import { Camera, Sparkles, Flame, ChevronRight } from "lucide-react-native";
import { router } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getPalette, getGradient, shadow } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

Dimensions.get("window");

interface LastScan {
  score: number;
  date: string;
  photo?: string;
}

export default function SkanStyleHomeScreen() {
  const { user } = useUser();
  const { user: authUser } = useAuth();
  const { theme } = useTheme();
  
  const currentStreak = user?.stats.dayStreak || 0;
  const totalScans = user?.stats.analyses || 0;
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const [lastScan, setLastScan] = useState<LastScan | null>(null);
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  const userName = useMemo(() => {
    if (authUser?.user_metadata && typeof authUser.user_metadata === 'object') {
      const meta = authUser.user_metadata as { full_name?: string; name?: string };
      return meta.full_name?.split(' ')[0] || meta.name?.split(' ')[0] || user?.name?.split(' ')[0] || '';
    }
    return user?.name?.split(' ')[0] || '';
  }, [authUser, user]);

  useEffect(() => {
    loadLastScan();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim, glowAnim, scanLineAnim]);

  const loadLastScan = async () => {
    try {
      const data = await AsyncStorage.getItem('last_scan_result');
      if (data) {
        setLastScan(JSON.parse(data));
      }
    } catch {
      console.log('No previous scan data');
    }
  };

  const handleScanPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/glow-analysis");
  }, []);

  const handleViewResults = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/progress");
  }, []);

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 60],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      
      {/* Header with Streak */}
      <View style={styles.header}>
        <View style={styles.streakBadge}>
          <Flame color="#FF6B35" size={20} fill="#FF6B35" />
          <Text style={styles.streakText}>{currentStreak}</Text>
        </View>
        
        {userName ? (
          <Text style={styles.greeting}>Hi, {userName}</Text>
        ) : null}
      </View>

      {/* Main Scan Section - Takes 80% of screen */}
      <View style={styles.scanSection}>
        <Animated.View style={[styles.scanButtonWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            onPress={handleScanPress}
            activeOpacity={0.95}
            style={styles.scanButtonTouchable}
            testID="home-scan-button"
          >
            <LinearGradient
              colors={['#0A0A0A', '#1A1A1A', '#0A0A0A']}
              style={styles.scanButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Animated glow ring */}
              <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />
              
              {/* Face outline visual */}
              <View style={styles.faceContainer}>
                <View style={styles.faceOval}>
                  <Camera color="rgba(255,255,255,0.9)" size={48} strokeWidth={1.5} />
                  
                  {/* Animated scan line */}
                  <Animated.View 
                    style={[
                      styles.scanLine,
                      { transform: [{ translateY: scanLineTranslate }] }
                    ]} 
                  />
                </View>
              </View>
              
              {/* Text */}
              <Text style={styles.scanTitle}>Scan Your Skin</Text>
              <Text style={styles.scanSubtitle}>Tap to analyze</Text>
              
              {/* Sparkle accent */}
              <View style={styles.sparkleAccent}>
                <Sparkles color="#C9A961" size={18} fill="#C9A961" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Stats Below Button */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalScans}</Text>
            <Text style={styles.statLabel}>Scans</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>
      </View>

      {/* Today's Glow Section - Only shows if scanned today */}
      {lastScan && (
        <TouchableOpacity 
          style={styles.todayGlow}
          onPress={handleViewResults}
          activeOpacity={0.8}
        >
          <View style={styles.todayGlowContent}>
            <View style={styles.todayGlowLeft}>
              <View style={styles.glowScoreCircle}>
                <Text style={styles.glowScoreNumber}>{lastScan.score}</Text>
              </View>
              <View style={styles.todayGlowText}>
                <Text style={styles.todayGlowTitle}>Today&apos;s Glow</Text>
                <Text style={styles.todayGlowDate}>{lastScan.date}</Text>
              </View>
            </View>
            <ChevronRight color={palette.textMuted} size={24} />
          </View>
        </TouchableOpacity>
      )}

      {/* Empty State Prompt */}
      {!lastScan && totalScans === 0 && (
        <View style={styles.emptyPrompt}>
          <Sparkles color={palette.gold} size={20} />
          <Text style={styles.emptyPromptText}>Your first scan unlocks personalized insights</Text>
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FF6B35',
    letterSpacing: -0.5,
  },
  greeting: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: palette.textSecondary,
  },
  scanSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  scanButtonWrapper: {
    width: '100%',
    maxWidth: 340,
    aspectRatio: 0.85,
  },
  scanButtonTouchable: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    ...shadow.strong,
    shadowColor: '#000',
    shadowOpacity: 0.4,
  },
  scanButton: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glowRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#C9A961',
  },
  faceContainer: {
    marginBottom: 24,
  },
  faceOval: {
    width: 120,
    height: 150,
    borderRadius: 60,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: '#C9A961',
    borderRadius: 2,
    opacity: 0.9,
  },
  scanTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  scanSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500' as const,
  },
  sparkleAccent: {
    position: 'absolute',
    top: 24,
    right: 24,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 13,
    color: palette.textSecondary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: palette.border,
  },
  todayGlow: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: palette.border,
    ...shadow.soft,
  },
  todayGlowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayGlowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  glowScoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowScoreNumber: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  todayGlowText: {
    gap: 2,
  },
  todayGlowTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: palette.textPrimary,
  },
  todayGlowDate: {
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '500' as const,
  },
  emptyPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(201, 169, 97, 0.08)',
    borderRadius: 16,
  },
  emptyPromptText: {
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '500' as const,
  },
});
