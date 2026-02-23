import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import {
  ArrowLeft,
  Sparkles,
  Star,
  ShoppingBag,
  TrendingUp,
  ChevronRight,
} from 'lucide-react-native';
import { useProducts } from '@/contexts/ProductContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';
import { ProductRecommendation } from '@/types/product';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 20;

export default function AllRecommendationsScreen() {
  const { theme } = useTheme();
  const { recommendations, isLoadingRecommendations } = useProducts();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  const sortedRecommendations = useMemo(() => {
    if (!recommendations) return [];
    return [...recommendations].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [recommendations]);

  const styles = createStyles(palette, gradient);

  const handleProductPress = (rec: ProductRecommendation) => {
    router.push({
      pathname: '/product-details',
      params: { id: rec.id },
    });
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return palette.success;
    if (score >= 60) return palette.gold;
    return palette.textSecondary;
  };

  const getMatchLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    return 'Fair Match';
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft color={palette.textPrimary} size={24} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Sparkles color={palette.gold} size={24} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Your Top Matches</Text>
            <Text style={styles.headerSubtitle}>
              {sortedRecommendations.length} personalized recommendations
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoadingRecommendations ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading recommendations...</Text>
          </View>
        ) : sortedRecommendations.length > 0 ? (
          <View style={styles.productsGrid}>
            {sortedRecommendations.map((rec, index) => {
              const matchScore = rec.matchScore || 0;
              const matchColor = getMatchColor(matchScore);
              
              return (
                <TouchableOpacity
                  key={rec.id}
                  style={styles.productCard}
                  onPress={() => handleProductPress(rec)}
                  activeOpacity={0.9}
                >
                  {/* Match Badge */}
                  <View style={[styles.matchBadge, { backgroundColor: `${matchColor}20` }]}>
                    <Star color={matchColor} size={14} fill={matchColor} />
                    <Text style={[styles.matchBadgeText, { color: matchColor }]}>
                      {matchScore}% Match
                    </Text>
                  </View>

                  {/* Product Image */}
                  <View style={styles.productImageContainer}>
                    {rec.imageUrl ? (
                      <Image
                        source={{ uri: rec.imageUrl }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <Text style={styles.productImagePlaceholderText}>No Image</Text>
                      </View>
                    )}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.3)']}
                      style={styles.imageOverlay}
                    />
                  </View>

                  {/* Product Info */}
                  <View style={styles.productInfo}>
                    <View style={styles.productHeader}>
                      <View style={styles.productTitleContainer}>
                        <Text style={styles.productBrand} numberOfLines={1}>
                          {rec.brand?.toUpperCase() || 'BRAND'}
                        </Text>
                        <Text style={styles.productName} numberOfLines={2}>
                          {rec.name}
                        </Text>
                      </View>
                      <ChevronRight color={palette.textMuted} size={20} />
                    </View>

                    {/* Match Score Bar */}
                    <View style={styles.matchScoreContainer}>
                      <View style={styles.matchScoreBar}>
                        <View
                          style={[
                            styles.matchScoreFill,
                            { width: `${matchScore}%`, backgroundColor: matchColor },
                          ]}
                        />
                      </View>
                      <Text style={styles.matchLabel}>{getMatchLabel(matchScore)}</Text>
                    </View>

                    {/* Category and Price */}
                    <View style={styles.productMeta}>
                      <View style={styles.categoryBadge}>
                        <ShoppingBag color={palette.textSecondary} size={12} />
                        <Text style={styles.categoryText}>{rec.category}</Text>
                      </View>
                      {rec.price && (
                        <Text style={styles.productPrice}>{rec.price}</Text>
                      )}
                    </View>

                    {/* Key Benefits */}
                    {rec.keyBenefits && rec.keyBenefits.length > 0 && (
                      <View style={styles.benefitsContainer}>
                        {rec.keyBenefits.slice(0, 2).map((benefit, idx) => (
                          <View key={idx} style={styles.benefitTag}>
                            <TrendingUp color={palette.gold} size={12} />
                            <Text style={styles.benefitText} numberOfLines={1}>
                              {benefit}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <ShoppingBag size={48} color={palette.textSecondary} />
            <Text style={styles.emptyTitle}>No Recommendations Yet</Text>
            <Text style={styles.emptySubtitle}>
              Scan your skin to get personalized product recommendations
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => router.push('/(tabs)/glow-analysis')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[palette.primary, palette.primaryDark || palette.primary]}
                style={styles.scanButtonGradient}
              >
                <Text style={styles.scanButtonText}>Scan Your Skin</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>, gradient: ReturnType<typeof getGradient>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.backgroundStart,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: CARD_PADDING,
      paddingVertical: 16,
      gap: 12,
    },
    backButton: {
      padding: 8,
    },
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(201, 169, 97, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: palette.textPrimary,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 14,
      color: palette.textSecondary,
      marginTop: 2,
    },
    scrollContent: {
      padding: CARD_PADDING,
      paddingTop: 8,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: palette.textSecondary,
      fontWeight: '500',
    },
    productsGrid: {
      gap: 20,
    },
    productCard: {
      backgroundColor: palette.surface,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: palette.border,
      ...shadow.medium,
    },
    matchBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      zIndex: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      ...shadow.soft,
    },
    matchBadgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    productImageContainer: {
      width: '100%',
      height: 200,
      position: 'relative',
    },
    productImage: {
      width: '100%',
      height: '100%',
    },
    productImagePlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: palette.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },
    productImagePlaceholderText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: palette.textMuted,
    },
    imageOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
    },
    productInfo: {
      padding: 16,
      gap: 12,
    },
    productHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    productTitleContainer: {
      flex: 1,
    },
    productBrand: {
      fontSize: 11,
      fontWeight: '600',
      color: palette.textMuted,
      letterSpacing: 1,
      marginBottom: 4,
    },
    productName: {
      fontSize: 18,
      fontWeight: '700',
      color: palette.textPrimary,
      lineHeight: 24,
    },
    matchScoreContainer: {
      gap: 6,
    },
    matchScoreBar: {
      height: 6,
      backgroundColor: palette.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    matchScoreFill: {
      height: '100%',
      borderRadius: 3,
    },
    matchLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: palette.textSecondary,
    },
    productMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: palette.surfaceAlt,
      borderRadius: 12,
    },
    categoryText: {
      fontSize: 12,
      fontWeight: '600',
      color: palette.textSecondary,
    },
    productPrice: {
      fontSize: 16,
      fontWeight: '700',
      color: palette.textPrimary,
    },
    benefitsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    benefitTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: 'rgba(201, 169, 97, 0.1)',
      borderRadius: 12,
    },
    benefitText: {
      fontSize: 12,
      fontWeight: '600',
      color: palette.gold,
    },
    emptyContainer: {
      padding: 60,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.textPrimary,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: palette.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    scanButton: {
      marginTop: 8,
      borderRadius: 16,
      overflow: 'hidden',
      ...shadow.medium,
    },
    scanButtonGradient: {
      paddingHorizontal: 32,
      paddingVertical: 16,
    },
    scanButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });

