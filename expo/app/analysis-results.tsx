import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Sparkles, Award, Crown, Share2, TrendingUp, Heart, Star, Gem, ChevronRight, Zap, Target } from 'lucide-react-native';
import { useAnalysis, AnalysisResult } from '@/contexts/AnalysisContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';
import BlurredContent from '@/components/BlurredContent';
import BlurredResultsOverlay from '@/components/BlurredResultsOverlay';
import HardPaywall from '@/components/HardPaywall';
import { useProducts } from '@/contexts/ProductContext';
import MedicalDisclaimer from '@/components/MedicalDisclaimer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;

export default function AnalysisResultsScreen() {
  const { currentResult, analysisHistory, setCurrentResult, loadHistory } = useAnalysis();
  const subscription = useSubscription();
  const { incrementScanCount, state, canScan } = subscription || {};
  const { theme } = useTheme();
  const { generateRecommendations, recommendations, isLoadingRecommendations } = useProducts();
  const [glowLevel, setGlowLevel] = useState<string>('');
  const [topStrength, setTopStrength] = useState<string>('');
  const [streak, setStreak] = useState<number>(0);
  const [streakProtected, setStreakProtected] = useState<boolean>(false);
  const [showPaywall, setShowPaywall] = useState(false);
  
  // Check if user is free (used their 1 free scan)
  const isFreeUser = !state?.isPremium && (state?.scanCount || 0) >= 1;
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = createStyles(palette);


  const hasCountedRef = React.useRef<string | null>(null);

  // Load history when component mounts
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // If currentResult is null but we have history, load the latest one
  useEffect(() => {
    if (!currentResult && analysisHistory && analysisHistory.length > 0) {
      // Get the most recent analysis (first item in history is latest)
      const latestAnalysis = analysisHistory[0];
      if (latestAnalysis) {
        setCurrentResult(latestAnalysis);
      }
    }
  }, [currentResult, analysisHistory, setCurrentResult]);

  useEffect(() => {
    if (!currentResult) return;

    // Increment scan count AFTER user sees results (even if blurred)
    // This allows them to complete the scan and see what they're missing
    if (hasCountedRef.current !== String(currentResult.timestamp)) {
      hasCountedRef.current = String(currentResult.timestamp);
      
      // Only increment if this is a new scan (not viewing old results)
      // Check if this result is from the current session
      const isNewScan = !analysisHistory || 
        analysisHistory.length === 0 || 
        analysisHistory[0]?.timestamp === currentResult.timestamp;
      
      if (isNewScan) {
        incrementScanCount();
      }
      
      generateRecommendations(currentResult);
    }

    const level = getGlowLevelForResult(currentResult);
    const strength = getTopStrength(currentResult);
    setGlowLevel(level);
    setTopStrength(strength);
    updateStreak();
  }, [currentResult, incrementScanCount, generateRecommendations, analysisHistory]);


  const progressMessage = useMemo(() => {
    if (!analysisHistory || analysisHistory.length < 2 || !currentResult) return null;
    const prev = analysisHistory.find(r => r.timestamp < currentResult.timestamp);
    if (!prev) return null;
    
    const improvements = [];
    const current = currentResult.detailedScores;
    const previous = prev.detailedScores;
    
    if (current.brightnessGlow > previous.brightnessGlow + 3) improvements.push('Brighter Glow');
    if (current.hydrationLevel > previous.hydrationLevel + 3) improvements.push('Better Hydration');
    if (current.skinTexture > previous.skinTexture + 3) improvements.push('Smoother Texture');
    
    return improvements.length > 0 ? `Improved: ${improvements.join(', ')}` : 'Keep up the routine!';
  }, [analysisHistory, currentResult]);

  const onShare = async () => {
    try {
      if (!currentResult) return;
      
      const shareContent = createShareContent(currentResult, glowLevel, topStrength);
      await Share.share({
        message: shareContent.message,
        title: shareContent.title,
        url: shareContent.url
      });
    } catch (e) {
      console.log('[Share] error', e);
    }
  };

  const createShareContent = (result: typeof currentResult, level: string, strength: string) => {
    if (!result) return { message: '', title: '', url: '' };
    
    const improvements = [];
    if (result.detailedScores.brightnessGlow >= 85) improvements.push('✨ Radiant Glow');
    if (result.detailedScores.facialSymmetry >= 85) improvements.push('🎯 Beautiful Symmetry');
    if (result.detailedScores.jawlineSharpness >= 85) improvements.push('💪 Defined Features');
    if (result.detailedScores.hydrationLevel >= 85) improvements.push('💧 Hydrated Skin');
    
    const improvementText = improvements.length > 0 ? 
      `\n\nMy strengths: ${improvements.slice(0, 2).join(', ')}` : '';
    
    return {
      message: `✨ Just got my GlowCheck Analysis!\n\n🌟 Glow Level: ${level}\n💫 Top Strength: ${strength}${improvementText}\n\n✨ Ready to discover your unique glow? Try GlowCheck AI!`,
      title: `My GlowCheck Analysis ✨`,
      url: 'https://glowcheck.ai'
    };
  };

  function getGlowLevelForResult(result: AnalysisResult): string {
    const scores = result.detailedScores;
    const avgScore = (scores.brightnessGlow + scores.hydrationLevel + scores.skinTexture + scores.evenness) / 4;
    
    if (avgScore >= 90) return '✨ Radiant & Luminous';
    if (avgScore >= 80) return '🌟 Glowing & Vibrant';
    if (avgScore >= 70) return '💫 Fresh & Healthy';
    if (avgScore >= 60) return '🌸 Natural Beauty';
    return '🌱 Developing Radiance';
  }

  function getTopStrength(result: AnalysisResult): string {
    const scores = result.detailedScores;
    const scoreEntries = [
      { name: 'Natural Glow', value: scores.brightnessGlow },
      { name: 'Hydrated Skin', value: scores.hydrationLevel },
      { name: 'Smooth Texture', value: scores.skinTexture },
      { name: 'Even Tone', value: scores.evenness },
      { name: 'Facial Harmony', value: scores.facialSymmetry },
      { name: 'Youthful Elasticity', value: scores.elasticity },
    ];
    
    const topScore = scoreEntries.reduce((prev, current) => 
      current.value > prev.value ? current : prev
    );
    
    return topScore.name;
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
          <TouchableOpacity style={styles.ctaButtonPrimary} onPress={() => router.push('/(tabs)/glow-analysis')}>
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
              <View style={styles.glowLevelPill}>
                <Sparkles color={palette.primary} size={18} fill={palette.primary} strokeWidth={2.5} />
                <Text style={styles.glowLevelText}>{glowLevel}</Text>
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
            
            <Text style={styles.overallLabel}>Your Starting Point</Text>
            
            <View style={styles.strengthCard}>
              <Award color={palette.champagne} size={24} strokeWidth={2.5} />
              <View style={styles.strengthContent}>
                <Text style={styles.strengthLabel}>Your Top Strength</Text>
                <Text style={styles.strengthValue}>{topStrength}</Text>
              </View>
            </View>
            
            <View style={styles.metaRow}>
              {progressMessage && (
                <View style={styles.metaItem}>
                  <TrendingUp color={palette.success} size={16} strokeWidth={2.5} />
                  <Text style={styles.metaText}>{progressMessage}</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Heart color={palette.rose} size={16} fill={palette.rose} strokeWidth={2.5} />
                <Text style={styles.metaText}>{currentResult.rating}</Text>
              </View>
            </View>
            
            <View style={styles.streakRow}>
              <Text style={styles.streakText}>✨ {streak} day streak</Text>
              {streakProtected && <Text style={styles.streakProtect}>🛡️ Protected</Text>}
            </View>
          </LinearGradient>
        </View>

        {/* Professional Skin Profile - Hide for free users */}
        {!isFreeUser && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles color={palette.primary} size={20} fill={palette.primary} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Professional Skin Profile</Text>
          </View>
          <View style={styles.analysisGrid}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileTitle}>Your Complete Analysis</Text>
              <View style={styles.confidenceBadge}>
                <Star color={palette.champagne} size={14} fill={palette.champagne} strokeWidth={2.5} />
                <Text style={styles.confidenceText}>AI Analysis • Starting Point</Text>
              </View>
              <Text style={styles.analysisNote}>Track progress over time to discover what works for YOUR skin</Text>
            </View>
            
            <View style={styles.analysisRow}>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Skin Type</Text>
                <Text style={styles.analysisValue}>{currentResult.skinType}</Text>
                <Text style={styles.analysisNote}>Dermatological classification</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Skin Quality</Text>
                <Text style={styles.analysisValue}>{currentResult.skinQuality}</Text>
                <Text style={styles.analysisNote}>Multi-factor assessment</Text>
              </View>
            </View>
            
            <View style={styles.analysisRow}>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Skin Tone</Text>
                <Text style={styles.analysisValue}>{currentResult.skinTone}</Text>
                <Text style={styles.analysisNote}>Color analysis</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Glow Potential</Text>
                <Text style={styles.analysisValue}>{currentResult.skinPotential}</Text>
                <Text style={styles.analysisNote}>Achievable with routine</Text>
              </View>
            </View>
            
            <View style={styles.riskAssessment}>
              <View style={styles.riskHeader}>
                <Text style={styles.riskLabel}>Acne Risk Assessment</Text>
                <Text
                  style={[
                    styles.riskValue,
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
              <Text style={styles.riskDescription}>
                {currentResult.dermatologyInsights.acneRisk === 'Low' 
                  ? 'Your skin shows minimal signs of acne-prone characteristics. Maintain your current routine to keep breakouts at bay.'
                  : currentResult.dermatologyInsights.acneRisk === 'Medium'
                  ? 'Some acne-prone indicators detected. Focus on oil control and gentle exfoliation to prevent breakouts.'
                  : 'Elevated acne risk detected. Consider targeted treatments and consult a dermatologist for persistent issues.'}
              </Text>
            </View>
          </View>
        </View>
        )}

        {/* Detailed Beauty Scores - Hide for free users */}
        {!isFreeUser && (
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
        )}

        {/* Expert Recommendations - Hide for free users */}
        {!isFreeUser && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💎 Expert Recommendations</Text>
            <Sparkles color={palette.primary} size={16} fill={palette.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.sectionSubtitle}>Expert recommendations tailored to your {currentResult.skinType.toLowerCase()} skin</Text>
          <View style={styles.tipsContainer}>
            {currentResult.personalizedTips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={styles.tipNumber}>
                  <Text style={styles.tipNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipText}>{tip}</Text>
                  <View style={styles.tipMeta}>
                    <Gem color={palette.champagne} size={12} strokeWidth={2} />
                    <Text style={styles.tipMetaText}>Tailored for you</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
        )}

        {/* Product Recommendations - Hide for free users */}
        {!isFreeUser && (
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Sparkles color={palette.gold} size={20} fill={palette.gold} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Products for Your Skin</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Scientifically matched to your {currentResult.skinType.toLowerCase()} skin
          </Text>
          
          {isLoadingRecommendations ? (
            <View style={styles.productsLoadingContainer}>
              <View style={styles.productsLoadingCard}>
                <View style={styles.productsLoadingShimmer} />
                <View style={styles.productsLoadingInfo}>
                  <View style={[styles.shimmerLine, { width: '60%' }]} />
                  <View style={[styles.shimmerLine, { width: '80%', marginTop: 8 }]} />
                  <View style={[styles.shimmerLine, { width: '40%', marginTop: 8 }]} />
                </View>
              </View>
              <Text style={styles.productsLoadingText}>Analyzing your skin profile for the best product matches...</Text>
            </View>
          ) : recommendations.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsScroll}
              snapToInterval={CARD_WIDTH + 20}
              decelerationRate="fast"
            >
              {recommendations.slice(0, 5).map((rec) => (
                <TouchableOpacity
                  key={rec.id}
                  style={styles.productCard}
                  onPress={() => {
                    router.push({
                      pathname: '/product-details',
                      params: { id: rec.id },
                    });
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.productMatchBadge}>
                    <Text style={styles.productMatchBadgeText}>{rec.matchScore}%</Text>
                  </View>

                  <View style={styles.productImageContainer}>
                    {rec.imageUrl ? (
                      <Image
                        source={{ uri: rec.imageUrl }}
                        style={styles.productCardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <Text style={styles.productImagePlaceholderText}>No Image</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.productCardInfo}>
                    {rec.brand && (
                      <Text style={styles.productCardBrand} numberOfLines={1}>
                        {rec.brand.toUpperCase()}
                      </Text>
                    )}
                    <Text style={styles.productCardName} numberOfLines={2}>
                      {rec.stepName}
                    </Text>

                    {rec.personalReason ? (
                      <View style={styles.personalReasonContainer}>
                        <Target color={palette.gold} size={12} />
                        <Text style={styles.personalReasonText} numberOfLines={3}>
                          {rec.personalReason}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.productCardDescription} numberOfLines={2}>
                        {rec.description}
                      </Text>
                    )}

                    {rec.concernsAddressed && rec.concernsAddressed.length > 0 ? (
                      <View style={styles.productBenefits}>
                        {rec.concernsAddressed.slice(0, 2).map((concern, index) => (
                          <View key={index} style={styles.productBenefitTag}>
                            <Zap color={palette.gold} size={10} fill={palette.gold} />
                            <Text style={styles.productBenefitText}>
                              {concern}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : rec.analysis?.actives && rec.analysis.actives.length > 0 ? (
                      <View style={styles.productBenefits}>
                        {rec.analysis.actives.slice(0, 2).map((active, index) => (
                          <View key={index} style={styles.productBenefitTag}>
                            <Star color={palette.gold} size={10} fill={palette.gold} />
                            <Text style={styles.productBenefitText}>
                              {active.conditions[0] || active.name}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {rec.usageTip && (
                      <View style={styles.usageTipContainer}>
                        <Text style={styles.usageTipText} numberOfLines={1}>
                          💡 {rec.usageTip}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.productsEmptyContainer}>
              <Sparkles color={palette.textMuted} size={32} strokeWidth={1.5} />
              <Text style={styles.productsEmptyText}>No product matches found yet</Text>
              <TouchableOpacity
                style={styles.productsRetryButton}
                onPress={() => currentResult && generateRecommendations(currentResult)}
              >
                <Text style={styles.productsRetryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        )}

        {/* CTA Section - Hide for free users */}
        {!isFreeUser && (
        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.ctaButtonPrimary} onPress={() => router.push('/(tabs)/progress')} testID="start-tracking">
            <TrendingUp color={palette.textLight} size={20} strokeWidth={2.5} />
            <Text style={styles.ctaButtonPrimaryText}>Start Tracking Progress</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ctaButtonSecondary} onPress={onShare} testID="share-button">
            <View style={styles.shareButtonContent}>
              <Share2 color={palette.primary} size={18} strokeWidth={2.5} />
              <Text style={styles.ctaButtonSecondaryText}>Share Your Glow Score</Text>
              <View style={styles.sharePreview}>
                <Text style={styles.sharePreviewText}>
                  {glowLevel}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <MedicalDisclaimer />
        </View>
        )}
      </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      <Stack.Screen options={{ title: 'Analysis Results', headerBackTitle: 'Back' }} />
      
      {resultsContent}
      
      {/* Show blurred overlay for free users (after 1 free scan) */}
      {isFreeUser && currentResult && (
        <BlurredResultsOverlay
          visible={true}
          onUnlock={() => setShowPaywall(true)}
          glowLevel={glowLevel}
          topStrength={topStrength}
          matchScore={currentResult.overallScore}
        />
      )}

      {/* Hard Paywall Modal */}
      <HardPaywall
        visible={showPaywall}
        feature="Full Analysis Results"
        message="Unlock your complete skin analysis, personalized recommendations, and AI-powered routine"
        showCloseButton={false}
        onSubscribe={async (type) => {
          const result = await subscription?.processInAppPurchase(type);
          if (result?.success) {
            setShowPaywall(false);
          }
        }}
      />
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
  glowLevelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.overlayBlush,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.primary,
    maxWidth: '65%',
  },
  glowLevelText: {
    color: palette.textPrimary,
    fontSize: 13,
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
  strengthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: palette.overlayGold,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.champagne,
    ...shadow.card,
  },
  strengthContent: {
    flex: 1,
  },
  strengthLabel: {
    fontSize: 13,
    color: palette.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  strengthValue: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.primary,
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
    width: '100%',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.overlayLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.divider,
    ...shadow.card,
  },
  metaText: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '700',
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
  sectionSubtitle: {
    fontSize: 14,
    color: palette.textSecondary,
    marginBottom: 16,
    marginTop: -8,
    fontWeight: '500',
    lineHeight: 20,
  },
  analysisGrid: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  profileHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.overlayGold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    ...shadow.card,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.primary,
    letterSpacing: 0.3,
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
  analysisNote: {
    fontSize: 11,
    color: palette.textMuted,
    marginTop: 4,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  analysisNoteCenter: {
    fontSize: 12,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
    opacity: 0.8,
  },
  riskAssessment: {
    marginTop: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: palette.divider,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: 0.3,
  },
  riskValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  riskDescription: {
    fontSize: 14,
    color: palette.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
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
    fontSize: 16,
    color: palette.textPrimary,
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 8,
  },
  tipContent: {
    flex: 1,
  },
  tipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  tipMetaText: {
    fontSize: 11,
    color: palette.champagne,
    fontWeight: '600',
    letterSpacing: 0.3,
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
  productsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  productsScroll: {
    paddingRight: 24,
    gap: 16,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: palette.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: palette.border,
    ...shadow.medium,
    position: 'relative',
  },
  productMatchBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: palette.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
    ...shadow.soft,
  },
  productMatchBadgeText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  productImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: palette.surfaceAlt,
  },
  productCardImage: {
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
  productCardInfo: {
    padding: 16,
  },
  productCardBrand: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: palette.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  productCardName: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    marginBottom: 8,
    lineHeight: 22,
  },
  productCardDescription: {
    fontSize: 12,
    color: palette.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  productBenefits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  productBenefitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.overlayGold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  productBenefitText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: palette.gold,
    textTransform: 'capitalize' as const,
  },
  personalReasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: palette.overlayGold,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  personalReasonText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: palette.textPrimary,
    lineHeight: 16,
    flex: 1,
  },
  usageTipContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: palette.divider,
  },
  usageTipText: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: palette.textSecondary,
    fontStyle: 'italic' as const,
  },
  productsLoadingContainer: {
    alignItems: 'center' as const,
    paddingVertical: 24,
  },
  productsLoadingCard: {
    width: CARD_WIDTH,
    backgroundColor: palette.surface,
    borderRadius: 20,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: palette.border,
  },
  productsLoadingShimmer: {
    width: '100%' as const,
    height: 160,
    backgroundColor: palette.surfaceElevated,
  },
  productsLoadingInfo: {
    padding: 16,
  },
  shimmerLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.surfaceElevated,
  },
  productsLoadingText: {
    fontSize: 13,
    color: palette.textSecondary,
    fontWeight: '500' as const,
    marginTop: 16,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
  productsEmptyContainer: {
    alignItems: 'center' as const,
    paddingVertical: 32,
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
  },
  productsEmptyText: {
    fontSize: 14,
    color: palette.textMuted,
    fontWeight: '500' as const,
    marginTop: 12,
    marginBottom: 16,
  },
  productsRetryButton: {
    backgroundColor: palette.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  productsRetryText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: palette.textLight,
  },
});