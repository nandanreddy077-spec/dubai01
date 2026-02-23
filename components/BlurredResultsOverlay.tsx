import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Lock,
  Sparkles,
  Eye,
  Heart,
  Star,
  Zap,
  TrendingUp,
  Crown,
} from 'lucide-react-native';
import { palette, gradient, shadow } from '@/constants/theme';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BlurredResultsOverlayProps {
  visible: boolean;
  onUnlock: () => void;
  glowLevel?: string;
  topStrength?: string;
  matchScore?: number;
}

export default function BlurredResultsOverlay({
  visible,
  onUnlock,
  glowLevel = 'Radiant Glow',
  topStrength = 'Beautiful Skin',
  matchScore = 85,
}: BlurredResultsOverlayProps) {
  if (!visible) return null;

  const handleUnlock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUnlock();
  };

  const emotionalMessages = [
    "Your perfect glow is just one tap away ✨",
    "Discover what your skin is really capable of 🌟",
    "Unlock the secrets to your best skin ever 💫",
    "Your personalized beauty journey starts here 💎",
    "See what thousands of others discovered about their skin 🌸",
  ];

  return (
    <View style={styles.overlay}>
      <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.content}>
        {/* Lock Icon */}
        <View style={styles.lockContainer}>
          <View style={styles.lockCircle}>
            <Lock color={palette.gold} size={32} strokeWidth={2.5} />
          </View>
        </View>

        {/* Emotional Headline */}
        <Text style={styles.headline}>
          You're So Close! 🔓
        </Text>
        
        <Text style={styles.subheadline}>
          {emotionalMessages[Math.floor(Math.random() * emotionalMessages.length)]}
        </Text>

        {/* Teased Results */}
        <View style={styles.teasedResults}>
          <View style={styles.teasedCard}>
            <View style={styles.teasedHeader}>
              <Sparkles color={palette.gold} size={20} />
              <Text style={styles.teasedLabel}>Your Glow Level</Text>
            </View>
            <Text style={styles.teasedValue}>{glowLevel}</Text>
            <View style={styles.blurredBar} />
          </View>

          <View style={styles.teasedCard}>
            <View style={styles.teasedHeader}>
              <Star color={palette.gold} size={20} />
              <Text style={styles.teasedLabel}>Top Strength</Text>
            </View>
            <Text style={styles.teasedValue}>{topStrength}</Text>
            <View style={styles.blurredBar} />
          </View>
        </View>

        {/* What You're Missing */}
        <View style={styles.missingSection}>
          <Text style={styles.missingTitle}>Unlock to See:</Text>
          <View style={styles.missingList}>
            <View style={styles.missingItem}>
              <Eye color={palette.gold} size={16} />
              <Text style={styles.missingText}>Complete detailed analysis scores</Text>
            </View>
            <View style={styles.missingItem}>
              <Heart color={palette.gold} size={16} />
              <Text style={styles.missingText}>Personalized product recommendations</Text>
            </View>
            <View style={styles.missingItem}>
              <Zap color={palette.gold} size={16} />
              <Text style={styles.missingText}>AI-powered skincare routine</Text>
            </View>
            <View style={styles.missingItem}>
              <TrendingUp color={palette.gold} size={16} />
              <Text style={styles.missingText}>Progress tracking & insights</Text>
            </View>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.unlockButton}
          onPress={handleUnlock}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[palette.gold, palette.blush]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.unlockButtonGradient}
          >
            <Crown color="#000" size={20} />
            <Text style={styles.unlockButtonText}>Unlock Full Results</Text>
            <Sparkles color="#000" size={18} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Urgency Message */}
        <Text style={styles.urgencyText}>
          Join thousands discovering their perfect glow ✨
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: SCREEN_WIDTH - 48,
    alignItems: 'center',
    gap: 24,
  },
  lockContainer: {
    marginBottom: 8,
  },
  lockCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201, 169, 97, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.gold,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subheadline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  teasedResults: {
    width: '100%',
    gap: 12,
  },
  teasedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 97, 0.3)',
  },
  teasedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  teasedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  teasedValue: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.gold,
    marginBottom: 8,
  },
  blurredBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  missingSection: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 97, 0.2)',
  },
  missingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  missingList: {
    gap: 12,
  },
  missingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  missingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  unlockButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    ...shadow.medium,
  },
  unlockButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  unlockButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  urgencyText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

