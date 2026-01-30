import React, { useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScanFace,
  Sparkles,
  MessageCircle,
  ChevronRight,
  ArrowLeftRight,
} from "lucide-react-native";
import { router } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getPalette, shadow } from "@/constants/theme";
import PressableScale from "@/components/PressableScale";
import TrialReminderBanner from "@/components/TrialReminderBanner";
import Svg, { Ellipse, Circle, Path } from "react-native-svg";

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 80;

export default function HomeScreen() {
  const { user } = useUser();
  useAuth();
  const { theme } = useTheme();
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  getPalette(theme);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const todayDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short', 
      day: 'numeric' 
    });
  }, []);

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 60],
  });

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const quickCards = [
    {
      id: "plan",
      title: "Today's Plan",
      subtitle: `${user.stats.dayStreak > 0 ? '3 steps' : 'Start your routine'}`,
      icon: <Sparkles color="#D97706" size={28} />,
      bgColor: "#FEF3C7",
      route: "/(tabs)/glow-coach",
    },
    {
      id: "compare",
      title: "My Progress",
      subtitle: "See your glow journey",
      icon: <ArrowLeftRight color="#7C3AED" size={28} />,
      bgColor: "#EDE9FE",
      route: "/(tabs)/progress",
    },
    {
      id: "coach",
      title: "Ask a Question",
      subtitle: "Quick skincare help",
      icon: <MessageCircle color="#059669" size={28} />,
      bgColor: "#D1FAE5",
      route: "/ai-advisor",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>{timeGreeting}</Text>
          <Text style={styles.dateText}>{todayDate}</Text>
        </View>

        <TrialReminderBanner />

        <View style={styles.faceSection}>
          <View style={styles.faceContainer}>
            <Svg width={200} height={260} viewBox="0 0 200 260">
              <Ellipse cx="100" cy="130" rx="75" ry="95" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="2" />
              <Ellipse cx="65" cy="110" rx="12" ry="8" fill="#E5E7EB" />
              <Ellipse cx="135" cy="110" rx="12" ry="8" fill="#E5E7EB" />
              <Circle cx="65" cy="110" r="4" fill="#374151" />
              <Circle cx="135" cy="110" r="4" fill="#374151" />
              <Ellipse cx="100" cy="145" rx="8" ry="6" fill="#E5E7EB" />
              <Path d="M 80 175 Q 100 190 120 175" stroke="#374151" strokeWidth="3" fill="none" strokeLinecap="round" />
            </Svg>
            
            <Animated.View 
              style={[
                styles.scanRing,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <View style={styles.scanRingInner} />
            </Animated.View>

            <Animated.View 
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanTranslateY }] }
              ]}
            >
              <LinearGradient
                colors={['transparent', '#C9A961', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanLineGradient}
              />
            </Animated.View>
          </View>

          <PressableScale
            onPress={() => router.push('/glow-analysis')}
            pressedScale={0.96}
            haptics="medium"
            style={styles.scanButtonContainer}
          >
            <LinearGradient
              colors={['#0A0A0A', '#1F2937']}
              style={styles.scanButton}
            >
              <ScanFace color="#FFFFFF" size={28} strokeWidth={1.5} />
              <Text style={styles.scanButtonText}>Scan My Skin</Text>
            </LinearGradient>
          </PressableScale>

          {user.stats.glowScore > 0 && (
            <View style={styles.lastScoreContainer}>
              <Text style={styles.lastScoreLabel}>Last score</Text>
              <Text style={styles.lastScoreValue}>{user.stats.glowScore}</Text>
            </View>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + 16}
        >
          {quickCards.map((card, index) => (
            <PressableScale
              key={card.id}
              onPress={() => router.push(card.route as any)}
              pressedScale={0.97}
              haptics="light"
              style={[
                styles.quickCard,
                { backgroundColor: card.bgColor },
                index === 0 && { marginLeft: 24 },
                index === quickCards.length - 1 && { marginRight: 24 },
              ]}
            >
              <View style={styles.quickCardIcon}>
                {card.icon}
              </View>
              <View style={styles.quickCardContent}>
                <Text style={styles.quickCardTitle}>{card.title}</Text>
                <Text style={styles.quickCardSubtitle}>{card.subtitle}</Text>
              </View>
              <ChevronRight color="#6B7280" size={20} />
            </PressableScale>
          ))}
        </ScrollView>

        {user.stats.dayStreak > 0 && (
          <View style={styles.streakSection}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>{user.stats.dayStreak} day streak</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0A0A0A",
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  faceSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  faceContainer: {
    width: 220,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scanRing: {
    position: 'absolute',
    width: 240,
    height: 300,
    borderRadius: 120,
    borderWidth: 3,
    borderColor: '#C9A961',
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  scanRingInner: {
    flex: 1,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 4,
  },
  scanLineGradient: {
    flex: 1,
    borderRadius: 2,
  },
  scanButtonContainer: {
    marginTop: 24,
    ...shadow.medium,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 28,
    gap: 12,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lastScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  lastScoreLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  lastScoreValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#C9A961',
  },
  cardsContainer: {
    paddingVertical: 8,
  },
  quickCard: {
    width: CARD_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginRight: 16,
  },
  quickCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickCardContent: {
    flex: 1,
    marginLeft: 16,
  },
  quickCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  quickCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  streakSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  streakEmoji: {
    fontSize: 20,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
  },
});
