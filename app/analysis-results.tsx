import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Sparkles, Award, Crown, Share2, TrendingUp, Heart, Star, Gem } from 'lucide-react-native';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';
import BlurredContent from '@/components/BlurredContent';
import { useProducts } from '@/contexts/ProductContext';

export default function AnalysisResultsScreen() {
  const { currentResult, analysisHistory } = useAnalysis();
  const { canViewResults, incrementScanCount } = useSubscription();
  const { theme } = useTheme();
  const { generateRecommendations, recommendations } = useProducts();
  const [revealedScore, setRevealedScore] = useState<number>(0);
  const [badge, setBadge] = useState<string>('');
  const [rankPercent, setRankPercent] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [streakProtected, setStreakProtected] = useState<boolean>(false);
  const scoreAnim = useRef(new Animated.Value(0)).current;
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = createStyles(palette);

  const handleStartPlan = () => {
    router.push('/skincare-plan-selection');
  };

  const handleViewProducts = () => {
    router.push('/product-tracking');
  };



  const hasCountedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentResult) return;

    if (hasCountedRef.current !== String(currentResult.timestamp)) {
      hasCountedRef.current = String(currentResult.timestamp);
      incrementScanCount();
      
      generateRecommendations(currentResult);
    }

    const s = currentResult.overallScore;
    setBadge(getBadgeForScore(s));
    setRankPercent(getMockRankPercent(s));
    updateStreak();
    scoreAnim.stopAnimation();
    scoreAnim.setValue(0);
    const sub = scoreAnim.addListener(({ value }) => {
      setRevealedScore(Math.round(value));
    });
    Animated.timing(scoreAnim, {
      toValue: s,
      duration: 1400,
      useNativeDriver: false,
    }).start();
    return () => {
      scoreAnim.removeListener(sub);
      scoreAnim.stopAnimation();
    };
  }, [currentResult?.timestamp, scoreAnim]);

  const previousScore = useMemo(() => {
    if (!analysisHistory || analysisHistory.length === 0 || !currentResult) return null as number | null;
    const prev = analysisHistory.find(r => r.timestamp < currentResult.timestamp);
    return prev ? prev.overallScore : null;
  }, [analysisHistory, currentResult]);

  const scoreDelta = useMemo(() => {
    if (previousScore === null || !currentResult) return null as number | null;
    return currentResult.overallScore - (previousScore ?? 0);
  }, [previousScore, currentResult]);

  const onShare = async () => {
    try {
      if (!currentResult) return;
      
      const shareContent = createShareContent(currentResult, badge);
      await Share.share({
        message: shareContent.message,
        title: shareContent.title,
        url: shareContent.url
      });
    } catch (e) {
      console.log('[Share] error', e);
    }
  };

  const createShareContent = (result: typeof currentResult, badgeText: string) => {
    if (!result) return { message: '', title: '', url: '' };
    
    const scoreEmoji = result.overallScore >= 90 ? '💎' : 
                      result.overallScore >= 85 ? '💫' : 
                      result.overallScore >= 80 ? '✨' : 
                      result.overallScore >= 75 ? '🌟' : '⭐';
    
    const improvements = [];
    if (result.detailedScores.brightnessGlow >= 85) improvements.push('✨ Radiant Glow');
    if (result.detailedScores.facialSymmetry >= 85) improvements.push('🎯 Perfect Symmetry');
    if (result.detailedScores.jawlineSharpness >= 85) improvements.push('💪 Sharp Jawline');
    if (result.detailedScores.hydrationLevel >= 85) improvements.push('💧 Hydrated Skin');
    
    const improvementText = improvements.length > 0 ? 
      `\n\nMy strengths: ${improvements.slice(0, 2).join(', ')}` : '';
    
    const confidenceText = result.confidence >= 0.9 ? 
      '\n\n📊 Analysis Confidence: 95%+' : '';
    
    return {
      message: `${scoreEmoji} Just got my Glow Score: ${result.overallScore}/100!\n\n🏆 Achievement: ${badgeText}\n${result.rating}${improvementText}${confidenceText}\n\n✨ Ready to discover your glow? Try GlowCheck AI!`,
      title: `My Glow Score: ${result.overallScore}/100 ${scoreEmoji}`,
      url: 'https://glowcheck.ai' // Replace with actual app URL
    };
  };

  function getBadgeForScore(score: number): string {
    if (score >= 90) return 'Diamond Glow';
    if (score >= 80) return 'Gold Glow';
    if (score >= 70) return 'Silver Glow';
    if (score >= 60) return 'Bronze Glow';
    return 'Rising Glow';
  }

  function getMockRankPercent(score: number): number {
    const pct = Math.max(1, Math.min(99, Math.round(100 - score)));
    return pct;
  }

  const updateStreak = async () => {
    try {
      const today = new Date();
      const key = 'glow_streak_state_v1';
      const raw = await AsyncStorage.getItem(key);
      const state = raw ? (JSON.parse(raw) as { streak: number; lastDate: string }) : { streak: 0, lastDate: '' };
      const last = state.lastDate ? new Date(state.lastDate) : null;
      const sameDay = !!last && last.toDateString() === today.toDateString();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const isYesterday = !!last && last.toDateString() === yesterday.toDateString();
      let newStreak = state.streak;
      if (!last) newStreak = 1;
      else if (sameDay) newStreak = state.streak;
      else if (isYesterday) newStreak = state.streak + 1;
      else newStreak = 1;
      await AsyncStorage.setItem(key, JSON.stringify({ streak: newStreak, lastDate: today.toISOString() }));
      setStreak(newStreak);
      setStreakProtected(newStreak >= 7);
    } catch (e) {
      console.log('[Streak] error', e);
    }
  };

  if (!currentResult) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
        <Stack.Screen options={{ title: 'Analysis Results', headerBackTitle: 'Back' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No analysis results found</Text>
          <TouchableOpacity style={styles.ctaButtonPrimary} onPress={() => router.push('/glow-analysis')}>
            <Text style={styles.ctaButtonPrimaryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const detailedScoresArray = [
    { name: 'Jawline Sharpness', score: currentResult.detailedScores.jawlineSharpness, color: palette.primary, icon: Crown },
    { name: 'Brightness & Glow', score: currentResult.detailedScores.brightnessGlow, color: palette.blush, icon: Sparkles },
    { name: 'Hydration Level', score: currentResult.detailedScores.hydrationLevel, color: palette.mint, icon: Heart },
    { name: 'Facial Symmetry', score: currentResult.detailedScores.facialSymmetry, color: palette.success, icon: Star },
    { name: 'Pore Visibility', score: currentResult.detailedScores.poreVisibility, color: palette.rose, icon: Gem },
    { name: 'Skin Texture', score: currentResult.detailedScores.skinTexture, color: palette.lavender, icon: Sparkles },
    { name: 'Skin Evenness', score: currentResult.detailedScores.evenness, color: palette.peach, icon: Award },
    { name: 'Skin Elasticity', score: currentResult.detailedScores.elasticity, color: palette.champagne, icon: TrendingUp },
  ];

  const resultsContent = (
    <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap} testID="hero-wrap">
          <LinearGradient colors={gradient.card} style={styles.glassCard}>
            <View style={styles.heroHeader}>
              <View style={styles.badgePill}>
                <Award color={palette.primary} size={16} strokeWidth={2.5} />
                <Text style={styles.badgePillText}>{badge}</Text>
              </View>
              <TouchableOpacity onPress={onShare} style={styles.shareBtn} testID="share-glow">
                <View style={styles.shareBtnContent}>
                  <Share2 color={palette.primary} size={18} strokeWidth={2.5} />
                  <Text style={styles.shareBtnText}>Share</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <View style={styles.imageContainer}>
              <Image source={{ uri: currentResult.imageUri }} style={styles.profileImageLarge} />
              <View style={styles.imageGlow} />
            </View>
            
            <Text style={styles.overallLabel}>Your Beautiful Glow Score</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreNumber} testID="animated-score">{revealedScore}</Text>
              <Text style={styles.scoreOutOf}>/100</Text>
            </View>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <TrendingUp color={palette.success} size={16} strokeWidth={2.5} />
                <Text style={styles.metaText}>{scoreDelta === null ? '—' : scoreDelta! >= 0 ? `+${scoreDelta}` : `${scoreDelta}`}</Text>
              </View>
              <View style={styles.metaItem}>
                <Crown color={palette.champagne} size={16} strokeWidth={2.5} />
                <Text style={styles.metaText}>Top {rankPercent}%</Text>
              </View>
              <View style={styles.metaItem}>
                <Sparkles color={palette.blush} size={16} fill={palette.blush} strokeWidth={2.5} />
                <Text style={styles.metaText}>{currentResult.rating}</Text>
              </View>
            </View>
            
            <View style={styles.streakRow}>
              <Text style={styles.streakText}>✨ {streak} day streak</Text>
              {streakProtected && <Text style={styles.streakProtect}>🛡️ Protected</Text>}
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles color={palette.primary} size={20} fill={palette.primary} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Comprehensive Analysis</Text>
          </View>
          <View style={styles.analysisGrid}>
            <View style={styles.analysisRow}>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Skin Potential</Text>
                <Text style={styles.analysisValue}>{currentResult.skinPotential}</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Skin Quality</Text>
                <Text style={styles.analysisValue}>{currentResult.skinQuality}</Text>
              </View>
            </View>
            <View style={styles.analysisRow}>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Skin Tone</Text>
                <Text style={styles.analysisValue}>{currentResult.skinTone}</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Skin Type</Text>
                <Text style={styles.analysisValue}>{currentResult.skinType}</Text>
              </View>
            </View>
            <View style={styles.analysisRow}>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Confidence Level</Text>
                <Text style={styles.analysisValue}>{Math.round(currentResult.confidence * 100)}%</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Acne Risk</Text>
                <Text
                  style={[
                    styles.analysisValue,
                    {
                      color:
                        currentResult.dermatologyInsights.acneRisk === 'Low'
                          ? palette.success
                          : currentResult.dermatologyInsights.acneRisk === 'Medium'
                          ? palette.warning
                          : palette.error,
                    },
                  ]}
                >
                  {currentResult.dermatologyInsights.acneRisk}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 Detailed Beauty Scores</Text>
          </View>
          <View style={styles.scoresContainer}>
            {detailedScoresArray.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <View key={index} style={styles.scoreItem}>
                  <View style={styles.scoreHeader}>
                    <View style={[styles.scoreIcon, { backgroundColor: `${item.color}20` }]}>
                      <IconComponent color={item.color} size={18} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.scoreItemName}>{item.name}</Text>
                    <Text style={[styles.scorePercentage, { color: item.color }]}>{item.score}%</Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBackground}>
                      <View style={[styles.progressBar, { width: `${item.score}%`, backgroundColor: item.color }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🧠 Personalized Beauty Tips</Text>
            <Sparkles color={palette.primary} size={16} fill={palette.primary} strokeWidth={2.5} />
          </View>
          <View style={styles.tipsContainer}>
            {currentResult.personalizedTips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={styles.tipNumber}>
                  <Text style={styles.tipNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.ctaButtonPrimary} onPress={handleStartPlan} testID="start-plan">
            <Sparkles color={palette.textLight} size={20} fill={palette.textLight} strokeWidth={2.5} />
            <Text style={styles.ctaButtonPrimaryText}>Start Your Glow Journey</Text>
          </TouchableOpacity>

          {recommendations.length > 0 && (
            <TouchableOpacity style={styles.ctaButtonProduct} onPress={handleViewProducts}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.ctaButtonProductGradient}>
                <Award color={palette.textLight} size={20} strokeWidth={2.5} />
                <View style={styles.ctaButtonProductContent}>
                  <Text style={styles.ctaButtonProductTitle}>View {recommendations.length} Product Recommendations</Text>
                  <Text style={styles.ctaButtonProductSubtitle}>Personalized for your skin analysis</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.ctaButtonSecondary} onPress={onShare} testID="share-button">
            <View style={styles.shareButtonContent}>
              <Share2 color={palette.primary} size={18} strokeWidth={2.5} />
              <Text style={styles.ctaButtonSecondaryText}>Share Your Glow Score</Text>
              <View style={styles.sharePreview}>
                <Text style={styles.sharePreviewText}>
                  {currentResult?.overallScore}/100 {getBadgeForScore(currentResult?.overallScore || 0)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.disclaimer}>
            ✨ This analysis is for beauty enhancement purposes. For medical concerns, please consult a dermatologist.
          </Text>
        </View>
      </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      <Stack.Screen options={{ title: 'Analysis Results', headerBackTitle: 'Back' }} />
      
      <BlurredContent 
        message="Upgrade to Premium to view your detailed analysis results"
        testID="blurred-results"
      >
        {resultsContent}
      </BlurredContent>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  heroWrap: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  glassCard: {
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.elevated,
    alignItems: 'center',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.overlayBlush,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  badgePillText: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  shareBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: palette.overlayGold,
    borderWidth: 1,
    borderColor: palette.primary,
    ...shadow.card,
  },
  shareBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareBtnText: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  shareButtonContent: {
    alignItems: 'center',
    gap: 8,
  },
  sharePreview: {
    backgroundColor: palette.overlayLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.divider,
  },
  sharePreviewText: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  profileImageLarge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: palette.primary,
    ...shadow.elevated,
  },
  imageGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 78,
    backgroundColor: palette.overlayGold,
    zIndex: -1,
  },
  overallLabel: {
    fontSize: 18,
    color: palette.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 24,
  },
  scoreNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: palette.primary,
    letterSpacing: -2,
  },
  scoreOutOf: {
    fontSize: 24,
    color: palette.textSecondary,
    marginLeft: 8,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.overlayLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.divider,
    ...shadow.card,
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
  },
  metaText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  streakText: {
    color: palette.blush,
    fontSize: 14,
    fontWeight: '700',
  },
  streakProtect: {
    color: palette.success,
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.textPrimary,
    letterSpacing: 0.3,
  },
  analysisGrid: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  analysisRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  analysisItem: {
    flex: 1,
    marginRight: 16,
  },
  analysisLabel: {
    fontSize: 14,
    color: palette.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  analysisValue: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.primary,
    letterSpacing: 0.2,
  },
  scoresContainer: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  scoreItem: {
    marginBottom: 20,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scoreItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
    flex: 1,
    letterSpacing: 0.2,
  },
  progressContainer: {
    marginLeft: 44,
  },
  progressBackground: {
    height: 8,
    backgroundColor: palette.surfaceElevated,
    borderRadius: 20,
    ...shadow.card,
  },
  progressBar: {
    height: '100%',
    borderRadius: 20,
  },
  scorePercentage: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tipsContainer: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tipNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
    ...shadow.card,
  },
  tipNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: palette.textLight,
  },
  tipText: {
    flex: 1,
    fontSize: 16,
    color: palette.textPrimary,
    lineHeight: 24,
    fontWeight: '500',
  },
  ctaSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  ctaButtonPrimary: {
    flexDirection: 'row',
    backgroundColor: palette.primary,
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
    ...shadow.elevated,
    minHeight: 60,
  },
  ctaButtonPrimaryText: {
    color: palette.textLight,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  ctaButtonSecondary: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: palette.primary,
    ...shadow.card,
    minHeight: 56,
  },
  ctaButtonSecondaryText: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: palette.textMuted,
    marginBottom: 20,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 13,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
  ctaButtonProduct: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 12,
    ...shadow.elevated,
  },
  ctaButtonProductGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 16,
  },
  ctaButtonProductContent: {
    flex: 1,
  },
  ctaButtonProductTitle: {
    color: palette.textLight,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  ctaButtonProductSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
});