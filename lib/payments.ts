import { Platform, Linking, Alert } from 'react-native';

// RevenueCat Configuration
export const REVENUECAT_CONFIG = {
  // Production RevenueCat API Keys - Configured for production
  API_KEY_IOS: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || 'appl_UpDZroTEjwQSDDRJdqLgYihNxsh',
  API_KEY_ANDROID: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || 'goog_xCXiGuMlJXxLNPQUlodNDLnAAYZ',
  ENTITLEMENT_ID: 'premium', // This should match your RevenueCat entitlement
} as const;

// Product IDs for App Store and Google Play
// These MUST match your App Store Connect product IDs exactly
export const PRODUCT_IDS = {
  MONTHLY: process.env.EXPO_PUBLIC_IAP_MONTHLY_PRODUCT_ID || 'com.glowcheck.monthly.premium',
  YEARLY: process.env.EXPO_PUBLIC_IAP_YEARLY_PRODUCT_ID || 'com.glowcheck.yearly1.premium',
} as const;

// App Store Connect Configuration
export const APP_STORE_CONFIG = {
  TEAM_ID: process.env.EXPO_PUBLIC_APP_STORE_TEAM_ID || '2V4DJQD8G3',
  BUNDLE_ID: process.env.EXPO_PUBLIC_APP_STORE_BUNDLE_ID || 'com.glowcheck01.app',
  SHARED_SECRET: process.env.EXPO_PUBLIC_APP_STORE_SHARED_SECRET || '5063e6dd7c174550b12001c140f6b803',
} as const;

// Google Play Configuration
export const GOOGLE_PLAY_CONFIG = {
  PACKAGE_NAME: process.env.EXPO_PUBLIC_GOOGLE_PLAY_PACKAGE_NAME || 'com.glowcheck01.app',
  SERVICE_ACCOUNT_KEY: 'google-services.json',
} as const;

// Pricing Configuration
export const PRICING = {
  MONTHLY: {
    price: 8.99,
    currency: 'USD',
    period: 'P1M', // ISO 8601 duration format
    trialPeriod: 'P7D', // 7 days free trial
  },
  YEARLY: {
    price: 99.00,
    currency: 'USD',
    period: 'P1Y', // ISO 8601 duration format
    trialPeriod: 'P7D', // 7 days free trial
  },
} as const;

export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  purchaseToken?: string;
  productId?: string;
  error?: string;
  cancelled?: boolean;
  originalTransactionId?: string;
}

export interface SubscriptionInfo {
  isActive: boolean;
  productId: string;
  purchaseDate: string;
  expiryDate: string;
  isTrialPeriod: boolean;
  autoRenewing: boolean;
  originalTransactionId?: string;
  purchaseToken?: string;
}

class PaymentService {
  private isInitialized = false;
  private purchasesModule: any = null;
  private subscriptionListeners: Set<(customerInfo: any) => void> = new Set();

  private async loadPurchasesModule(): Promise<any> {
    try {
      // Try to load RevenueCat - this will work in production builds with EAS Build
      const Purchases = require('react-native-purchases');
      return Purchases.default || Purchases;
    } catch (error) {
      console.log('RevenueCat module not available - using fallback mode:', error);
      return null;
    }
  }

  async initialize(userId?: string | null): Promise<boolean> {
    try {
      console.log('Initializing payment service...', { userId });
      
      if (Platform.OS === 'web') {
        console.log('Payment service not available on web');
        return false;
      }

      // Check if running in Expo Go
      const Constants = await import('expo-constants');
      const isExpoGo = Constants.default.appOwnership === 'expo';

      if (isExpoGo) {
        console.log('Running in Expo Go - payment service will redirect to stores');
        this.isInitialized = true;
        return true;
      }

      // Production build with react-native-purchases:
      try {
        const Purchases = await this.loadPurchasesModule();
        
        if (!Purchases) {
          console.log('RevenueCat not available, using fallback mode');
          this.isInitialized = true;
          return true;
        }
        
        // Configure RevenueCat if available
        const apiKey = Platform.OS === 'ios' 
          ? REVENUECAT_CONFIG.API_KEY_IOS 
          : REVENUECAT_CONFIG.API_KEY_ANDROID;
        
        if (!apiKey || apiKey.includes('YOUR_')) {
          console.warn('RevenueCat API key not configured properly');
          this.isInitialized = true;
          return true;
        }
        
        // Configure RevenueCat with user ID if provided
        await Purchases.configure({
          apiKey,
          appUserID: userId || null, // Sync with Supabase user ID
        });
        
        // Set up subscription status listener
        Purchases.addCustomerInfoUpdateListener((customerInfo: any) => {
          console.log('Subscription status updated:', customerInfo);
          // Notify all listeners
          this.subscriptionListeners.forEach(listener => {
            try {
              listener(customerInfo);
            } catch (error) {
              console.error('Error in subscription listener:', error);
            }
          });
        });
        
        this.purchasesModule = Purchases;
        console.log('RevenueCat initialized successfully with user ID:', userId || 'anonymous');
      } catch (error) {
        console.log('RevenueCat not available, using fallback mode:', error);
      }
      
      this.isInitialized = true;
      console.log('Payment service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize payment service:', error);
      return false;
    }
  }

  /**
   * Sync RevenueCat user ID with Supabase user ID
   */
  async syncUser(userId: string): Promise<boolean> {
    try {
      // Initialize if not already done
      if (!this.isInitialized) {
        await this.initialize(userId);
      }

      // In Expo Go or if RevenueCat isn't available, skip syncing
      if (!this.purchasesModule) {
        console.log('RevenueCat not available - skipping user sync');
        return true;
      }

      const Purchases = this.purchasesModule;
      await Purchases.logIn(userId);
      console.log('RevenueCat user ID synced with Supabase user:', userId);
      return true;
    } catch (error: any) {
      // Handle "no singleton instance" error gracefully
      if (error?.message?.includes('singleton') || error?.message?.includes('configure')) {
        console.log('RevenueCat not configured - skipping user sync');
        return true;
      }
      console.error('Failed to sync RevenueCat user ID:', error);
      return false;
    }
  }

  /**
   * Add subscription status listener
   */
  addSubscriptionListener(listener: (customerInfo: any) => void): () => void {
    this.subscriptionListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.subscriptionListeners.delete(listener);
    };
  }

  private getFallbackProducts(): any[] {
    const products = [
      {
        productId: PRODUCT_IDS.MONTHLY,
        price: PRICING.MONTHLY.price,
        currency: PRICING.MONTHLY.currency,
        title: 'Monthly Glow Premium',
        description: 'Unlimited scans, AI coach, and premium features',
        subscriptionPeriod: PRICING.MONTHLY.period,
        freeTrialPeriod: PRICING.MONTHLY.trialPeriod,
      },
      {
        productId: PRODUCT_IDS.YEARLY,
        price: PRICING.YEARLY.price,
        currency: PRICING.YEARLY.currency,
        title: 'Yearly Glow Premium',
        description: 'Unlimited scans, AI coach, and premium features - Best Value!',
        subscriptionPeriod: PRICING.YEARLY.period,
        freeTrialPeriod: PRICING.YEARLY.trialPeriod,
      },
    ];
    console.log('Retrieved fallback products:', products);
    return products;
  }

  async getProducts(): Promise<any[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Check if running in Expo Go
      const Constants = await import('expo-constants');
      const isExpoGo = Constants.default.appOwnership === 'expo';

      if (isExpoGo) {
        return this.getFallbackProducts();
      }

      // Production build with react-native-purchases:
      try {
        const Purchases = await this.loadPurchasesModule();
        
        if (!Purchases) {
          console.log('RevenueCat not available, using fallback products');
          return this.getFallbackProducts();
        }
        
        const offerings = await Purchases.getOfferings();
        const currentOffering = offerings.current;
        
        if (!currentOffering) {
          console.log('No current offering available, using fallback products');
          return this.getFallbackProducts();
        }
        
        const products = currentOffering.availablePackages.map((pkg: any) => ({
          productId: pkg.product.identifier,
          price: pkg.product.price,
          currency: pkg.product.currencyCode,
          title: pkg.product.title,
          description: pkg.product.description,
          subscriptionPeriod: pkg.product.subscriptionPeriod,
          freeTrialPeriod: pkg.product.introPrice?.period,
          package: pkg,
        }));
        
        console.log('Retrieved products from RevenueCat:', products);
        return products;
      } catch (error) {
        console.log('Failed to get RevenueCat products, using fallback:', error);
        return this.getFallbackProducts();
      }
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    try {
      console.log(`Attempting to purchase product: ${productId}`);
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (Platform.OS === 'web') {
        return {
          success: false,
          error: 'In-app purchases are not supported on web. Please use the mobile app.',
        };
      }

      // Check if running in Expo Go (development)
      const Constants = await import('expo-constants');
      const isExpoGo = Constants.default.appOwnership === 'expo';

      if (isExpoGo) {
        // For Expo Go, redirect to store
        console.log('Running in Expo Go - redirecting to store for subscription...');
        
        const storeUrl = this.getStoreSubscriptionUrl();
        const canOpen = await Linking.canOpenURL(storeUrl);
        
        if (canOpen) {
          await Linking.openURL(storeUrl);
          return {
            success: false,
            error: 'STORE_REDIRECT',
            productId,
          };
        } else {
          return {
            success: false,
            error: 'Unable to open app store. Please visit the App Store or Google Play Store manually to subscribe.',
          };
        }
      }

      // Production build with react-native-purchases:
      try {
        const Purchases = await this.loadPurchasesModule();
        
        if (!Purchases) {
          console.log('RevenueCat not available, redirecting to store');
          const storeUrl = this.getStoreSubscriptionUrl();
          const canOpen = await Linking.canOpenURL(storeUrl);
          
          if (canOpen) {
            await Linking.openURL(storeUrl);
            return {
              success: false,
              error: 'STORE_REDIRECT',
              productId,
            };
          } else {
            return {
              success: false,
              error: 'Unable to open app store. Please visit the App Store or Google Play Store manually to subscribe.',
            };
          }
        }
        
        const offerings = await Purchases.getOfferings();
        const currentOffering = offerings.current;
        
        if (!currentOffering) {
          throw new Error('No offerings available');
        }
        
        // Try to find package by product ID (exact match)
        let packageToPurchase = currentOffering.availablePackages.find(
          (pkg: any) => pkg.product.identifier === productId
        );
        
        // If not found, try to find by product ID pattern (for Android base plan format)
        if (!packageToPurchase) {
          const productIdBase = productId.split(':')[0]; // Remove base plan ID for Android
          packageToPurchase = currentOffering.availablePackages.find(
            (pkg: any) => {
              const pkgProductId = pkg.product.identifier?.split(':')[0];
              return pkgProductId === productIdBase;
            }
          );
        }
        
        // If still not found, try to find by package identifier (RevenueCat standard: $rc_monthly, $rc_annual)
        if (!packageToPurchase) {
          const isYearly = productId.includes('yearly') || productId.includes('annual');
          const packageIdentifier = isYearly ? '$rc_annual' : '$rc_monthly';
          packageToPurchase = currentOffering.availablePackages.find(
            (pkg: any) => pkg.identifier === packageIdentifier
          );
        }
        
        // If still not found, try by package type
        if (!packageToPurchase) {
          const packageType = productId.includes('yearly') || productId.includes('annual') 
            ? 'ANNUAL' 
            : 'MONTHLY';
          packageToPurchase = currentOffering.availablePackages.find(
            (pkg: any) => {
              const pkgType = pkg.packageType || '';
              return pkgType === packageType || 
                     pkg.identifier?.toLowerCase().includes(packageType.toLowerCase()) ||
                     pkg.identifier?.toLowerCase().includes(productId.includes('yearly') ? 'annual' : 'monthly');
            }
          );
        }
        
        // Last resort: use first available package (should not happen in production)
        if (!packageToPurchase && currentOffering.availablePackages.length > 0) {
          console.warn(`Product ${productId} not found, using first available package`);
          console.warn('Available packages:', currentOffering.availablePackages.map((p: any) => ({
            identifier: p.identifier,
            productId: p.product.identifier,
            packageType: p.packageType
          })));
          packageToPurchase = currentOffering.availablePackages[0];
        }
        
        if (!packageToPurchase) {
          throw new Error(`Product ${productId} not found in offerings`);
        }
        
        console.log('Purchasing package:', packageToPurchase.product.identifier, {
          price: packageToPurchase.product.priceString,
          trialPeriod: packageToPurchase.product.introPrice?.periodString,
        });
        
        const purchaseResult = await Purchases.purchasePackage(packageToPurchase);
        
        console.log('Purchase completed:', {
          productId: purchaseResult.customerInfo.originalAppUserId,
          entitlements: Object.keys(purchaseResult.customerInfo.entitlements.active),
        });
        
        // Check if premium entitlement is active
        const premiumEntitlement = purchaseResult.customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID];
        
        if (premiumEntitlement) {
          const transactionIdentifier = purchaseResult.customerInfo.originalPurchaseDate;
          
          return {
            success: true,
            transactionId: transactionIdentifier || 'purchased',
            purchaseToken: purchaseResult.customerInfo.originalAppUserId || transactionIdentifier,
            productId: premiumEntitlement.productIdentifier || productId,
          };
        } else {
          return {
            success: false,
            error: 'Purchase completed but entitlement not active',
          };
        }
      } catch (purchaseError: any) {
        console.log('Purchase error:', purchaseError);
        
        if (purchaseError.userCancelled) {
          return {
            success: false,
            cancelled: true,
            error: 'Purchase cancelled by user',
          };
        }
        
        // Handle other RevenueCat errors
        if (purchaseError.code) {
          switch (purchaseError.code) {
            case 'PURCHASE_NOT_ALLOWED_ERROR':
              return {
                success: false,
                error: 'Purchases are not allowed on this device',
              };
            case 'PAYMENT_PENDING_ERROR':
              return {
                success: false,
                error: 'Payment is pending approval',
              };
            case 'PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR':
              return {
                success: false,
                error: 'Product is not available for purchase',
              };
            default:
              return {
                success: false,
                error: purchaseError.message || 'Purchase failed',
              };
          }
        }
        
        return {
          success: false,
          error: purchaseError.message || 'Purchase failed',
        };
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  async restorePurchases(): Promise<SubscriptionInfo[]> {
    try {
      console.log('Restoring purchases...');
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (Platform.OS === 'web') {
        return [];
      }

      // Production build with react-native-purchases:
      try {
        const Purchases = await this.loadPurchasesModule();
        
        if (!Purchases) {
          console.log('RevenueCat not available for restore purchases');
          return [];
        }
        
        console.log('Restoring purchases...');
        const customerInfo = await Purchases.restorePurchases();
        
        console.log('Customer info:', customerInfo);
        const activeEntitlements = Object.values(customerInfo.entitlements.active);
        
        const subscriptions = activeEntitlements.map((entitlement: any) => ({
          isActive: true,
          productId: entitlement.productIdentifier,
          purchaseDate: entitlement.originalPurchaseDate,
          expiryDate: entitlement.expirationDate || '',
          isTrialPeriod: entitlement.isTrialPeriod,
          autoRenewing: entitlement.willRenew,
          originalTransactionId: entitlement.originalTransactionId,
        }));
        
        console.log('Restored subscriptions:', subscriptions);
        return subscriptions;
      } catch (error) {
        console.error('Failed to restore purchases:', error);
        return [];
      }
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return [];
    }
  }

  async getSubscriptionStatus(): Promise<SubscriptionInfo | null> {
    try {
      console.log('Checking subscription status...');
      
      if (Platform.OS === 'web') {
        return null;
      }

      // Ensure we're initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Production build with react-native-purchases:
      try {
        // Check if purchases module is available
        if (!this.purchasesModule) {
          this.purchasesModule = await this.loadPurchasesModule();
          
          if (!this.purchasesModule) {
            console.log('RevenueCat not available for subscription status');
            return null;
          }
        }
        
        // Get customer info with error handling
        let customerInfo;
        try {
          customerInfo = await this.purchasesModule.getCustomerInfo();
        } catch (error: any) {
          // Handle the specific "no singleton instance" error gracefully
          if (error?.message?.includes('singleton instance') || 
              error?.message?.includes('configure') ||
              error?.message?.includes('Make sure you configure')) {
            console.log('RevenueCat not configured yet - this is OK in development');
            return null;
          }
          throw error;
        }
        
        console.log('Customer info received:', {
          userId: customerInfo.originalAppUserId,
          entitlements: Object.keys(customerInfo.entitlements.active || {}),
          allPurchaseDates: customerInfo.allPurchaseDates,
        });
        
        const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID];
        
        if (entitlement) {
          const isInTrial = entitlement.willRenew && entitlement.isActive && 
                           entitlement.expirationDate && 
                           new Date(entitlement.expirationDate) > new Date() &&
                           (entitlement as any).isTrialPeriod;
          
          const subscription: SubscriptionInfo = {
            isActive: entitlement.isActive,
            productId: entitlement.productIdentifier || '',
            purchaseDate: entitlement.latestPurchaseDate || entitlement.originalPurchaseDate || new Date().toISOString(),
            expiryDate: entitlement.expirationDate || '',
            isTrialPeriod: isInTrial || false,
            autoRenewing: entitlement.willRenew || false,
            originalTransactionId: entitlement.originalTransactionId || '',
            purchaseToken: customerInfo.originalAppUserId || '',
          };
          
          console.log('Active subscription found:', subscription);
          return subscription;
        }
        
        console.log('No active subscription found');
        return null;
      } catch (error) {
        console.error('Failed to get customer info:', error);
        return null;
      }
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return null;
    }
  }

  /**
   * Get current customer info from RevenueCat
   */
  async getCustomerInfo(): Promise<any | null> {
    try {
      if (Platform.OS === 'web') {
        return null;
      }

      // Ensure we're initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Check if purchases module is available
      if (!this.purchasesModule) {
        // Try to load it
        this.purchasesModule = await this.loadPurchasesModule();
        
        // If still not available, return null (fallback mode)
        if (!this.purchasesModule) {
          console.log('RevenueCat not available - returning null');
          return null;
        }
      }

      // Now safely get customer info
      try {
        return await this.purchasesModule.getCustomerInfo();
      } catch (error: any) {
        // Handle the specific "no singleton instance" error gracefully
        if (error?.message?.includes('singleton instance') || 
            error?.message?.includes('configure') ||
            error?.message?.includes('Make sure you configure')) {
          console.log('RevenueCat not configured yet - this is OK in development');
          return null;
        }
        // Re-throw other errors to be caught by outer catch
        throw error;
      }
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null; // Return null instead of throwing - app will work with local state
    }
  }

  private async verifyPurchase(purchase: PurchaseResult): Promise<boolean> {
    try {
      console.log('Verifying purchase with backend...');
      
      // In a real app, you would send the purchase data to your backend
      // for verification with Apple/Google servers
      const verificationData = {
        platform: Platform.OS,
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        purchaseToken: purchase.purchaseToken,
        timestamp: Date.now(),
      };

      console.log('Verification data:', verificationData);
      
      // Simulate backend verification
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      console.log('Purchase verified successfully');
      return true;
    } catch (error) {
      console.error('Purchase verification failed:', error);
      return false;
    }
  }

  private getStoreSubscriptionUrl(): string {
    if (Platform.OS === 'ios') {
      // iOS App Store - Replace with your actual App Store app ID when available
      // Format: https://apps.apple.com/app/id{APP_ID}
      // For now, redirect to App Store search
      return `https://apps.apple.com/search?term=glow%20check%20beauty`;
    } else {
      // Google Play Store subscription URL
      return `https://play.google.com/store/apps/details?id=${GOOGLE_PLAY_CONFIG.PACKAGE_NAME}&hl=en&gl=US`;
    }
  }

  async openSubscriptionManagement(): Promise<boolean> {
    try {
      console.log('Opening subscription management...');
      
      let url: string;
      if (Platform.OS === 'ios') {
        // iOS subscription management
        url = 'https://apps.apple.com/account/subscriptions';
      } else {
        // Android subscription management
        url = 'https://play.google.com/store/account/subscriptions';
      }
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to open subscription management:', error);
      return false;
    }
  }

  async cancelSubscription(): Promise<boolean> {
    try {
      console.log('Directing user to cancel subscription...');
      
      const opened = await this.openSubscriptionManagement();
      if (!opened) {
        // Fallback: Show instructions
        if (Platform.OS !== 'web') {
          Alert.alert(
            'Manage Subscription',
            Platform.OS === 'ios' 
              ? 'To cancel your subscription:\n\n1. Open Settings on your device\n2. Tap your Apple ID\n3. Tap Subscriptions\n4. Find Glow Check and tap Cancel'
              : 'To cancel your subscription:\n\n1. Open Google Play Store\n2. Tap Menu → Subscriptions\n3. Find Glow Check and tap Cancel',
            [{ text: 'OK' }]
          );
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }
}

export const paymentService = new PaymentService();

// Helper functions for subscription management
export const formatPrice = (price: number, currency: string = 'USD'): string => {
  if (typeof price !== 'number' || price < 0) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
};

export const getTrialEndDate = (startDate: Date = new Date()): Date => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7); // 7 days trial
  return endDate;
};

export const isTrialActive = (trialEndDate: string): boolean => {
  return new Date(trialEndDate) > new Date();
};

export const getDaysUntilExpiry = (expiryDate: string): number => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Revenue tracking and analytics
export const trackPurchaseEvent = (productId: string, price: number, currency: string) => {
  console.log('Purchase event tracked:', { productId, price, currency });
  // In a real app, you would send this to your analytics service
};

export const trackTrialStartEvent = () => {
  console.log('Trial start event tracked');
  // In a real app, you would send this to your analytics service
};

export const trackSubscriptionCancelEvent = (productId: string, reason?: string) => {
  console.log('Subscription cancel event tracked:', { productId, reason });
  // In a real app, you would send this to your analytics service
};