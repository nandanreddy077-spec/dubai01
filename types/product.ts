export interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'skincare' | 'makeup' | 'haircare' | 'fragrance' | 'bodycare' | 'supplements';
  type?: string;
  imageUrl?: string;
  barcode?: string;
  price?: number;
  purchaseDate?: string;
  purchaseLocation?: string;
  expiryDate?: string;
  size?: string;
  notes?: string;
  rating?: number;
  repurchase?: boolean;
  ingredients?: string[];
  affiliateUrl?: string;
  isPremiumRecommendation?: boolean;
}

export interface ProductUsageEntry {
  id: string;
  productId: string;
  date: string;
  timestamp: string;
  notes?: string;
  rating?: number;
  skinCondition?: 'excellent' | 'good' | 'fair' | 'poor';
  beforePhoto?: string;
  afterPhoto?: string;
}

export interface ProductRoutine {
  id: string;
  name: string;
  type: 'morning' | 'evening' | 'weekly' | 'custom';
  products: string[];
  order?: number[];
  createdAt: string;
  isActive: boolean;
}

export interface ProductRecommendation {
  id: string;
  category: string;
  stepName: string;
  description: string;
  tiers: {
    luxury: ProductTier;
    medium: ProductTier;
    budget: ProductTier;
  };
  matchScore: number;
  source?: 'analysis' | 'glow-coach';
  imageUrl?: string;
  brand?: string;
  affiliateUrl?: string;
  price?: string;
}

export interface ProductTier {
  title: string;
  description: string;
  guidance: string;
  priceRange: string;
  affiliateUrl: string;
  keywords: string[];
}
