import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Product, ProductUsageEntry, ProductRoutine, ProductRecommendation, ProductTier } from '@/types/product';
import { useUser } from './UserContext';
import { getUserLocation, formatAmazonAffiliateLink, type LocationInfo } from '@/lib/location';
import { useAnalysis, AnalysisResult } from './AnalysisContext';
import { useSkincare } from './SkincareContext';
import { analyzeProductIngredients } from '@/lib/ingredient-intelligence';
import { generatePersonalizedRecommendations, type PersonalizedProduct } from '@/lib/ai-product-recommendations';
import {
  findProductsWithIngredients,
  getProductsByCategory,
  calculateIngredientMatchScore,
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

function getRecommendedIngredients(
  category: string,
  skinType: string,
  concerns: string[]
): string[] {
  const baseIngredients: string[] = [];
  
  baseIngredients.push('Water', 'Glycerin');
  
  const lowerConcerns = concerns.map(c => c.toLowerCase());
  
  switch (category) {
    case 'cleansers':
      baseIngredients.push('Sodium Lauryl Sulfate', 'Cocamidopropyl Betaine');
      if (skinType === 'sensitive' || skinType === 'dry') {
        baseIngredients.push('Hyaluronic Acid', 'Ceramides');
      }
      break;
      
    case 'serums':
      if (lowerConcerns.some(c => c.includes('acne') || c.includes('breakout'))) {
        baseIngredients.push('Niacinamide', 'Salicylic Acid');
      }
      if (lowerConcerns.some(c => c.includes('fine lines') || c.includes('aging') || c.includes('wrinkle'))) {
        baseIngredients.push('Retinol', 'Peptides');
      }
      if (lowerConcerns.some(c => c.includes('hyperpigmentation') || c.includes('dark spot') || c.includes('uneven'))) {
        baseIngredients.push('Niacinamide', 'Vitamin C');
      }
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
      if (lowerConcerns.some(c => c.includes('acne') || c.includes('breakout'))) {
        baseIngredients.push('Salicylic Acid', 'Benzoyl Peroxide');
      }
      if (lowerConcerns.some(c => c.includes('fine lines') || c.includes('aging') || c.includes('wrinkle'))) {
        baseIngredients.push('Retinol', 'Peptides');
      }
      break;
      
    default:
      baseIngredients.push('Hyaluronic Acid');
  }
  
  return baseIngredients;
}

function findBestProductForCategory(
  category: 'cleansers' | 'toners' | 'serums' | 'moisturizers' | 'sunscreens' | 'treatments',
  skinType: string,
  concerns: string[],
  location: LocationInfo
): { product: GlobalProduct; matchScore: number } | null {
  const recommendedIngredients = getRecommendedIngredients(category, skinType, concerns);
  
  const matchingProducts = findProductsWithIngredients(
    recommendedIngredients,
    category,
    skinType,
    concerns
  ).filter(product => {
    if (location.countryCode) {
      return product.regionalAvailability.some(
        avail => avail.countryCode === location.countryCode && avail.available
      );
    }
    return true;
  });

  if (matchingProducts.length > 0) {
    console.log(`[Products] Found ${matchingProducts.length} strict matches for ${category}`);
    const best = matchingProducts.map(product => {
      const ingredientMatch = calculateIngredientMatchScore(product, recommendedIngredients);
      const productAnalysis = analyzeProductIngredients(product.name, product.ingredients);
      const score = Math.round(
        (ingredientMatch * 0.4) +
        (productAnalysis.analysis.efficacy.score * 0.4) +
        (productAnalysis.analysis.safety.score * 0.15) +
        ((productAnalysis.analysis.compatibility.compatible ? 100 : 70) * 0.05)
      );
      return { product, matchScore: score };
    }).sort((a, b) => b.matchScore - a.matchScore)[0];
    return best;
  }

  console.log(`[Products] No strict match for ${category}, trying skin type + country only...`);
  const skinTypeOnly = getProductsByCategory(category).filter(product => {
    const skinMatch = product.targetSkinTypes.includes(skinType.toLowerCase()) || product.targetSkinTypes.includes('all');
    if (!skinMatch) return false;
    if (location.countryCode) {
      return product.regionalAvailability.some(
        avail => avail.countryCode === location.countryCode && avail.available
      );
    }
    return true;
  });

  if (skinTypeOnly.length > 0) {
    console.log(`[Products] Found ${skinTypeOnly.length} skin-type matches for ${category}`);
    const product = skinTypeOnly[0];
    const productAnalysis = analyzeProductIngredients(product.name, product.ingredients);
    const score = Math.round(
      (productAnalysis.analysis.efficacy.score * 0.6) +
      (productAnalysis.analysis.safety.score * 0.3) +
      ((productAnalysis.analysis.compatibility.compatible ? 100 : 70) * 0.1)
    );
    return { product, matchScore: score };
  }

  console.log(`[Products] No skin-type match for ${category}, trying category only...`);
  const categoryOnly = getProductsByCategory(category).filter(product => {
    if (location.countryCode) {
      return product.regionalAvailability.some(
        avail => avail.countryCode === location.countryCode && avail.available
      );
    }
    return true;
  });

  if (categoryOnly.length > 0) {
    const product = categoryOnly[0];
    const productAnalysis = analyzeProductIngredients(product.name, product.ingredients);
    const score = Math.round(
      (productAnalysis.analysis.efficacy.score * 0.5) +
      (productAnalysis.analysis.safety.score * 0.3) +
      (60 * 0.2)
    );
    return { product, matchScore: score };
  }

  console.log(`[Products] No products at all for ${category} in ${location.countryCode}, trying any country...`);
  const anyCountry = getProductsByCategory(category);
  if (anyCountry.length > 0) {
    const product = anyCountry[0];
    const productAnalysis = analyzeProductIngredients(product.name, product.ingredients);
    const score = Math.round(
      (productAnalysis.analysis.efficacy.score * 0.5) +
      (productAnalysis.analysis.safety.score * 0.3) +
      (50 * 0.2)
    );
    return { product, matchScore: score };
  }

  return null;
}

export const [ProductProvider, useProducts] = createContextHook(() => {
  const [products, setProducts] = useState<Product[]>([]);
  const [usageHistory, setUsageHistory] = useState<ProductUsageEntry[]>([]);
  const [routines, setRoutines] = useState<ProductRoutine[]>([]);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [userLocation, setUserLocation] = useState<LocationInfo | null>(null);
  const [hasAnalysisOrPlan, setHasAnalysisOrPlan] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  
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
      console.log('[Products] User location loaded:', location);
    } catch (error) {
      console.error('[Products] Error loading user location:', error);
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

      const CURRENT_VERSION = '4';
      if (recsData && recsVersion === CURRENT_VERSION) {
        const parsed = JSON.parse(recsData);
        setRecommendations(Array.isArray(parsed) ? parsed : []);
      } else {
        console.log('[Products] Clearing old recommendations to regenerate');
        await AsyncStorage.removeItem(STORAGE_KEYS.RECOMMENDATIONS);
        await AsyncStorage.setItem('product_recommendations_version', CURRENT_VERSION);
        setRecommendations([]);
      }
    } catch (error) {
      console.error('[Products] Error loading product data:', error);
    }
  };

  const saveProducts = async (newProducts: Product[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
    } catch (error) {
      console.error('[Products] Error saving products:', error);
    }
  };

  const saveUsageHistory = async (history: ProductUsageEntry[]) => {
    try {
      const limited = history.slice(-100);
      await AsyncStorage.setItem(STORAGE_KEYS.USAGE_HISTORY, JSON.stringify(limited));
    } catch (error) {
      console.error('[Products] Error saving usage history:', error);
    }
  };

  const saveRoutines = async (newRoutines: ProductRoutine[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(newRoutines));
    } catch (error) {
      console.error('[Products] Error saving routines:', error);
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

    console.log('[Products] Product added:', newProduct.name);
    return newProduct;
  }, [products]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    const updatedProducts = products.map(p =>
      p.id === id ? { ...p, ...updates } : p
    );
    setProducts(updatedProducts);
    await saveProducts(updatedProducts);
    console.log('[Products] Product updated:', id);
  }, [products]);

  const deleteProduct = useCallback(async (id: string) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    await saveProducts(updatedProducts);
    console.log('[Products] Product deleted:', id);
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
    console.log('[Products] Usage logged for product:', productId);
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
    console.log('[Products] Routine created:', newRoutine.name);
    return newRoutine;
  }, [routines]);

  const updateRoutine = useCallback(async (id: string, updates: Partial<ProductRoutine>) => {
    const updatedRoutines = routines.map(r =>
      r.id === id ? { ...r, ...updates } : r
    );
    setRoutines(updatedRoutines);
    await saveRoutines(updatedRoutines);
    console.log('[Products] Routine updated:', id);
  }, [routines]);

  const deleteRoutine = useCallback(async (id: string) => {
    const updatedRoutines = routines.filter(r => r.id !== id);
    setRoutines(updatedRoutines);
    await saveRoutines(updatedRoutines);
    console.log('[Products] Routine deleted:', id);
  }, [routines]);

  const getActiveRoutines = useCallback(() => {
    return routines.filter(r => r.isActive);
  }, [routines]);

  const buildRecommendationFromProduct = useCallback((
    globalProduct: GlobalProduct,
    location: LocationInfo,
    analysisResult: AnalysisResult | undefined,
    matchScore: number,
    source: 'analysis' | 'glow-coach',
    personalReason?: string,
    whyForYou?: string[],
    skinTypeMatch?: string,
    usageTip?: string,
    concernsAddressed?: string[],
  ): ProductRecommendation => {
    const actualIngredients = globalProduct.ingredients;
    const productAnalysis = analyzeProductIngredients(globalProduct.name, actualIngredients);

    const regionalAvailability = globalProduct.regionalAvailability.find(
      avail => avail.countryCode === location.countryCode && avail.available
    ) || globalProduct.regionalAvailability[0];

    const baseSearchQuery = `${globalProduct.brand} ${globalProduct.name}`;
    const primaryImage = globalProduct.images.find(img => img.type === 'primary')?.url || globalProduct.images[0]?.url || '';
    const skinType = analysisResult?.skinType || 'combination';
    const concerns = analysisResult?.dermatologyInsights?.skinConcerns || [];

    return {
      id: globalProduct.id,
      category: globalProduct.category,
      stepName: globalProduct.name,
      description: globalProduct.description,
      imageUrl: primaryImage,
      brand: globalProduct.brand,
      matchScore,
      source,
      ingredients: actualIngredients,
      personalReason: personalReason || `Selected for your ${skinType} skin based on ingredient analysis.`,
      whyForYou: whyForYou || [
        `Targets your ${concerns[0] || 'skin'} concerns`,
        `Key ingredients: ${globalProduct.keyIngredients?.slice(0, 2).join(', ') || 'Verified formula'}`,
        `Safe for ${skinType} skin type`,
      ],
      skinTypeMatch: skinTypeMatch || `Formulated for ${skinType} skin`,
      usageTip,
      concernsAddressed: concernsAddressed || concerns.slice(0, 3),
      price: regionalAvailability?.price || (globalProduct.priceRange ? `${globalProduct.priceRange.currency} ${globalProduct.priceRange.min}-${globalProduct.priceRange.max}` : undefined),
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
          'Top-tier products with clinically-proven results.',
          regionalAvailability?.price || (globalProduct.priceRange ? `${globalProduct.priceRange.currency} ${globalProduct.priceRange.min}-${globalProduct.priceRange.max}` : '$60-150+'),
          `${globalProduct.brand} ${globalProduct.name} premium`,
          location
        ),
        medium: createProductTier(
          'Best Value',
          'High-quality products at accessible prices',
          'Excellent quality without the premium price tag.',
          regionalAvailability?.price || (globalProduct.priceRange ? `${globalProduct.priceRange.currency} ${globalProduct.priceRange.min}-${globalProduct.priceRange.max}` : '$20-60'),
          `${globalProduct.brand} ${globalProduct.name}`,
          location
        ),
        budget: createProductTier(
          'Budget-Friendly',
          'Affordable options that work',
          'Effective products at wallet-friendly prices.',
          regionalAvailability?.price || (globalProduct.priceRange ? `${globalProduct.priceRange.currency} ${globalProduct.priceRange.min}-${globalProduct.priceRange.max}` : '$5-20'),
          `${globalProduct.brand} ${globalProduct.name} affordable`,
          location
        ),
      },
      affiliateUrl: regionalAvailability?.affiliateUrl || formatAmazonAffiliateLink(baseSearchQuery, location),
    };
  }, []);

  const generateRecommendations = useCallback(async (analysisResult?: AnalysisResult) => {
    console.log('[Products] Generating personalized recommendations...');
    setIsLoadingRecommendations(true);
    
    try {
      const defaultLocation: LocationInfo = {
        country: 'United States',
        countryCode: 'US',
        currency: 'USD',
        amazonDomain: 'amazon.com',
      };
      const location: LocationInfo = userLocation || await getUserLocation() || defaultLocation;
      
      const newRecommendations: ProductRecommendation[] = [];
      
      if (analysisResult) {
        let aiProducts: PersonalizedProduct[] = [];
        try {
          aiProducts = await generatePersonalizedRecommendations(analysisResult, location);
          console.log(`[Products] AI returned ${aiProducts.length} personalized products`);
        } catch (aiError) {
          console.warn('[Products] AI recommendations failed, using rule-based fallback:', aiError);
        }

        if (aiProducts.length >= 3) {
          aiProducts.forEach((pp) => {
            const rec = buildRecommendationFromProduct(
              pp.globalProduct,
              location,
              analysisResult,
              pp.matchScore,
              'analysis',
              pp.aiInsight.personalReason,
              pp.aiInsight.whyForYou,
              pp.aiInsight.skinTypeMatch,
              pp.aiInsight.usageTip,
              pp.aiInsight.concernsAddressed,
            );
            newRecommendations.push(rec);
          });
        } else {
          console.log('[Products] AI returned < 3 products, using robust rule-based fallback');
          const skinType = (analysisResult.skinType || 'combination').toLowerCase();
          const concerns = analysisResult.dermatologyInsights?.skinConcerns || [];
          
          const requiredCategories: Array<'cleansers' | 'toners' | 'serums' | 'moisturizers' | 'sunscreens' | 'treatments'> = ['cleansers', 'serums', 'moisturizers', 'sunscreens'];
          const lowerConcerns = concerns.map(c => c.toLowerCase());
          if (lowerConcerns.some(c => c.includes('fine lines') || c.includes('aging') || c.includes('wrinkle'))) {
            requiredCategories.push('treatments');
          }
          if (lowerConcerns.some(c => c.includes('acne') || c.includes('breakout'))) {
            requiredCategories.push('treatments');
          }

          const addedCategories = new Set<string>();

          if (aiProducts.length > 0) {
            aiProducts.forEach(pp => {
              const rec = buildRecommendationFromProduct(
                pp.globalProduct,
                location,
                analysisResult,
                pp.matchScore,
                'analysis',
                pp.aiInsight.personalReason,
                pp.aiInsight.whyForYou,
                pp.aiInsight.skinTypeMatch,
                pp.aiInsight.usageTip,
                pp.aiInsight.concernsAddressed,
              );
              newRecommendations.push(rec);
              addedCategories.add(pp.globalProduct.category);
            });
          }

          for (const category of requiredCategories) {
            if (addedCategories.has(category)) continue;
            
            const result = findBestProductForCategory(category, skinType, concerns, location);
            if (result) {
              const rec = buildRecommendationFromProduct(
                result.product,
                location,
                analysisResult,
                result.matchScore,
                'analysis',
              );
              newRecommendations.push(rec);
              addedCategories.add(category);
              console.log(`[Products] Added ${category}: ${result.product.brand} ${result.product.name} (score: ${result.matchScore})`);
            } else {
              console.warn(`[Products] Could not find any product for category: ${category}`);
            }
          }
        }
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
          
          const concerns = currentPlan.skinConcerns || [];
          const ingredients = getRecommendedIngredients(stepData.category, skinType, concerns);
          const productAnalysis = analyzeProductIngredients(stepName, ingredients);
          const efficacyScore = productAnalysis.analysis.efficacy.score;
          const safetyScore = productAnalysis.analysis.safety.score;
          const compatibilityScore = productAnalysis.analysis.compatibility.compatible ? 100 : 70;
          
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
            matchScore: calculatedMatchScore,
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
                'Professional-grade products with proven efficacy and superior textures.',
                '$60-150+',
                `luxury ${baseSearchQuery} premium high-end`,
                location
              ),
              medium: createProductTier(
                'Mid-Range Option',
                'Quality products that balance effectiveness and affordability',
                'Excellent results with scientifically-backed formulations at accessible prices.',
                '$20-60',
                `${baseSearchQuery} quality affordable effective`,
                location
              ),
              budget: createProductTier(
                'Budget-Friendly Option',
                'Affordable yet effective products',
                'Real results at wallet-friendly prices with proven active ingredients.',
                '$5-20',
                `${baseSearchQuery} budget affordable drugstore`,
                location
              ),
            },
          };
          
          newRecommendations.push(recommendation);
        });
      }
      
      console.log(`[Products] Generated ${newRecommendations.length} total recommendations`);
      setRecommendations(newRecommendations);
      await AsyncStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(newRecommendations));
      await AsyncStorage.setItem('product_recommendations_version', '4');
    } catch (error) {
      console.error('[Products] Error generating recommendations:', error);
      setRecommendations([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [userLocation, currentPlan, buildRecommendationFromProduct]);

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
      console.log('[Products] Affiliate tap tracked:', productId);
    } catch (error) {
      console.error('[Products] Error tracking affiliate tap:', error);
    }
  }, [user?.id]);

  const getProductByIdLocal = useCallback((id: string) => {
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
    isLoadingRecommendations,
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
    getProductById: getProductByIdLocal,
  }), [
    products,
    usageHistory,
    routines,
    filteredRecommendations,
    isLoadingRecommendations,
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
    getProductByIdLocal,
  ]);
});
