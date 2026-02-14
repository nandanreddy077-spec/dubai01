/**
 * Global Product Database - Aggregated
 * Combines all product categories for global access
 */

import { GlobalProduct } from '../product-database-structure';
import { CLEANSERS } from './cleansers';
import { TONERS } from './toners';
import { SERUMS } from './serums';
import { MOISTURIZERS } from './moisturizers';
import { SUNSCREENS } from './sunscreens';
import { TREATMENTS } from './treatments';

/**
 * All products in the database
 * Current: 50+ products across 6 categories
 * Target: 1000+ products across all categories
 */
export const ALL_PRODUCTS: GlobalProduct[] = [
  ...CLEANSERS,
  ...TONERS,
  ...SERUMS,
  ...MOISTURIZERS,
  ...SUNSCREENS,
  ...TREATMENTS,
];

/**
 * Get products by category
 */
export function getProductsByCategory(category: GlobalProduct['category']): GlobalProduct[] {
  return ALL_PRODUCTS.filter(product => product.category === category);
}

/**
 * Get products by brand
 */
export function getProductsByBrand(brand: string): GlobalProduct[] {
  return ALL_PRODUCTS.filter(product => 
    product.brand.toLowerCase() === brand.toLowerCase()
  );
}

/**
 * Get products available in country
 */
export function getProductsAvailableInCountry(countryCode: string): GlobalProduct[] {
  return ALL_PRODUCTS.filter(product =>
    product.regionalAvailability.some(
      availability => availability.countryCode === countryCode && availability.available
    )
  );
}

/**
 * Search products by name, brand, or ingredients
 */
export function searchProducts(query: string): GlobalProduct[] {
  const lowerQuery = query.toLowerCase();
  return ALL_PRODUCTS.filter(product =>
    product.name.toLowerCase().includes(lowerQuery) ||
    product.brand.toLowerCase().includes(lowerQuery) ||
    product.ingredients.some(ing => ing.toLowerCase().includes(lowerQuery)) ||
    product.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Find products with specific ingredients
 */
export function findProductsWithIngredients(
  requiredIngredients: string[],
  category?: GlobalProduct['category'],
  skinType?: string,
  concerns?: string[]
): GlobalProduct[] {
  return ALL_PRODUCTS.filter(product => {
    // Filter by category
    if (category && product.category !== category) {
      return false;
    }

    // Filter by skin type
    if (skinType && !product.targetSkinTypes.includes(skinType) && !product.targetSkinTypes.includes('all')) {
      return false;
    }

    // Filter by concerns
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

    // Check ingredients - if no required ingredients specified, return all matching products
    if (requiredIngredients.length === 0) {
      return true;
    }

    const productIngredientsLower = product.ingredients.map(ing => ing.toLowerCase());
    const matchingIngredients = requiredIngredients.filter(requiredIng =>
      productIngredientsLower.some(productIng =>
        productIng.includes(requiredIng.toLowerCase()) ||
        requiredIng.toLowerCase().includes(productIng)
      )
    );

    // Return products that have at least 50% of required ingredients
    return matchingIngredients.length >= Math.ceil(requiredIngredients.length * 0.5);
  });
}

/**
 * Get product by ID
 */
export function getProductById(id: string): GlobalProduct | undefined {
  return ALL_PRODUCTS.find(product => product.id === id);
}

/**
 * Calculate ingredient match score
 */
export function calculateIngredientMatchScore(
  product: GlobalProduct,
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

