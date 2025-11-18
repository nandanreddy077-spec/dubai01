import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from "expo-router";
import { Shirt, Star, Palette, Eye, Award, ArrowRight, Crown, Sparkles, Gem, Heart } from "lucide-react-native";
import { useStyle } from "@/contexts/StyleContext";
import { palette, gradient, shadow, typography, spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

// Color mapping function to convert color names to hex values
const getColorHex = (colorName: string): string => {
  const colorMap: { [key: string]: string } = {
    // Basic colors
    'red': '#DC2626',
    'blue': '#2563EB',
    'green': '#16A34A',
    'yellow': '#EAB308',
    'orange': '#EA580C',
    'purple': '#9333EA',
    'pink': '#EC4899',
    'black': '#000000',
    'white': '#FFFFFF',
    'gray': '#6B7280',
    'grey': '#6B7280',
    'brown': '#92400E',
    
    // Specific color variations
    'navy blue': '#1E3A8A',
    'navy': '#1E3A8A',
    'dark blue': '#1E40AF',
    'light blue': '#3B82F6',
    'sky blue': '#0EA5E9',
    'royal blue': '#1D4ED8',
    
    'beige': '#F5F5DC',
    'cream': '#FFFDD0',
    'ivory': '#FFFFF0',
    'off-white': '#FAF9F6',
    
    'charcoal': '#36454F',
    'charcoal gray': '#36454F',
    'charcoal grey': '#36454F',
    'dark gray': '#4B5563',
    'dark grey': '#4B5563',
    'light gray': '#D1D5DB',
    'light grey': '#D1D5DB',
    
    'burgundy': '#800020',
    'maroon': '#800000',
    'wine': '#722F37',
    'crimson': '#DC143C',
    
    'forest green': '#228B22',
    'olive': '#808000',
    'olive green': '#6B8E23',
    'mint': '#98FB98',
    'sage': '#9CAF88',
    
    'gold': '#FFD700',
    'silver': '#C0C0C0',
    'bronze': '#CD7F32',
    'copper': '#B87333',
    
    'lavender': '#E6E6FA',
    'lilac': '#C8A2C8',
    'violet': '#8A2BE2',
    'indigo': '#4B0082',
    
    'coral': '#FF7F50',
    'salmon': '#FA8072',
    'peach': '#FFCBA4',
    'rose': '#FF66CC',
    
    'khaki': '#F0E68C',
    'tan': '#D2B48C',
    'camel': '#C19A6B',
    'sand': '#F4A460',
    
    'teal': '#008080',
    'turquoise': '#40E0D0',
    'aqua': '#00FFFF',
    'cyan': '#00FFFF',
    
    // Frame colors
    'black (frames)': '#000000',
    'brown (frames)': '#8B4513',
    'gold (frames)': '#FFD700',
    'silver (frames)': '#C0C0C0',
    
    // Clothing specific
    'denim': '#1560BD',
    'denim blue': '#1560BD',
    'white crisp shirt': '#FFFFFF',
    'white shirt': '#FFFFFF',
    'crisp white': '#FFFFFF',
  };
  
  // Convert to lowercase for matching
  const lowerColorName = colorName.toLowerCase().trim();
  
  // Direct match
  if (colorMap[lowerColorName]) {
    return colorMap[lowerColorName];
  }
  
  // Partial matches for complex color names
  for (const [key, value] of Object.entries(colorMap)) {
    if (lowerColorName.includes(key) || key.includes(lowerColorName)) {
      return value;
    }
  }
  
  // Default fallback colors based on common color words
  if (lowerColorName.includes('blue')) return '#2563EB';
  if (lowerColorName.includes('red')) return '#DC2626';
  if (lowerColorName.includes('green')) return '#16A34A';
  if (lowerColorName.includes('yellow')) return '#EAB308';
  if (lowerColorName.includes('orange')) return '#EA580C';
  if (lowerColorName.includes('purple') || lowerColorName.includes('violet')) return '#9333EA';
  if (lowerColorName.includes('pink')) return '#EC4899';
  if (lowerColorName.includes('brown')) return '#92400E';
  if (lowerColorName.includes('black')) return '#000000';
  if (lowerColorName.includes('white')) return '#FFFFFF';
  if (lowerColorName.includes('gray') || lowerColorName.includes('grey')) return '#6B7280';
  
  // Ultimate fallback
  return '#9CA3AF';
};

export default function StyleResultsScreen() {
  const { analysisResult, resetAnalysis } = useStyle();

  React.useEffect(() => {
    if (!analysisResult) {
      router.replace('/style-check');
    }
  }, [analysisResult]);

  if (!analysisResult) {
    return null;
  }

  const handleNewAnalysis = () => {
    resetAnalysis();
    router.push('/style-check');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
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
          <Text style={styles.headerTitle}>Your Style Story</Text>
          <Text style={styles.headerSubtitle}>
            Discover the artistry in your look with our expert analysis
          </Text>
          <View style={styles.headerDivider} />
        </View>

        {/* Elegant Results Card */}
        <View style={styles.resultsSection}>
          <LinearGradient colors={gradient.card} style={styles.resultsCard}>
            <View style={styles.imageSection}>
              <View style={styles.imageFrame}>
                <Image source={{ uri: analysisResult.image }} style={styles.outfitImage} />
                <LinearGradient 
                  colors={gradient.glow} 
                  style={styles.imageGlow}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              </View>
            </View>
            
            <View style={styles.scoreSection}>
              <View style={styles.occasionBadge}>
                <Sparkles color={palette.primary} size={12} />
                <Text style={styles.occasion}>{analysisResult.occasion}</Text>
              </View>
              <Text style={styles.vibe}>{analysisResult.vibe}</Text>
              
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>Your Style Score</Text>
                <LinearGradient 
                  colors={getScoreColor(analysisResult.overallScore) === '#10B981' ? gradient.success : 
                          getScoreColor(analysisResult.overallScore) === '#F59E0B' ? gradient.warning : 
                          ['#EF4444', '#F87171']}
                  style={styles.scoreCircle}
                >
                  <Text style={styles.scoreNumber}>
                    {analysisResult.overallScore}
                  </Text>
                  <Text style={styles.scoreOutOf}>/100</Text>
                </LinearGradient>
                <Text style={[styles.scoreRating, { color: getScoreColor(analysisResult.overallScore) }]}>
                  {getScoreLabel(analysisResult.overallScore)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Color Harmony Section */}
        <View style={styles.section}>
          <LinearGradient colors={gradient.lavender} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient colors={gradient.glow} style={styles.sectionIcon}>
                <Palette color={palette.textLight} size={16} />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Color Harmony</Text>
            </View>
            
            <View style={styles.harmonyContainer}>
              <Text style={styles.harmonyLabel}>Color Balance</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <LinearGradient 
                    colors={getScoreColor(analysisResult.colorAnalysis.colorHarmony) === '#10B981' ? gradient.success : 
                            getScoreColor(analysisResult.colorAnalysis.colorHarmony) === '#F59E0B' ? gradient.warning : 
                            ['#EF4444', '#F87171']}
                    style={[styles.progressBar, { width: `${analysisResult.colorAnalysis.colorHarmony}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.scorePercentage}>{analysisResult.colorAnalysis.colorHarmony}%</Text>
              </View>
            </View>

            <View style={styles.colorsSection}>
              <View style={styles.colorGroup}>
                <Text style={styles.colorGroupTitle}>Your Palette</Text>
                <View style={styles.colorsGrid}>
                  {analysisResult.colorAnalysis.dominantColors.map((color, index) => (
                    <View key={index} style={styles.colorItem}>
                      <LinearGradient 
                        colors={gradient.shimmer} 
                        style={[styles.colorCircle, { backgroundColor: getColorHex(color) }]}
                      />
                      <Text style={styles.colorName}>{color}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.colorGroup}>
                <Text style={styles.colorGroupTitle}>Perfect Matches</Text>
                <View style={styles.colorsGrid}>
                  {analysisResult.colorAnalysis.recommendedColors.map((color, index) => (
                    <View key={index} style={styles.colorItem}>
                      <LinearGradient 
                        colors={gradient.shimmer} 
                        style={[styles.colorCircle, { backgroundColor: getColorHex(color) }]}
                      />
                      <Text style={styles.colorName}>{color}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.seasonalContainer}>
              <Star color={palette.primary} size={16} fill={palette.primary} />
              <Text style={styles.seasonalMatch}>
                Your Season: {analysisResult.colorAnalysis.seasonalMatch}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Outfit Breakdown */}
        <View style={styles.section}>
          <LinearGradient colors={gradient.mint} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient colors={gradient.glow} style={styles.sectionIcon}>
                <Shirt color={palette.textLight} size={16} />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Outfit Analysis</Text>
            </View>
            
            {/* Top */}
            <View style={styles.outfitItem}>
              <Text style={styles.outfitItemTitle}>Top: {analysisResult.outfitBreakdown.top.item}</Text>
              <View style={styles.outfitDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fit Score:</Text>
                  <Text style={[styles.detailScore, { color: getScoreColor(analysisResult.outfitBreakdown.top.fit) }]}>
                    {analysisResult.outfitBreakdown.top.fit}/100
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Style:</Text>
                  <Text style={styles.detailValue}>{analysisResult.outfitBreakdown.top.style}</Text>
                </View>
                <Text style={styles.feedback}>{analysisResult.outfitBreakdown.top.feedback}</Text>
              </View>
            </View>

            {/* Bottom */}
            <View style={styles.outfitItem}>
              <Text style={styles.outfitItemTitle}>Bottom: {analysisResult.outfitBreakdown.bottom.item}</Text>
              <View style={styles.outfitDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fit Score:</Text>
                  <Text style={[styles.detailScore, { color: getScoreColor(analysisResult.outfitBreakdown.bottom.fit) }]}>
                    {analysisResult.outfitBreakdown.bottom.fit}/100
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Style:</Text>
                  <Text style={styles.detailValue}>{analysisResult.outfitBreakdown.bottom.style}</Text>
                </View>
                <Text style={styles.feedback}>{analysisResult.outfitBreakdown.bottom.feedback}</Text>
              </View>
            </View>

            {/* Accessories */}
            {analysisResult.outfitBreakdown.accessories && (
              <View style={styles.accessoriesSection}>
                <Text style={styles.accessoriesTitle}>Accessories</Text>
                
                {analysisResult.outfitBreakdown.accessories.jewelry && (
                  <View style={styles.accessoryItem}>
                    <Text style={styles.accessoryLabel}>Jewelry:</Text>
                    <Text style={styles.accessoryItems}>
                      {analysisResult.outfitBreakdown.accessories.jewelry.items.join(', ')}
                    </Text>
                    <Text style={styles.accessoryFeedback}>
                      {analysisResult.outfitBreakdown.accessories.jewelry.feedback}
                    </Text>
                  </View>
                )}
                
                {analysisResult.outfitBreakdown.accessories.shoes && (
                  <View style={styles.accessoryItem}>
                    <Text style={styles.accessoryLabel}>Shoes:</Text>
                    <Text style={styles.accessoryItems}>
                      {analysisResult.outfitBreakdown.accessories.shoes.style}
                    </Text>
                    <Text style={styles.accessoryFeedback}>
                      {analysisResult.outfitBreakdown.accessories.shoes.feedback}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Occasion Match */}
        <View style={styles.section}>
          <LinearGradient colors={gradient.rose} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient colors={gradient.glow} style={styles.sectionIcon}>
                <Award color={palette.textLight} size={16} />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Occasion Perfect</Text>
            </View>
            
            <View style={styles.harmonyContainer}>
              <Text style={styles.harmonyLabel}>Appropriateness Score</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <LinearGradient 
                    colors={getScoreColor(analysisResult.occasionMatch.appropriateness) === '#10B981' ? gradient.success : 
                            getScoreColor(analysisResult.occasionMatch.appropriateness) === '#F59E0B' ? gradient.warning : 
                            ['#EF4444', '#F87171']}
                    style={[styles.progressBar, { width: `${analysisResult.occasionMatch.appropriateness}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.scorePercentage}>{analysisResult.occasionMatch.appropriateness}%</Text>
              </View>
            </View>

            <View style={styles.seasonalContainer}>
              <Star color={palette.primary} size={16} fill={palette.primary} />
              <Text style={styles.seasonalMatch}>
                Formality: {analysisResult.occasionMatch.formalityLevel}
              </Text>
            </View>

            {analysisResult.occasionMatch.suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Perfect For:</Text>
                {analysisResult.occasionMatch.suggestions.map((suggestion, index) => (
                  <Text key={index} style={styles.suggestionText}>• {suggestion}</Text>
                ))}
              </View>
            )}
          </LinearGradient>
        </View>

        {/* What Worked */}
        <View style={styles.section}>
          <LinearGradient colors={gradient.success} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient colors={gradient.glow} style={styles.sectionIcon}>
                <Star color={palette.textLight} size={16} />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Your Strengths</Text>
            </View>
            
            {analysisResult.overallFeedback.whatWorked.map((item, index) => (
              <View key={index} style={styles.feedbackItem}>
                <View style={[styles.feedbackDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.feedbackText}>{item}</Text>
              </View>
            ))}
          </LinearGradient>
        </View>

        {/* Improvements */}
        <View style={styles.section}>
          <LinearGradient colors={gradient.warning} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient colors={gradient.glow} style={styles.sectionIcon}>
                <ArrowRight color={palette.textLight} size={16} />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Enhancement Tips</Text>
            </View>
            
            {analysisResult.overallFeedback.improvements.map((item, index) => (
              <View key={index} style={styles.feedbackItem}>
                <View style={[styles.feedbackDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.feedbackText}>{item}</Text>
              </View>
            ))}
          </LinearGradient>
        </View>

        {/* Specific Suggestions */}
        <View style={styles.section}>
          <LinearGradient colors={gradient.card} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient colors={gradient.glow} style={styles.sectionIcon}>
                <Eye color={palette.textLight} size={16} />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Style Recommendations</Text>
            </View>
            
            {analysisResult.overallFeedback.specificSuggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionItem}>
                <LinearGradient colors={gradient.primary} style={styles.suggestionNumber}>
                  <Text style={styles.suggestionNumberText}>{index + 1}</Text>
                </LinearGradient>
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </LinearGradient>
        </View>

        {/* Body Type Recommendations */}
        <View style={styles.section}>
          <LinearGradient colors={gradient.aurora} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient colors={gradient.glow} style={styles.sectionIcon}>
                <Sparkles color={palette.textLight} size={16} />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Body Type Guide</Text>
            </View>
            
            <View style={styles.bodyTypeSection}>
              <Text style={styles.bodyTypeTitle}>Your Natural Assets:</Text>
              {analysisResult.bodyTypeRecommendations.strengths.map((strength, index) => (
                <Text key={index} style={styles.bodyTypeItem}>• {strength}</Text>
              ))}
            </View>

            <View style={styles.bodyTypeSection}>
              <Text style={styles.bodyTypeTitle}>Styles That Flatter You:</Text>
              {analysisResult.bodyTypeRecommendations.stylesThatSuit.map((style, index) => (
                <Text key={index} style={styles.bodyTypeItem}>• {style}</Text>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Elegant Action Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleNewAnalysis}
            activeOpacity={0.9}
          >
            <LinearGradient colors={gradient.primary} style={styles.primaryButtonGradient}>
              <Sparkles color={palette.textLight} size={20} />
              <Text style={styles.primaryButtonText}>Create Another Masterpiece</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: 80,
    paddingBottom: spacing.xxxxl,
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
  resultsSection: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  resultsCard: {
    borderRadius: 28,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: palette.borderLight,
    ...shadow.floating,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  imageFrame: {
    position: 'relative',
  },
  outfitImage: {
    width: 140,
    height: 180,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: palette.primary,
    ...shadow.elevated,
  },
  imageGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    opacity: 0.3,
  },
  scoreSection: {
    alignItems: 'center',
  },
  occasionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.overlayGold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    gap: spacing.xs,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  occasion: {
    fontSize: typography.bodySmall,
    color: palette.primary,
    fontWeight: typography.bold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  vibe: {
    fontSize: typography.h5,
    color: palette.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.xl,
    fontWeight: typography.medium,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: typography.caption,
    color: palette.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: typography.semibold,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.glow,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: typography.black,
    color: palette.textLight,
  },
  scoreOutOf: {
    fontSize: typography.body,
    color: palette.textLight,
    marginLeft: 4,
    opacity: 0.8,
  },
  scoreRating: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    letterSpacing: 0.3,
  },
  section: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  sectionCard: {
    borderRadius: 24,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: palette.borderLight,
    ...shadow.elevated,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.glow,
  },
  sectionTitle: {
    fontSize: typography.h4,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    letterSpacing: -0.2,
  },
  harmonyContainer: {
    marginBottom: spacing.xl,
  },
  harmonyLabel: {
    fontSize: typography.h6,
    fontWeight: typography.semibold,
    color: palette.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: palette.overlayLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  scorePercentage: {
    fontSize: typography.bodySmall,
    fontWeight: typography.bold,
    color: palette.primary,
    minWidth: 40,
  },
  colorsSection: {
    marginBottom: spacing.lg,
  },
  colorGroup: {
    marginBottom: spacing.lg,
  },
  colorGroupTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: palette.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: 0.2,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: palette.borderLight,
    ...shadow.card,
  },
  colorName: {
    fontSize: typography.caption,
    color: palette.textSecondary,
    textAlign: 'center',
    fontWeight: typography.medium,
    maxWidth: 50,
  },
  seasonalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.overlayBlush,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    gap: spacing.xs,
    ...shadow.card,
  },
  seasonalMatch: {
    fontSize: typography.body,
    color: palette.primary,
    fontWeight: typography.bold,
    letterSpacing: 0.2,
  },
  outfitItem: {
    backgroundColor: palette.overlayLight,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: palette.borderLight,
    ...shadow.card,
  },
  outfitItemTitle: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    color: palette.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: 0.2,
  },
  outfitDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    fontWeight: typography.medium,
  },
  detailValue: {
    fontSize: typography.bodySmall,
    color: palette.textPrimary,
    fontWeight: typography.semibold,
  },
  detailScore: {
    fontSize: typography.bodySmall,
    fontWeight: typography.bold,
  },
  feedback: {
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    lineHeight: 20,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  accessoriesSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.divider,
  },
  accessoriesTitle: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    color: palette.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: 0.2,
  },
  accessoryItem: {
    marginBottom: spacing.md,
  },
  accessoryLabel: {
    fontSize: typography.bodySmall,
    fontWeight: typography.semibold,
    color: palette.textPrimary,
    marginBottom: 4,
  },
  accessoryItems: {
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    marginBottom: 4,
  },
  accessoryFeedback: {
    fontSize: typography.caption,
    color: palette.textMuted,
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    marginTop: spacing.lg,
  },
  suggestionsTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: palette.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  feedbackDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  feedbackText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: palette.textPrimary,
    lineHeight: 22,
    fontWeight: typography.regular,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  suggestionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    ...shadow.glow,
  },
  suggestionNumberText: {
    fontSize: typography.caption,
    fontWeight: typography.bold,
    color: palette.textLight,
  },
  suggestionText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: palette.textPrimary,
    lineHeight: 22,
    fontWeight: typography.regular,
  },
  bodyTypeSection: {
    marginBottom: spacing.lg,
  },
  bodyTypeTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: palette.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  bodyTypeItem: {
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
    fontWeight: typography.regular,
  },
  buttonSection: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxxl,
  },
  primaryButton: {
    borderRadius: 28,
    overflow: 'hidden',
    ...shadow.floating,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryButtonText: {
    color: palette.textLight,
    fontSize: typography.h6,
    fontWeight: typography.bold,
    letterSpacing: 0.2,
  },
});