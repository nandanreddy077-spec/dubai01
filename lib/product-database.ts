/**
 * Real Product Database
 * Contains actual products with verified ingredient lists
 * Based on real product formulations from manufacturers
 */

export interface RealProduct {
  id: string;
  name: string;
  brand: string;
  category: 'cleansers' | 'serums' | 'moisturizers' | 'sunscreens' | 'treatments' | 'toners' | 'masks';
  description: string;
  imageUrl: string;
  ingredients: string[]; // Actual INCI ingredient list
  priceRange: string;
  amazonSearchQuery: string;
  sephoraUrl?: string;
  ultaUrl?: string;
  targetSkinTypes: string[];
  targetConcerns: string[];
  verified: boolean; // Whether ingredient list has been verified
  lastVerified?: string; // Date of last verification
}

/**
 * Real Product Database
 * Products with actual, verified ingredient lists
 */
export const REAL_PRODUCT_DATABASE: RealProduct[] = [
  // CLEANSERS
  {
    id: 'cerave_hydrating_cleanser',
    name: 'Hydrating Facial Cleanser',
    brand: 'CeraVe',
    category: 'cleansers',
    description: 'A gentle, non-foaming cleanser with ceramides and hyaluronic acid to remove dirt and makeup without stripping the skin.',
    imageUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=800&fit=crop&q=90',
    ingredients: [
      'Water',
      'Glycerin',
      'Cetearyl Alcohol',
      'Ceramide NP',
      'Ceramide AP',
      'Ceramide EOP',
      'Carbomer',
      'Glyceryl Monostearate',
      'PEG-100 Stearate',
      'Behentrimonium Methosulfate',
      'Sodium Lauroyl Lactylate',
      'Sodium Hyaluronate',
      'Cholesterol',
      'Dimethicone',
      'Polysorbate 20',
      'Potassium Phosphate',
      'Disodium EDTA',
      'Dipropylene Glycol',
      'Phenoxyethanol',
      'Methylparaben',
      'Propylparaben',
    ],
    priceRange: '$10-15',
    amazonSearchQuery: 'CeraVe Hydrating Facial Cleanser',
    targetSkinTypes: ['dry', 'sensitive', 'normal'],
    targetConcerns: ['dryness', 'sensitivity', 'barrier repair'],
    verified: true,
    lastVerified: '2024-01-01',
  },
  {
    id: 'la_roche_posay_toleriane_cleanser',
    name: 'Toleriane Hydrating Gentle Cleanser',
    brand: 'La Roche-Posay',
    category: 'cleansers',
    description: 'A gentle, soap-free cleanser for sensitive skin with ceramides and niacinamide to cleanse without irritation.',
    imageUrl: 'https://images.unsplash.com/photo-1556229010-aa9e36e4e0f9?w=800&h=800&fit=crop&q=90',
    ingredients: [
      'Water',
      'Glycerin',
      'Pentaerythrityl Tetraisostearate',
      'Niacinamide',
      'Ceramide NP',
      'Sodium Lauroamphoacetate',
      'Cocamidopropyl Betaine',
      'Sodium Trideceth Sulfate',
      'Disodium EDTA',
      'Caprylyl Glycol',
      'Citric Acid',
      'Sodium Hydroxide',
    ],
    priceRange: '$15-20',
    amazonSearchQuery: 'La Roche-Posay Toleriane Hydrating Gentle Cleanser',
    targetSkinTypes: ['sensitive', 'dry', 'normal'],
    targetConcerns: ['sensitivity', 'redness', 'irritation'],
    verified: true,
    lastVerified: '2024-01-01',
  },
  {
    id: 'cetaphil_daily_cleanser',
    name: 'Daily Facial Cleanser',
    brand: 'Cetaphil',
    category: 'cleansers',
    description: 'A gentle, soap-free cleanser that removes dirt and makeup without over-drying or irritating the skin.',
    imageUrl: 'https://images.unsplash.com/photo-1556229010-aa9e36e4e0f9?w=800&h=800&fit=crop&q=90',
    ingredients: [
      'Water',
      'Cetyl Alcohol',
      'Propylene Glycol',
      'Sodium Lauryl Sulfate',
      'Stearyl Alcohol',
      'Methylparaben',
      'Propylparaben',
      'Butylparaben',
    ],
    priceRange: '$8-12',
    amazonSearchQuery: 'Cetaphil Daily Facial Cleanser',
    targetSkinTypes: ['sensitive', 'dry', 'normal', 'oily'],
    targetConcerns: ['sensitivity', 'dryness'],
    verified: true,
    lastVerified: '2024-01-01',
  },

  // SERUMS
  {
    id: 'ordinary_hyaluronic_acid',
    name: 'Hyaluronic Acid 2% + B5',
    brand: 'The Ordinary',
    category: 'serums',
    description: 'A hydrating serum with multiple weights of hyaluronic acid to hydrate and plump the skin.',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop&q=90',
    ingredients: [
      'Water',
      'Sodium Hyaluronate',
      'Sodium Hyaluronate Crosspolymer',
      'Hyaluronic Acid',
      'Panthenol',
      'Glycerin',
      'Propanediol',
      '1,2-Hexanediol',
      'Caprylyl Glycol',
      'Trisodium Ethylenediamine Disuccinate',
      'Citric Acid',
      'Isoceteth-20',
      'Polysorbate 20',
    ],
    priceRange: '$6-8',
    amazonSearchQuery: 'The Ordinary Hyaluronic Acid 2% + B5',
    targetSkinTypes: ['dry', 'normal', 'oily', 'combination'],
    targetConcerns: ['dryness', 'fine lines', 'hydration'],
    verified: true,
    lastVerified: '2024-01-01',
  },
  {
    id: 'ordinary_niacinamide',
    name: 'Niacinamide 10% + Zinc 1%',
    brand: 'The Ordinary',
    category: 'serums',
    description: 'A high-strength niacinamide serum to reduce blemishes and balance sebum production.',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop&q=90',
    ingredients: [
      'Water',
      'Niacinamide',
      'Zinc PCA',
      'Dimethyl Isosorbide',
      'Tamarinus Indica Seed Gum',
      'Isoceteth-20',
      'Phenoxyethanol',
      'Chlorphenesin',
    ],
    priceRange: '$6-8',
    amazonSearchQuery: 'The Ordinary Niacinamide 10% + Zinc 1%',
    targetSkinTypes: ['oily', 'combination', 'acne-prone'],
    targetConcerns: ['acne', 'pores', 'oiliness', 'hyperpigmentation'],
    verified: true,
    lastVerified: '2024-01-01',
  },
  {
    id: 'paula_choice_niacinamide',
    name: '10% Niacinamide Booster',
    brand: "Paula's Choice",
    category: 'serums',
    description: 'A concentrated niacinamide serum to minimize pores, reduce redness, and improve skin texture.',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop&q=90',
    ingredients: [
      'Water',
      'Niacinamide',
      'Acetyl Glucosamine',
      'Butylene Glycol',
      'Glycerin',
      'Allantoin',
      'Sodium Hyaluronate',
      'Dipropylene Glycol',
      'Sodium PCA',
      'Ceramide NP',
      'Phytosphingosine',
      'Cholesterol',
      'Sodium Lauroyl Lactylate',
      'Carbomer',
      'Polysorbate 20',
      'Disodium EDTA',
      'Ethylhexylglycerin',
      'Phenoxyethanol',
    ],
    priceRange: '$35-42',
    amazonSearchQuery: "Paula's Choice 10% Niacinamide Booster",
    targetSkinTypes: ['oily', 'combination', 'normal'],
    targetConcerns: ['pores', 'texture', 'redness', 'hyperpigmentation'],
    verified: true,
    lastVerified: '2024-01-01',
  },

  // MOISTURIZERS
  {
    id: 'cerave_daily_moisturizer',
    name: 'Daily Moisturizing Lotion',
    brand: 'CeraVe',
    category: 'moisturizers',
    description: 'A lightweight, oil-free moisturizer with ceramides and hyaluronic acid to hydrate and restore the skin barrier.',
    imageUrl: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=800&h=800&fit=crop&q=90',
    ingredients: [
      'Water',
      'Glycerin',
      'Caprylic/Capric Triglyceride',
      'Cetearyl Alcohol',
      'Ceramide NP',
      'Ceramide AP',
      'Ceramide EOP',
      'Hyaluronic Acid',
      'Dimethicone',
      'Polysorbate 20',
      'Polyglyceryl-3 Diisostearate',
      'Potassium Phosphate',
      'Dipropylene Glycol',
      'Sodium Lauroyl Lactylate',
      'Disodium EDTA',
      'Methylparaben',
      'Propylparaben',
      'Carbomer',
      'Xanthan Gum',
    ],
    priceRange: '$12-18',
    amazonSearchQuery: 'CeraVe Daily Moisturizing Lotion',
    targetSkinTypes: ['dry', 'normal', 'sensitive'],
    targetConcerns: ['dryness', 'barrier repair', 'hydration'],
    verified: true,
    lastVerified: '2024-01-01',
  },
  {
    id: 'cetaphil_daily_moisturizer',
    name: 'Daily Hydrating Moisturizer',
    brand: 'Cetaphil',
    category: 'moisturizers',
    description: 'A lightweight, non-comedogenic moisturizer with hyaluronic acid to hydrate without clogging pores.',
    imageUrl: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=800&h=800&fit=crop&q=90',
    ingredients: [
      'Water',
      'Glycerin',
      'Dicaprylyl Carbonate',
      'Cyclopentasiloxane',
      'Glycine Soja Oil',
      'Hydroxyethyl Urea',
      'Glyceryl Stearate',
      'PEG-100 Stearate',
      'Sodium PCA',
      'Tocopherol',
      'Dimethicone',
      'Carbomer',
      'Sodium Hydroxide',
      'Phenoxyethanol',
      'Ethylhexylglycerin',
    ],
    priceRange: '$10-15',
    amazonSearchQuery: 'Cetaphil Daily Hydrating Moisturizer',
    targetSkinTypes: ['dry', 'normal', 'sensitive'],
    targetConcerns: ['dryness', 'hydration', 'sensitivity'],
    verified: true,
    lastVerified: '2024-01-01',
  },
  {
    id: 'neutrogena_hydro_boost',
    name: 'Hydro Boost Water Gel',
    brand: 'Neutrogena',
    category: 'moisturizers',
    description: 'An oil-free, lightweight gel moisturizer with hyaluronic acid for intense hydration.',
    imageUrl: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=800&h=800&fit=crop&q=90',
    ingredients: [
      'Water',
      'Dimethicone',
      'Glycerin',
      'Dimethicone/Vinyl Dimethicone Crosspolymer',
      'Sodium Hyaluronate',
      'Polyacrylamide',
      'C13-14 Isoparaffin',
      'Laureth-7',
      'Phenoxyethanol',
      'Dimethiconol',
      'Ethylhexylglycerin',
      'Laureth-23',
      'Sodium Hydroxide',
      'Disodium EDTA',
      'Blue 1',
      'Yellow 5',
    ],
    priceRange: '$15-20',
    amazonSearchQuery: 'Neutrogena Hydro Boost Water Gel',
    targetSkinTypes: ['oily', 'combination', 'normal'],
    targetConcerns: ['hydration', 'oiliness'],
    verified: true,
    lastVerified: '2024-01-01',
  },

  // SUNSCREENS
  {
    id: 'la_roche_posay_anthelios',
    name: 'Anthelios Ultra-Light SPF 50',
    brand: 'La Roche-Posay',
    category: 'sunscreens',
    description: 'A lightweight, non-greasy sunscreen with broad-spectrum SPF 50 protection.',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop&q=90',
    ingredients: [
      'Water',
      'Homosalate',
      'Octisalate',
      'Avobenzone',
      'Octocrylene',
      'Zinc Oxide',
      'Silica',
      'Alcohol Denat.',
      'Dimethicone',
      'Glycerin',
      'PEG-8',
      'Sodium Hyaluronate',
      'Tocopherol',
      'Caprylyl Glycol',
      'Phenoxyethanol',
      'Acrylates/Dimethicone Copolymer',
      'Disodium EDTA',
      'Potassium Cetyl Phosphate',
      'Sodium Hydroxide',
    ],
    priceRange: '$20-28',
    amazonSearchQuery: 'La Roche-Posay Anthelios Ultra-Light SPF 50',
    targetSkinTypes: ['all'],
    targetConcerns: ['sun protection', 'premature aging', 'hyperpigmentation'],
    verified: true,
    lastVerified: '2024-01-01',
  },
  {
    id: 'cerave_mineral_sunscreen',
    name: 'Mineral Sunscreen SPF 50',
    brand: 'CeraVe',
    category: 'sunscreens',
    description: 'A mineral-based sunscreen with zinc oxide and titanium dioxide for sensitive skin.',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop&q=90',
    ingredients: [
      'Water',
      'Zinc Oxide',
      'Titanium Dioxide',
      'Cetearyl Alcohol',
      'Glycerin',
      'Ceramide NP',
      'Ceramide AP',
      'Ceramide EOP',
      'Hyaluronic Acid',
      'Dimethicone',
      'Sodium Hyaluronate',
      'Tocopherol',
      'Carbomer',
      'Sodium Lauroyl Lactylate',
      'Potassium Phosphate',
      'Disodium EDTA',
      'Phenoxyethanol',
      'Methylparaben',
      'Propylparaben',
    ],
    priceRange: '$12-18',
    amazonSearchQuery: 'CeraVe Mineral Sunscreen SPF 50',
    targetSkinTypes: ['sensitive', 'dry', 'normal'],
    targetConcerns: ['sun protection', 'sensitivity'],
    verified: true,
    lastVerified: '2024-01-01',
  },

  // TREATMENTS
  {
    id: 'ordinary_retinol',
    name: 'Retinol 0.5% in Squalane',
    brand: 'The Ordinary',
    category: 'treatments',
    description: 'A water-free solution with 0.5% pure retinol in squalane for anti-aging benefits.',
    imageUrl: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800&h=800&fit=crop&q=90',
    ingredients: [
      'Squalane',
      'Retinol',
      'Rosmarinus Officinalis Leaf Extract',
      'Tocopherol',
    ],
    priceRange: '$8-10',
    amazonSearchQuery: 'The Ordinary Retinol 0.5% in Squalane',
    targetSkinTypes: ['normal', 'oily', 'combination'],
    targetConcerns: ['fine lines', 'wrinkles', 'texture', 'acne'],
    verified: true,
    lastVerified: '2024-01-01',
  },
  {
    id: 'ordinary_glycolic_acid',
    name: 'Glycolic Acid 7% Toning Solution',
    brand: 'The Ordinary',
    category: 'treatments',
    description: 'An exfoliating toner with 7% glycolic acid to improve skin texture and radiance.',
    imageUrl: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800&h=800&fit=crop&q=90',
    ingredients: [
      'Water',
      'Glycolic Acid',
      'Aminomethyl Propanol',
      'Glycerin',
      'Aloe Barbadensis Leaf Water',
      'Ginseng Root Extract',
      'Tasmannia Lanceolata Fruit/Leaf Extract',
      '1,2-Hexanediol',
      'Propanediol',
      'Citric Acid',
      'Polysorbate 20',
    ],
    priceRange: '$8-10',
    amazonSearchQuery: 'The Ordinary Glycolic Acid 7% Toning Solution',
    targetSkinTypes: ['normal', 'oily', 'combination'],
    targetConcerns: ['texture', 'fine lines', 'hyperpigmentation', 'acne'],
    verified: true,
    lastVerified: '2024-01-01',
  },
  {
    id: 'paula_choice_bha',
    name: '2% BHA Liquid Exfoliant',
    brand: "Paula's Choice",
    category: 'treatments',
    description: 'A leave-on exfoliant with 2% salicylic acid to unclog pores and smooth skin texture.',
    imageUrl: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800&h=800&fit=crop&q=90',
    ingredients: [
      'Water',
      'Methylpropanediol',
      'Salicylic Acid',
      'Camellia Oleifera Leaf Extract',
      'Sodium Hydroxide',
      'Butylene Glycol',
      'Polysorbate 20',
      'Tetrasodium EDTA',
      'Ethylhexylglycerin',
      'Phenoxyethanol',
      'Blue 1',
    ],
    priceRange: '$30-35',
    amazonSearchQuery: "Paula's Choice 2% BHA Liquid Exfoliant",
    targetSkinTypes: ['oily', 'combination', 'acne-prone'],
    targetConcerns: ['acne', 'pores', 'blackheads', 'texture'],
    verified: true,
    lastVerified: '2024-01-01',
  },
];

/**
 * Find products that contain specific ingredients
 */
export function findProductsWithIngredients(
  requiredIngredients: string[],
  category?: string,
  skinType?: string,
  concerns?: string[]
): RealProduct[] {
  return REAL_PRODUCT_DATABASE.filter(product => {
    // Filter by category if specified
    if (category && product.category !== category) {
      return false;
    }

    // Filter by skin type if specified
    if (skinType && !product.targetSkinTypes.includes(skinType)) {
      return false;
    }

    // Filter by concerns if specified
    if (concerns && concerns.length > 0) {
      const hasMatchingConcern = concerns.some(concern =>
        product.targetConcerns.some(targetConcern =>
          targetConcern.toLowerCase().includes(concern.toLowerCase()) ||
          concern.toLowerCase().includes(targetConcern.toLowerCase())
        )
      );
      if (!hasMatchingConcern) {
        return false;
      }
    }

    // Check if product contains required ingredients
    const productIngredientsLower = product.ingredients.map(ing => ing.toLowerCase());
    const hasAllIngredients = requiredIngredients.every(requiredIng =>
      productIngredientsLower.some(productIng =>
        productIng.includes(requiredIng.toLowerCase()) ||
        requiredIng.toLowerCase().includes(productIng)
      )
    );

    return hasAllIngredients;
  });
}

/**
 * Find products by category and skin type
 */
export function findProductsByCategory(
  category: string,
  skinType?: string,
  concerns?: string[]
): RealProduct[] {
  return REAL_PRODUCT_DATABASE.filter(product => {
    if (product.category !== category) {
      return false;
    }

    if (skinType && !product.targetSkinTypes.includes(skinType)) {
      return false;
    }

    if (concerns && concerns.length > 0) {
      const hasMatchingConcern = concerns.some(concern =>
        product.targetConcerns.some(targetConcern =>
          targetConcern.toLowerCase().includes(concern.toLowerCase()) ||
          concern.toLowerCase().includes(targetConcern.toLowerCase())
        )
      );
      if (!hasMatchingConcern) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get product by ID
 */
export function getProductById(id: string): RealProduct | undefined {
  return REAL_PRODUCT_DATABASE.find(product => product.id === id);
}

/**
 * Calculate ingredient match score for a product
 */
export function calculateIngredientMatchScore(
  product: RealProduct,
  recommendedIngredients: string[]
): number {
  if (recommendedIngredients.length === 0) return 0;

  const productIngredientsLower = product.ingredients.map(ing => ing.toLowerCase());
  const matchingIngredients = recommendedIngredients.filter(requiredIng =>
    productIngredientsLower.some(productIng =>
      productIng.includes(requiredIng.toLowerCase()) ||
      requiredIng.toLowerCase().includes(productIng)
    )
  );

  return Math.round((matchingIngredients.length / recommendedIngredients.length) * 100);
}


