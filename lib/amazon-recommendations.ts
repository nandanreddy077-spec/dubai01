/**
 * AI-Powered Amazon Product Recommendations
 * Uses user's skin analysis, preferences, and location to recommend specific products
 */

import { AnalysisResult } from '@/contexts/AnalysisContext';
import { LocationInfo } from './location';

export interface ProductRecommendation {
  name: string;
  brand: string;
  category: string;
  description: string;
  whyRecommended: string;
  keyIngredients: string[];
  benefits: string[];
  bestFor: string[];
  priceRange: string;
  searchQuery: string;
  amazonSearchUrl: string;
  matchScore: number;
  priority: 'essential' | 'recommended' | 'optional';
}

export interface RecommendationSet {
  skinType: string;
  mainConcerns: string[];
  recommendations: ProductRecommendation[];
  routineOrder: string[];
  tips: string[];
  budgetOptions: {
    luxury: ProductRecommendation[];
    midRange: ProductRecommendation[];
    budget: ProductRecommendation[];
  };
}

/**
 * Generate AI-powered product recommendations based on skin analysis
 */
export async function generateProductRecommendations(
  analysisResult: AnalysisResult,
  location: LocationInfo,
  affiliateTag: string
): Promise<RecommendationSet> {
  // Build comprehensive analysis context
  const context = buildAnalysisContext(analysisResult);
  
  try {
    // Try AI-powered recommendations first
    const aiRecommendations = await getAIRecommendations(context, location, affiliateTag);
    if (aiRecommendations) {
      return aiRecommendations;
    }
  } catch (error) {
    console.warn('AI recommendations failed, using rule-based system:', error);
  }
  
  // Fallback to intelligent rule-based system
  return getRuleBasedRecommendations(analysisResult, location, affiliateTag);
}

/**
 * Build detailed context from analysis for AI
 */
function buildAnalysisContext(analysis: AnalysisResult): string {
  const concerns = analysis.dermatologyInsights?.skinConcerns || [];
  const scores = analysis.detailedScores;
  
  return `
SKIN PROFILE:
- Skin Type: ${analysis.skinType}
- Overall Score: ${analysis.overallScore}/100
- Skin Tone: ${analysis.skinTone || 'Not specified'}
- Skin Quality: ${analysis.skinQuality || 'Average'}

DETAILED METRICS:
- Hydration: ${scores.hydrationLevel}/100 ${scores.hydrationLevel < 60 ? '(NEEDS IMPROVEMENT)' : ''}
- Texture: ${scores.skinTexture}/100 ${scores.skinTexture < 60 ? '(NEEDS IMPROVEMENT)' : ''}
- Brightness: ${scores.brightnessGlow}/100 ${scores.brightnessGlow < 60 ? '(NEEDS IMPROVEMENT)' : ''}
- Pore Visibility: ${scores.poreVisibility}/100 ${scores.poreVisibility < 60 ? '(NEEDS IMPROVEMENT)' : ''}
- Elasticity: ${scores.elasticity}/100 ${scores.elasticity < 60 ? '(NEEDS IMPROVEMENT)' : ''}
- Evenness: ${scores.evenness}/100 ${scores.evenness < 60 ? '(NEEDS IMPROVEMENT)' : ''}

SKIN CONCERNS: ${concerns.length > 0 ? concerns.join(', ') : 'None detected'}

AGING SIGNS: ${analysis.dermatologyInsights?.agingSigns?.join(', ') || 'None detected'}

ACNE RISK: ${analysis.dermatologyInsights?.acneRisk || 'Low'}
`;
}

/**
 * Get AI-powered recommendations using OpenAI
 */
async function getAIRecommendations(
  context: string,
  location: LocationInfo,
  affiliateTag: string
): Promise<RecommendationSet | null> {
  const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
    console.log('OpenAI API key not configured, using rule-based recommendations');
    return null;
  }

  const prompt = `You are a professional skincare advisor. Based on this skin analysis, recommend specific, real skincare products available on Amazon.

${context}

USER LOCATION: ${location.country} (${location.countryCode})

Provide a JSON response with this structure:
{
  "essentialProducts": [
    {
      "name": "Exact product name",
      "brand": "Brand name",
      "category": "cleanser/toner/serum/moisturizer/sunscreen/treatment/mask",
      "description": "What it does",
      "whyRecommended": "Why this specific product for THIS user",
      "keyIngredients": ["ingredient1", "ingredient2"],
      "benefits": ["benefit1", "benefit2"],
      "bestFor": ["concern1", "concern2"],
      "priceRange": "$X-$Y",
      "searchQuery": "exact Amazon search query",
      "matchScore": 95,
      "priority": "essential"
    }
  ],
  "recommendedProducts": [],
  "optionalProducts": [],
  "routineOrder": ["Morning: cleanser, serum, moisturizer, sunscreen", "Evening: cleanser, treatment, moisturizer"],
  "tips": ["Tip 1", "Tip 2"]
}

REQUIREMENTS:
1. Recommend REAL products that exist on Amazon
2. Match products to user's skin type and concerns
3. Include products from budget to luxury price ranges
4. Prioritize effectiveness over brand names
5. Consider user's location for product availability
6. Be specific with brand names and product lines
7. Include Korean, Japanese, American, and European brands
8. Match search queries to actual Amazon listings

Focus on:
- Cleanser (essential)
- Treatment serum/essence for main concerns (essential)
- Moisturizer for skin type (essential)  
- Sunscreen SPF 30+ (essential)
- Targeted treatments for specific concerns (recommended)
- Weekly treatments/masks (optional)

Return ONLY valid JSON, no markdown.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional skincare advisor with deep knowledge of products available on Amazon. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const aiData = JSON.parse(jsonMatch[0]);
    
    // Convert to RecommendationSet format
    const allProducts = [
      ...(aiData.essentialProducts || []),
      ...(aiData.recommendedProducts || []),
      ...(aiData.optionalProducts || []),
    ];

    // Add Amazon URLs
    const productsWithUrls = allProducts.map(product => ({
      ...product,
      amazonSearchUrl: formatAmazonUrl(product.searchQuery, location.amazonDomain, affiliateTag),
    }));

    // Categorize by price
    const budgetOptions = categorizByPrice(productsWithUrls);

    return {
      skinType: context.match(/Skin Type: ([^\n]+)/)?.[1] || 'combination',
      mainConcerns: context.match(/SKIN CONCERNS: ([^\n]+)/)?.[1]?.split(', ') || [],
      recommendations: productsWithUrls,
      routineOrder: aiData.routineOrder || [],
      tips: aiData.tips || [],
      budgetOptions,
    };
  } catch (error) {
    console.error('AI recommendations error:', error);
    return null;
  }
}

/**
 * Intelligent rule-based recommendation system
 */
function getRuleBasedRecommendations(
  analysis: AnalysisResult,
  location: LocationInfo,
  affiliateTag: string
): RecommendationSet {
  const skinType = analysis.skinType || 'combination';
  const concerns = analysis.dermatologyInsights?.skinConcerns || [];
  const scores = analysis.detailedScores;
  
  const recommendations: ProductRecommendation[] = [];
  
  // ESSENTIAL 1: Cleanser based on skin type
  const cleanserRec = getCleanserRecommendation(skinType, location, affiliateTag);
  recommendations.push(cleanserRec);
  
  // ESSENTIAL 2: Targeted serum for biggest concern
  if (scores.hydrationLevel < 60) {
    recommendations.push(getHydrationSerum(skinType, location, affiliateTag));
  } else if (concerns.includes('Fine lines') || concerns.includes('Aging')) {
    recommendations.push(getAntiAgingSerum(skinType, location, affiliateTag));
  } else if (concerns.includes('Acne') || scores.poreVisibility < 60) {
    recommendations.push(getAcneSerum(skinType, location, affiliateTag));
  } else if (scores.brightnessGlow < 60) {
    recommendations.push(getBrighteningSerum(skinType, location, affiliateTag));
  }
  
  // ESSENTIAL 3: Moisturizer
  recommendations.push(getMoisturizerRecommendation(skinType, location, affiliateTag));
  
  // ESSENTIAL 4: Sunscreen
  recommendations.push(getSunscreenRecommendation(skinType, location, affiliateTag));
  
  // RECOMMENDED: Additional treatments
  if (concerns.includes('Dark spots') || scores.evenness < 60) {
    recommendations.push(getDarkSpotTreatment(skinType, location, affiliateTag));
  }
  
  if (scores.skinTexture < 60) {
    recommendations.push(getExfoliant(skinType, location, affiliateTag));
  }
  
  // OPTIONAL: Weekly treatments
  if (concerns.length > 2) {
    recommendations.push(getWeeklyMask(skinType, concerns, location, affiliateTag));
  }
  
  const budgetOptions = categorizByPrice(recommendations);
  
  return {
    skinType,
    mainConcerns: concerns,
    recommendations,
    routineOrder: [
      'Morning: Cleanser → Serum → Moisturizer → Sunscreen',
      'Evening: Cleanser → Treatment → Serum → Moisturizer',
    ],
    tips: [
      'Introduce new products one at a time (1-2 weeks apart) to monitor reactions',
      'Always patch test new products on your inner arm before facial application',
      'Consistency is key - give products 4-6 weeks to show results',
      'Sunscreen is non-negotiable, even on cloudy days',
    ],
    budgetOptions,
  };
}

// Product recommendation helpers
function getCleanserRecommendation(skinType: string, location: LocationInfo, tag: string): ProductRecommendation {
  const cleansers: Record<string, any> = {
    oily: {
      name: 'Salicylic Acid Cleanser',
      brand: 'CeraVe or La Roche-Posay',
      searchQuery: 'CeraVe salicylic acid cleanser oily skin',
      keyIngredients: ['Salicylic Acid', 'Niacinamide', 'Ceramides'],
      benefits: ['Controls oil', 'Unclogs pores', 'Prevents breakouts'],
    },
    dry: {
      name: 'Hydrating Cleanser',
      brand: 'CeraVe or Cetaphil',
      searchQuery: 'CeraVe hydrating cleanser dry skin',
      keyIngredients: ['Hyaluronic Acid', 'Ceramides', 'Glycerin'],
      benefits: ['Deeply hydrates', 'Gentle cleansing', 'Maintains moisture barrier'],
    },
    combination: {
      name: 'Gentle Foaming Cleanser',
      brand: 'CeraVe or Neutrogena',
      searchQuery: 'CeraVe foaming cleanser combination skin',
      keyIngredients: ['Niacinamide', 'Ceramides', 'Hyaluronic Acid'],
      benefits: ['Balances skin', 'Gentle formula', 'Removes excess oil'],
    },
    sensitive: {
      name: 'Ultra Gentle Cleanser',
      brand: 'Vanicream or La Roche-Posay',
      searchQuery: 'Vanicream gentle cleanser sensitive skin',
      keyIngredients: ['Free of fragrance', 'Minimal ingredients', 'pH balanced'],
      benefits: ['No irritation', 'Soothes skin', 'Dermatologist recommended'],
    },
  };
  
  const rec = cleansers[skinType] || cleansers.combination;
  
  return {
    ...rec,
    category: 'cleanser',
    description: 'Daily facial cleanser designed for your skin type',
    whyRecommended: `Perfect for ${skinType} skin - gently cleanses without stripping natural oils`,
    bestFor: [skinType + ' skin', 'Daily use', 'Gentle cleansing'],
    priceRange: '$8-$15',
    amazonSearchUrl: formatAmazonUrl(rec.searchQuery, location.amazonDomain, tag),
    matchScore: 95,
    priority: 'essential' as const,
  };
}

function getHydrationSerum(skinType: string, location: LocationInfo, tag: string): ProductRecommendation {
  return {
    name: 'Hyaluronic Acid Serum',
    brand: 'The Ordinary or Neutrogena',
    category: 'serum',
    description: 'Intense hydration booster that plumps and smooths skin',
    whyRecommended: 'Your hydration score needs a boost - this will make a visible difference in 3-5 days',
    keyIngredients: ['Hyaluronic Acid', 'Vitamin B5', 'Amino Acids'],
    benefits: ['Deep hydration', 'Plumps fine lines', 'Improves skin texture'],
    bestFor: ['Dehydrated skin', 'Fine lines', 'Dullness'],
    priceRange: '$7-$12',
    searchQuery: 'The Ordinary hyaluronic acid serum',
    amazonSearchUrl: formatAmazonUrl('The Ordinary hyaluronic acid serum', location.amazonDomain, tag),
    matchScore: 98,
    priority: 'essential' as const,
  };
}

function getAntiAgingSerum(skinType: string, location: LocationInfo, tag: string): ProductRecommendation {
  return {
    name: 'Retinol Serum',
    brand: 'RoC or Neutrogena',
    category: 'serum',
    description: 'Clinically proven to reduce fine lines and improve skin texture',
    whyRecommended: 'Targets aging signs detected in your analysis - start with low strength and build tolerance',
    keyIngredients: ['Retinol', 'Vitamin E', 'Hyaluronic Acid'],
    benefits: ['Reduces fine lines', 'Improves texture', 'Boosts collagen'],
    bestFor: ['Anti-aging', 'Fine lines', 'Uneven texture'],
    priceRange: '$15-$25',
    searchQuery: 'RoC retinol serum anti-aging',
    amazonSearchUrl: formatAmazonUrl('RoC retinol serum anti-aging', location.amazonDomain, tag),
    matchScore: 95,
    priority: 'essential' as const,
  };
}

function getAcneSerum(skinType: string, location: LocationInfo, tag: string): ProductRecommendation {
  return {
    name: 'Niacinamide + Zinc Serum',
    brand: 'The Ordinary or Paula\'s Choice',
    category: 'serum',
    description: 'Controls oil production and minimizes pores',
    whyRecommended: 'Your pore visibility and acne risk indicate this will be highly effective',
    keyIngredients: ['Niacinamide 10%', 'Zinc', 'Vitamin B3'],
    benefits: ['Reduces breakouts', 'Minimizes pores', 'Controls oil'],
    bestFor: ['Acne-prone skin', 'Large pores', 'Oily skin'],
    priceRange: '$6-$12',
    searchQuery: 'The Ordinary niacinamide zinc serum',
    amazonSearchUrl: formatAmazonUrl('The Ordinary niacinamide zinc serum', location.amazonDomain, tag),
    matchScore: 97,
    priority: 'essential' as const,
  };
}

function getBrighteningSerum(skinType: string, location: LocationInfo, tag: string): ProductRecommendation {
  return {
    name: 'Vitamin C Serum',
    brand: 'TruSkin or Mad Hippie',
    category: 'serum',
    description: 'Brightens skin and evens tone with powerful antioxidants',
    whyRecommended: 'Will significantly boost your brightness score - visible results in 2-3 weeks',
    keyIngredients: ['Vitamin C', 'Ferulic Acid', 'Vitamin E'],
    benefits: ['Brightens skin', 'Fades dark spots', 'Antioxidant protection'],
    bestFor: ['Dull skin', 'Dark spots', 'Uneven tone'],
    priceRange: '$15-$20',
    searchQuery: 'TruSkin vitamin C serum brightening',
    amazonSearchUrl: formatAmazonUrl('TruSkin vitamin C serum brightening', location.amazonDomain, tag),
    matchScore: 94,
    priority: 'essential' as const,
  };
}

function getMoisturizerRecommendation(skinType: string, location: LocationInfo, tag: string): ProductRecommendation {
  const moisturizers: Record<string, any> = {
    oily: {
      name: 'Lightweight Gel Moisturizer',
      brand: 'Neutrogena Hydro Boost',
      searchQuery: 'Neutrogena Hydro Boost gel moisturizer oily skin',
      description: 'Oil-free gel that hydrates without heaviness',
    },
    dry: {
      name: 'Rich Moisturizing Cream',
      brand: 'CeraVe or Cetaphil',
      searchQuery: 'CeraVe moisturizing cream dry skin',
      description: 'Rich, nourishing cream for lasting hydration',
    },
    combination: {
      name: 'Balancing Moisturizer',
      brand: 'CeraVe PM or Cetaphil',
      searchQuery: 'CeraVe PM moisturizer combination skin',
      description: 'Lightweight yet nourishing, perfect for combination skin',
    },
    sensitive: {
      name: 'Soothing Moisturizer',
      brand: 'Vanicream or Aveeno',
      searchQuery: 'Vanicream daily moisturizer sensitive skin',
      description: 'Fragrance-free, gentle formula that soothes and protects',
    },
  };
  
  const rec = moisturizers[skinType] || moisturizers.combination;
  
  return {
    ...rec,
    category: 'moisturizer',
    whyRecommended: `Formulated specifically for ${skinType} skin - seals in hydration and strengthens skin barrier`,
    keyIngredients: ['Ceramides', 'Niacinamide', 'Hyaluronic Acid'],
    benefits: ['Locks in moisture', 'Repairs barrier', 'Non-comedogenic'],
    bestFor: [skinType + ' skin', 'Daily hydration', 'Barrier repair'],
    priceRange: '$10-$18',
    amazonSearchUrl: formatAmazonUrl(rec.searchQuery, location.amazonDomain, tag),
    matchScore: 96,
    priority: 'essential' as const,
  };
}

function getSunscreenRecommendation(skinType: string, location: LocationInfo, tag: string): ProductRecommendation {
  return {
    name: 'Broad Spectrum SPF 50+',
    brand: 'La Roche-Posay or EltaMD',
    category: 'sunscreen',
    description: 'Lightweight, non-greasy sunscreen for daily protection',
    whyRecommended: 'Essential for preventing premature aging and protecting your skin improvements',
    keyIngredients: ['Zinc Oxide', 'Titanium Dioxide', 'Antioxidants'],
    benefits: ['Prevents sun damage', 'Anti-aging', 'Non-comedogenic'],
    bestFor: ['All skin types', 'Daily use', 'Under makeup'],
    priceRange: '$15-$35',
    searchQuery: 'La Roche Posay Anthelios sunscreen SPF 50',
    amazonSearchUrl: formatAmazonUrl('La Roche Posay Anthelios sunscreen SPF 50', location.amazonDomain, tag),
    matchScore: 100,
    priority: 'essential' as const,
  };
}

function getDarkSpotTreatment(skinType: string, location: LocationInfo, tag: string): ProductRecommendation {
  return {
    name: 'Dark Spot Corrector',
    brand: 'Murad or Paula\'s Choice',
    category: 'treatment',
    description: 'Targeted treatment for hyperpigmentation and dark spots',
    whyRecommended: 'Your evenness score suggests dark spots - this will help fade them in 4-6 weeks',
    keyIngredients: ['Vitamin C', 'Niacinamide', 'Kojic Acid'],
    benefits: ['Fades dark spots', 'Evens skin tone', 'Brightens'],
    bestFor: ['Dark spots', 'Hyperpigmentation', 'Uneven tone'],
    priceRange: '$20-$40',
    searchQuery: 'Murad dark spot corrector vitamin C',
    amazonSearchUrl: formatAmazonUrl('Murad dark spot corrector vitamin C', location.amazonDomain, tag),
    matchScore: 92,
    priority: 'recommended' as const,
  };
}

function getExfoliant(skinType: string, location: LocationInfo, tag: string): ProductRecommendation {
  return {
    name: 'AHA/BHA Exfoliating Toner',
    brand: 'Paula\'s Choice or COSRX',
    category: 'treatment',
    description: 'Gentle chemical exfoliant for smoother, brighter skin',
    whyRecommended: 'Will dramatically improve your texture score - use 2-3x per week',
    keyIngredients: ['Glycolic Acid', 'Salicylic Acid', 'Willow Bark'],
    benefits: ['Smooths texture', 'Unclogs pores', 'Brightens'],
    bestFor: ['Rough texture', 'Dull skin', 'Clogged pores'],
    priceRange: '$15-$30',
    searchQuery: 'Paula\'s Choice AHA BHA exfoliating toner',
    amazonSearchUrl: formatAmazonUrl('Paula\'s Choice AHA BHA exfoliating toner', location.amazonDomain, tag),
    matchScore: 90,
    priority: 'recommended' as const,
  };
}

function getWeeklyMask(skinType: string, concerns: string[], location: LocationInfo, tag: string): ProductRecommendation {
  return {
    name: 'Hydrating Sheet Mask Pack',
    brand: 'Mediheal or Tony Moly',
    category: 'mask',
    description: 'Weekly boost of hydration and nourishment',
    whyRecommended: 'Perfect for weekly skin pampering - addresses multiple concerns at once',
    keyIngredients: ['Hyaluronic Acid', 'Peptides', 'Botanical Extracts'],
    benefits: ['Intense hydration', 'Instant glow', 'Calms skin'],
    bestFor: ['Weekly treatment', 'All skin types', 'Quick boost'],
    priceRange: '$12-$20',
    searchQuery: 'Mediheal hydrating sheet mask pack',
    amazonSearchUrl: formatAmazonUrl('Mediheal hydrating sheet mask pack', location.amazonDomain, tag),
    matchScore: 85,
    priority: 'optional' as const,
  };
}

// Helper functions
function formatAmazonUrl(searchQuery: string, domain: string, tag: string): string {
  const encodedQuery = encodeURIComponent(searchQuery);
  return `https://www.${domain}/s?k=${encodedQuery}&tag=${tag}&linkCode=ll2&ref=as_li_ss_tl`;
}

function categorizByPrice(products: ProductRecommendation[]): {
  luxury: ProductRecommendation[];
  midRange: ProductRecommendation[];
  budget: ProductRecommendation[];
} {
  return {
    luxury: products.filter(p => p.priceRange.includes('$30') || p.priceRange.includes('$40') || p.priceRange.includes('$50')),
    midRange: products.filter(p => (p.priceRange.includes('$15') || p.priceRange.includes('$20') || p.priceRange.includes('$25')) && !p.priceRange.includes('$30')),
    budget: products.filter(p => p.priceRange.includes('$6') || p.priceRange.includes('$7') || p.priceRange.includes('$8') || p.priceRange.includes('$10') || p.priceRange.includes('$12')),
  };
}
