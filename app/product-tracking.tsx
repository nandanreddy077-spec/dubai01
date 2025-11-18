import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Plus,
  Package,
  Star,
  ExternalLink,
  Sparkles,
  ShoppingBag,
  Award,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useProducts } from '@/contexts/ProductContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';

export default function ProductTrackingScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  
  const {
    products,
    recommendations,
    addProduct,
    trackAffiliateTap,
  } = useProducts();
  
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-products' | 'recommendations'>('my-products');
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    category: 'skincare' as const,
  });
  
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.brand) return;
    
    await addProduct(newProduct);
    setNewProduct({ name: '', brand: '', category: 'skincare' });
    setShowAddProduct(false);
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };
  

  
  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const styles = createStyles(palette, gradient);
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Product Tracker',
          headerStyle: {
            backgroundColor: palette.surface,
          },
          headerTintColor: palette.textPrimary,
          headerShadowVisible: false,
        }}
      />
      
      <LinearGradient
        colors={gradient.hero}
        style={StyleSheet.absoluteFillObject}
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Track Your Beauty Arsenal</Text>
            <Text style={styles.subtitle}>
              Log products, get recommendations, and earn rewards
            </Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Package color={palette.blush} size={20} strokeWidth={2.5} />
              <Text style={styles.statNumber}>{products.length}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            
            <View style={styles.statCard}>
              <Star color={palette.gold} size={20} fill={palette.gold} strokeWidth={2.5} />
              <Text style={styles.statNumber}>{recommendations.length}</Text>
              <Text style={styles.statLabel}>Recommendations</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('my-products');
              animatePress();
            }}
            activeOpacity={0.8}
            style={[
              styles.tab,
              activeTab === 'my-products' && styles.tabActive,
            ]}
          >
            <Package
              color={activeTab === 'my-products' ? palette.textLight : palette.textSecondary}
              size={20}
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'my-products' && styles.tabTextActive,
              ]}
            >
              My Products
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              setActiveTab('recommendations');
              animatePress();
            }}
            activeOpacity={0.8}
            style={[
              styles.tab,
              activeTab === 'recommendations' && styles.tabActive,
            ]}
          >
            <Sparkles
              color={activeTab === 'recommendations' ? palette.textLight : palette.textSecondary}
              size={20}
              fill={activeTab === 'recommendations' ? palette.textLight : 'none'}
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'recommendations' && styles.tabTextActive,
              ]}
            >
              Recommendations
            </Text>
            {recommendations.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{recommendations.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {activeTab === 'my-products' && (
          <View style={styles.content}>
            <TouchableOpacity
              onPress={() => setShowAddProduct(!showAddProduct)}
              activeOpacity={0.9}
              style={[styles.addButton, shadow.card]}
            >
              <LinearGradient
                colors={['#FF6B9D', '#C44569']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <Plus color={palette.textLight} size={24} strokeWidth={2.5} />
                <Text style={styles.addButtonText}>Add Product</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {showAddProduct && (
              <View style={[styles.addProductForm, shadow.card]}>
                <Text style={styles.formTitle}>Add New Product</Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="Product Name"
                  placeholderTextColor={palette.textSecondary}
                  value={newProduct.name}
                  onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Brand"
                  placeholderTextColor={palette.textSecondary}
                  value={newProduct.brand}
                  onChangeText={(text) => setNewProduct({ ...newProduct, brand: text })}
                />
                
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    onPress={() => setShowAddProduct(false)}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleAddProduct}
                    disabled={!newProduct.name || !newProduct.brand}
                    style={[
                      styles.saveButton,
                      (!newProduct.name || !newProduct.brand) && styles.saveButtonDisabled,
                    ]}
                  >
                    <LinearGradient
                      colors={
                        !newProduct.name || !newProduct.brand
                          ? ['#ccc', '#999']
                          : ['#4CAF50', '#45a049']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveButtonGradient}
                    >
                      <Text style={styles.saveButtonText}>Save Product</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {products.length === 0 ? (
              <View style={styles.emptyState}>
                <Package color={palette.textSecondary} size={64} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No products yet</Text>
                <Text style={styles.emptySubtitle}>
                  Start tracking your beauty products to get personalized insights
                </Text>
              </View>
            ) : (
              <View style={styles.productsList}>
                {products.map((product) => (
                  <View key={product.id} style={[styles.productCard, shadow.card]}>
                    <View style={styles.productHeader}>
                      {product.imageUrl ? (
                        <Image
                          source={{ uri: product.imageUrl }}
                          style={styles.productImage}
                        />
                      ) : (
                        <View style={styles.productImagePlaceholder}>
                          <Package color={palette.textSecondary} size={24} strokeWidth={2} />
                        </View>
                      )}
                      
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productBrand}>{product.brand}</Text>
                        <View style={styles.productBadge}>
                          <Text style={styles.productBadgeText}>{product.category}</Text>
                        </View>
                      </View>
                    </View>
                    
                    {product.rating && (
                      <View style={styles.productRating}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < product.rating! ? '#FFD700' : 'none'}
                            color="#FFD700"
                            strokeWidth={2}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        
        {activeTab === 'recommendations' && (
          <View style={styles.content}>
            {recommendations.length === 0 ? (
              <View style={styles.emptyState}>
                <Sparkles color={palette.textSecondary} size={64} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>Complete your analysis first</Text>
                <Text style={styles.emptySubtitle}>
                  Get your glow analysis or create a skincare plan to receive personalized product recommendations
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.revenueCard}>
                  <LinearGradient
                    colors={['#FF6B9D', '#C44569']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.revenueCardGradient}
                  >
                    <View style={styles.revenueIcon}>
                      <Sparkles color={palette.textLight} size={28} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.revenueTitle}>Personalized For You</Text>
                    <Text style={styles.revenueSubtitle}>
                      Curated recommendations based on your skin analysis & skincare goals
                    </Text>
                  </LinearGradient>
                </View>
                
                {recommendations.filter(r => r.source === 'analysis').length > 0 && (
                  <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                      <Sparkles color={palette.blush} size={20} fill={palette.blush} strokeWidth={2.5} />
                      <Text style={styles.sectionHeaderText}>Glow Analysis Recommendations</Text>
                    </View>
                    <Text style={styles.sectionSubtext}>Based on your skin analysis results</Text>
                  </View>
                )}
                
                {recommendations.filter(r => r.source === 'analysis').map((rec, index) => (
                  <View key={rec.id} style={[styles.recommendationCard, shadow.card]}>
                    {index === 0 && (
                      <View style={styles.premiumBadge}>
                        <Award color="#FFF" size={14} strokeWidth={2.5} />
                        <Text style={styles.premiumBadgeText}>PREMIUM PICK</Text>
                      </View>
                    )}
                    
                    <View style={styles.productImageContainer}>
                      <Image
                        source={{ uri: rec.imageUrl }}
                        style={styles.productRecommendationImage}
                        resizeMode="cover"
                      />
                    </View>
                    
                    <View style={styles.recHeaderSection}>
                      <View style={styles.recTitleRow}>
                        <Text style={styles.recStepName}>{rec.stepName}</Text>
                      </View>
                      {rec.brand && (
                        <Text style={styles.recBrand}>{rec.brand}</Text>
                      )}
                      <View style={styles.matchBadge}>
                        <Star color="#6EE7B7" size={14} fill="#6EE7B7" strokeWidth={2} />
                        <Text style={styles.matchText}>{rec.matchScore}% Match</Text>
                      </View>
                      <Text style={styles.recDescription}>{rec.description}</Text>
                    </View>
                    
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.tiersScrollContainer}
                      style={styles.tiersContainer}
                      snapToInterval={310}
                      decelerationRate="fast"
                    >
                      
                      <TouchableOpacity
                        onPress={async () => {
                          await trackAffiliateTap(rec.id, rec.tiers.luxury.affiliateUrl);
                          Linking.openURL(rec.tiers.luxury.affiliateUrl);
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        activeOpacity={0.85}
                        style={styles.tierCard}
                      >
                        <LinearGradient
                          colors={['#FCD34D', '#F59E0B']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.tierGradient}
                        >
                          <View style={styles.tierHeader}>
                            <View style={styles.tierTitleRow}>
                              <Award color="#FFF" size={20} strokeWidth={2.5} />
                              <Text style={styles.tierLabel}>Luxury</Text>
                            </View>
                            <Text style={styles.tierPrice}>{rec.tiers.luxury.priceRange}</Text>
                          </View>
                          <Text style={styles.tierGuidance}>{rec.tiers.luxury.guidance}</Text>
                          <View style={styles.shopNowButton}>
                            <ShoppingBag color="#FFF" size={18} strokeWidth={2.5} />
                            <Text style={styles.shopNowText}>Shop Now</Text>
                            <ExternalLink color="#FFF" size={16} strokeWidth={2.5} />
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={async () => {
                          await trackAffiliateTap(rec.id, rec.tiers.medium.affiliateUrl);
                          Linking.openURL(rec.tiers.medium.affiliateUrl);
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        activeOpacity={0.85}
                        style={styles.tierCard}
                      >
                        <LinearGradient
                          colors={['#93C5FD', '#3B82F6']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.tierGradient}
                        >
                          <View style={styles.tierHeader}>
                            <View style={styles.tierTitleRow}>
                              <Star color="#FFF" size={20} strokeWidth={2.5} />
                              <Text style={styles.tierLabel}>Mid-Range</Text>
                            </View>
                            <Text style={styles.tierPrice}>{rec.tiers.medium.priceRange}</Text>
                          </View>
                          <Text style={styles.tierGuidance}>{rec.tiers.medium.guidance}</Text>
                          <View style={styles.shopNowButton}>
                            <ShoppingBag color="#FFF" size={18} strokeWidth={2.5} />
                            <Text style={styles.shopNowText}>Shop Now</Text>
                            <ExternalLink color="#FFF" size={16} strokeWidth={2.5} />
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={async () => {
                          await trackAffiliateTap(rec.id, rec.tiers.budget.affiliateUrl);
                          Linking.openURL(rec.tiers.budget.affiliateUrl);
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        activeOpacity={0.85}
                        style={styles.tierCard}
                      >
                        <LinearGradient
                          colors={['#6EE7B7', '#10B981']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.tierGradient}
                        >
                          <View style={styles.tierHeader}>
                            <View style={styles.tierTitleRow}>
                              <ShoppingBag color="#FFF" size={20} strokeWidth={2.5} />
                              <Text style={styles.tierLabel}>Budget-Friendly</Text>
                            </View>
                            <Text style={styles.tierPrice}>{rec.tiers.budget.priceRange}</Text>
                          </View>
                          <Text style={styles.tierGuidance}>{rec.tiers.budget.guidance}</Text>
                          <View style={styles.shopNowButton}>
                            <ShoppingBag color="#FFF" size={18} strokeWidth={2.5} />
                            <Text style={styles.shopNowText}>Shop Now</Text>
                            <ExternalLink color="#FFF" size={16} strokeWidth={2.5} />
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                ))}
                
                {recommendations.filter(r => r.source === 'glow-coach').length > 0 && (
                  <View style={[styles.sectionContainer, { marginTop: 32 }]}>
                    <View style={styles.sectionHeaderRow}>
                      <Award color={palette.primary} size={20} strokeWidth={2.5} />
                      <Text style={styles.sectionHeaderText}>Glow Coach Recommendations</Text>
                    </View>
                    <Text style={styles.sectionSubtext}>Based on your personalized skincare plan</Text>
                  </View>
                )}
                
                {recommendations.filter(r => r.source === 'glow-coach').map((rec, index) => (
                  <View key={rec.id} style={[styles.recommendationCard, shadow.card]}>
                    {index === 0 && (
                      <View style={styles.premiumBadge}>
                        <Award color="#FFF" size={14} strokeWidth={2.5} />
                        <Text style={styles.premiumBadgeText}>PREMIUM PICK</Text>
                      </View>
                    )}
                    
                    <View style={styles.productImageContainer}>
                      <Image
                        source={{ uri: rec.imageUrl }}
                        style={styles.productRecommendationImage}
                        resizeMode="cover"
                      />
                    </View>
                    
                    <View style={styles.recHeaderSection}>
                      <View style={styles.recTitleRow}>
                        <Text style={styles.recStepName}>{rec.stepName}</Text>
                      </View>
                      {rec.brand && (
                        <Text style={styles.recBrand}>{rec.brand}</Text>
                      )}
                      <View style={styles.matchBadge}>
                        <Star color="#6EE7B7" size={14} fill="#6EE7B7" strokeWidth={2} />
                        <Text style={styles.matchText}>{rec.matchScore}% Match</Text>
                      </View>
                      <Text style={styles.recDescription}>{rec.description}</Text>
                    </View>
                    
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.tiersScrollContainer}
                      style={styles.tiersContainer}
                      snapToInterval={310}
                      decelerationRate="fast"
                    >
                      
                      <TouchableOpacity
                        onPress={async () => {
                          await trackAffiliateTap(rec.id, rec.tiers.luxury.affiliateUrl);
                          Linking.openURL(rec.tiers.luxury.affiliateUrl);
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        activeOpacity={0.85}
                        style={styles.tierCard}
                      >
                        <LinearGradient
                          colors={['#FCD34D', '#F59E0B']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.tierGradient}
                        >
                          <View style={styles.tierHeader}>
                            <View style={styles.tierTitleRow}>
                              <Award color="#FFF" size={20} strokeWidth={2.5} />
                              <Text style={styles.tierLabel}>Luxury</Text>
                            </View>
                            <Text style={styles.tierPrice}>{rec.tiers.luxury.priceRange}</Text>
                          </View>
                          <Text style={styles.tierGuidance}>{rec.tiers.luxury.guidance}</Text>
                          <View style={styles.shopNowButton}>
                            <ShoppingBag color="#FFF" size={18} strokeWidth={2.5} />
                            <Text style={styles.shopNowText}>Shop Now</Text>
                            <ExternalLink color="#FFF" size={16} strokeWidth={2.5} />
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={async () => {
                          await trackAffiliateTap(rec.id, rec.tiers.medium.affiliateUrl);
                          Linking.openURL(rec.tiers.medium.affiliateUrl);
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        activeOpacity={0.85}
                        style={styles.tierCard}
                      >
                        <LinearGradient
                          colors={['#93C5FD', '#3B82F6']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.tierGradient}
                        >
                          <View style={styles.tierHeader}>
                            <View style={styles.tierTitleRow}>
                              <Star color="#FFF" size={20} strokeWidth={2.5} />
                              <Text style={styles.tierLabel}>Mid-Range</Text>
                            </View>
                            <Text style={styles.tierPrice}>{rec.tiers.medium.priceRange}</Text>
                          </View>
                          <Text style={styles.tierGuidance}>{rec.tiers.medium.guidance}</Text>
                          <View style={styles.shopNowButton}>
                            <ShoppingBag color="#FFF" size={18} strokeWidth={2.5} />
                            <Text style={styles.shopNowText}>Shop Now</Text>
                            <ExternalLink color="#FFF" size={16} strokeWidth={2.5} />
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={async () => {
                          await trackAffiliateTap(rec.id, rec.tiers.budget.affiliateUrl);
                          Linking.openURL(rec.tiers.budget.affiliateUrl);
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        activeOpacity={0.85}
                        style={styles.tierCard}
                      >
                        <LinearGradient
                          colors={['#6EE7B7', '#10B981']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.tierGradient}
                        >
                          <View style={styles.tierHeader}>
                            <View style={styles.tierTitleRow}>
                              <ShoppingBag color="#FFF" size={20} strokeWidth={2.5} />
                              <Text style={styles.tierLabel}>Budget-Friendly</Text>
                            </View>
                            <Text style={styles.tierPrice}>{rec.tiers.budget.priceRange}</Text>
                          </View>
                          <Text style={styles.tierGuidance}>{rec.tiers.budget.guidance}</Text>
                          <View style={styles.shopNowButton}>
                            <ShoppingBag color="#FFF" size={18} strokeWidth={2.5} />
                            <Text style={styles.shopNowText}>Shop Now</Text>
                            <ExternalLink color="#FFF" size={16} strokeWidth={2.5} />
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>, gradient: ReturnType<typeof getGradient>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: palette.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.divider,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: palette.textPrimary,
    marginVertical: 8,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: palette.textSecondary,
    letterSpacing: 0.5,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.divider,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: palette.blush,
    borderColor: palette.blush,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: palette.textSecondary,
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: palette.textLight,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF6B9D',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: palette.textLight,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  addButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: palette.textLight,
    letterSpacing: 0.5,
  },
  addProductForm: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: palette.divider,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  input: {
    backgroundColor: palette.backgroundStart,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: palette.textPrimary,
    borderWidth: 1,
    borderColor: palette.divider,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.divider,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: palette.textSecondary,
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: palette.textLight,
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  productsList: {
    gap: 16,
  },
  productCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.divider,
  },
  productHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: palette.backgroundStart,
  },
  productImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: palette.backgroundStart,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.divider,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  productBrand: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: palette.textSecondary,
    marginBottom: 8,
  },
  productBadge: {
    alignSelf: 'flex-start',
    backgroundColor: palette.overlayBlush,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  productBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: palette.blush,
    textTransform: 'capitalize' as const,
    letterSpacing: 0.5,
  },
  productRating: {
    flexDirection: 'row',
    gap: 4,
  },
  revenueCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
  },
  revenueCardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  revenueIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  revenueTitle: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: palette.textLight,
    marginBottom: 8,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  revenueSubtitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  recommendationCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.divider,
    marginBottom: 16,
  },
  premiumBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '900' as const,
    color: '#FFF',
    letterSpacing: 1,
  },
  productImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: palette.backgroundStart,
  },
  productRecommendationImage: {
    width: '100%',
    height: '100%',
  },
  recHeaderSection: {
    padding: 20,
    paddingBottom: 16,
  },
  recTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  recStepName: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: palette.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  recBrand: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: palette.textSecondary,
    marginBottom: 12,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(110, 231, 183, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  matchText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#059669',
    letterSpacing: 0.3,
  },
  recDescription: {
    fontSize: 15,
    color: palette.textSecondary,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  tiersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tiersScrollContainer: {
    gap: 16,
    paddingRight: 20,
  },
  tierCard: {
    width: 290,
    borderRadius: 24,
    overflow: 'hidden',
  },
  tierGradient: {
    padding: 24,
    minHeight: 200,
  },
  tierHeader: {
    marginBottom: 12,
  },
  tierTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  tierLabel: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#FFF',
    letterSpacing: 0.3,
  },
  tierPrice: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tierGuidance: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 20,
    fontWeight: '500' as const,
    marginBottom: 16,
  },
  shopNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  shopNowText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSubtext: {
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
});
