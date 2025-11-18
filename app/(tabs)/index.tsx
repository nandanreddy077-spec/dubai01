import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Sparkles, ChevronRight, User, Star, Heart, Flower2, Palette, Crown, Wand2, Sun, Zap, ArrowRight, TrendingUp, Package, Navigation } from "lucide-react-native";
import { router } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useGamification } from "@/contexts/GamificationContext";
import { useProducts } from "@/contexts/ProductContext";
import PhotoPickerModal from "@/components/PhotoPickerModal";
import DailyCheckInModal from "@/components/DailyCheckInModal";
import { getPalette, getGradient, shadow, spacing, radii, typography } from "@/constants/theme";
import { trackAppOpen, scheduleDailyNotifications } from "@/lib/smart-notifications";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

const DAILY_AFFIRMATIONS = [
  {
    text: "You are radiant, inside and out",
    author: "Daily Glow",
    icon: Heart,
  },
  {
    text: "Your beauty is uniquely yours to celebrate",
    author: "Self Love",
    icon: Flower2,
  },
  {
    text: "Today is perfect for embracing your glow",
    author: "Beauty Wisdom",
    icon: Sun,
  },
  {
    text: "Confidence is your most beautiful feature",
    author: "Inner Beauty",
    icon: Crown,
  },
];

const BEAUTY_SERVICES = [
  {
    id: 'glow-analysis',
    title: 'Glow Analysis',
    subtitle: 'Discover your natural radiance',
    description: 'AI-powered beauty insights tailored just for you',
    icon: Camera,
    gradient: ['#F2C2C2', '#E8A87C'],
    route: '/glow-analysis',
    badge: 'Gentle',
  },
  {
    id: 'style-guide',
    title: 'Style Guide',
    subtitle: 'Find your perfect aesthetic',
    description: 'Personalized style recommendations',
    icon: Palette,
    gradient: ['#E8D5F0', '#D4A574'],
    route: '/style-check',
    badge: 'Creative',
  },
  {
    id: 'beauty-coach',
    title: 'Beauty Coach',
    subtitle: 'Your personal glow mentor',
    description: 'Daily guidance for your beauty journey',
    icon: Wand2,
    gradient: ['#D4F0E8', '#F5D5C2'],
    route: '/glow-coach',
    badge: 'Caring',
  },
  {
    id: 'ai-beauty-advisor',
    title: 'AI Beauty Advisor',
    subtitle: 'Real-time beauty consultation',
    description: 'Chat with AI for instant beauty advice',
    icon: Sparkles,
    gradient: ['#E8A87C', '#D4A574'],
    route: '/ai-advisor',
    badge: 'Premium',
  },
  {
    id: 'trend-tracker',
    title: 'Trend Tracker',
    subtitle: 'Stay ahead of beauty trends',
    description: 'Weekly trend updates & personalized recommendations',
    icon: Navigation,
    gradient: ['#F5D5C2', '#E8D5F0'],
    route: '/trends',
    badge: 'Fresh',
  },
];

export default function HomeScreen() {
  const { user, isFirstTime, setIsFirstTime } = useUser();
  const { user: authUser } = useAuth();
  const { theme } = useTheme();
  const { dailyCompletions, hasCompletedToday } = useGamification();
  const { products } = useProducts();
  
  const currentStreak = user?.stats.dayStreak || 0;
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);
  const [showDailyCheckIn, setShowDailyCheckIn] = useState<boolean>(false);
  const [sparkleAnim] = useState(new Animated.Value(0));
  const [floatingAnim] = useState(new Animated.Value(0));
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState<number>(0);
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const currentAffirmation = DAILY_AFFIRMATIONS[currentAffirmationIndex];

  useEffect(() => {
    const initializeHome = async () => {
      await trackAppOpen();
      await scheduleDailyNotifications(currentStreak);
      
      const lastCheckInDate = await AsyncStorage.getItem('last_daily_check_in_date');
      const today = new Date().toISOString().split('T')[0];
      
      if (lastCheckInDate !== today && !hasCompletedToday()) {
        setTimeout(() => setShowDailyCheckIn(true), 1000);
      }
    };
    
    initializeHome();
    
    if (isFirstTime) {
      setShowPhotoPicker(true);
      setIsFirstTime(false);
    }
    
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
  }, [isFirstTime, setIsFirstTime, sparkleAnim, floatingAnim, currentStreak, hasCompletedToday]);

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
  
  const handleDailyCheckInClose = async () => {
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem('last_daily_check_in_date', today);
    setShowDailyCheckIn(false);
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
          <Star color={palette.lavender} size={12} fill={palette.lavender} />
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
          <Heart color={palette.champagne} size={14} fill={palette.champagne} />
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
            <Text style={styles.greeting}>Hello beautiful,</Text>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{authUser?.user_metadata && typeof authUser.user_metadata === 'object' ? (authUser.user_metadata as { full_name?: string; name?: string }).full_name ?? (authUser.user_metadata as { full_name?: string; name?: string }).name ?? user.name : user.name}</Text>
              <View style={styles.crownContainer}>
                <Flower2 color={palette.blush} size={20} fill={palette.blush} />
              </View>
            </View>
            <Text style={styles.subtitle}>Ready to discover your inner glow?</Text>
          </View>
          <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.8} style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={getGradient(theme).rose} style={styles.avatarPlaceholder}>
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
                <Heart color={palette.textPrimary} size={32} strokeWidth={2} fill={palette.blush} />
                <View style={styles.iconShimmer} />
              </View>
              <Text style={styles.ctaTitle}>Discover Your{"\n"}Beautiful Glow</Text>
              <Text style={styles.ctaSubtitle}>
                Gentle AI insights for your{"\n"}unique beauty journey
              </Text>
              <View style={styles.ctaBadge}>
                <Sparkles color={palette.textPrimary} size={14} fill={palette.blush} />
                <Text style={styles.ctaBadgeText}>Personalized</Text>
              </View>
            </View>
            <ChevronRight color={palette.textPrimary} size={24} style={styles.ctaArrow} strokeWidth={2.5} />
            <View style={styles.decorativeElements}>
              <View style={[styles.decorativeCircle, { top: 20, right: 30, backgroundColor: palette.overlayBlush }]} />
              <View style={[styles.decorativeCircle, { bottom: 40, right: 60, opacity: 0.6, backgroundColor: palette.overlayGold }]} />
              <View style={[styles.decorativeCircle, { top: 50, right: 85, opacity: 0.4, width: 10, height: 10, backgroundColor: palette.lavender }]} />
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
                colors={['#FFB4A2', '#E8A87C']}
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
                colors={['#FFD700', '#FFA500']}
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
            <Text style={styles.sectionTitle}>Beauty Services</Text>
            <View style={styles.sectionDivider} />
          </View>
          
          <TouchableOpacity onPress={handleGlowAnalysis} activeOpacity={0.9}>
            <View style={[styles.actionCard, shadow.card]}>
              <View style={styles.actionIconContainer}>
                <LinearGradient 
                  colors={['#F2C2C2', '#E8A87C']} 
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
                <Text style={styles.actionTitle}>Glow Analysis</Text>
                <Text style={styles.actionSubtitle}>Discover your skin's natural beauty</Text>
                <View style={styles.actionBadge}>
                  <Heart color={palette.blush} size={12} fill={palette.blush} />
                  <Text style={[styles.actionBadgeText, { color: palette.blush }]}>Gentle</Text>
                </View>
              </View>
              <View style={styles.actionArrow}>
                <ArrowRight color={palette.blush} size={24} strokeWidth={2.5} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleStyleCheck} activeOpacity={0.9}>
            <View style={[styles.actionCard, shadow.card]}>
              <View style={styles.actionIconContainer}>
                <LinearGradient 
                  colors={['#E8D5F0', '#D4A574']} 
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
                <Text style={styles.actionSubtitle}>Find your perfect aesthetic</Text>
                <View style={styles.actionBadge}>
                  <Sparkles color={palette.champagne} size={12} fill={palette.champagne} />
                  <Text style={[styles.actionBadgeText, { color: palette.champagne }]}>Creative</Text>
                </View>
              </View>
              <View style={styles.actionArrow}>
                <ArrowRight color={palette.champagne} size={24} strokeWidth={2.5} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleGlowCoach} activeOpacity={0.9}>
            <View style={[styles.actionCard, shadow.card]}>
              <View style={styles.actionIconContainer}>
                <LinearGradient 
                  colors={['#D4F0E8', '#F5D5C2']} 
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
                <Text style={styles.actionTitle}>Beauty Coach</Text>
                <Text style={styles.actionSubtitle}>Nurture your glow journey</Text>
                <View style={styles.actionBadge}>
                  <Star color={palette.lavender} size={12} fill={palette.lavender} />
                  <Text style={[styles.actionBadgeText, { color: palette.lavender }]}>Caring</Text>
                </View>
              </View>
              <View style={styles.actionArrow}>
                <ArrowRight color={palette.lavender} size={24} strokeWidth={2.5} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Inspiration</Text>
            <View style={styles.sectionDivider} />
          </View>
          <View style={[styles.quoteCard, shadow.card]}>
            <View style={styles.quoteIconContainer}>
              <Heart color={palette.blush} size={28} fill={palette.blush} />
              <View style={styles.quoteIconGlow} />
            </View>
            <Text style={styles.quoteText}>"{currentAffirmation.text}"</Text>
            <Text style={styles.quoteAuthor}>— {currentAffirmation.author}</Text>
            <View style={styles.quoteDivider} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Glow Journey</Text>
            <View style={styles.sectionDivider} />
          </View>
          <View style={[styles.statsContainer, shadow.card]}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: palette.overlayBlush }]}>
                <Camera color={palette.blush} size={20} strokeWidth={2.5} />
              </View>
              <Text style={styles.statNumber}>{user.stats.analyses}</Text>
              <Text style={styles.statLabel}>ANALYSES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: palette.overlayGold }]}>
                <Heart color={palette.champagne} size={20} fill={palette.champagne} strokeWidth={2.5} />
              </View>
              <Text style={styles.statNumber}>{user.stats.dayStreak}</Text>
              <Text style={styles.statLabel}>DAY STREAK</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(230,215,240,0.4)' }]}>
                <Star color={palette.lavender} size={20} fill={palette.lavender} strokeWidth={2.5} />
              </View>
              <Text style={styles.statNumber}>{user.stats.glowScore}</Text>
              <Text style={styles.statLabel}>GLOW SCORE</Text>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
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
    fontWeight: '800' as const,
    color: palette.textPrimary,
    letterSpacing: -0.5,
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8D9C8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#C4996A',
    letterSpacing: -0.5,
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: palette.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
    fontWeight: "500",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 32,
    fontWeight: "800",
    color: palette.textPrimary,
    marginRight: 12,
    letterSpacing: -0.5,
  },
  crownContainer: {
    marginTop: 4,
  },
  subtitle: {
    fontSize: 17,
    color: palette.textSecondary,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: palette.gold,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: palette.gold,
  },
  avatarGlow: {
    position: "absolute",
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 35,
    backgroundColor: palette.overlayGold,
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
    marginHorizontal: 24,
    marginBottom: 40,
  },
  mainCta: {
    borderRadius: 24,
    padding: 28,
    minHeight: 160,
    position: "relative",
    overflow: "hidden",
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
    fontSize: 28,
    fontWeight: "900",
    color: palette.textPrimary,
    marginBottom: 12,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: "500",
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
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  sectionHeader: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: palette.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: palette.gold,
    width: 40,
    borderRadius: 1,
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
    backgroundColor: '#D2A372',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
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
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressHubCardInner: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
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
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.divider,
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
    fontSize: 18,
    fontWeight: "800",
    color: palette.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: palette.textSecondary,
    marginBottom: 8,
    fontWeight: "500",
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
    padding: 28,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.divider,
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
    marginBottom: 16,
    lineHeight: 26,
    fontWeight: "500",
  },
  quoteAuthor: {
    fontSize: 14,
    color: palette.gold,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  quoteDivider: {
    height: 1,
    backgroundColor: palette.gold,
    width: 60,
    borderRadius: 0.5,
  },
  statsContainer: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.divider,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "900",
    color: palette.gold,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: palette.textSecondary,
    fontWeight: "800",
    letterSpacing: 1,
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