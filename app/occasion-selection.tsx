import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';

import { useStyle } from '@/contexts/StyleContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow, typography, spacing } from '@/constants/theme';
import { Sparkles, Crown, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function OccasionSelectionScreen() {
  const { occasions, currentImage, setSelectedOccasion } = useStyle();
  const { theme } = useTheme();
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = createStyles(palette);

  const handleOccasionSelect = (occasionId: string) => {
    setSelectedOccasion(occasionId);
    router.push('/style-loading');
  };



  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      <Stack.Screen 
        options={{ 
          title: "",
          headerTransparent: true,
          headerBackTitle: "Back",
        }} 
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Luxurious Header */}
          <View style={styles.header}>
            <LinearGradient 
              colors={gradient.shimmer} 
              style={styles.headerGlow}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Crown color={palette.primary} size={28} />
            </LinearGradient>
            <Text style={styles.headerTitle}>Set Your Scene</Text>
            <Text style={styles.headerSubtitle}>
              Every moment deserves the perfect look. Choose your occasion for styling that captures your essence.
            </Text>
            <View style={styles.headerDivider} />
          </View>

          {/* Elegant Photo Preview */}
          {currentImage && (
            <View style={styles.imagePreview}>
              <View style={styles.imageFrame}>
                <Image source={{ uri: currentImage }} style={styles.previewImage} />
                <LinearGradient 
                  colors={gradient.glow} 
                  style={styles.imageOverlay}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              </View>
              <View style={styles.previewBadge}>
                <Star color={palette.primary} size={12} fill={palette.primary} />
                <Text style={styles.previewText}>Your Beautiful Look</Text>
              </View>
            </View>
          )}

          {/* Curated Occasions */}
          <View style={styles.occasionsSection}>
            <View style={styles.sectionHeader}>
              <Sparkles color={palette.primary} size={20} />
              <Text style={styles.sectionTitle}>Perfect Occasions</Text>
            </View>
            
            <View style={styles.occasionsGrid}>
              {occasions.map((occasion, index) => (
                <TouchableOpacity
                  key={occasion.id}
                  style={styles.occasionCard}
                  onPress={() => handleOccasionSelect(occasion.id)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={index % 3 === 0 ? gradient.rose : index % 3 === 1 ? gradient.lavender : gradient.mint}
                    style={styles.occasionCardGradient}
                  >
                    <View style={styles.occasionIconContainer}>
                      <LinearGradient colors={gradient.shimmer} style={styles.occasionIcon}>
                        <Text style={styles.occasionEmoji}>{occasion.icon}</Text>
                      </LinearGradient>
                    </View>
                    <Text style={styles.occasionName}>{occasion.name}</Text>
                    <View style={styles.occasionShimmer} />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: 80,
    paddingBottom: spacing.xxxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxxl,
  },
  headerGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadow.floating,
  },
  headerTitle: {
    fontSize: typography.display,
    fontWeight: typography.black,
    color: palette.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: typography.h6,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: spacing.lg,
    fontWeight: typography.medium,
  },
  headerDivider: {
    width: 60,
    height: 3,
    backgroundColor: palette.primary,
    borderRadius: 2,
    marginTop: spacing.xl,
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: spacing.xxxxl,
  },
  imageFrame: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  previewImage: {
    width: 160,
    height: 200,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: palette.primary,
    ...shadow.floating,
  },
  imageOverlay: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    opacity: 0.3,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.overlayGold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    gap: spacing.xs,
    ...shadow.card,
  },
  previewText: {
    fontSize: typography.bodySmall,
    color: palette.primary,
    fontWeight: typography.semibold,
    letterSpacing: 0.3,
  },
  occasionsSection: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.h3,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  occasionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  occasionCard: {
    width: (width - spacing.xxl * 2 - spacing.lg) / 2,
    borderRadius: 28,
    ...shadow.floating,
    overflow: 'hidden',
  },
  occasionCardGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.borderLight,
    position: 'relative',
    minHeight: 140,
    justifyContent: 'center',
  },
  occasionIconContainer: {
    marginBottom: spacing.lg,
  },
  occasionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.glow,
    borderWidth: 2,
    borderColor: palette.primary,
  },
  occasionEmoji: {
    fontSize: 28,
  },
  occasionName: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    color: palette.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  occasionShimmer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderTopRightRadius: 28,
    backgroundColor: palette.overlayGold,
    opacity: 0.6,
  },
});