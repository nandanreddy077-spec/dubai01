import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft,
  TrendingUp,
  Heart,
  Bookmark,
  Share,
  Clock,
  Users,
  Sparkles,
  Crown,
  File,
  Star,
  Eye,
  Calendar
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getPalette, getGradient, shadow, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { generateText } from '@rork-ai/toolkit-sdk';

const { width } = Dimensions.get('window');

interface BeautyTrend {
  id: string;
  title: string;
  description: string;
  category: 'skincare' | 'makeup' | 'haircare' | 'wellness' | 'fashion';
  popularity: number;
  timeframe: 'daily' | 'weekly' | 'monthly';
  image?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedCost: 'low' | 'medium' | 'high';
  createdAt: Date;
  engagement: {
    likes: number;
    saves: number;
    tries: number;
  };
}

const TREND_CATEGORIES = [
  { id: 'all', title: 'All Trends', icon: Sparkles, color: '#D4A574' },
  { id: 'skincare', title: 'Skincare', icon: Heart, color: '#F2C2C2' },
  { id: 'makeup', title: 'Makeup', icon: Crown, color: '#E8D5F0' },
  { id: 'haircare', title: 'Hair Care', icon: Star, color: '#D4F0E8' },
  { id: 'wellness', title: 'Wellness', icon: File, color: '#F5D5C2' },
  { id: 'fashion', title: 'Fashion', icon: Eye, color: '#E8A87C' },
];

const MOCK_TRENDS: BeautyTrend[] = [
  {
    id: '1',
    title: 'Glass Skin Routine 2.0',
    description: 'The evolved Korean glass skin routine with new hydrating serums and techniques for that perfect dewy glow.',
    category: 'skincare',
    popularity: 95,
    timeframe: 'weekly',
    tags: ['korean-beauty', 'hydration', 'glow', 'dewy-skin'],
    difficulty: 'intermediate',
    estimatedCost: 'medium',
    createdAt: new Date(),
    engagement: { likes: 12500, saves: 3200, tries: 8900 }
  },
  {
    id: '2',
    title: 'Sunset Blush Technique',
    description: 'Gradient blush application mimicking sunset colors for a natural, sun-kissed look that\'s taking social media by storm.',
    category: 'makeup',
    popularity: 88,
    timeframe: 'daily',
    tags: ['blush', 'gradient', 'sunset', 'natural-makeup'],
    difficulty: 'beginner',
    estimatedCost: 'low',
    createdAt: new Date(),
    engagement: { likes: 9800, saves: 2100, tries: 5600 }
  },
  {
    id: '3',
    title: 'Scalp Massage Rituals',
    description: 'Ancient Ayurvedic scalp massage techniques combined with modern oils for hair growth and stress relief.',
    category: 'haircare',
    popularity: 82,
    timeframe: 'weekly',
    tags: ['scalp-care', 'ayurveda', 'hair-growth', 'wellness'],
    difficulty: 'beginner',
    estimatedCost: 'low',
    createdAt: new Date(),
    engagement: { likes: 7200, saves: 1800, tries: 4300 }
  },
  {
    id: '4',
    title: 'Facial Gua Sha Evolution',
    description: 'Next-level gua sha techniques with heated stones and lymphatic drainage patterns for maximum sculpting.',
    category: 'wellness',
    popularity: 79,
    timeframe: 'monthly',
    tags: ['gua-sha', 'facial-massage', 'lymphatic', 'sculpting'],
    difficulty: 'advanced',
    estimatedCost: 'medium',
    createdAt: new Date(),
    engagement: { likes: 6500, saves: 1500, tries: 3200 }
  },
  {
    id: '5',
    title: 'Dopamine Dressing Beauty',
    description: 'Bright, mood-boosting makeup and nail colors that complement the dopamine dressing fashion trend.',
    category: 'fashion',
    popularity: 76,
    timeframe: 'daily',
    tags: ['dopamine-dressing', 'bright-colors', 'mood-boosting', 'nails'],
    difficulty: 'intermediate',
    estimatedCost: 'medium',
    createdAt: new Date(),
    engagement: { likes: 5800, saves: 1200, tries: 2900 }
  }
];

export default function TrendsScreen() {
  const { theme } = useTheme();
  const { state } = useSubscription();
  const hasActiveSubscription = state.isPremium;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [trends, setTrends] = useState<BeautyTrend[]>(MOCK_TRENDS);
  const [refreshing, setRefreshing] = useState(false);
  const [savedTrends, setSavedTrends] = useState<string[]>([]);
  const [isGeneratingTrends, setIsGeneratingTrends] = useState(false);
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  const filteredTrends = selectedCategory === 'all' 
    ? trends 
    : trends.filter(trend => trend.category === selectedCategory);

  const generateWeeklyTrends = async () => {
    if (!hasActiveSubscription) {
      router.push('/subscribe');
      return;
    }

    setIsGeneratingTrends(true);
    try {
      const trendPrompt = `Generate 3 new beauty trends for this week. Consider current social media trends, seasonal changes, and emerging beauty techniques. 
      
      For each trend, provide:
      - Catchy title
      - Detailed description (2-3 sentences)
      - Category (skincare, makeup, haircare, wellness, or fashion)
      - 3-4 relevant tags
      - Difficulty level
      - Estimated cost
      
      Make them fresh, innovative, and achievable for everyday beauty enthusiasts.`;

      const response = await generateText(trendPrompt);
      
      // Parse AI response and create trend objects
      // This is a simplified version - in production, you'd have better parsing
      const newTrends: BeautyTrend[] = [
        {
          id: Date.now().toString(),
          title: 'AI-Generated Trend',
          description: response.substring(0, 200) + '...',
          category: 'skincare',
          popularity: Math.floor(Math.random() * 20) + 80,
          timeframe: 'weekly',
          tags: ['ai-generated', 'fresh', 'trending'],
          difficulty: 'intermediate',
          estimatedCost: 'medium',
          createdAt: new Date(),
          engagement: {
            likes: Math.floor(Math.random() * 5000) + 1000,
            saves: Math.floor(Math.random() * 1000) + 200,
            tries: Math.floor(Math.random() * 2000) + 500
          }
        }
      ];
      
      setTrends(prev => [...newTrends, ...prev]);
    } catch (error) {
      console.error('Error generating trends:', error);
    } finally {
      setIsGeneratingTrends(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleSaveTrend = (trendId: string) => {
    setSavedTrends(prev => 
      prev.includes(trendId) 
        ? prev.filter(id => id !== trendId)
        : [...prev, trendId]
    );
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = TREND_CATEGORIES.find(cat => cat.id === category);
    return categoryData?.icon || Sparkles;
  };

  const getCategoryColor = (category: string) => {
    const categoryData = TREND_CATEGORIES.find(cat => cat.id === category);
    return categoryData?.color || '#D4A574';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderTrendCard = (trend: BeautyTrend) => {
    const CategoryIcon = getCategoryIcon(trend.category);
    const isSaved = savedTrends.includes(trend.id);
    
    return (
      <View key={trend.id} style={styles.trendCard}>
        <LinearGradient 
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']} 
          style={styles.trendCardGradient}
        >
          {/* Header */}
          <View style={styles.trendHeader}>
            <View style={styles.trendCategory}>
              <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(trend.category) + '20' }]}>
                <CategoryIcon color={getCategoryColor(trend.category)} size={16} />
              </View>
              <Text style={[styles.categoryText, { color: getCategoryColor(trend.category) }]}>
                {trend.category.charAt(0).toUpperCase() + trend.category.slice(1)}
              </Text>
            </View>
            
            <View style={styles.trendActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleSaveTrend(trend.id)}
              >
                <Bookmark 
                  color={isSaved ? '#D4A574' : 'rgba(255, 255, 255, 0.6)'} 
                  size={18} 
                  fill={isSaved ? '#D4A574' : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Share color="rgba(255, 255, 255, 0.6)" size={18} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View style={styles.trendContent}>
            <Text style={styles.trendTitle}>{trend.title}</Text>
            <Text style={styles.trendDescription}>{trend.description}</Text>
            
            {/* Tags */}
            <View style={styles.tagsContainer}>
              {trend.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
            
            {/* Metadata */}
            <View style={styles.trendMetadata}>
              <View style={styles.metadataRow}>
                <View style={styles.metadataItem}>
                  <TrendingUp color="#10B981" size={14} />
                  <Text style={styles.metadataText}>{trend.popularity}% trending</Text>
                </View>
                
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(trend.difficulty) + '20' }]}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(trend.difficulty) }]}>
                    {trend.difficulty}
                  </Text>
                </View>
                
                <View style={[styles.costBadge, { backgroundColor: getCostColor(trend.estimatedCost) + '20' }]}>
                  <Text style={[styles.costText, { color: getCostColor(trend.estimatedCost) }]}>
                    {trend.estimatedCost} cost
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Engagement */}
            <View style={styles.engagementRow}>
              <View style={styles.engagementItem}>
                <Heart color="#EF4444" size={14} fill="#EF4444" />
                <Text style={styles.engagementText}>{(trend.engagement.likes / 1000).toFixed(1)}k</Text>
              </View>
              
              <View style={styles.engagementItem}>
                <Bookmark color="#F59E0B" size={14} />
                <Text style={styles.engagementText}>{(trend.engagement.saves / 1000).toFixed(1)}k</Text>
              </View>
              
              <View style={styles.engagementItem}>
                <Users color="#8B5CF6" size={14} />
                <Text style={styles.engagementText}>{(trend.engagement.tries / 1000).toFixed(1)}k tried</Text>
              </View>
              
              <View style={styles.engagementItem}>
                <Clock color="rgba(255, 255, 255, 0.6)" size={14} />
                <Text style={styles.engagementText}>{trend.timeframe}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={palette.textPrimary} size={24} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <LinearGradient colors={gradient.primary} style={styles.headerIcon}>
            <TrendingUp color={palette.textLight} size={20} />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>Beauty Trends</Text>
            <Text style={styles.headerSubtitle}>Stay ahead of the curve</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.generateButton}
          onPress={generateWeeklyTrends}
          disabled={isGeneratingTrends}
        >
          <LinearGradient colors={gradient.primary} style={styles.generateButtonGradient}>
            <Sparkles color={palette.textLight} size={16} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {TREND_CATEGORIES.map((category) => {
          const CategoryIcon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                isSelected && styles.selectedCategoryButton,
                { borderColor: category.color }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <CategoryIcon 
                color={isSelected ? palette.textLight : category.color} 
                size={18} 
              />
              <Text style={[
                styles.categoryButtonText,
                isSelected && styles.selectedCategoryButtonText
              ]}>
                {category.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Trends List */}
      <ScrollView 
        style={styles.trendsContainer}
        contentContainerStyle={styles.trendsContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={palette.primary}
          />
        }
      >
        {/* Weekly Trends Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <File color="#EF4444" size={20} />
            <Text style={styles.sectionTitle}>This Week&apos;s Hottest Trends</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            {filteredTrends.length} trending {selectedCategory === 'all' ? 'beauty' : selectedCategory} topics
          </Text>
        </View>

        {/* Premium Notice */}
        {!hasActiveSubscription && (
          <TouchableOpacity 
            style={styles.premiumNotice}
            onPress={() => router.push('/subscribe')}
          >
            <LinearGradient colors={gradient.primary} style={styles.premiumNoticeGradient}>
              <Crown color={palette.textLight} size={20} />
              <View style={styles.premiumNoticeContent}>
                <Text style={styles.premiumNoticeTitle}>Unlock Premium Trends</Text>
                <Text style={styles.premiumNoticeText}>
                  Get personalized trend recommendations and early access to emerging beauty trends
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Trends */}
        {filteredTrends.map(renderTrendCard)}
        
        {filteredTrends.length === 0 && (
          <View style={styles.emptyState}>
            <TrendingUp color="rgba(255, 255, 255, 0.3)" size={48} />
            <Text style={styles.emptyStateTitle}>No trends found</Text>
            <Text style={styles.emptyStateText}>
              Check back later for the latest {selectedCategory} trends
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0D10',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.glow,
  },
  headerTitle: {
    fontSize: typography.h5,
    fontWeight: typography.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: typography.medium,
  },
  generateButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  generateButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: spacing.xs,
  },
  selectedCategoryButton: {
    backgroundColor: '#D4A574',
    borderColor: '#D4A574',
  },
  categoryButtonText: {
    fontSize: typography.bodySmall,
    fontWeight: typography.semibold,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
  },
  trendsContainer: {
    flex: 1,
  },
  trendsContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  sectionHeader: {
    marginBottom: spacing.xl,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.h4,
    fontWeight: typography.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: typography.medium,
  },
  premiumNotice: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadow.elevated,
  },
  premiumNoticeGradient: {
    flexDirection: 'row',
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  premiumNoticeContent: {
    flex: 1,
  },
  premiumNoticeTitle: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  premiumNoticeText: {
    fontSize: typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  trendCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadow.elevated,
  },
  trendCardGradient: {
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  trendCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: typography.bodySmall,
    fontWeight: typography.semibold,
    textTransform: 'capitalize',
  },
  trendActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContent: {
    gap: spacing.md,
  },
  trendTitle: {
    fontSize: typography.h5,
    fontWeight: typography.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  trendDescription: {
    fontSize: typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    fontWeight: typography.regular,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: 'rgba(212, 165, 116, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.3)',
  },
  tagText: {
    fontSize: typography.caption,
    color: '#D4A574',
    fontWeight: typography.semibold,
  },
  trendMetadata: {
    gap: spacing.sm,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metadataText: {
    fontSize: typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.medium,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: typography.caption,
    fontWeight: typography.semibold,
    textTransform: 'capitalize',
  },
  costBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  costText: {
    fontSize: typography.caption,
    fontWeight: typography.semibold,
    textTransform: 'capitalize',
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  engagementText: {
    fontSize: typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: typography.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxxl,
    gap: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.h5,
    fontWeight: typography.bold,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  emptyStateText: {
    fontSize: typography.body,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});