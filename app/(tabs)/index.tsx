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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Sparkles, ChevronRight, User, Star, Heart, Flower2, Palette, Crown, Wand2, Sun, Zap, ArrowRight, TrendingUp, Package } from "lucide-react-native";
import { router } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useProducts } from "@/contexts/ProductContext";
import PhotoPickerModal from "@/components/PhotoPickerModal";
import { getPalette, getGradient, shadow, typography } from "@/constants/theme";
import { trackAppOpen, scheduleDailyNotifications } from "@/lib/smart-notifications";
import PressableScale from "@/components/PressableScale";

const DAILY_AFFIRMATIONS = [
  {
    text: "Small rituals. Real results.",
    author: "GlowCheck",
    icon: Heart,
  },
  {
    text: "Consistency is a luxury you can afford.",
    author: "Daily Practice",
    icon: Flower2,
  },
  {
    text: "Your skin loves a plan — keep the promise.",
    author: "Routine",
    icon: Sun,
  },
  {
    text: "Track the glow. Trust the process.",
    author: "Momentum",
    icon: Crown,
  },
];

export default function HomeScreen() {
  const { user, isFirstTime, setIsFirstTime } = useUser();
  const { user: authUser } = useAuth();
  const { theme } = useTheme();
  const { products } = useProducts();
  
  const currentStreak = user?.stats.dayStreak || 0;
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);
  const [sparkleAnim] = useState(new Animated.Value(0));
  const [floatingAnim] = useState(new Animated.Value(0));
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState<number>(0);
  
  const palette = getPalette(theme);
  const currentAffirmation = DAILY_AFFIRMATIONS[currentAffirmationIndex];

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning,";
    if (hour < 17) return "Good afternoon,";
    return "Good evening,";
  }, []);

  // Initialize notifications and tracking once on mount
  useEffect(() => {
    const initializeHome = async () => {
      await trackAppOpen();
      await scheduleDailyNotifications(user?.stats.dayStreak || 0);
    };
    
    initializeHome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle first time user - just mark as not first time anymore
  // Don't automatically show photo picker as it can cause issues on app startup
  useEffect(() => {
    if (isFirstTime && user) {
      // Just mark as not first time - user can add profile photo from profile screen
      setIsFirstTime(false);
    }
  }, [isFirstTime, setIsFirstTime, user]);

  // Animations effect - only runs once
  useEffect(() => {
    // Gentle sparkle animation
    const sparkleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Floating animation for cards
    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );
    
    sparkleAnimation.start();
    floatingAnimation.start();
    
    // Cycle through affirmations
    const affirmationInterval = setInterval(() => {
      setCurrentAffirmationIndex((prev) => (prev + 1) % DAILY_AFFIRMATIONS.length);
    }, 5000);
    
    return () => {
      sparkleAnimation.stop();
      floatingAnimation.stop();
      clearInterval(affirmationInterval);
    };
  }, [sparkleAnim, floatingAnim]);

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

  const handleGlowAnalysis = () => {
    router.push("/glow-analysis");
  };

  const handleStyleCheck = () => {
    router.push("/style-check");
  };

  const handleGlowCoach = () => {
    router.push("/glow-coach");
  };
  
  const handleProductTracking = () => {
    router.push("/product-tracking");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={getGradient(theme).hero} style={StyleSheet.absoluteFillObject} />
      <View style={styles.ambientTop} pointerEvents="none" />
      <View style={styles.ambientBottom} pointerEvents="none" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Floating sparkles */}
        <Animated.View 
          style={[
            styles.sparkle1,
            {
              opacity: sparkleAnim,
              transform: [{
                rotate: sparkleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }
          ]}
        >
          <Sparkles color={palette.blush} size={16} fill={palette.blush} />
        </Animated.View>
        <Animated.View 
          style={[
            styles.sparkle2,
            {
              opacity: sparkleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
            }
          ]}
        >
          <Star color={palette.sage} size={12} fill={palette.sage} />
        </Animated.View>
        <Animated.View 
          style={[
            styles.sparkle3,
            {
              opacity: sparkleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 0.8],
              }),
            }
          ]}
        >
          <Heart color={palette.gold} size={14} fill={palette.gold} />
        </Animated.View>
        
        {/* Logo and Streak Header */}
        <View style={styles.topBar}>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/53s334upy03qk49h5gire' }} 
              style={styles.logoImage}
            />
            <Text style={styles.logoText}>GlowCheck</Text>
          </View>
          
          <View style={styles.streakContainer}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting} testID="home-greeting">{timeGreeting}</Text>
            <View style={styles.nameContainer}>
              <Text style={styles.name} testID="home-name">{authUser?.user_metadata && typeof authUser.user_metadata === 'object' ? (authUser.user_metadata as { full_name?: string; name?: string }).full_name ?? (authUser.user_metadata as { full_name?: string; name?: string }).name ?? user.name : user.name}</Text>
              <View style={styles.crownContainer}>
                <Sparkles color={palette.gold} size={20} fill={palette.gold} />
              </View>
            </View>
            <Text style={styles.subtitle} testID="home-subtitle">Your glow, engineered — one check-in at a time.</Text>
          </View>
          <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.8} style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={getGradient(theme).blush} style={styles.avatarPlaceholder}>
                <User color={palette.pearl} size={28} strokeWidth={2} />
              </LinearGradient>
            )}
            <View style={styles.avatarGlow} />
          </TouchableOpacity>
        </View>

        <PressableScale
          onPress={handleGlowAnalysis}
          pressedScale={0.985}
          haptics="medium"
          style={styles.mainCtaContainer}
          testID="home-main-cta"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={getGradient(theme).primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.mainCta, shadow.card]}
          >
            <View style={styles.ctaContent}>
              <View style={styles.ctaIconContainer}>
                <Camera color={palette.textLight} size={32} strokeWidth={2} />
                <View style={styles.iconShimmer} />
              </View>
              <Text style={styles.ctaTitle} testID="home-cta-title">AI Skin Scan{"\n"}In 30 Seconds</Text>
              <Text style={styles.ctaSubtitle} testID="home-cta-subtitle">
                Get a clean, actionable plan —
                not a wall of advice.
              </Text>
              <View style={styles.ctaBadge}>
                <Sparkles color={palette.textLight} size={14} fill={palette.textLight} />
                <Text style={[styles.ctaBadgeText, {color: palette.textLight}]}>Tailored to you</Text>
              </View>
            </View>
            <ChevronRight color={palette.textLight} size={24} style={styles.ctaArrow} strokeWidth={2.5} />
            <View style={styles.decorativeElements}>
              <View style={[styles.decorativeCircle, { top: 20, right: 30, backgroundColor: palette.overlayBlush }]} />
              <View style={[styles.decorativeCircle, { bottom: 40, right: 60, opacity: 0.6, backgroundColor: palette.overlayGold }]} />
              <View style={[styles.decorativeCircle, { top: 50, right: 85, opacity: 0.4, width: 10, height: 10, backgroundColor: palette.sage }]} />
            </View>
          </LinearGradient>
        </PressableScale>

        {/* Progress Hub Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <TrendingUp color={palette.gold} size={24} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>Your Progress Hub</Text>
            </View>
            <View style={styles.newBadge}>
              <Sparkles color={palette.textLight} size={10} fill={palette.textLight} />
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>Photos, routines, and momentum — in one place.</Text>
          
          <View style={styles.progressHubGrid}>
            <TouchableOpacity 
              onPress={() => router.push('/progress')}
              activeOpacity={0.9}
              style={styles.progressHubCard}
            >
              <LinearGradient
                colors={['#1F2937', '#0F172A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.progressHubCardInner, shadow.card]}
              >
                <View style={styles.progressHubIcon}>
                  <TrendingUp color={palette.textLight} size={28} strokeWidth={2.5} />
                </View>
                <Text style={styles.progressHubTitle}>Progress Studio</Text>
                <View style={styles.progressHubStats}>
                  <Text style={styles.progressHubNumber}>{user.stats.analyses || 0}</Text>
                  <Text style={styles.progressHubLabel}>snapshots</Text>
                </View>
                <View style={styles.progressHubButton}>
                  <Text style={styles.progressHubButtonText}>VIEW TIMELINE</Text>
                  <ArrowRight color={palette.textLight} size={16} strokeWidth={3} />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleProductTracking}
              activeOpacity={0.9}
              style={styles.progressHubCard}
            >
              <LinearGradient
                colors={['#374151', '#1F2937']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.progressHubCardInner, shadow.card]}
              >
                <View style={styles.progressHubIcon}>
                  <Package color={palette.textLight} size={28} strokeWidth={2.5} />
                </View>
                <Text style={styles.progressHubTitle}>Routine Shelf</Text>
                <View style={styles.progressHubStats}>
                  <Text style={styles.progressHubNumber}>{products.length}</Text>
                  <Text style={styles.progressHubLabel}>products</Text>
                </View>
                <View style={styles.progressHubButton}>
                  <Text style={styles.progressHubButtonText}>ADD TO SHELF</Text>
                  <ArrowRight color={palette.textLight} size={16} strokeWidth={3} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>What are we doing today?</Text>
            <View style={styles.sectionDivider} />
          </View>
          
          <PressableScale
            onPress={handleGlowAnalysis}
            pressedScale={0.985}
            haptics="light"
            testID="home-action-skin-analysis"
            accessibilityRole="button"
          >
            <View style={[styles.actionCard, shadow.card]}>
              <View style={styles.actionIconContainer}>
                <LinearGradient 
                  colors={['#6B7280', '#374151']} 
                  style={styles.actionIconBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Camera color={palette.textLight} size={28} strokeWidth={2.5} />
                  <View style={styles.iconSparkle}>
                    <Sparkles color={palette.textLight} size={12} fill={palette.textLight} />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Skin Analysis</Text>
                <Text style={styles.actionSubtitle}>Pinpoint what to do next (and why)</Text>
                <View style={styles.actionBadge}>
                  <Star color={palette.gold} size={12} fill={palette.gold} />
                  <Text style={[styles.actionBadgeText, { color: palette.gold }]}>Professional</Text>
                </View>
              </View>
              <View style={styles.actionArrow}>
                <ArrowRight color={palette.gold} size={24} strokeWidth={2.5} />
              </View>
            </View>
          </PressableScale>

          <PressableScale
            onPress={handleStyleCheck}
            pressedScale={0.985}
            haptics="light"
            testID="home-action-style-guide"
            accessibilityRole="button"
          >
            <View style={[styles.actionCard, shadow.card]}>
              <View style={styles.actionIconContainer}>
                <LinearGradient 
                  colors={['#94A3B8', '#64748B']} 
                  style={styles.actionIconBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Palette color={palette.textLight} size={28} strokeWidth={2.5} />
                  <View style={[styles.iconSparkle, { top: 8, right: 8 }]}>
                    <Zap color={palette.textLight} size={12} fill={palette.textLight} />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Style Check</Text>
                <Text style={styles.actionSubtitle}>Build a look that actually suits you</Text>
                <View style={styles.actionBadge}>
                  <Sparkles color={palette.sage} size={12} fill={palette.sage} />
                  <Text style={[styles.actionBadgeText, { color: palette.sage }]}>Creative</Text>
                </View>
              </View>
              <View style={styles.actionArrow}>
                <ArrowRight color={palette.sage} size={24} strokeWidth={2.5} />
              </View>
            </View>
          </PressableScale>

          <PressableScale
            onPress={handleGlowCoach}
            pressedScale={0.985}
            haptics="light"
            testID="home-action-glow-coach"
            accessibilityRole="button"
          >
            <View style={[styles.actionCard, shadow.card]}>
              <View style={styles.actionIconContainer}>
                <LinearGradient 
                  colors={['#475569', '#334155']} 
                  style={styles.actionIconBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Wand2 color={palette.textLight} size={28} strokeWidth={2.5} />
                  <View style={[styles.iconSparkle, { bottom: 8, left: 8 }]}>
                    <Star color={palette.textLight} size={12} fill={palette.textLight} />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Glow Coach</Text>
                <Text style={styles.actionSubtitle}>A routine that fits your life</Text>
                <View style={styles.actionBadge}>
                  <Star color={palette.mint} size={12} fill={palette.mint} />
                  <Text style={[styles.actionBadgeText, { color: palette.mint }]}>Expert</Text>
                </View>
              </View>
              <View style={styles.actionArrow}>
                <ArrowRight color={palette.mint} size={24} strokeWidth={2.5} />
              </View>
            </View>
          </PressableScale>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today&apos;s Focus</Text>
            <View style={styles.sectionDivider} />
          </View>
          <View style={[styles.quoteCard, shadow.card]}>
            <View style={styles.quoteIconContainer}>
              <Sparkles color={palette.gold} size={28} fill={palette.gold} />
              <View style={styles.quoteIconGlow} />
            </View>
            <Text style={styles.quoteText}>&ldquo;{currentAffirmation.text}&rdquo;</Text>
            <Text style={styles.quoteAuthor}>— {currentAffirmation.author}</Text>
            <View style={styles.quoteDivider} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Numbers</Text>
            <View style={styles.sectionDivider} />
          </View>
          <View style={[styles.statsContainer, shadow.card]}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: palette.overlayGold }]}>
                <Camera color={palette.gold} size={20} strokeWidth={2.5} />
              </View>
              <Text style={styles.statNumber}>{user.stats.analyses}</Text>
              <Text style={styles.statLabel}>ANALYSES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: palette.overlayGold }]}>
                <Zap color={palette.gold} size={20} fill={palette.gold} strokeWidth={2.5} />
              </View>
              <Text style={styles.statNumber}>{user.stats.dayStreak}</Text>
              <Text style={styles.statLabel}>DAY STREAK</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: palette.overlayGold }]}>
                <Star color={palette.gold} size={20} fill={palette.gold} strokeWidth={2.5} />
              </View>
              <Text style={styles.statNumber}>{user.stats.glowScore}</Text>
              <Text style={styles.statLabel}>SCORE</Text>
            </View>
          </View>
        </View>
      </ScrollView>

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
    backgroundColor: palette.backgroundStart,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  ambientTop: {
    position: "absolute",
    top: -180,
    left: -120,
    width: 380,
    height: 380,
    borderRadius: 999,
    backgroundColor: palette.overlayGold,
    opacity: 0.55,
  },
  ambientBottom: {
    position: "absolute",
    bottom: -220,
    right: -140,
    width: 440,
    height: 440,
    borderRadius: 999,
    backgroundColor: palette.overlaySage,
    opacity: 0.5,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.divider,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  logoText: {
    fontSize: 22,
    fontWeight: typography.bold,
    color: palette.textPrimary,
    letterSpacing: -0.6,
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 10,
    ...shadow.elevated,
  },
  streakNumber: {
    fontSize: 22,
    fontWeight: typography.black,
    color: palette.textLight,
    letterSpacing: -1,
  },
  streakActive: {
    color: '#C4996A',
  },
  streakEmoji: {
    fontSize: 20,
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: palette.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.overline,
    color: palette.textSecondary,
    marginBottom: 10,
    letterSpacing: 2.2,
    fontWeight: typography.semibold,
    textTransform: "uppercase" as const,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 38,
    fontWeight: typography.black,
    color: palette.textPrimary,
    marginRight: 12,
    letterSpacing: -1.8,
    lineHeight: 42,
  },
  crownContainer: {
    marginTop: 4,
  },
  subtitle: {
    fontSize: typography.body,
    color: palette.textSecondary,
    fontWeight: typography.medium,
    letterSpacing: 0.1,
    lineHeight: 24,
    maxWidth: 260,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: palette.border,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.border,
    backgroundColor: palette.tertiary,
  },
  avatarGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 36,
    backgroundColor: palette.overlayLight,
    opacity: 0.15,
    zIndex: -1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: palette.textSecondary,
    fontWeight: typography.medium,
    letterSpacing: 0.2,
  },
  mainCtaContainer: {
    marginHorizontal: 20,
    marginBottom: 28,
  },
  mainCta: {
    borderRadius: 28,
    padding: 32,
    minHeight: 200,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ctaContent: {
    flex: 1,
    zIndex: 2,
  },
  ctaIconContainer: {
    position: "relative",
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  iconShimmer: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 20,
    backgroundColor: palette.overlayLight,
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: typography.black,
    color: palette.textLight,
    marginBottom: 14,
    lineHeight: 36,
    letterSpacing: -1.6,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.86)",
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: typography.medium,
    letterSpacing: 0.15,
  },
  ctaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.overlayLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  ctaBadgeText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: typography.extrabold,
    marginLeft: 6,
    letterSpacing: 0.6,
  },
  ctaArrow: {
    position: "absolute",
    top: 28,
    right: 28,
    zIndex: 3,
  },
  decorativeElements: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  decorativeCircle: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(248, 246, 240, 0.3)",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeader: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.8,
  },
  sectionDivider: {
    height: 3,
    backgroundColor: palette.primary,
    width: 48,
    borderRadius: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: palette.textSecondary,
    marginBottom: 20,
    fontWeight: typography.medium,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5,
  },
  newBadgeText: {
    color: palette.textLight,
    fontSize: 10,
    fontWeight: typography.extrabold,
    letterSpacing: 0.55,
  },
  progressHubGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  progressHubCard: {
    flex: 1,
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
  },
  progressHubCardInner: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  progressHubIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressHubTitle: {
    fontSize: 18,
    fontWeight: typography.black,
    color: palette.textLight,
    letterSpacing: -0.4,
  },
  progressHubStats: {
    marginTop: -8,
  },
  progressHubNumber: {
    fontSize: 36,
    fontWeight: typography.black,
    color: palette.textLight,
    letterSpacing: -1,
  },
  progressHubLabel: {
    fontSize: 12,
    fontWeight: typography.medium,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.3,
  },
  progressHubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  progressHubButtonText: {
    fontSize: 11,
    fontWeight: typography.extrabold,
    color: palette.textLight,
    letterSpacing: 0.85,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 28,
    borderRadius: 24,
    marginBottom: 20,
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  actionIconContainer: {
    position: "relative",
    marginRight: 20,
  },
  actionIconGlow: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 20,
    backgroundColor: palette.overlayGold,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 19,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.6,
  },
  actionSubtitle: {
    fontSize: 15,
    color: palette.textSecondary,
    marginBottom: 10,
    fontWeight: typography.medium,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  actionBadgeText: {
    color: palette.gold,
    fontSize: 11,
    fontWeight: typography.extrabold,
    marginLeft: 4,
    letterSpacing: 0.55,
  },
  quoteCard: {
    padding: 36,
    borderRadius: 28,
    alignItems: "center",
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  quoteIconContainer: {
    position: "relative",
    marginBottom: 20,
  },
  quoteIconGlow: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 20,
    backgroundColor: palette.overlayGold,
  },
  quoteText: {
    fontSize: 18,
    fontStyle: "italic",
    color: palette.textPrimary,
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 28,
    fontWeight: typography.regular,
    letterSpacing: 0.15,
  },
  quoteAuthor: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: typography.semibold,
    letterSpacing: 1.7,
    marginBottom: 16,
    textTransform: "uppercase" as const,
  },
  quoteDivider: {
    height: 2,
    backgroundColor: palette.primary,
    width: 80,
    borderRadius: 1,
  },
  statsContainer: {
    flexDirection: "row",
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: palette.tertiary,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: typography.black,
    color: palette.primary,
    marginBottom: 8,
    letterSpacing: -1.6,
  },
  statLabel: {
    fontSize: 11,
    color: palette.textSecondary,
    fontWeight: typography.extrabold,
    letterSpacing: 1.6,
  },
  statDivider: {
    width: 2,
    height: 50,
    backgroundColor: palette.divider,
    marginHorizontal: 20,
    borderRadius: 1,
  },
  // Floating sparkles
  sparkle1: {
    position: 'absolute',
    top: 80,
    right: 40,
    zIndex: 1,
  },
  sparkle2: {
    position: 'absolute',
    top: 140,
    left: 30,
    zIndex: 1,
  },
  sparkle3: {
    position: 'absolute',
    top: 200,
    right: 80,
    zIndex: 1,
  },
  // Action icon background
  actionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconSparkle: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  actionArrow: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  productTrackingCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  productTrackingGradient: {
    padding: 20,
  },
  productTrackingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  productTrackingIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productTrackingTextContainer: {
    flex: 1,
  },
  productTrackingTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: palette.textLight,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  productTrackingSubtitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});