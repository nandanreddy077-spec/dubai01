import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Palette, Sparkles, TrendingUp, ChevronRight, Zap } from "lucide-react-native";
import { router } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getPalette, getGradient, shadow, typography } from "@/constants/theme";
import PressableScale from "@/components/PressableScale";
import TrialReminderBanner from "@/components/TrialReminderBanner";

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useUser();
  const { user: authUser } = useAuth();
  const { theme } = useTheme();
  
  const palette = getPalette(theme);

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const displayName = useMemo(() => {
    if (authUser?.user_metadata && typeof authUser.user_metadata === 'object') {
      const meta = authUser.user_metadata as { full_name?: string; name?: string };
      if (meta.full_name) return meta.full_name.split(' ')[0];
      if (meta.name) return meta.name.split(' ')[0];
    }
    if (user?.name) return user.name.split(' ')[0];
    return 'there';
  }, [authUser?.user_metadata, user?.name]);

  const styles = useMemo(() => createStyles(palette), [palette]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{timeGreeting} {displayName}!</Text>
            <Text style={styles.subtitle}>What would you like to do?</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakNumber}>{user.stats.dayStreak}</Text>
          </View>
        </View>

        <TrialReminderBanner />

        <PressableScale
          onPress={() => router.push("/glow-analysis")}
          pressedScale={0.98}
          haptics="medium"
          style={styles.mainCardContainer}
        >
          <LinearGradient
            colors={['#1a1a1a', '#0a0a0a']}
            style={styles.mainCard}
          >
            <View style={styles.mainCardIcon}>
              <Camera color="#FFFFFF" size={40} strokeWidth={2} />
            </View>
            <View style={styles.mainCardContent}>
              <Text style={styles.mainCardTitle}>Scan My Face</Text>
              <Text style={styles.mainCardDesc}>Get your skin score in 30 seconds</Text>
            </View>
            <View style={styles.mainCardArrow}>
              <ChevronRight color="#FFFFFF" size={28} />
            </View>
          </LinearGradient>
        </PressableScale>

        <Text style={styles.sectionTitle}>More Features</Text>

        <View style={styles.cardsGrid}>
          <PressableScale
            onPress={() => router.push("/style-check")}
            pressedScale={0.97}
            haptics="light"
            style={styles.featureCardContainer}
          >
            <View style={[styles.featureCard, { backgroundColor: '#F0F4F8' }]}>
              <View style={[styles.featureIcon, { backgroundColor: '#E2E8F0' }]}>
                <Palette color="#64748B" size={28} strokeWidth={2} />
              </View>
              <Text style={styles.featureTitle}>Style Check</Text>
              <Text style={styles.featureDesc}>Is my outfit good?</Text>
            </View>
          </PressableScale>

          <PressableScale
            onPress={() => router.push("/(tabs)/glow-coach")}
            pressedScale={0.97}
            haptics="light"
            style={styles.featureCardContainer}
          >
            <View style={[styles.featureCard, { backgroundColor: '#FEF3C7' }]}>
              <View style={[styles.featureIcon, { backgroundColor: '#FDE68A' }]}>
                <Sparkles color="#D97706" size={28} strokeWidth={2} />
              </View>
              <Text style={styles.featureTitle}>My Routine</Text>
              <Text style={styles.featureDesc}>Daily skin plan</Text>
            </View>
          </PressableScale>

          <PressableScale
            onPress={() => router.push("/(tabs)/progress")}
            pressedScale={0.97}
            haptics="light"
            style={styles.featureCardContainer}
          >
            <View style={[styles.featureCard, { backgroundColor: '#ECFDF5' }]}>
              <View style={[styles.featureIcon, { backgroundColor: '#A7F3D0' }]}>
                <TrendingUp color="#059669" size={28} strokeWidth={2} />
              </View>
              <Text style={styles.featureTitle}>My Progress</Text>
              <Text style={styles.featureDesc}>See improvements</Text>
            </View>
          </PressableScale>

          <PressableScale
            onPress={() => router.push("/product-tracking")}
            pressedScale={0.97}
            haptics="light"
            style={styles.featureCardContainer}
          >
            <View style={[styles.featureCard, { backgroundColor: '#F3E8FF' }]}>
              <View style={[styles.featureIcon, { backgroundColor: '#E9D5FF' }]}>
                <Zap color="#9333EA" size={28} strokeWidth={2} />
              </View>
              <Text style={styles.featureTitle}>Products</Text>
              <Text style={styles.featureDesc}>Track what works</Text>
            </View>
          </PressableScale>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📸</Text>
              <Text style={styles.statNumber}>{user.stats.analyses}</Text>
              <Text style={styles.statLabel}>Scans</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statNumber}>{user.stats.dayStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>✨</Text>
              <Text style={styles.statNumber}>{user.stats.glowScore}</Text>
              <Text style={styles.statLabel}>Glow Score</Text>
            </View>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Quick Tip</Text>
            <Text style={styles.tipText}>Scan your face in natural light for the best results!</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: palette.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  streakEmoji: {
    fontSize: 18,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D97706',
  },
  mainCardContainer: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  mainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    ...shadow.medium,
  },
  mainCardIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mainCardContent: {
    flex: 1,
  },
  mainCardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  mainCardDesc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  mainCardArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 12,
    marginBottom: 32,
  },
  featureCardContainer: {
    width: (screenWidth - 52) / 2,
  },
  featureCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  statsSection: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  tipEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#15803D',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});
