import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Share2,
  ChevronRight,
  CheckCircle,
  X,
  AlertCircle,
  Info,
  Star,
  TrendingUp,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useProducts } from '@/contexts/ProductContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';
import { findIngredient, type Ingredient } from '@/lib/ingredient-intelligence';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Tab = 'safety' | 'match';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { recommendations, trackAffiliateTap } = useProducts();
  const [activeTab, setActiveTab] = useState<Tab>('safety');
  const [favorite, setFavorite] = useState(false);
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = createStyles(palette);

  // Find the product recommendation
  const product = useMemo(() => {
    if (!id) return null;
    return recommendations.find(rec => rec.id === id);
  }, [id, recommendations]);

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Product Details', headerBackTitle: 'Back' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Product not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const analysis = product.analysis;
  const ingredients = product.ingredients || [];

  // Categorize ingredients
  const ingredientData = useMemo(() => {
    return ingredients.map(ingName => {
      const ing = findIngredient(ingName);
      if (!ing) return { name: ingName, rating: 'neutral' as const, ingredient: null };
      
      let rating: 'safe' | 'caution' | 'concern' | 'neutral' = 'neutral';
      
      if (ing.safety.comedogenic >= 4 || ing.safety.irritation === 'high') {
        rating = 'concern';
      } else if (ing.safety.comedogenic >= 2 || ing.safety.irritation === 'medium') {
        rating = 'caution';
      } else if (ing.efficacy.proven && ing.efficacy.effectiveness === 'high') {
        rating = 'safe';
      }
      
      return { name: ingName, rating, ingredient: ing };
    });
  }, [ingredients]);

  const beneficialIngredients = ingredientData.filter(ing => ing.rating === 'safe');
  const concernIngredients = ingredientData.filter(ing => ing.rating === 'concern');
  const cautionIngredients = ingredientData.filter(ing => ing.rating === 'caution');

  // Get ingredient concerns
  const concerns = useMemo(() => {
    const concernList: Array<{ category: string; ingredients: string[] }> = [];
    
    concernIngredients.forEach(({ ingredient }) => {
      if (!ingredient) return;
      
      if (ingredient.safety.comedogenic >= 4) {
        const existing = concernList.find(c => c.category === 'Fungal Acne Triggers');
        if (existing) {
          existing.ingredients.push(ingredient.name);
        } else {
          concernList.push({ category: 'Fungal Acne Triggers', ingredients: [ingredient.name] });
        }
      }
      
      if (ingredient.safety.irritation === 'high') {
        const existing = concernList.find(c => c.category === 'Irritation Risk');
        if (existing) {
          existing.ingredients.push(ingredient.name);
        } else {
          concernList.push({ category: 'Irritation Risk', ingredients: [ingredient.name] });
        }
      }
    });
    
    return concernList;
  }, [concernIngredients]);

  // Get key benefits from actives
  const keyBenefits = useMemo(() => {
    if (!analysis?.actives) return [];
    
    const benefits = new Set<string>();
    analysis.actives.forEach(active => {
      active.conditions.forEach(condition => {
        if (condition === 'hydration') benefits.add('Hydration');
        if (condition === 'fine lines' || condition === 'wrinkles') benefits.add('Anti-Aging');
        if (condition === 'acne') benefits.add('Acne Treatment');
        if (condition === 'hyperpigmentation' || condition === 'dark spots') benefits.add('Brightening');
        if (condition === 'texture') benefits.add('Texture Improvement');
        if (condition === 'sensitivity') benefits.add('Soothing');
      });
    });
    
    return Array.from(benefits);
  }, [analysis?.actives]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Product Details',
          headerBackTitle: 'Back',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setFavorite(!favorite)}
                style={styles.headerButton}
              >
                <Heart
                  color={favorite ? palette.error : palette.textSecondary}
                  size={24}
                  fill={favorite ? palette.error : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Share2 color={palette.textSecondary} size={24} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image & Basic Info */}
        <View style={styles.productHeader}>
          {product.imageUrl && (
            <View style={styles.imageContainer}>
              <ExpoImage
                source={{ uri: product.imageUrl }}
                style={styles.productImage}
                contentFit="cover"
                transition={200}
              />
            </View>
          )}
          
          <View style={styles.productInfo}>
            {product.brand && (
              <Text style={styles.brand}>{product.brand.toUpperCase()}</Text>
            )}
            <Text style={styles.productName}>{product.stepName}</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'safety' && styles.tabActive]}
            onPress={() => setActiveTab('safety')}
          >
            <Text style={[styles.tabText, activeTab === 'safety' && styles.tabTextActive]}>
              Safety Rating
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'match' && styles.tabActive]}
            onPress={() => setActiveTab('match')}
          >
            <Text style={[styles.tabText, activeTab === 'match' && styles.tabTextActive]}>
              Skin Match
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'safety' ? (
          <View style={styles.tabContent}>
            {/* Product Snapshot */}
            <View style={styles.snapshotSection}>
              <Text style={styles.sectionTitle}>Product Snapshot</Text>
              
              {keyBenefits.length > 0 && (
                <View style={styles.benefitsSection}>
                  <Text style={styles.benefitsTitle}>KEY BENEFITS</Text>
                  <View style={styles.benefitsList}>
                    {keyBenefits.map((benefit, index) => (
                      <View key={index} style={styles.benefitItem}>
                        <Star color={palette.gold} size={16} fill={palette.gold} />
                        <Text style={styles.benefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Composition */}
              <View style={styles.compositionSection}>
                <Text style={styles.compositionTitle}>COMPOSITION</Text>
                <View style={styles.compositionList}>
                  {analysis && (
                    <>
                      <View style={styles.compositionItem}>
                        {analysis.safety.concerns.length === 0 ? (
                          <CheckCircle color={palette.success} size={18} />
                        ) : (
                          <X color={palette.error} size={18} />
                        )}
                        <Text style={styles.compositionText}>
                          {analysis.safety.concerns.length === 0 ? 'Safe for most skin types' : 'Some concerns detected'}
                        </Text>
                      </View>
                      <View style={styles.compositionItem}>
                        {analysis.compatibility.compatible ? (
                          <CheckCircle color={palette.success} size={18} />
                        ) : (
                          <X color={palette.error} size={18} />
                        )}
                        <Text style={styles.compositionText}>
                          {analysis.compatibility.compatible ? 'Compatible ingredients' : 'Ingredient conflicts detected'}
                        </Text>
                      </View>
                      <View style={styles.compositionItem}>
                        {analysis.efficacy.score >= 70 ? (
                          <CheckCircle color={palette.success} size={18} />
                        ) : (
                          <X color={palette.error} size={18} />
                        )}
                        <Text style={styles.compositionText}>
                          {analysis.efficacy.score >= 70 ? 'Proven active ingredients' : 'Limited active ingredients'}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Ingredient Concerns */}
            {concerns.length > 0 && (
              <View style={styles.concernsSection}>
                <View style={styles.concernsHeader}>
                  <AlertCircle color={palette.error} size={20} />
                  <Text style={styles.concernsTitle}>Ingredient Concerns</Text>
                </View>
                {concerns.map((concern, index) => (
                  <View key={index} style={styles.concernCategory}>
                    <View style={styles.concernCategoryHeader}>
                      <X color={palette.error} size={18} />
                      <Text style={styles.concernCategoryTitle}>{concern.category}</Text>
                    </View>
                    <View style={styles.concernTags}>
                      {concern.ingredients.map((ing, ingIndex) => (
                        <View key={ingIndex} style={styles.concernTag}>
                          <Text style={styles.concernTagText}>{ing}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Ingredients List */}
            <View style={styles.ingredientsSection}>
              <View style={styles.ingredientsHeader}>
                <Text style={styles.ingredientsTitle}>Ingredients</Text>
                <Text style={styles.ingredientsCount}>{ingredients.length} total</Text>
              </View>

              {/* Filter Tabs */}
              <View style={styles.filterTabs}>
                <TouchableOpacity style={[styles.filterTab, styles.filterTabActive]}>
                  <Text style={[styles.filterTabText, styles.filterTabTextActive]}>
                    All ({ingredients.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterTab}>
                  <Text style={styles.filterTabText}>
                    Beneficial ({beneficialIngredients.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterTab}>
                  <Text style={styles.filterTabText}>
                    Concerns ({concernIngredients.length + cautionIngredients.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Ingredients List */}
              <View style={styles.ingredientsList}>
                {ingredientData.map((ing, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.ingredientItem}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.ingredientDot,
                        ing.rating === 'safe' && styles.ingredientDotSafe,
                        ing.rating === 'caution' && styles.ingredientDotCaution,
                        ing.rating === 'concern' && styles.ingredientDotConcern,
                      ]}
                    />
                    <Text style={styles.ingredientName}>{ing.name}</Text>
                    <ChevronRight color={palette.textMuted} size={16} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.tabContent}>
            {/* Match Score */}
            <View style={styles.matchScoreSection}>
              <View style={styles.matchScoreCircle}>
                <LinearGradient
                  colors={product.matchScore >= 80 ? ['#10B981', '#059669'] : ['#F59E0B', '#D97706']}
                  style={styles.matchScoreGradient}
                >
                  <Text style={styles.matchScoreNumber}>{product.matchScore}%</Text>
                </LinearGradient>
              </View>
              <Text style={styles.matchScoreLabel}>MATCH SCORE</Text>
            </View>

            {/* Match Summary */}
            {analysis && (
              <View style={styles.matchSummary}>
                <View style={styles.matchSummaryCard}>
                  <Info color={palette.success} size={20} />
                  <View style={styles.matchSummaryText}>
                    <Text style={styles.matchSummaryTitle}>
                      {product.matchScore >= 80 ? "It's a good match!" : "Moderate match"}
                    </Text>
                    <Text style={styles.matchSummaryDescription}>
                      {analysis.efficacy.reasoning || 'This product matches your skin type and concerns.'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* How It Affects Your Skin */}
            {analysis?.actives && analysis.actives.length > 0 && (
              <View style={styles.effectsSection}>
                <Text style={styles.effectsTitle}>How it affects your skin</Text>
                {analysis.actives.map((active, index) => (
                  <View key={index} style={styles.effectCard}>
                    <CheckCircle color={palette.success} size={20} />
                    <View style={styles.effectContent}>
                      <Text style={styles.effectTitle}>
                        Addresses {active.conditions.join(' & ')}
                      </Text>
                      <Text style={styles.effectDescription}>
                        Benefits: {active.conditions.map(c => c.toLowerCase()).join(', ')}
                      </Text>
                      <Text style={styles.effectIngredients}>
                        Active ingredient: {active.name} ({active.effectiveness} efficacy)
                      </Text>
                    </View>
                    <ChevronRight color={palette.textMuted} size={18} />
                  </View>
                ))}
              </View>
            )}

            {/* Compatibility Warnings */}
            {analysis && !analysis.compatibility.compatible && analysis.compatibility.issues.length > 0 && (
              <View style={styles.warningsSection}>
                <Text style={styles.warningsTitle}>Compatibility Notes</Text>
                {analysis.compatibility.issues.map((issue, index) => (
                  <View key={index} style={styles.warningCard}>
                    <Info color={palette.warning} size={18} />
                    <View style={styles.warningContent}>
                      <Text style={styles.warningTitle}>{issue.description}</Text>
                      <Text style={styles.warningSolution}>{issue.solution}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Buy Online Button */}
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => {
            // Open Amazon affiliate link directly - no prompts, no delays
            const affiliateUrl = product.tiers.medium.affiliateUrl; // Use medium tier (best value)
            
            if (affiliateUrl) {
              // Track the affiliate tap (fire and forget - don't wait)
              trackAffiliateTap(product.id, affiliateUrl).catch(console.error);
              
              // Open immediately without checking
              Linking.openURL(affiliateUrl).catch((error) => {
                console.error('Error opening affiliate link:', error);
              });
              
              // Haptic feedback
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
            }
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#1A1A1A', '#000000']}
            style={styles.buyButtonGradient}
          >
            <ShoppingBag color="#FFFFFF" size={20} />
            <Text style={styles.buyButtonText}>Buy on Amazon</Text>
            <ExternalLink color="#FFFFFF" size={18} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: palette.textSecondary,
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: palette.primary,
    borderRadius: 12,
  },
  backButtonText: {
    color: palette.textLight,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 8,
  },
  headerButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  productHeader: {
    padding: 20,
    alignItems: 'center',
  },
  imageContainer: {
    width: 120,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: palette.surfaceAlt,
    ...shadow.soft,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    alignItems: 'center',
    width: '100%',
  },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productName: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: palette.success,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  snapshotSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 16,
  },
  benefitsSection: {
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  benefitsList: {
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  compositionSection: {
    marginTop: 20,
  },
  compositionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  compositionList: {
    gap: 10,
  },
  compositionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compositionText: {
    fontSize: 14,
    color: palette.textPrimary,
    fontWeight: '500',
  },
  concernsSection: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  concernsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  concernsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.error,
  },
  concernCategory: {
    marginBottom: 16,
  },
  concernCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  concernCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  concernTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  concernTag: {
    backgroundColor: palette.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  concernTagText: {
    fontSize: 12,
    color: palette.textPrimary,
    fontWeight: '500',
  },
  ingredientsSection: {
    marginBottom: 24,
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ingredientsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.textPrimary,
  },
  ingredientsCount: {
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '600',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: palette.surfaceAlt,
  },
  filterTabActive: {
    backgroundColor: palette.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  filterTabTextActive: {
    color: palette.textLight,
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  ingredientDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.textMuted,
  },
  ingredientDotSafe: {
    backgroundColor: palette.success,
  },
  ingredientDotCaution: {
    backgroundColor: palette.warning,
  },
  ingredientDotConcern: {
    backgroundColor: palette.error,
  },
  ingredientName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: palette.textPrimary,
  },
  matchScoreSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  matchScoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 12,
    ...shadow.medium,
  },
  matchScoreGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchScoreNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  matchScoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  matchSummary: {
    marginBottom: 24,
  },
  matchSummaryCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: palette.overlaySuccess,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  matchSummaryText: {
    flex: 1,
  },
  matchSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  matchSummaryDescription: {
    fontSize: 13,
    color: palette.textSecondary,
    lineHeight: 18,
  },
  effectsSection: {
    marginBottom: 24,
  },
  effectsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 16,
  },
  effectCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: palette.overlaySuccess,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  effectContent: {
    flex: 1,
  },
  effectTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  effectDescription: {
    fontSize: 13,
    color: palette.textSecondary,
    marginBottom: 6,
  },
  effectIngredients: {
    fontSize: 12,
    color: palette.textMuted,
    fontStyle: 'italic',
  },
  warningsSection: {
    marginBottom: 24,
  },
  warningsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  warningCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: palette.overlayError,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  warningSolution: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  buyButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadow.medium,
  },
  buyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

