import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Animated,
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
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useProducts } from '@/contexts/ProductContext';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';
import { findIngredient, analyzeProductIngredients, type Ingredient } from '@/lib/ingredient-intelligence';
import { getIngredientEducation, generateProductSkinImpact } from '@/lib/ingredient-education';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Tab = 'safety' | 'match';

export default function ProductDetailsScreen() {
  const { id, productId } = useLocalSearchParams<{ id?: string; productId?: string }>();
  const { theme } = useTheme();
  const { recommendations, products, trackAffiliateTap, getProductById } = useProducts();
  const { currentResult } = useAnalysis();
  const [activeTab, setActiveTab] = useState<Tab>('safety');
  const [favorite, setFavorite] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const [expandedActives, setExpandedActives] = useState<Set<number>>(new Set());
  const [ingredientFilter, setIngredientFilter] = useState<'all' | 'beneficial' | 'concerns'>('all');
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = createStyles(palette);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const matchScoreAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const tabSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate match score if personalized match exists
    if (personalizedMatch) {
      Animated.spring(matchScoreAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        delay: 200,
        useNativeDriver: true,
      }).start(() => {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      });
    }
  }, [personalizedMatch]);

  useEffect(() => {
    // Tab transition animation
    Animated.spring(tabSlideAnim, {
      toValue: activeTab === 'match' ? 1 : 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  // Find the product - either from recommendations or from user's shelf
  const product = useMemo(() => {
    const searchId = id || productId;
    if (!searchId) return null;
    
    // First check recommendations
    const rec = recommendations.find(r => r.id === searchId);
    if (rec) return rec;
    
    // Then check user's products
    const userProduct = getProductById(searchId);
    if (userProduct) {
      // Convert Product to ProductRecommendation format for display
      const analysis = userProduct.ingredients && userProduct.ingredients.length > 0
        ? analyzeProductIngredients(userProduct.name, userProduct.ingredients)
        : null;
      
      return {
        id: userProduct.id,
        category: userProduct.category,
        stepName: userProduct.name,
        description: `Your ${userProduct.name} from ${userProduct.brand}`,
        imageUrl: userProduct.imageUrl,
        brand: userProduct.brand,
        price: userProduct.price?.toString(),
        ingredients: userProduct.ingredients || [],
        analysis: analysis?.analysis,
        matchScore: analysis ? analysis.analysis.efficacy.score : 50,
        source: 'shelf' as const,
      };
    }
    
    return null;
  }, [id, productId, recommendations, products, getProductById]);

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

  const beneficialIngredients = useMemo(() => 
    ingredientData.filter(ing => ing.rating === 'safe'), 
    [ingredientData]
  );
  const concernIngredients = useMemo(() => 
    ingredientData.filter(ing => ing.rating === 'concern'), 
    [ingredientData]
  );
  const cautionIngredients = useMemo(() => 
    ingredientData.filter(ing => ing.rating === 'caution'), 
    [ingredientData]
  );
  
  // Filter ingredients based on selected filter
  const filteredIngredientData = useMemo(() => {
    switch (ingredientFilter) {
      case 'beneficial':
        return beneficialIngredients;
      case 'concerns':
        return [...concernIngredients, ...cautionIngredients];
      default:
        return ingredientData;
    }
  }, [ingredientFilter, ingredientData, beneficialIngredients, concernIngredients, cautionIngredients]);

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

  // Calculate personalized skin match based on user's analysis
  const personalizedMatch = useMemo(() => {
    if (!currentResult || !analysis || !ingredients.length) {
      return null;
    }

    const skinType = currentResult.skinType.toLowerCase();
    const userConcerns = currentResult.dermatologyInsights?.skinConcerns || [];
    const userSkinQuality = currentResult.skinQuality?.toLowerCase() || '';

    let matchScore = analysis.efficacy.score || 50;
    const benefits: string[] = [];
    const warnings: string[] = [];
    const worksForConcerns: string[] = [];

    // Check if ingredients address user's concerns
    if (analysis.actives && analysis.actives.length > 0) {
      analysis.actives.forEach(active => {
        // Check if this active addresses any of the user's concerns
        const addressesConcern = active.efficacy.conditions.some(condition =>
          userConcerns.some(concern =>
            concern.toLowerCase().includes(condition.toLowerCase()) ||
            condition.toLowerCase().includes(concern.toLowerCase())
          )
        );

        if (addressesConcern) {
          worksForConcerns.push(active.name);
          benefits.push(`${active.name} addresses your ${active.efficacy.conditions.join(', ')} concerns`);
          matchScore += 10; // Boost score for addressing concerns
        }

        // Skin type specific warnings
        if (skinType === 'sensitive' && active.safety.irritation === 'high') {
          warnings.push(`${active.name} may cause irritation for sensitive skin. Patch test first.`);
          matchScore -= 15;
        }
        if (skinType === 'dry' && active.name.includes('Acid') && !active.name.includes('Hyaluronic')) {
          warnings.push(`${active.name} may be drying. Use with a rich moisturizer.`);
          matchScore -= 10;
        }
        if (skinType === 'oily' && active.safety.comedogenic >= 3) {
          warnings.push(`${active.name} may clog pores for oily skin. Monitor for breakouts.`);
          matchScore -= 10;
        }
      });
    }

    // Check compatibility issues
    if (!analysis.compatibility.compatible && analysis.compatibility.issues.length > 0) {
      analysis.compatibility.issues.forEach(issue => {
        warnings.push(issue.description);
        matchScore -= 5;
      });
    }

    // Check ingredient safety for user's skin type
    ingredientData.forEach(({ ingredient, rating }) => {
      if (!ingredient) return;

      if (skinType === 'sensitive' && ingredient.safety.irritation === 'high') {
        warnings.push(`${ingredient.name} may irritate sensitive skin`);
      }
      if (skinType === 'oily' && ingredient.safety.comedogenic >= 4) {
        warnings.push(`${ingredient.name} is highly comedogenic - may cause breakouts`);
      }
      if (skinType === 'dry' && ingredient.name.toLowerCase().includes('alcohol') && !ingredient.name.toLowerCase().includes('fatty')) {
        warnings.push(`${ingredient.name} may be drying for dry skin`);
      }
    });

    // Final score should be between 0-100
    matchScore = Math.max(0, Math.min(100, matchScore));

    return {
      score: Math.round(matchScore),
      benefits,
      warnings: [...new Set(warnings)], // Remove duplicates
      worksForConcerns,
      skinTypeMatch: true, // We'll determine this based on warnings
      recommendation: matchScore >= 80 ? 'excellent' : matchScore >= 60 ? 'good' : matchScore >= 40 ? 'moderate' : 'poor',
    };
  }, [currentResult, analysis, ingredients, ingredientData]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Product Details',
          headerBackTitle: 'Back',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => {
                  setFavorite(!favorite);
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                style={styles.headerButton}
                activeOpacity={0.7}
              >
                <Heart
                  color={favorite ? palette.error : palette.textSecondary}
                  size={24}
                  fill={favorite ? palette.error : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                activeOpacity={0.7}
              >
                <Share2 color={palette.textSecondary} size={24} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <Animated.View
        style={[
          styles.scrollContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Product Image & Basic Info */}
          <Animated.View 
            style={[
              styles.productHeader,
              {
                opacity: fadeAnim,
              },
            ]}
          >
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
        </Animated.View>

        {/* Tab Selector */}
        <Animated.View 
          style={[
            styles.tabContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'safety' && styles.tabActive]}
            onPress={() => {
              setActiveTab('safety');
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'safety' && styles.tabTextActive]}>
              Safety Rating
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'match' && styles.tabActive]}
            onPress={() => {
              setActiveTab('match');
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'match' && styles.tabTextActive]}>
              Skin Match
            </Text>
          </TouchableOpacity>
        </Animated.View>

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
                <TouchableOpacity 
                  style={[styles.filterTab, ingredientFilter === 'all' && styles.filterTabActive]}
                  onPress={() => {
                    setIngredientFilter('all');
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterTabText, ingredientFilter === 'all' && styles.filterTabTextActive]}>
                    All ({ingredients.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterTab, ingredientFilter === 'beneficial' && styles.filterTabActive]}
                  onPress={() => {
                    setIngredientFilter('beneficial');
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterTabText, ingredientFilter === 'beneficial' && styles.filterTabTextActive]}>
                    Beneficial ({beneficialIngredients.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterTab, ingredientFilter === 'concerns' && styles.filterTabActive]}
                  onPress={() => {
                    setIngredientFilter('concerns');
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterTabText, ingredientFilter === 'concerns' && styles.filterTabTextActive]}>
                    Concerns ({concernIngredients.length + cautionIngredients.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Ingredients List */}
              <View style={styles.ingredientsList}>
                {filteredIngredientData.length === 0 ? (
                  <View style={styles.emptyFilterState}>
                    <Text style={styles.emptyFilterText}>
                      {ingredientFilter === 'beneficial' 
                        ? 'No beneficial ingredients found'
                        : 'No ingredients with concerns found'}
                    </Text>
                  </View>
                ) : (
                  filteredIngredientData.map((ing, index) => {
                    const isSelected = selectedIngredient === ing.name;
                    const education = getIngredientEducation(ing.name);
                    
                    return (
                      <View key={index}>
                        <TouchableOpacity
                          style={styles.ingredientItem}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedIngredient(isSelected ? null : ing.name);
                            if (Platform.OS !== 'web') {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                          }}
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
                          <ChevronRight 
                            color={palette.textMuted} 
                            size={16}
                            style={{
                              transform: [{ rotate: isSelected ? '90deg' : '0deg' }],
                            }}
                          />
                        </TouchableOpacity>
                        
                        {/* Expanded Ingredient Details */}
                        {isSelected && education && (
                          <Animated.View
                            style={[
                              styles.ingredientDetailCard,
                              {
                                opacity: fadeAnim,
                              },
                            ]}
                          >
                            <Text style={styles.ingredientDetailText}>
                              {education.detailedExplanation}
                            </Text>
                            
                            {education.benefits.length > 0 && (
                              <View style={styles.ingredientDetailSection}>
                                <View style={styles.ingredientDetailHeader}>
                                  <Sparkles color={palette.success} size={16} />
                                  <Text style={styles.ingredientDetailSectionTitle}>BENEFITS</Text>
                                </View>
                                <View style={styles.ingredientTags}>
                                  {education.benefits.map((benefit, i) => (
                                    <View key={i} style={styles.ingredientTag}>
                                      <Text style={styles.ingredientTagText}>{benefit}</Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            )}
                            
                            {education.function.length > 0 && (
                              <View style={styles.ingredientDetailSection}>
                                <View style={styles.ingredientDetailHeader}>
                                  <Info color={palette.textSecondary} size={16} />
                                  <Text style={styles.ingredientDetailSectionTitle}>FUNCTION</Text>
                                </View>
                                <View style={styles.ingredientTags}>
                                  {education.function.map((func, i) => (
                                    <View key={i} style={[styles.ingredientTag, styles.ingredientTagNeutral]}>
                                      <Text style={[styles.ingredientTagText, styles.ingredientTagTextNeutral]}>
                                        {func}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            )}
                            
                            {education.safetyNotes && (
                              <View style={styles.ingredientSafetyNote}>
                                <AlertCircle color={palette.warning || '#F59E0B'} size={16} />
                                <Text style={styles.ingredientSafetyText}>{education.safetyNotes}</Text>
                              </View>
                            )}
                          </Animated.View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.tabContent}>
            {/* Personalized Match Score */}
            {personalizedMatch ? (
              <>
                <Animated.View 
                  style={[
                    styles.matchScoreSection,
                    {
                      opacity: matchScoreAnim,
                      transform: [
                        {
                          scale: matchScoreAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.matchScoreCircle}>
                    <LinearGradient
                      colors={
                        personalizedMatch.score >= 80 ? ['#10B981', '#059669'] :
                        personalizedMatch.score >= 60 ? ['#3B82F6', '#2563EB'] :
                        personalizedMatch.score >= 40 ? ['#F59E0B', '#D97706'] :
                        ['#EF4444', '#DC2626']
                      }
                      style={styles.matchScoreGradient}
                    >
                      <Animated.Text 
                        style={[
                          styles.matchScoreNumber,
                          {
                            transform: [
                              {
                                scale: matchScoreAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.5, 1],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        {personalizedMatch.score}%
                      </Animated.Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.matchScoreLabel}>YOUR SKIN MATCH</Text>
                  <Text style={styles.matchScoreSubtext}>
                    Based on your {currentResult?.skinType || 'skin'} analysis
                  </Text>
                </Animated.View>

                {/* Personalized Match Summary */}
                <View style={styles.matchSummary}>
                  <View style={[
                    styles.matchSummaryCard,
                    personalizedMatch.score >= 80 && styles.matchSummaryCardExcellent,
                    personalizedMatch.score >= 60 && personalizedMatch.score < 80 && styles.matchSummaryCardGood,
                    personalizedMatch.score >= 40 && personalizedMatch.score < 60 && styles.matchSummaryCardModerate,
                    personalizedMatch.score < 40 && styles.matchSummaryCardPoor,
                  ]}>
                    <Info 
                      color={
                        personalizedMatch.score >= 80 ? palette.success :
                        personalizedMatch.score >= 60 ? palette.primary :
                        personalizedMatch.score >= 40 ? palette.warning || '#F59E0B' :
                        palette.error || '#EF4444'
                      } 
                      size={20} 
                    />
                    <View style={styles.matchSummaryText}>
                      <Text style={styles.matchSummaryTitle}>
                        {personalizedMatch.score >= 80 ? "Excellent match for your skin! ✨" :
                         personalizedMatch.score >= 60 ? "Good match for your skin" :
                         personalizedMatch.score >= 40 ? "Moderate match - use with caution" :
                         "Not ideal for your skin type"}
                      </Text>
                      <Text style={styles.matchSummaryDescription}>
                        {personalizedMatch.worksForConcerns.length > 0
                          ? `Contains ${personalizedMatch.worksForConcerns.join(', ')} which address your skin concerns.`
                          : analysis?.efficacy.reasoning || 'Review ingredients and warnings below.'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Works for Your Concerns */}
                {personalizedMatch.benefits.length > 0 && (
                  <View style={styles.benefitsSection}>
                    <Text style={styles.sectionTitle}>✅ Works for Your Skin</Text>
                    {personalizedMatch.benefits.map((benefit, index) => (
                      <View key={index} style={styles.benefitCard}>
                        <CheckCircle color={palette.success} size={18} />
                        <Text style={styles.benefitCardText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Personalized Warnings */}
                {personalizedMatch.warnings.length > 0 && (
                  <View style={styles.warningsSection}>
                    <Text style={styles.warningsTitle}>⚠️ Important for Your Skin Type</Text>
                    {personalizedMatch.warnings.map((warning, index) => (
                      <View key={index} style={styles.warningCard}>
                        <AlertCircle color={palette.warning || '#F59E0B'} size={18} />
                        <View style={styles.warningContent}>
                          <Text style={styles.warningTitle}>{warning}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <>
                {/* Fallback to generic match if no user analysis */}
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
                  {!currentResult && (
                    <Text style={styles.matchScoreSubtext}>
                      Complete a skin analysis for personalized match
                    </Text>
                  )}
                </View>

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
              </>
            )}

            {/* How It Affects Your Skin */}
            {analysis?.actives && analysis.actives.length > 0 && (
              <View style={styles.effectsSection}>
                <Text style={styles.effectsTitle}>
                  {personalizedMatch ? 'Active Ingredients & Your Skin' : 'How it affects your skin'}
                </Text>
                {analysis.actives.map((active, index) => {
                  // Check if this active addresses user's concerns
                  const addressesUserConcern = personalizedMatch?.worksForConcerns.includes(active.name) || false;
                  
                  return (
                    <View key={index} style={[
                      styles.effectCard,
                      addressesUserConcern && styles.effectCardHighlighted
                    ]}>
                      {addressesUserConcern ? (
                        <CheckCircle color={palette.success} size={20} fill={palette.success} />
                      ) : (
                        <CheckCircle color={palette.textMuted} size={20} />
                      )}
                      <View style={styles.effectContent}>
                        <Text style={styles.effectTitle}>
                          {active.name}
                          {addressesUserConcern && (
                            <Text style={styles.effectBadge}> • Works for you</Text>
                          )}
                        </Text>
                        <Text style={styles.effectDescription}>
                          Addresses: {active.conditions.map(c => c.toLowerCase()).join(', ')}
                        </Text>
                        <Text style={styles.effectIngredients}>
                          Efficacy: {active.effectiveness} • {active.efficacy.proven ? 'Proven ingredient' : 'Limited evidence'}
                        </Text>
                      </View>
                      <ChevronRight color={palette.textMuted} size={18} />
                    </View>
                  );
                })}
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
        <Animated.View
          style={[
            styles.buyButtonContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.buyButton}
            onPress={() => {
              // Animate button press
              Animated.sequence([
                Animated.timing(scaleAnim, {
                  toValue: 0.95,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                  toValue: 1,
                  tension: 300,
                  friction: 10,
                  useNativeDriver: true,
                }),
              ]).start();

              // Open Amazon affiliate link directly - no prompts, no delays
              const affiliateUrl = product.tiers?.medium?.affiliateUrl || product.affiliateUrl;
              
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
              } else {
                // Fallback if no affiliate URL
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
        </Animated.View>
      </ScrollView>
      </Animated.View>
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
  scrollContainer: {
    flex: 1,
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: palette.success,
    borderColor: palette.success,
    ...shadow.soft,
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
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    marginBottom: 12,
    ...shadow.elevated,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  matchScoreGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchScoreNumber: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  matchScoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  matchScoreSubtext: {
    fontSize: 11,
    color: palette.textMuted,
    marginTop: 4,
    textAlign: 'center',
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
  matchSummaryCardExcellent: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  matchSummaryCardGood: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  matchSummaryCardModerate: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  matchSummaryCardPoor: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
  effectCardHighlighted: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 2,
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
  effectBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.success,
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
  effectBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.success,
  },
  productImpactCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  productImpactText: {
    fontSize: 14,
    lineHeight: 22,
    color: palette.textPrimary,
    fontWeight: '500',
  },
  ingredientDetailCard: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  ingredientDetailText: {
    fontSize: 14,
    lineHeight: 22,
    color: palette.textPrimary,
    marginBottom: 16,
  },
  ingredientDetailSection: {
    marginTop: 16,
  },
  ingredientDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  ingredientDetailSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ingredientTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  ingredientTagNeutral: {
    backgroundColor: palette.surfaceAlt,
    borderColor: palette.border,
  },
  ingredientTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.success,
  },
  ingredientTagTextNeutral: {
    color: palette.textPrimary,
  },
  ingredientSafetyNote: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  ingredientSafetyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: palette.textPrimary,
    fontWeight: '500',
  },
  activeDetailCard: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  activeDetailText: {
    fontSize: 14,
    lineHeight: 22,
    color: palette.textPrimary,
    marginBottom: 12,
  },
  activeDetailSection: {
    marginTop: 12,
  },
  activeDetailSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  activeDetailSectionText: {
    fontSize: 13,
    lineHeight: 20,
    color: palette.textSecondary,
  },
  activeSafetyNote: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  activeSafetyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: palette.textPrimary,
    fontWeight: '500',
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
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    ...shadow.soft,
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
  buyButtonContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  buyButton: {
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

