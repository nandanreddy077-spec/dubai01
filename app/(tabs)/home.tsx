import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Sparkles, ChevronRight, User, Star, Heart, Palette, Crown, Wand2, Sun, Zap, ArrowRight, TrendingUp, Package, Scan, MessageCircle } from "lucide-react-native";
import { router } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useProducts } from "@/contexts/ProductContext";
import PhotoPickerModal from "@/components/PhotoPickerModal";
import GlassCard from "@/components/GlassCard";
import { getPalette, getGradient, shadow, typography, radii } from "@/constants/theme";
import { trackAppOpen, scheduleDailyNotifications } from "@/lib/smart-notifications";
import PressableScale from "@/components/PressableScale";
import TrialReminderBanner from "@/components/TrialReminderBanner";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DAILY_TIPS = [
  "Consistency beats perfection. Small steps daily!",
  "Your skin is unique. Honor your journey.",
  "Hydration is the foundation of healthy skin.",
  "Track progress weekly, not daily.",
];

export default function GlowHomeScreen() {
  const { user, isFirstTime, setIsFirstTime } = useUser();
  const { user: authUser } = useAuth();
  const { theme } = useTheme();
  const { products } = useProducts();
  
  const currentStreak = user?.stats.dayStreak || 0;
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [tipIndex, setTipIndex] = useState<number>(0);
  
  const palette = getPalette(theme);

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const firstName = useMemo(() => {
    const fullName = authUser?.user_metadata && typeof authUser.user_metadata === 'object' 
      ? (authUser.user_metadata as { full_name?: string; name?: string }).full_name ?? (authUser.user_metadata as { full_name?: string; name?: string }).name ?? user?.name 
      : user?.name;
    return fullName?.split(' ')[0] || 'Beautiful';
  }, [authUser?.user_metadata, user?.name]);

  useEffect(() => {
    const initializeHome = async () => {
      await trackAppOpen();
      await scheduleDailyNotifications(user?.stats.dayStreak || 0);
    };
    initializeHome();
  }, [user?.stats.dayStreak]);

  useEffect(() => {
    if (isFirstTime && user) {
      setIsFirstTime(false);
    }
  }, [isFirstTime, setIsFirstTime, user]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % DAILY_TIPS.length);
    }, 6000);

    return () => {
      pulseAnimation.stop();
      clearInterval(tipInterval);
    };
  }, [pulseAnim, fadeAnim]);

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handlePhotoPickerClose = () => {
    setShowPhotoPicker(false);
  };

  const styles = useMemo(() => createStyles(palette), [palette]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[palette.backgroundStart, palette.backgroundEnd]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#FAFBFC', '#F5F7FA']} style={StyleSheet.absoluteFillObject} />
      
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{timeGreeting},</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
            </View>
            
            <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.8} style={styles.avatarButton}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={['#E8DDD5', '#D4C4B8']} style={styles.avatarPlaceholder}>
                  <User color={palette.textPrimary} size={22} strokeWidth={2} />
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <PressableScale
          onPress={() => router.push("/glow-analysis")}
          pressedScale={0.98}
          haptics="medium"
          style={styles.heroSection}
          testID="home-main-cta"
        >
          <LinearGradient
            colors={['#0A0A0A', '#1A1A1A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Sparkles color="#C9A961" size={12} fill="#C9A961" />
                <Text style={styles.heroBadgeText}>AI-POWERED</Text>
              </View>
              
              <Text style={styles.heroTitle}>Skin Analysis</Text>
              <Text style={styles.heroSubtitle}>
                Get personalized insights in 30 seconds
              </Text>
              
              <View style={styles.heroButton}>
                <Scan color="#FFFFFF" size={20} strokeWidth={2.5} />
                <Text style={styles.heroButtonText}>Start Scan</Text>
                <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} />
              </View>
            </View>
            
            <Animated.View style={[styles.heroVisual, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient
                colors={['rgba(201,169,97,0.3)', 'rgba(201,169,97,0.1)']}
                style={styles.heroCircle}
              >
                <Camera color="#C9A961" size={48} strokeWidth={1.5} />
              </LinearGradient>
            </Animated.View>
            
            <View style={styles.heroDecor1} />
            <View style={styles.heroDecor2} />
          </LinearGradient>
        </PressableScale>

        <TrialReminderBanner />

        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActionsGrid}>
            <PressableScale
              onPress={() => router.push("/style-check")}
              pressedScale={0.97}
              haptics="light"
              style={styles.quickActionCard}
            >
              <GlassCard variant="elevated" borderRadius={20} padding={0}>
                <View style={styles.quickActionContent}>
                  <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(184,197,194,0.2)' }]}>
                    <Palette color="#6B7280" size={24} strokeWidth={2} />
                  </View>
                  <Text style={styles.quickActionTitle}>Style Check</Text>
                  <Text style={styles.quickActionSubtitle}>Outfit analysis</Text>
                </View>
              </GlassCard>
            </PressableScale>

            <PressableScale
              onPress={() => router.push("/ai-advisor")}
              pressedScale={0.97}
              haptics="light"
              style={styles.quickActionCard}
            >
              <GlassCard variant="elevated" borderRadius={20} padding={0}>
                <View style={styles.quickActionContent}>
                  <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(201,169,97,0.15)' }]}>
                    <MessageCircle color="#C9A961" size={24} strokeWidth={2} />
                  </View>
                  <Text style={styles.quickActionTitle}>AI Advisor</Text>
                  <Text style={styles.quickActionSubtitle}>Beauty tips</Text>
                </View>
              </GlassCard>
            </PressableScale>

            <PressableScale
              onPress={() => router.push("/glow-coach")}
              pressedScale={0.97}
              haptics="light"
              style={styles.quickActionCard}
            >
              <GlassCard variant="elevated" borderRadius={20} padding={0}>
                <View style={styles.quickActionContent}>
                  <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(232,221,213,0.4)' }]}>
                    <Wand2 color="#8B7355" size={24} strokeWidth={2} />
                  </View>
                  <Text style={styles.quickActionTitle}>Glow Coach</Text>
                  <Text style={styles.quickActionSubtitle}>Daily routine</Text>
                </View>
              </GlassCard>
            </PressableScale>

            <PressableScale
              onPress={() => router.push("/product-tracking")}
              pressedScale={0.97}
              haptics="light"
              style={styles.quickActionCard}
            >
              <GlassCard variant="elevated" borderRadius={20} padding={0}>
                <View style={styles.quickActionContent}>
                  <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(107,114,128,0.1)' }]}>
                    <Package color="#475569" size={24} strokeWidth={2} />
                  </View>
                  <Text style={styles.quickActionTitle}>Products</Text>
                  <Text style={styles.quickActionSubtitle}>Track routine</Text>
                </View>
              </GlassCard>
            </PressableScale>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          
          <GlassCard variant="elevated" borderRadius={24}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(201,169,97,0.12)' }]}>
                  <Camera color="#C9A961" size={20} strokeWidth={2.5} />
                </View>
                <Text style={styles.statValue}>{user.stats.analyses}</Text>
                <Text style={styles.statLabel}>Scans</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                  <Zap color="#EF4444" size={20} fill="#EF4444" strokeWidth={2.5} />
                </View>
                <Text style={styles.statValue}>{user.stats.dayStreak}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                  <Star color="#10B981" size={20} fill="#10B981" strokeWidth={2.5} />
                </View>
                <Text style={styles.statValue}>{user.stats.glowScore}</Text>
                <Text style={styles.statLabel}>Score</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Progress Studio</Text>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/progress')}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>See all</Text>
              <ChevronRight color="#C9A961" size={16} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <PressableScale
            onPress={() => router.push('/(tabs)/progress')}
            pressedScale={0.98}
            haptics="light"
          >
            <LinearGradient
              colors={['#1F2937', '#111827']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.progressCard}
            >
              <View style={styles.progressCardContent}>
                <View style={styles.progressCardLeft}>
                  <View style={styles.progressIconWrapper}>
                    <TrendingUp color="#FFFFFF" size={28} strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={styles.progressCardTitle}>Track Your Journey</Text>
                    <Text style={styles.progressCardSubtitle}>
                      {user.stats.analyses} snapshots captured
                    </Text>
                  </View>
                </View>
                <ArrowRight color="rgba(255,255,255,0.6)" size={24} strokeWidth={2} />
              </View>
              
              <View style={styles.progressCardDecor} />
            </LinearGradient>
          </PressableScale>
        </View>

        <View style={styles.tipSection}>
          <GlassCard variant="subtle" borderRadius={20}>
            <View style={styles.tipContent}>
              <View style={styles.tipIcon}>
                <Heart color="#C9A961" size={18} fill="#C9A961" />
              </View>
              <Text style={styles.tipText}>{DAILY_TIPS[tipIndex]}</Text>
            </View>
          </GlassCard>
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      <PhotoPickerModal
        visible={showPhotoPicker}
        onClose={handlePhotoPickerClose}
      />
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: palette.textSecondary,
    fontWeight: '500' as const,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    minHeight: 180,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201,169,97,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 5,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#C9A961',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 20,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C9A961',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    alignSelf: 'flex-start',
    gap: 8,
  },
  heroButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  heroVisual: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -55,
  },
  heroCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,169,97,0.3)',
  },
  heroDecor1: {
    position: 'absolute',
    top: 20,
    right: 140,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(201,169,97,0.4)',
  },
  heroDecor2: {
    position: 'absolute',
    bottom: 30,
    right: 100,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(201,169,97,0.2)',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (SCREEN_WIDTH - 52) / 2,
  },
  quickActionContent: {
    padding: 16,
    alignItems: 'flex-start',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '500' as const,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    marginBottom: 2,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 14,
    color: '#C9A961',
    fontWeight: '600' as const,
  },
  progressCard: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  progressCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  progressCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  progressIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCardTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 3,
  },
  progressCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500' as const,
  },
  progressCardDecor: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tipSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(201,169,97,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '500' as const,
    lineHeight: 20,
    fontStyle: 'italic' as const,
  },
});
