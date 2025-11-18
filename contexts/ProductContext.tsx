import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Product, ProductUsageEntry, ProductRoutine, ProductRecommendation, ProductTier } from '@/types/product';
import { useUser } from './UserContext';
import { getUserLocation, formatAmazonAffiliateLink, getLocalizedPrice, type LocationInfo } from '@/lib/location';
import { useAnalysis, AnalysisResult } from './AnalysisContext';
import { useSkincare } from './SkincareContext';

interface ProductContextType {
  products: Product[];
  usageHistory: ProductUsageEntry[];
  routines: ProductRoutine[];
  recommendations: ProductRecommendation[];
  userLocation: LocationInfo | null;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  logUsage: (productId: string, entry: Omit<ProductUsageEntry, 'id' | 'productId' | 'timestamp'>) => Promise<void>;
  getProductUsage: (productId: string) => ProductUsageEntry[];
  createRoutine: (routine: Omit<ProductRoutine, 'id' | 'createdAt'>) => Promise<ProductRoutine>;
  updateRoutine: (id: string, updates: Partial<ProductRoutine>) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  getActiveRoutines: () => ProductRoutine[];
  generateRecommendations: (analysisResult?: AnalysisResult) => Promise<void>;
  trackAffiliateTap: (productId: string, url: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
}

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
  affiliateUrl: formatAmazonAffiliateLink('4r8xgWO', searchQuery, location),
  keywords: searchQuery.split(' '),
});

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
      const [productsData, usageData, routinesData, recsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS),
        AsyncStorage.getItem(STORAGE_KEYS.USAGE_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.ROUTINES),
        AsyncStorage.getItem(STORAGE_KEYS.RECOMMENDATIONS),
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

      if (recsData) {
        const parsed = JSON.parse(recsData);
        setRecommendations(Array.isArray(parsed) ? parsed : []);
      } else {
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
      const location = userLocation || await getUserLocation();
      
      const recommendations: ProductRecommendation[] = [];
      
      if (analysisResult) {
        const skinType = analysisResult.skinType || 'combination';
        const concerns = analysisResult.dermatologyInsights?.skinConcerns || [];
        
        const analysisRecommendations = [
          {
            name: 'Gentle Cleanser',
            description: 'Use a mild, pH-balanced cleanser designed for your skin type to remove impurities without stripping natural moisture.',
            category: 'cleansers',
            imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
            matchScore: 92,
          },
          {
            name: 'Hydrating Serum',
            description: 'Apply a hyaluronic acid serum to deeply hydrate and plump your skin, improving its overall texture and appearance.',
            category: 'serums',
            imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
            matchScore: 88,
          },
          {
            name: 'Daily Moisturizer',
            description: 'Lock in hydration with a lightweight moisturizer formulated for your skin type to maintain a healthy moisture barrier.',
            category: 'moisturizers',
            imageUrl: 'https://images.unsplash.com/photo-1556228841-7cfb04e5093e?w=400',
            matchScore: 90,
          },
          {
            name: 'SPF Sunscreen',
            description: 'Protect your skin with broad-spectrum SPF 30+ sunscreen daily to prevent premature aging and sun damage.',
            category: 'sunscreens',
            imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
            matchScore: 95,
          },
        ];

        if (concerns.includes('Fine lines') || concerns.includes('Aging')) {
          analysisRecommendations.push({
            name: 'Anti-Aging Night Cream',
            description: 'Target aging signs with retinol or peptides to improve skin elasticity and reduce fine lines while you sleep.',
            category: 'treatments',
            imageUrl: 'https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=400',
            matchScore: 87,
          });
        }

        analysisRecommendations.forEach((rec) => {
          const baseSearchQuery = `${rec.name.toLowerCase()} ${skinType.toLowerCase()} skin`;
          
          const recommendation: ProductRecommendation = {
            id: `analysis_${rec.name.toLowerCase().replace(/\s+/g, '_')}`,
            category: rec.category,
            stepName: rec.name,
            description: rec.description,
            imageUrl: rec.imageUrl,
            matchScore: rec.matchScore,
            source: 'analysis',
            tiers: {
              luxury: createProductTier(
                'Premium Choice',
                'Professional-grade formulation with advanced ingredients',
                `Top-tier products with clinically-proven results. Perfect for achieving maximum effectiveness.`,
                '$60-150+',
                `luxury ${baseSearchQuery} premium`,
                location
              ),
              medium: createProductTier(
                'Best Value',
                'High-quality products at accessible prices',
                `Excellent quality without the premium price tag. Scientifically-backed formulations that deliver results.`,
                '$20-60',
                `${baseSearchQuery} quality effective`,
                location
              ),
              budget: createProductTier(
                'Budget-Friendly',
                'Affordable options that work',
                `Effective products at wallet-friendly prices. Great for starting your skincare journey.`,
                '$5-20',
                `${baseSearchQuery} budget affordable`,
                location
              ),
            },
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

        uniqueSteps.forEach((stepData, stepName) => {
          const baseSearchQuery = `${stepName.toLowerCase().replace(/[^a-z ]/g, '')} ${skinType.toLowerCase()} skin`;
          
          const recommendation: ProductRecommendation = {
            id: `coach_${stepName.toLowerCase().replace(/\s+/g, '_')}`,
            category: stepData.category,
            stepName: stepName,
            description: stepData.description,
            source: 'glow-coach',
            matchScore: 90,
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
