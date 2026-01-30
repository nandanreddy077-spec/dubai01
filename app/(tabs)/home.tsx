import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScanFace,
  Sparkles,
  Palette,
  TrendingUp,
  ChevronRight,
  MessageCircle,
} from "lucide-react-native";
import { router } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getPalette, shadow } from "@/constants/theme";
import PressableScale from "@/components/PressableScale";
import TrialReminderBanner from "@/components/TrialReminderBanner";

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.75;
const SPACER_WIDTH = (screenWidth - CARD_WIDTH) / 2;

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

  const features = [
    {
      id: "scan",
      step: "1",
      title: "Scan My Face",
      subtitle: "Get your Glow Score",
      icon: <ScanFace color="#FFFFFF" size={52} strokeWidth={1.4} />,
      colors: ["#0A0A0A", "#1F2937"] as const,
      route: "/glow-analysis",
      badge: "Start here",
    },
    {
      id: "routine",
      step: "2",
      title: "Do My Routine",
      subtitle: "Morning & night steps",
      icon: <Sparkles color="#FFFFFF" size={52} strokeWidth={1.4} />,
      colors: ["#C9A961", "#7A5E22"] as const,
      route: "/(tabs)/glow-coach",
      badge: `${user.stats.dayStreak} day streak`,
    },
    {
      id: "coach",
      step: "3",
      title: "Ask Glow Coach",
      subtitle: "Quick answers for skincare",
      icon: <MessageCircle color="#FFFFFF" size={52} strokeWidth={1.4} />,
      colors: ["#111827", "#C9A961"] as const,
      route: "/ai-advisor",
      badge: "Chat",
    },
    {
      id: "style",
      step: "Bonus",
      title: "Style Check",
      subtitle: "Rate my outfit",
      icon: <Palette color="#FFFFFF" size={52} strokeWidth={1.4} />,
      colors: ["#6B7280", "#0A0A0A"] as const,
      route: "/style-check",
    },
    {
      id: "progress",
      step: "Track",
      title: "My Progress",
      subtitle: "See improvements",
      icon: <TrendingUp color="#FFFFFF" size={52} strokeWidth={1.4} />,
      colors: ["#059669", "#0A0A0A"] as const,
      route: "/(tabs)/progress",
    },
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{timeGreeting},</Text>
            <Text style={styles.name}>{displayName}</Text>
          </View>
          <View style={styles.profileImageContainer}>
             <View style={styles.streakBadge}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={styles.streakNumber}>{user.stats.dayStreak}</Text>
              </View>
          </View>
        </View>

        <TrialReminderBanner />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>What do you want to do?</Text>
          <Text style={styles.sectionSubtitle}>Swipe right to pick one</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + 20}
          pagingEnabled={false}
        >
          {features.map((feature, index) => (
            <PressableScale
              key={feature.id}
              onPress={() => router.push(feature.route as any)}
              pressedScale={0.95}
              haptics="medium"
              containerTestID={`home.feature.${feature.id}`}
              style={[
                styles.cardContainer,
                index === 0 && { marginLeft: SPACER_WIDTH },
                index === features.length - 1 && { marginRight: SPACER_WIDTH },
              ]}
            >
              <LinearGradient
                colors={feature.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.cardContent}>
                  <View style={styles.stepPill}>
                    <Text style={styles.stepPillText}>{feature.step}</Text>
                  </View>

                  <View style={styles.iconCircle}>{feature.icon}</View>

                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>{feature.title}</Text>
                    <Text style={styles.cardSubtitle}>{feature.subtitle}</Text>
                  </View>

                  {feature.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{feature.badge}</Text>
                    </View>
                  )}

                  <View style={styles.actionButton}>
                    <ChevronRight color="#FFFFFF" size={24} />
                  </View>
                </View>

                <View
                  style={[
                    styles.decorativeCircle,
                    { top: -60, right: -60, width: 180, height: 180 },
                  ]}
                />
                <View
                  style={[
                    styles.decorativeCircle,
                    { bottom: -40, left: -40, width: 120, height: 120 },
                  ]}
                />
              </LinearGradient>
            </PressableScale>
          ))}
        </ScrollView>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitleSmall}>Your Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📸</Text>
              <Text style={styles.statNumber}>{user.stats.analyses}</Text>
              <Text style={styles.statLabel}>Scans</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>✨</Text>
              <Text style={styles.statNumber}>{user.stats.glowScore}</Text>
              <Text style={styles.statLabel}>Glow Score</Text>
            </View>
             <PressableScale 
                style={styles.statCard} 
                onPress={() => router.push("/product-tracking")}
            >
              <Text style={styles.statEmoji}>⚡️</Text>
              <Text style={styles.statNumber}>Products</Text>
              <Text style={styles.statLabel}>Track</Text>
            </PressableScale>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 100,
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  name: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0A0A0A",
    letterSpacing: -0.5,
  },
  profileImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  streakEmoji: {
    fontSize: 16,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D97706',
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  carouselContent: {
    paddingHorizontal: 0, // Using spacer logic for centering
    paddingBottom: 24,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: 392,
    marginRight: 20,
    borderRadius: 32,
    ...shadow.medium,
  },
  card: {
    flex: 1,
    borderRadius: 32,
    padding: 32,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardContent: {
    flex: 1,
    zIndex: 1,
    justifyContent: 'space-between',
  },
  stepPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 18,
  },
  stepPillText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  cardSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.84)",
    fontWeight: "600",
    lineHeight: 22,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  statsSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitleSmall: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
