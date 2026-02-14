import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Product, ProductUsageEntry, ProductRoutine, ProductRecommendation, ProductTier } from '@/types/product';
import { useUser } from './UserContext';
import { getUserLocation, formatAmazonAffiliateLink, type LocationInfo } from '@/lib/location';
import { useAnalysis, AnalysisResult } from './AnalysisContext';
import { useSkincare } from './SkincareContext';
import { analyzeProductIngredients, findIngredient, type Ingredient } from '@/lib/ingredient-intelligence';
// Legacy support - keeping old imports for backward compatibility
import {
  REAL_PRODUCT_DATABASE,
  findProductsWithIngredients as findProductsWithIngredientsLegacy,
  findProductsByCategory as findProductsByCategoryLegacy,
  getProductById as getRealProductByIdLegacy,
  calculateIngredientMatchScore as calculateIngredientMatchScoreLegacy,
  type RealProduct,
} from '@/lib/product-database';

// New global product database
import {
  ALL_PRODUCTS,
  findProductsWithIngredients,
  getProductsByCategory,
  getProductById,
  calculateIngredientMatchScore,
  getProductsAvailableInCountry,
  type GlobalProduct,
} from '@/lib/products';



const STORAGE_KEYS = {
  PRODUCTS: 'product_tracking_products',
  USAGE_HISTORY: 'product_tracking_usage',
  ROUTINES: 'product_tracking_routines',
  RECOMMENDATIONS: 'product_recommendations',
  AFFILIATE_TAPS: 'product_affiliate_taps',
};

const createProductTier = (title: string, description: string, guidance: string, priceRange: string, searchQuery: string, location: LocationInfo): ProductTier => ({
  title,
  description,
  guidance,
  priceRange,
  affiliateUrl: formatAmazonAffiliateLink(searchQuery, location),
  keywords: searchQuery.split(' '),
});

/**
 * Generate ingredient list based on product category and skin concerns
 * Uses evidence-based ingredients that are proven to work
 */
function getRecommendedIngredients(
  category: string,
  skinType: string,
  concerns: string[]
): string[] {
  const baseIngredients: string[] = [];
  
  // Base ingredients for all products
  baseIngredients.push('Water', 'Glycerin');
  
  // Category-specific proven ingredients
  switch (category) {
    case 'cleansers':
      baseIngredients.push('Sodium Lauryl Sulfate', 'Cocamidopropyl Betaine');
      if (skinType === 'sensitive' || skinType === 'dry') {
        baseIngredients.push('Hyaluronic Acid', 'Ceramides');
      }
      break;
      
    case 'serums':
      // Add proven actives based on concerns
      if (concerns.includes('acne') || concerns.includes('Acne')) {
        baseIngredients.push('Niacinamide', 'Salicylic Acid');
      }
      if (concerns.includes('Fine lines') || concerns.includes('Aging') || concerns.includes('Wrinkles')) {
        baseIngredients.push('Retinol', 'Peptides');
      }
      if (concerns.includes('hyperpigmentation') || concerns.includes('Dark spots')) {
        baseIngredients.push('Niacinamide', 'Vitamin C');
      }
      // Always include hydration
      baseIngredients.push('Hyaluronic Acid');
      break;
      
    case 'moisturizers':
      baseIngredients.push('Ceramides', 'Hyaluronic Acid');
      if (skinType === 'dry') {
        baseIngredients.push('Squalane', 'Shea Butter');
      } else if (skinType === 'oily') {
        baseIngredients.push('Niacinamide');
      }
      break;
      
    case 'sunscreens':
      baseIngredients.push('Zinc Oxide', 'Titanium Dioxide');
      break;
      
    case 'treatments':
      if (concerns.includes('acne') || concerns.includes('Acne')) {
        baseIngredients.push('Salicylic Acid', 'Benzoyl Peroxide');
      }
      if (concerns.includes('Fine lines') || concerns.includes('Aging')) {
        baseIngredients.push('Retinol', 'Peptides');
      }
      break;
      
    default:
      baseIngredients.push('Hyaluronic Acid');
  }
  
  return baseIngredients;
}

export const [ProductProvider, useProducts] = createContextHook(() => {
  const [products, setProducts] = useState<Product[]>([]);
  const [usageHistory, setUsageHistory] = useState<ProductUsageEntry[]>([]);
  const [routines, setRoutines] = useState<ProductRoutine[]>([]);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [userLocation, setUserLocation] = useState<LocationInfo | null>(null);
  const [hasAnalysisOrPlan, setHasAnalysisOrPlan] = useState(false);
  
  const { user } = useUser();
  const { currentResult: analysisResult } = useAnalysis();
  const { currentPlan } = useSkincare();

  useEffect(() => {
    loadData();
    loadUserLocation();
  }, []);

  useEffect(() => {
    setHasAnalysisOrPlan(analysisResult !== null || currentPlan !== null);
  }, [analysisResult, currentPlan]);

  const loadUserLocation = async () => {
    try {
      const location = await getUserLocation();
      setUserLocation(location);
      console.log('✅ User location loaded:', location);
    } catch (error) {
      console.error('Error loading user location:', error);
    }
  };

  const loadData = async () => {
    try {
      const [productsData, usageData, routinesData, recsData, recsVersion] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS),
        AsyncStorage.getItem(STORAGE_KEYS.USAGE_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.ROUTINES),
        AsyncStorage.getItem(STORAGE_KEYS.RECOMMENDATIONS),
        AsyncStorage.getItem('product_recommendations_version'),
      ]);

      if (productsData) {
        const parsed = JSON.parse(productsData);
        setProducts(Array.isArray(parsed) ? parsed : []);
      }

      if (usageData) {
        const parsed = JSON.parse(usageData);
        setUsageHistory(Array.isArray(parsed) ? parsed : []);
      }

      if (routinesData) {
        const parsed = JSON.parse(routinesData);
        setRoutines(Array.isArray(parsed) ? parsed : []);
      }

      // Version 3: Added linkCode and ref params for proper affiliate tracking
      const CURRENT_VERSION = '3';
      if (recsData && recsVersion === CURRENT_VERSION) {
        const parsed = JSON.parse(recsData);
        setRecommendations(Array.isArray(parsed) ? parsed : []);
      } else {
        // Clear old recommendations to force regeneration with fixed URLs
        console.log('🔄 Clearing old recommendations to regenerate with proper affiliate tracking params');
        await AsyncStorage.removeItem(STORAGE_KEYS.RECOMMENDATIONS);
        await AsyncStorage.setItem('product_recommendations_version', CURRENT_VERSION);
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error loading product data:', error);
    }
  };

  const saveProducts = async (newProducts: Product[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
    } catch (error) {
      console.error('Error saving products:', error);
    }
  };

  const saveUsageHistory = async (history: ProductUsageEntry[]) => {
    try {
      const limited = history.slice(-100);
      await AsyncStorage.setItem(STORAGE_KEYS.USAGE_HISTORY, JSON.stringify(limited));
    } catch (error) {
      console.error('Error saving usage history:', error);
    }
  };

  const saveRoutines = async (newRoutines: ProductRoutine[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(newRoutines));
    } catch (error) {
      console.error('Error saving routines:', error);
    }
  };

  const addProduct = useCallback(async (product: Omit<Product, 'id'>): Promise<Product> => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    await saveProducts(updatedProducts);

    console.log('✅ Product added:', newProduct.name);
    return newProduct;
  }, [products]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    const updatedProducts = products.map(p =>
      p.id === id ? { ...p, ...updates } : p
    );
    setProducts(updatedProducts);
    await saveProducts(updatedProducts);
    console.log('✅ Product updated:', id);
  }, [products]);

  const deleteProduct = useCallback(async (id: string) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    await saveProducts(updatedProducts);
    console.log('🗑️ Product deleted:', id);
  }, [products]);

  const logUsage = useCallback(async (productId: string, entry: Omit<ProductUsageEntry, 'id' | 'productId' | 'timestamp'>) => {
    const newEntry: ProductUsageEntry = {
      ...entry,
      id: Date.now().toString(),
      productId,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [newEntry, ...usageHistory];
    setUsageHistory(updatedHistory);
    await saveUsageHistory(updatedHistory);
    console.log('📝 Usage logged for product:', productId);
  }, [usageHistory]);

  const getProductUsage = useCallback((productId: string) => {
    return usageHistory.filter(entry => entry.productId === productId);
  }, [usageHistory]);

  const createRoutine = useCallback(async (routine: Omit<ProductRoutine, 'id' | 'createdAt'>): Promise<ProductRoutine> => {
    const newRoutine: ProductRoutine = {
      ...routine,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updatedRoutines = [...routines, newRoutine];
    setRoutines(updatedRoutines);
    await saveRoutines(updatedRoutines);
    console.log('✅ Routine created:', newRoutine.name);
    return newRoutine;
  }, [routines]);

  const updateRoutine = useCallback(async (id: string, updates: Partial<ProductRoutine>) => {
    const updatedRoutines = routines.map(r =>
      r.id === id ? { ...r, ...updates } : r
    );
    setRoutines(updatedRoutines);
    await saveRoutines(updatedRoutines);
    console.log('✅ Routine updated:', id);
  }, [routines]);

  const deleteRoutine = useCallback(async (id: string) => {
    const updatedRoutines = routines.filter(r => r.id !== id);
    setRoutines(updatedRoutines);
    await saveRoutines(updatedRoutines);
    console.log('🗑️ Routine deleted:', id);
  }, [routines]);

  const getActiveRoutines = useCallback(() => {
    return routines.filter(r => r.isActive);
  }, [routines]);

  const generateRecommendations = useCallback(async (analysisResult?: AnalysisResult) => {
    console.log('🎯 Generating personalized recommendations...');
    
    try {
      // Get location with fallback to default US location
      const defaultLocation: LocationInfo = {
        country: 'United States',
        countryCode: 'US',
        currency: 'USD',
        amazonDomain: 'amazon.com',
      };
      const location: LocationInfo = userLocation || await getUserLocation() || defaultLocation;
      
      const recommendations: ProductRecommendation[] = [];
      
      if (analysisResult) {
        const skinType = analysisResult.skinType || 'combination';
        const concerns = analysisResult.dermatologyInsights?.skinConcerns || [];
        
        // Use GLOBAL PRODUCT DATABASE with verified ingredient lists
        const requiredCategories: Array<'cleansers' | 'toners' | 'serums' | 'moisturizers' | 'sunscreens' | 'treatments'> = ['cleansers', 'serums', 'moisturizers', 'sunscreens'];
        if (concerns.includes('Fine lines') || concerns.includes('Aging')) {
          requiredCategories.push('treatments');
        }

        const analysisRecommendations: Array<{
          name: string;
          brand: string;
          description: string;
          category: string;
          imageUrl: string;
          matchScore: number;
          globalProduct: GlobalProduct;
        }> = [];

        // For each required category, find the best matching global product
        requiredCategories.forEach(category => {
          // Get recommended ingredients for this category
          const recommendedIngredients = getRecommendedIngredients(category, skinType, concerns);
          
          // Find global products that match (check regional availability)
          const matchingProducts = findProductsWithIngredients(
            recommendedIngredients,
            category,
            skinType,
            concerns
          ).filter(product => {
            // Filter by regional availability if location is known
            if (location.countryCode) {
              return product.regionalAvailability.some(
                avail => avail.countryCode === location.countryCode && avail.available
              );
            }
            return true; // If no location, show all available products
          });

          if (matchingProducts.length > 0) {
            // Calculate match scores for each product
            const productsWithScores = matchingProducts.map(product => {
              const ingredientMatch = calculateIngredientMatchScore(product, recommendedIngredients);
              
              // Analyze the actual product ingredients
              const productAnalysis = analyzeProductIngredients(product.name, product.ingredients);
              const efficacyScore = productAnalysis.analysis.efficacy.score;
              const safetyScore = productAnalysis.analysis.safety.score;
              const compatibilityScore = productAnalysis.analysis.compatibility.compatible ? 100 : 70;
              
              // Weighted match score: 40% ingredient match, 40% efficacy, 15% safety, 5% compatibility
              const calculatedMatchScore = Math.round(
                (ingredientMatch * 0.4) +
                (efficacyScore * 0.4) +
                (safetyScore * 0.15) +
                (compatibilityScore * 0.05)
              );

              return {
                product,
                matchScore: calculatedMatchScore,
                ingredientMatch,
                productAnalysis,
              };
            });

            // Sort by match score and pick the best one
            productsWithScores.sort((a, b) => b.matchScore - a.matchScore);
            const bestMatch = productsWithScores[0];

            // Get primary image URL
            const primaryImage = bestMatch.product.images.find(img => img.type === 'primary')?.url || bestMatch.product.images[0]?.url || '';

            analysisRecommendations.push({
              name: bestMatch.product.name,
              brand: bestMatch.product.brand,
              description: bestMatch.product.description,
              category: bestMatch.product.category,
              imageUrl: primaryImage,
              matchScore: bestMatch.matchScore,
              globalProduct: bestMatch.product,
            });
          } else {
            // Fallback: find any product in this category for this skin type
            const fallbackProducts = getProductsByCategory(category).filter(product => {
              // Filter by skin type
              if (skinType && !product.targetSkinTypes.includes(skinType) && !product.targetSkinTypes.includes('all')) {
                return false;
              }
              // Filter by regional availability
              if (location.countryCode) {
                return product.regionalAvailability.some(
                  avail => avail.countryCode === location.countryCode && avail.available
                );
              }
              return true;
            });

            if (fallbackProducts.length > 0) {
              const fallbackProduct = fallbackProducts[0];
              const recommendedIngredients = getRecommendedIngredients(category, skinType, concerns);
              const productAnalysis = analyzeProductIngredients(fallbackProduct.name, fallbackProduct.ingredients);
              
              const efficacyScore = productAnalysis.analysis.efficacy.score;
              const safetyScore = productAnalysis.analysis.safety.score;
              const compatibilityScore = productAnalysis.analysis.compatibility.compatible ? 100 : 70;
              
              const matchScore = Math.round(
                (efficacyScore * 0.6) +
                (safetyScore * 0.3) +
                (compatibilityScore * 0.1)
              );

              const primaryImage = fallbackProduct.images.find(img => img.type === 'primary')?.url || fallbackProduct.images[0]?.url || '';

              analysisRecommendations.push({
                name: fallbackProduct.name,
                brand: fallbackProduct.brand,
                description: fallbackProduct.description,
                category: fallbackProduct.category,
                imageUrl: primaryImage,
                matchScore,
                globalProduct: fallbackProduct,
              });
            }
          }
        });

        analysisRecommendations.forEach((rec) => {
          // Use ACTUAL product ingredients from global product database
          const globalProduct = rec.globalProduct;
          const actualIngredients = globalProduct.ingredients;
          
          // Analyze ACTUAL product ingredients (not theoretical ones)
          const productAnalysis = analyzeProductIngredients(rec.name, actualIngredients);
          
          // Use the match score calculated from global product matching
          const calculatedMatchScore = rec.matchScore;
          
          // Get regional pricing and affiliate link
          const regionalAvailability = globalProduct.regionalAvailability.find(
            avail => avail.countryCode === location.countryCode && avail.available
          ) || globalProduct.regionalAvailability[0];
          
          const baseSearchQuery = `${rec.brand} ${rec.name}`;
          
          const recommendation: ProductRecommendation = {
            id: globalProduct.id,
            category: rec.category,
            stepName: rec.name,
            description: rec.description,
            imageUrl: rec.imageUrl,
            brand: rec.brand,
            matchScore: calculatedMatchScore, // Based on ACTUAL product ingredients
            source: 'analysis',
            ingredients: actualIngredients, // ACTUAL ingredient list from global product
            price: regionalAvailability?.price || globalProduct.priceRange ? `${globalProduct.priceRange.currency} ${globalProduct.priceRange.min}-${globalProduct.priceRange.max}` : undefined,
            analysis: {
              efficacy: productAnalysis.analysis.efficacy,
              safety: productAnalysis.analysis.safety,
              compatibility: productAnalysis.analysis.compatibility,
              actives: productAnalysis.analysis.actives.map(ing => ({
                name: ing.name,
                effectiveness: ing.efficacy.effectiveness,
                conditions: ing.efficacy.conditions,
              })),
            },
            tiers: {
              luxury: createProductTier(
                'Premium Choice',
                'Professional-grade formulation with advanced ingredients',
                `Top-tier products with clinically-proven results. Perfect for achieving maximum effectiveness.`,
                regionalAvailability?.price || (globalProduct.priceRange ? `${globalProduct.priceRange.currency} ${globalProduct.priceRange.min}-${globalProduct.priceRange.max}` : '$60-150+'),
                `${rec.brand} ${rec.name} premium`,
                location
              ),
              medium: createProductTier(
                'Best Value',
                'High-quality products at accessible prices',
                `Excellent quality without the premium price tag. Scientifically-backed formulations that deliver results.`,
                regionalAvailability?.price || (globalProduct.priceRange ? `${globalProduct.priceRange.currency} ${globalProduct.priceRange.min}-${globalProduct.priceRange.max}` : '$20-60'),
                `${rec.brand} ${rec.name}`,
                location
              ),
              budget: createProductTier(
                'Budget-Friendly',
                'Affordable options that work',
                `Effective products at wallet-friendly prices. Great for starting your skincare journey.`,
                regionalAvailability?.price || (globalProduct.priceRange ? `${globalProduct.priceRange.currency} ${globalProduct.priceRange.min}-${globalProduct.priceRange.max}` : '$5-20'),
                `${rec.brand} ${rec.name} affordable`,
                location
              ),
            },
            affiliateUrl: regionalAvailability?.affiliateUrl || formatAmazonAffiliateLink(baseSearchQuery, location),
          };
          
          recommendations.push(recommendation);
        });
      }
      
      if (currentPlan) {
        const skinType = currentPlan.skinType || 'combination';
        const currentWeek = currentPlan.weeklyPlans[Math.ceil((currentPlan.progress.currentDay || 1) / 7) - 1];
        
        const uniqueSteps = new Map<string, { name: string; description: string; category: string }>();
        
        if (currentWeek) {
          currentWeek.steps.forEach(step => {
            if (!uniqueSteps.has(step.name)) {
              uniqueSteps.set(step.name, {
                name: step.name,
                description: step.description,
                category: step.name.toLowerCase().includes('cleanser') ? 'cleansers' :
                          step.name.toLowerCase().includes('toner') ? 'toners' :
                          step.name.toLowerCase().includes('serum') ? 'serums' :
                          step.name.toLowerCase().includes('moisturizer') ? 'moisturizers' :
                          step.name.toLowerCase().includes('sunscreen') ? 'sunscreens' :
                          step.name.toLowerCase().includes('mask') ? 'masks' :
                          'treatments'
              });
            }
          });
        }

        // Map category to product images
        const categoryImages: Record<string, string> = {
          'cleansers': 'https://images.unsplash.com/photo-1556229010-aa9e36e4e0f9?w=800&h=600&fit=crop&q=80',
          'toners': 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800&h=600&fit=crop&q=80',
          'serums': 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=600&fit=crop&q=80',
          'moisturizers': 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=800&h=600&fit=crop&q=80',
          'sunscreens': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=600&fit=crop&q=80',
          'masks': 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&h=600&fit=crop&q=80',
          'treatments': 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800&h=600&fit=crop&q=80',
        };

        uniqueSteps.forEach((stepData, stepName) => {
          const baseSearchQuery = `${stepName.toLowerCase().replace(/[^a-z ]/g, '')} ${skinType.toLowerCase()} skin`;
          const imageUrl = categoryImages[stepData.category] || 'https://images.unsplash.com/photo-1556229010-aa9e36e4e0f9?w=800&h=600&fit=crop&q=80';
          
          // Get recommended ingredients for this product
          const concerns = currentPlan.skinConcerns || [];
          const ingredients = getRecommendedIngredients(stepData.category, skinType, concerns);
          
          // Analyze ingredients for accuracy
          const productAnalysis = analyzeProductIngredients(stepName, ingredients);
          
          // Calculate match score based on actual analysis
          const efficacyScore = productAnalysis.analysis.efficacy.score;
          const safetyScore = productAnalysis.analysis.safety.score;
          const compatibilityScore = productAnalysis.analysis.compatibility.compatible ? 100 : 70;
          
          // Weighted match score: 60% efficacy, 30% safety, 10% compatibility
          const calculatedMatchScore = Math.round(
            (efficacyScore * 0.6) +
            (safetyScore * 0.3) +
            (compatibilityScore * 0.1)
          );
          
          const recommendation: ProductRecommendation = {
            id: `coach_${stepName.toLowerCase().replace(/\s+/g, '_')}`,
            category: stepData.category,
            stepName: stepName,
            description: stepData.description,
            source: 'glow-coach',
            matchScore: calculatedMatchScore, // Now based on actual analysis
            imageUrl: imageUrl,
            ingredients: ingredients,
            analysis: {
              efficacy: productAnalysis.analysis.efficacy,
              safety: productAnalysis.analysis.safety,
              compatibility: productAnalysis.analysis.compatibility,
              actives: productAnalysis.analysis.actives.map(ing => ({
                name: ing.name,
                effectiveness: ing.efficacy.effectiveness,
                conditions: ing.efficacy.conditions,
              })),
            },
            tiers: {
              luxury: createProductTier(
                'Luxury Option',
                'Premium, high-end brands with advanced formulations',
                `Professional-grade products with proven efficacy and superior textures.`,
                '$60-150+',
                `luxury ${baseSearchQuery} premium high-end`,
                location
              ),
              medium: createProductTier(
                'Mid-Range Option',
                'Quality products that balance effectiveness and affordability',
                `Excellent results with scientifically-backed formulations at accessible prices.`,
                '$20-60',
                `${baseSearchQuery} quality affordable effective`,
                location
              ),
              budget: createProductTier(
                'Budget-Friendly Option',
                'Affordable yet effective products',
                `Real results at wallet-friendly prices with proven active ingredients.`,
                '$5-20',
                `${baseSearchQuery} budget affordable drugstore`,
                location
              ),
            },
          };
          
          recommendations.push(recommendation);
        });
      }
      
      console.log(`✅ Generated ${recommendations.length} recommendations`);
      setRecommendations(recommendations);
      await AsyncStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(recommendations));
      await AsyncStorage.setItem('product_recommendations_version', '3');
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setRecommendations([]);
    }
  }, [userLocation, currentPlan]);

  const trackAffiliateTap = useCallback(async (productId: string, url: string) => {
    try {
      const taps = await AsyncStorage.getItem(STORAGE_KEYS.AFFILIATE_TAPS);
      const tapsData = taps ? JSON.parse(taps) : [];
      
      const newTap = {
        productId,
        url,
        timestamp: new Date().toISOString(),
        userId: user?.id,
      };
      
      tapsData.push(newTap);
      await AsyncStorage.setItem(STORAGE_KEYS.AFFILIATE_TAPS, JSON.stringify(tapsData));
      console.log('💰 Affiliate tap tracked:', productId);
    } catch (error) {
      console.error('Error tracking affiliate tap:', error);
    }
  }, [user?.id]);

  const getProductById = useCallback((id: string) => {
    return products.find(p => p.id === id);
  }, [products]);

  const filteredRecommendations = useMemo(() => {
    if (!hasAnalysisOrPlan) {
      return [];
    }
    return recommendations;
  }, [hasAnalysisOrPlan, recommendations]);

  return useMemo(() => ({
    products,
    usageHistory,
    routines,
    recommendations: filteredRecommendations,
    userLocation,
    addProduct,
    updateProduct,
    deleteProduct,
    logUsage,
    getProductUsage,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    getActiveRoutines,
    generateRecommendations,
    trackAffiliateTap,
    getProductById,
  }), [
    products,
    usageHistory,
    routines,
    filteredRecommendations,
    userLocation,
    addProduct,
    updateProduct,
    deleteProduct,
    logUsage,
    getProductUsage,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    getActiveRoutines,
    generateRecommendations,
    trackAffiliateTap,
    getProductById,
  ]);
});
