import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
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
import { getPalette, getGradient, shadow } from "@/constants/theme";
import { trackAppOpen, scheduleDailyNotifications } from "@/lib/smart-notifications";

const DAILY_AFFIRMATIONS = [
  {
    text: "Invest in yourself, every day counts",
    author: "Daily Growth",
    icon: Heart,
  },
  {
    text: "Progress is personal, celebrate your journey",
    author: "Self Care",
    icon: Flower2,
  },
  {
    text: "Today is perfect for positive change",
    author: "Daily Wisdom",
    icon: Sun,
  },
  {
    text: "Consistency creates transformation",
    author: "Daily Focus",
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

  const styles = createStyles(palette);

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
      <LinearGradient colors={getGradient(theme).hero} style={StyleSheet.absoluteFillObject} />
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
            <Text style={styles.greeting}>Welcome back,</Text>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{authUser?.user_metadata && typeof authUser.user_metadata === 'object' ? (authUser.user_metadata as { full_name?: string; name?: string }).full_name ?? (authUser.user_metadata as { full_name?: string; name?: string }).name ?? user.name : user.name}</Text>
              <View style={styles.crownContainer}>
                <Sparkles color={palette.gold} size={20} fill={palette.gold} />
              </View>
            </View>
            <Text style={styles.subtitle}>Ready to optimize your skincare?</Text>
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

        <TouchableOpacity onPress={handleGlowAnalysis} activeOpacity={0.95} style={styles.mainCtaContainer}>
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
              <Text style={styles.ctaTitle}>Analyze Your Skin{"\n"}With AI</Text>
              <Text style={styles.ctaSubtitle}>
                Professional insights for{"\n"}optimal skincare results
              </Text>
              <View style={styles.ctaBadge}>
                <Sparkles color={palette.textLight} size={14} fill={palette.textLight} />
                <Text style={[styles.ctaBadgeText, {color: palette.textLight}]}>Personalized</Text>
              </View>
            </View>
            <ChevronRight color={palette.textLight} size={24} style={styles.ctaArrow} strokeWidth={2.5} />
            <View style={styles.decorativeElements}>
              <View style={[styles.decorativeCircle, { top: 20, right: 30, backgroundColor: palette.overlayBlush }]} />
              <View style={[styles.decorativeCircle, { bottom: 40, right: 60, opacity: 0.6, backgroundColor: palette.overlayGold }]} />
              <View style={[styles.decorativeCircle, { top: 50, right: 85, opacity: 0.4, width: 10, height: 10, backgroundColor: palette.sage }]} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

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
          <Text style={styles.sectionSubtitle}>Track your glow journey & product routines</Text>
          
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
                <Text style={styles.progressHubTitle}>Progress Photos</Text>
                <View style={styles.progressHubStats}>
                  <Text style={styles.progressHubNumber}>{user.stats.analyses || 0}</Text>
                  <Text style={styles.progressHubLabel}>snapshots</Text>
                </View>
                <View style={styles.progressHubButton}>
                  <Text style={styles.progressHubButtonText}>TRACK CHANGES</Text>
                  <ArrowRight color={palette.textLight} size={16} strokeWidth={3} />
                </View>
                
                {/* Decorative circles */}
                <View style={[styles.progressDecorCircle, { top: 20, right: 20, width: 40, height: 40, opacity: 0.15 }]} />
                <View style={[styles.progressDecorCircle, { bottom: 30, right: 30, width: 60, height: 60, opacity: 0.1 }]} />
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
                <Text style={styles.progressHubTitle}>Product Tracker</Text>
                <View style={styles.progressHubStats}>
                  <Text style={styles.progressHubNumber}>{products.length}</Text>
                  <Text style={styles.progressHubLabel}>products</Text>
                </View>
                <View style={styles.progressHubButton}>
                  <Text style={styles.progressHubButtonText}>ADD PRODUCT</Text>
                  <ArrowRight color={palette.textLight} size={16} strokeWidth={3} />
                </View>
                
                {/* Decorative circles */}
                <View style={[styles.progressDecorCircle, { top: 20, right: 20, width: 40, height: 40, opacity: 0.15 }]} />
                <View style={[styles.progressDecorCircle, { bottom: 30, right: 30, width: 60, height: 60, opacity: 0.1 }]} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Skincare Services</Text>
            <View style={styles.sectionDivider} />
          </View>
          
          <TouchableOpacity onPress={handleGlowAnalysis} activeOpacity={0.9}>
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
                <Text style={styles.actionSubtitle}>Understand your skin&apos;s condition</Text>
                <View style={styles.actionBadge}>
                  <Star color={palette.gold} size={12} fill={palette.gold} />
                  <Text style={[styles.actionBadgeText, { color: palette.gold }]}>Professional</Text>
                </View>
              </View>
              <View style={styles.actionArrow}>
                <ArrowRight color={palette.gold} size={24} strokeWidth={2.5} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleStyleCheck} activeOpacity={0.9}>
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
                <Text style={styles.actionTitle}>Style Guide</Text>
                <Text style={styles.actionSubtitle}>Find your perfect look</Text>
                <View style={styles.actionBadge}>
                  <Sparkles color={palette.sage} size={12} fill={palette.sage} />
                  <Text style={[styles.actionBadgeText, { color: palette.sage }]}>Creative</Text>
                </View>
              </View>
              <View style={styles.actionArrow}>
                <ArrowRight color={palette.sage} size={24} strokeWidth={2.5} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleGlowCoach} activeOpacity={0.9}>
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
                <Text style={styles.actionTitle}>Skincare Coach</Text>
                <Text style={styles.actionSubtitle}>Optimize your routine</Text>
                <View style={styles.actionBadge}>
                  <Star color={palette.mint} size={12} fill={palette.mint} />
                  <Text style={[styles.actionBadgeText, { color: palette.mint }]}>Expert</Text>
                </View>
              </View>
              <View style={styles.actionArrow}>
                <ArrowRight color={palette.mint} size={24} strokeWidth={2.5} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Motivation</Text>
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
            <Text style={styles.sectionTitle}>Your Progress</Text>
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
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: palette.divider,
    backgroundColor: palette.surface,
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
    fontSize: 24,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    letterSpacing: -1,
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
    fontWeight: '800' as const,
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
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    color: palette.textSecondary,
    marginBottom: 8,
    letterSpacing: 1.5,
    fontWeight: "600",
    textTransform: 'uppercase' as const,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 36,
    fontWeight: "700",
    color: palette.textPrimary,
    marginRight: 12,
    letterSpacing: -1.5,
  },
  crownContainer: {
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    fontWeight: "500",
    letterSpacing: 0,
    lineHeight: 24,
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
  },
  mainCtaContainer: {
    marginHorizontal: 28,
    marginBottom: 48,
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
    fontWeight: "700",
    color: palette.textLight,
    marginBottom: 16,
    lineHeight: 38,
    letterSpacing: -1.5,
  },
  ctaSubtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 26,
    marginBottom: 20,
    fontWeight: "400",
    letterSpacing: 0.2,
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
    fontWeight: "700",
    marginLeft: 6,
    letterSpacing: 0.5,
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
    paddingHorizontal: 28,
    marginBottom: 48,
  },
  sectionHeader: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: palette.textPrimary,
    marginBottom: 8,
    letterSpacing: -1,
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
    fontWeight: '500',
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
    fontWeight: '800',
    letterSpacing: 0.5,
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
    fontWeight: '800',
    color: palette.textLight,
    letterSpacing: -0.3,
  },
  progressHubStats: {
    marginTop: -8,
  },
  progressHubNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: palette.textLight,
    letterSpacing: -1,
  },
  progressHubLabel: {
    fontSize: 12,
    fontWeight: '600',
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
    fontWeight: '800',
    color: palette.textLight,
    letterSpacing: 0.8,
  },
  progressDecorCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: palette.textLight,
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
    fontWeight: "700",
    color: palette.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  actionSubtitle: {
    fontSize: 15,
    color: palette.textSecondary,
    marginBottom: 10,
    fontWeight: "400",
    letterSpacing: 0,
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
    fontWeight: "700",
    marginLeft: 4,
    letterSpacing: 0.5,
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
    fontSize: 19,
    fontStyle: "italic",
    color: palette.textPrimary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 30,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  quoteAuthor: {
    fontSize: 13,
    color: palette.textSecondary,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase' as const,
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
    fontWeight: "700",
    color: palette.primary,
    marginBottom: 8,
    letterSpacing: -1.5,
  },
  statLabel: {
    fontSize: 11,
    color: palette.textSecondary,
    fontWeight: "700",
    letterSpacing: 1.5,
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