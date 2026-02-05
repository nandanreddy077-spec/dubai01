import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  TextInput,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  TrendingUp,
  TrendingDown,
  Calendar,
  Droplets,
  Moon as Sleep,
  Zap,
  Heart,
  Target,
  Trophy,
  Sparkles,
  Star,
  Clock,
  X,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palette, gradient, shadow, spacing, typography } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useGamification } from '@/contexts/GamificationContext';
import { useProducts } from '@/contexts/ProductContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import AnimatedProgressBar from '@/components/AnimatedProgressBar';
// All features free - UpgradePrompt removed
import { generateInsights, AIInsightResult, checkMinimumRequirements } from '@/lib/insights-engine';
import { analyzeProgressPhoto, compareProgressPhotos, ProgressPhotoAnalysis } from '@/lib/ai-helpers';

const { width } = Dimensions.get('window');

type Tab = 'photos' | 'journal' | 'insights';
type Mood = 'great' | 'good' | 'okay' | 'bad';

interface ProgressPhoto {
  id: string;
  uri: string;
  date: string;
  timestamp: number;
  analysis?: {
    hydration: number;
    texture: number;
    brightness: number;
    acne: number;
    improvements?: string[];
  };
  notes?: string;
}

interface JournalEntry {
  id: string;
  date: string;
  timestamp: number;
  mood: Mood;
  sleepHours: number;
  waterIntake: number; // glasses
  stressLevel: number; // 1-5
  notes?: string;
  skinFeeling?: string; // optional text about how skin feels
}

interface WeeklyInsight {
  id: string;
  week: number;
  startDate: string;
  endDate: string;
  wins: string[];
  correlations: string[];
  recommendations: string[];
  photosCount: number;
  routineCompletionRate: number;
  generated: boolean;
}

const STORAGE_KEYS = {
  PHOTOS: 'progress_photos_v1',
  JOURNAL: 'progress_journal_v1',
  INSIGHTS: 'progress_insights_v1',
};

export default function ProgressTrackerScreen() {
  const { user } = useUser();
  const { dailyCompletions } = useGamification();
  const { products, usageHistory, routines } = useProducts();
  // All features free - no subscription checks needed
  const params = useLocalSearchParams<{ tab?: string }>();
  
  const [activeTab, setActiveTab] = useState<Tab>((params.tab as Tab) || 'photos');
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [insights, setInsights] = useState<WeeklyInsight[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsightResult | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [photoNotes, setPhotoNotes] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d'>('30d');
  // All features free - UpgradePrompt removed

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  // Journal form state
  const [journalMood, setJournalMood] = useState<Mood>('good');
  const [journalSleep, setJournalSleep] = useState('7');
  const [journalWater, setJournalWater] = useState('8');
  const [journalStress, setJournalStress] = useState(3);
  const [journalNotes, setJournalNotes] = useState('');
  const [journalSkinFeeling, setJournalSkinFeeling] = useState('');

  // Generate insights when tab opens or data changes
  useEffect(() => {
    if (activeTab === 'insights' && !aiInsights && !isGeneratingInsights) {
      generateInsightsForUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    loadData();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    sparkleLoop.start();
    floatLoop.start();

    return () => {
      sparkleLoop.stop();
      floatLoop.stop();
    };
  }, [fadeAnim, slideAnim, scaleAnim, sparkleAnim, floatAnim]);

  const loadData = async () => {
    try {
      const [photosData, journalData, insightsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PHOTOS),
        AsyncStorage.getItem(STORAGE_KEYS.JOURNAL),
        AsyncStorage.getItem(STORAGE_KEYS.INSIGHTS),
      ]);

      if (photosData) setPhotos(JSON.parse(photosData));
      if (journalData) setJournalEntries(JSON.parse(journalData));
      if (insightsData) setInsights(JSON.parse(insightsData));
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const savePhotos = async (newPhotos: ProgressPhoto[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(newPhotos));
      setPhotos(newPhotos);
    } catch (error) {
      console.error('Error saving photos:', error);
    }
  };

  const saveJournal = async (newEntries: JournalEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(newEntries));
      setJournalEntries(newEntries);
    } catch (error) {
      console.error('Error saving journal:', error);
    }
  };

  const processImageResult = async (uri: string) => {
    try {
      // Show analyzing indicator
      Alert.alert('🔍 Analyzing...', 'AI is analyzing your skin. This may take a few seconds.');
      
      // Use real AI analysis with Google Vision + GPT-4o-mini
      console.log('🔍 Starting AI analysis for progress photo...');
      const aiAnalysis = await analyzeProgressPhoto(uri);
      console.log('✅ AI analysis completed:', aiAnalysis);
      
      // Compare with previous photo to generate improvements
      let improvements: string[] = aiAnalysis.improvements || [];
      if (photos.length > 0 && photos[0].analysis) {
        const previousAnalysis: ProgressPhotoAnalysis = {
          hydration: photos[0].analysis.hydration,
          texture: photos[0].analysis.texture,
          brightness: photos[0].analysis.brightness,
          acne: photos[0].analysis.acne,
          confidence: 0.8,
        };
        improvements = compareProgressPhotos(previousAnalysis, aiAnalysis);
      }

      const analysis = {
        hydration: aiAnalysis.hydration,
        texture: aiAnalysis.texture,
        brightness: aiAnalysis.brightness,
        acne: aiAnalysis.acne,
        improvements: improvements.length > 0 ? improvements : ['Photo analyzed successfully'],
      };

      const newPhoto: ProgressPhoto = {
        id: Date.now().toString(),
        uri,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        analysis,
        notes: photoNotes,
      };

      const updatedPhotos = [newPhoto, ...photos].slice(0, 30); // Keep last 30
      await savePhotos(updatedPhotos);
      setPhotoNotes('');
      
      // Track photo taken for notifications
      const { trackUserActivity } = await import('@/lib/engagement-notifications');
      await trackUserActivity('photo_taken');
      
      // Refresh insights if on insights tab
      if (activeTab === 'insights' && aiInsights) {
        generateInsightsForUser();
      }
      
      // Show success message with AI results
      const confidenceText = aiAnalysis.confidence >= 0.8 ? 'High confidence' : 'Analysis complete';
      Alert.alert(
        '✨ Photo Analyzed!', 
        `${confidenceText}\n\n💧 Hydration: ${analysis.hydration}%\n✨ Brightness: ${analysis.brightness}%\n⭐ Texture: ${analysis.texture}%\n❤️ Clear Skin: ${100 - analysis.acne}%`
      );
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to analyze photo. Please try again.');
    }
  };

  const pickImage = async () => {
    // All features free - no checks needed

    if (Platform.OS === 'web') {
      // For web, just use library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processImageResult(result.assets[0].uri);
      }
    } else {
      // For mobile, give option to choose
      Alert.alert(
        'Select Photo',
        'Choose an option',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please allow access to your camera');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                await processImageResult(result.assets[0].uri);
              }
            },
          },
          {
            text: 'Photo Library',
            onPress: async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please allow access to your photos');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                await processImageResult(result.assets[0].uri);
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const addJournalEntry = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existingEntry = journalEntries.find(e => e.date === today);

      if (existingEntry) {
        Alert.alert('Already logged', 'You already logged today. Update it instead?');
        return;
      }

      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        date: today,
        timestamp: Date.now(),
        mood: journalMood,
        sleepHours: parseFloat(journalSleep) || 7,
        waterIntake: parseInt(journalWater) || 8,
        stressLevel: journalStress,
        notes: journalNotes.trim(),
        skinFeeling: journalSkinFeeling.trim(),
      };

      const updatedEntries = [newEntry, ...journalEntries];
      await saveJournal(updatedEntries);
      setShowJournalModal(false);
      resetJournalForm();
      
      // Track journal entry for notifications
      const { trackUserActivity } = await import('@/lib/engagement-notifications');
      await trackUserActivity('journal_entry');
      
      // Refresh insights if on insights tab
      if (activeTab === 'insights' && aiInsights) {
        generateInsightsForUser();
      }
      
      Alert.alert('✨ Entry Saved!', 'Your daily log has been saved successfully.');
    } catch (error) {
      console.error('Error adding journal entry:', error);
      Alert.alert('Error', 'Failed to save journal entry. Please try again.');
    }
  };

  const resetJournalForm = () => {
    setJournalMood('good');
    setJournalSleep('7');
    setJournalWater('8');
    setJournalStress(3);
    setJournalNotes('');
    setJournalSkinFeeling('');
  };

  const generateInsightsForUser = async () => {
    // Check minimum requirements first
    const requirements = checkMinimumRequirements(photos, journalEntries);
    if (!requirements.met) {
      console.log('⚠️ Minimum requirements not met:', requirements);
      return; // Don't generate if requirements not met
    }

    console.log('🚀 Starting insights generation...', {
      photosCount: photos.length,
      journalCount: journalEntries.length,
      productsCount: products.length,
    });

    setIsGeneratingInsights(true);
    try {
      const insights = await generateInsights(
        photos,
        journalEntries,
        products,
        usageHistory,
        routines
      );
      console.log('✅ Insights generated successfully:', {
        winsCount: insights.wins?.length || 0,
        insightsCount: insights.insights?.length || 0,
        recommendationsCount: insights.recommendations?.length || 0,
        consistency: insights.consistency?.consistencyPercentage || 0,
      });
      setAiInsights(insights);
    } catch (error) {
      console.error('❌ Failed to generate insights:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Still set some basic insights even if generation fails
      const fallbackConsistency = {
        photoStreak: 0,
        journalStreak: 0,
        currentPhotoStreak: 0,
        currentJournalStreak: 0,
        consistencyPercentage: 0,
        last7Days: [],
        totalDaysTracked: 0,
        totalPossibleDays: 7,
      };
      setAiInsights({
        consistency: fallbackConsistency,
        wins: ['Keep tracking to unlock insights'],
        insights: ['More data needed for personalized analysis'],
        recommendations: ['Continue logging daily habits and taking progress photos'],
        summary: 'Building your personalized insights...',
        generatedAt: new Date().toISOString(),
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Calculate stats from journal
  const journalStats = useMemo(() => {
    const last30 = journalEntries.slice(0, 30);
    if (last30.length === 0) return { avgSleep: 0, avgWater: 0, avgStress: 0 };

    return {
      avgSleep: (last30.reduce((sum, e) => sum + e.sleepHours, 0) / last30.length).toFixed(1),
      avgWater: Math.round(last30.reduce((sum, e) => sum + e.waterIntake, 0) / last30.length),
      avgStress: (last30.reduce((sum, e) => sum + e.stressLevel, 0) / last30.length).toFixed(1),
    };
  }, [journalEntries]);

  // Check if insights are unlocked
  const canUnlockInsights = journalEntries.length >= 5 || photos.length >= 3;

  // Organize photos by day (last 30 days max)
  const organizedPhotos = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // Get last 30 days of photos
    const recentPhotos = photos
      .filter(p => p.timestamp >= thirtyDaysAgo)
      .sort((a, b) => b.timestamp - a.timestamp); // Newest first
    
    // Group by day
    const grouped: Record<string, ProgressPhoto[]> = {};
    recentPhotos.forEach(photo => {
      const dateKey = new Date(photo.timestamp).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(photo);
    });
    
    // Convert to array and sort by date (newest first)
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, photos]) => ({ date, photos }));
  }, [photos]);

  // Get comparison photos based on selected period
  const getComparisonPhotos = () => {
    if (photos.length < 2) return { before: null, after: null, daysDiff: 0 };
    
    const sortedPhotos = [...photos].sort((a, b) => a.timestamp - b.timestamp);
    const oldestPhoto = sortedPhotos[0];
    const latestPhoto = sortedPhotos[sortedPhotos.length - 1];
    
    const daysDiff = Math.floor((latestPhoto.timestamp - oldestPhoto.timestamp) / (1000 * 60 * 60 * 24));
    
    // For selected period, find photos within that range
    const now = Date.now();
    const periodDays = selectedPeriod === '7d' ? 7 : 30;
    const periodStart = now - (periodDays * 24 * 60 * 60 * 1000);
    
    const periodPhotos = photos.filter(p => p.timestamp >= periodStart);
    
    if (periodPhotos.length < 2) {
      return { before: oldestPhoto, after: latestPhoto, daysDiff };
    }
    
    const periodSorted = periodPhotos.sort((a, b) => a.timestamp - b.timestamp);
    return {
      before: periodSorted[0],
      after: periodSorted[periodSorted.length - 1],
      daysDiff: Math.floor((periodSorted[periodSorted.length - 1].timestamp - periodSorted[0].timestamp) / (1000 * 60 * 60 * 24)),
    };
  };

  // Calculate progress status
  const getProgressStatus = () => {
    const comparison = getComparisonPhotos();
    if (!comparison.before?.analysis || !comparison.after?.analysis) {
      return { status: 'stable', text: '— Stable' };
    }
    
    const hydrationChange = comparison.after.analysis.hydration - comparison.before.analysis.hydration;
    const textureChange = comparison.after.analysis.texture - comparison.before.analysis.texture;
    const brightnessChange = comparison.after.analysis.brightness - comparison.before.analysis.brightness;
    const avgChange = (hydrationChange + textureChange + brightnessChange) / 3;
    
    if (avgChange > 5) {
      return { status: 'improving', text: '↑ Improving' };
    } else if (avgChange < -5) {
      return { status: 'declining', text: '↓ Declining' };
    } else {
      return { status: 'stable', text: '— Stable' };
    }
  };

  const renderPhotosTab = () => {
    const hasPhotos = photos.length > 0;
    const latestPhoto = photos[0];
    const comparison = getComparisonPhotos();
    const progressStatus = getProgressStatus();

    return (
      <View style={styles.tabContent}>
        {/* Add Photo Button */}
        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={pickImage}
          activeOpacity={0.9}
        >
          <LinearGradient colors={gradient.primary} style={styles.addPhotoGradient}>
            <Camera color={palette.textLight} size={24} />
            <Text style={styles.addPhotoText}>Take Progress Photo</Text>
          </LinearGradient>
        </TouchableOpacity>

        {!hasPhotos && (
          <View style={styles.emptyState}>
            <ImageIcon color={palette.textMuted} size={64} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Start Your Visual Journey</Text>
            <Text style={styles.emptyText}>
              Take your first progress photo to track your glow transformation over time
            </Text>
          </View>
        )}

        {/* Progress Comparison Section */}
        {hasPhotos && comparison.before && comparison.after && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <TrendingUp color={palette.primary} size={22} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>Progress Comparison</Text>
            </View>
            <View style={styles.progressComparisonCard}>
            <View style={styles.progressComparisonHeader}>
              <View style={styles.periodSelector}>
                <TouchableOpacity
                  style={[styles.periodButton, selectedPeriod === '7d' && styles.periodButtonActive]}
                  onPress={() => setSelectedPeriod('7d')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.periodButtonText, selectedPeriod === '7d' && styles.periodButtonTextActive]}>
                    7d
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.periodButton, selectedPeriod === '30d' && styles.periodButtonActive]}
                  onPress={() => setSelectedPeriod('30d')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.periodButtonText, selectedPeriod === '30d' && styles.periodButtonTextActive]}>
                    30d
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.comparisonImagesContainer}>
              <View style={styles.comparisonImageWrapper}>
                {comparison.before ? (
                  <Image source={{ uri: comparison.before.uri }} style={styles.comparisonImageNew} />
                ) : (
                  <View style={[styles.comparisonImageNew, styles.comparisonImagePlaceholder]}>
                    <ImageIcon color={palette.textMuted} size={32} />
                  </View>
                )}
                <View style={styles.comparisonImageLabel}>
                  <Text style={styles.comparisonLabelText}>Before</Text>
                </View>
              </View>

              <ArrowRight color={palette.primary} size={28} strokeWidth={2.5} />

              <View style={styles.comparisonImageWrapper}>
                {comparison.after ? (
                  <Image source={{ uri: comparison.after.uri }} style={styles.comparisonImageNew} />
                ) : (
                  <View style={[styles.comparisonImageNew, styles.comparisonImagePlaceholder]}>
                    <ImageIcon color={palette.textMuted} size={32} />
                  </View>
                )}
                <View style={styles.comparisonImageLabel}>
                  <Text style={styles.comparisonLabelText}>After</Text>
                </View>
              </View>
            </View>

            <View style={styles.progressSummary}>
              <Text style={styles.progressDaysText}>
                {comparison.daysDiff} Day{comparison.daysDiff !== 1 ? 's' : ''} Progress
              </Text>
              <Text style={[
                styles.progressStatusText,
                progressStatus.status === 'improving' && styles.progressStatusImproving,
                progressStatus.status === 'declining' && styles.progressStatusDeclining,
              ]}>
                {progressStatus.text}
              </Text>
            </View>
          </View>
          </View>
        )}

        {/* Daily Photos Scrollable View */}
        {hasPhotos && organizedPhotos.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Camera color={palette.primary} size={22} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>Daily Photos</Text>
              <Text style={styles.sectionSubtitle}>(Last 30 Days)</Text>
            </View>
            <View style={styles.dailyPhotosSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dailyPhotosScrollContainer}
            >
              {organizedPhotos.map(({ date, photos: dayPhotos }) => (
                <View key={date} style={styles.dailyPhotoGroup}>
                  <Text style={styles.dailyPhotoDate}>
                    {new Date(date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </Text>
                  <View style={styles.dailyPhotoRow}>
                    {dayPhotos.map((photo) => (
                      <TouchableOpacity
                        key={photo.id}
                        style={styles.dailyPhotoCard}
                        activeOpacity={0.9}
                      >
                        <Image source={{ uri: photo.uri }} style={styles.dailyPhotoThumbnail} />
                        {photo.analysis && (
                          <View style={styles.dailyPhotoBadge}>
                            <Text style={styles.dailyPhotoBadgeText}>
                              {Math.round((photo.analysis.hydration + photo.analysis.texture + photo.analysis.brightness) / 3)}%
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
            </View>
          </View>
        )}

        {/* Latest Analysis - Moved to bottom after daily photos */}
        {hasPhotos && latestPhoto?.analysis && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Sparkles color={palette.primary} size={22} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>Latest Analysis</Text>
            </View>
          <View style={styles.analysisCard}>
            <LinearGradient colors={gradient.card} style={styles.analysisCardInner}>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Droplets color={palette.primary} size={20} />
                  <Text style={styles.metricValue}>{latestPhoto.analysis.hydration}%</Text>
                  <Text style={styles.metricLabel}>Hydration</Text>
                </View>
                <View style={styles.metricItem}>
                  <Sparkles color={palette.primary} size={20} />
                  <Text style={styles.metricValue}>{latestPhoto.analysis.brightness}%</Text>
                  <Text style={styles.metricLabel}>Brightness</Text>
                </View>
                <View style={styles.metricItem}>
                  <Star color={palette.primary} size={20} />
                  <Text style={styles.metricValue}>{latestPhoto.analysis.texture}%</Text>
                  <Text style={styles.metricLabel}>Texture</Text>
                </View>
                <View style={styles.metricItem}>
                  <Heart color={palette.rose} size={20} />
                  <Text style={styles.metricValue}>{100 - latestPhoto.analysis.acne}%</Text>
                  <Text style={styles.metricLabel}>Clear Skin</Text>
                </View>
              </View>

              {latestPhoto.analysis.improvements && (
                <View style={styles.improvementsSection}>
                  <Text style={styles.improvementsTitle}>Recent Improvements</Text>
                  {latestPhoto.analysis.improvements.map((imp, idx) => (
                    <View key={idx} style={styles.improvementItem}>
                      <TrendingUp color={palette.success} size={16} />
                      <Text style={styles.improvementText}>{imp}</Text>
                    </View>
                  ))}
                </View>
              )}
            </LinearGradient>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderJournalTab = () => {
    const today = new Date().toISOString().split('T')[0];
    const hasLoggedToday = journalEntries.some(e => e.date === today);

    return (
      <View style={styles.tabContent}>
        {/* Add Entry Button */}
        <TouchableOpacity
          style={[styles.addEntryButton, hasLoggedToday && styles.addEntryButtonDisabled]}
          onPress={() => setShowJournalModal(true)}
          disabled={hasLoggedToday}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={hasLoggedToday ? ['#6B7280', '#4B5563'] : gradient.success}
            style={styles.addEntryGradient}
          >
            {hasLoggedToday ? (
              <>
                <CheckCircle color={palette.textLight} size={24} />
                <Text style={styles.addEntryText}>Logged Today!</Text>
              </>
            ) : (
              <>
                <Plus color={palette.textLight} size={24} />
                <Text style={styles.addEntryText}>Log Today</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats Overview */}
        {journalEntries.length > 0 && (
          <View style={styles.statsCard}>
            <LinearGradient colors={gradient.card} style={styles.statsCardInner}>
              <Text style={styles.statsTitle}>30-Day Averages</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Sleep color={palette.primary} size={24} />
                  <Text style={styles.statValue}>{journalStats.avgSleep}h</Text>
                  <Text style={styles.statLabel}>Sleep</Text>
                </View>
                <View style={styles.statItem}>
                  <Droplets color={palette.primary} size={24} />
                  <Text style={styles.statValue}>{journalStats.avgWater}</Text>
                  <Text style={styles.statLabel}>Water</Text>
                </View>
                <View style={styles.statItem}>
                  <Zap color={palette.rose} size={24} />
                  <Text style={styles.statValue}>{journalStats.avgStress}/5</Text>
                  <Text style={styles.statLabel}>Stress</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Journal Entries */}
        {journalEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar color={palette.textMuted} size={64} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Begin Daily Tracking</Text>
            <Text style={styles.emptyText}>
              Log your daily habits to discover patterns that affect your skin
            </Text>
          </View>
        ) : (
          <View style={styles.entriesList}>
            <Text style={styles.sectionTitle}>Recent Entries</Text>
            {journalEntries.slice(0, 10).map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryDate}>
                    {new Date(entry.timestamp).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric' 
                    })}
                  </Text>
                  <Text style={styles.entryMood}>{getMoodEmoji(entry.mood)}</Text>
                </View>
                <View style={styles.entryStats}>
                  <View style={styles.entryStatItem}>
                    <Sleep color={palette.textMuted} size={14} />
                    <Text style={styles.entryStatText}>{entry.sleepHours}h</Text>
                  </View>
                  <View style={styles.entryStatItem}>
                    <Droplets color={palette.textMuted} size={14} />
                    <Text style={styles.entryStatText}>{entry.waterIntake} glasses</Text>
                  </View>
                  <View style={styles.entryStatItem}>
                    <Zap color={palette.textMuted} size={14} />
                    <Text style={styles.entryStatText}>Stress {entry.stressLevel}/5</Text>
                  </View>
                </View>
                {entry.skinFeeling && (
                  <Text style={styles.entryNotes}>Skin: {entry.skinFeeling}</Text>
                )}
                {entry.notes && (
                  <Text style={styles.entryNotes}>{entry.notes}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderInsightsPaywall = () => {
    return (
      <View style={styles.tabContent}>
        {/* Premium Insights Paywall */}
        <View style={styles.insightsPaywallContainer}>
          <LinearGradient
            colors={['#1A1A1A', '#2D1B2E', '#1A1A1A']}
            style={styles.insightsPaywallGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Icon */}
            <View style={styles.insightsPaywallIcon}>
              <LinearGradient
                colors={['#C9A961', '#D4B978', '#E8DED2']}
                style={styles.insightsPaywallIconBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Sparkles color="#1A1A1A" size={40} strokeWidth={2.5} fill="#1A1A1A" />
              </LinearGradient>
            </View>

            <Text style={styles.insightsPaywallTitle}>Unlock AI Insights</Text>
            <Text style={styles.insightsPaywallSubtitle}>
              Your personal beauty scientist that discovers what truly works for YOUR skin
            </Text>

            {/* Value Props */}
            <View style={styles.insightsValueSection}>
              <Text style={styles.insightsValueTitle}>Why Insights Changes Everything:</Text>
              
              <View style={styles.insightsValueItem}>
                <View style={styles.insightsValueIconBg}>
                  <LinearGradient
                    colors={['rgba(201, 169, 97, 0.3)', 'rgba(212, 185, 120, 0.2)']}
                    style={styles.insightsValueIconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Target color="#C9A961" size={20} strokeWidth={2.5} />
                  </LinearGradient>
                </View>
                <View style={styles.insightsValueContent}>
                  <Text style={styles.insightsValueHeading}>Pattern Discovery</Text>
                  <Text style={styles.insightsValueText}>AI finds hidden connections between your habits, products, and skin changes</Text>
                </View>
              </View>

              <View style={styles.insightsValueItem}>
                <View style={styles.insightsValueIconBg}>
                  <LinearGradient
                    colors={['rgba(201, 169, 97, 0.3)', 'rgba(212, 185, 120, 0.2)']}
                    style={styles.insightsValueIconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <CheckCircle color="#C9A961" size={20} strokeWidth={2.5} />
                  </LinearGradient>
                </View>
                <View style={styles.insightsValueContent}>
                  <Text style={styles.insightsValueHeading}>Product Effectiveness Report</Text>
                  <Text style={styles.insightsValueText}>Know exactly which products work for YOU — stop wasting money on guesses</Text>
                </View>
              </View>

              <View style={styles.insightsValueItem}>
                <View style={styles.insightsValueIconBg}>
                  <LinearGradient
                    colors={['rgba(201, 169, 97, 0.3)', 'rgba(212, 185, 120, 0.2)']}
                    style={styles.insightsValueIconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <TrendingUp color="#C9A961" size={20} strokeWidth={2.5} />
                  </LinearGradient>
                </View>
                <View style={styles.insightsValueContent}>
                  <Text style={styles.insightsValueHeading}>30-Day Transformation Report</Text>
                  <Text style={styles.insightsValueText}>See your actual progress with before/after analysis and improvement scores</Text>
                </View>
              </View>

              <View style={styles.insightsValueItem}>
                <View style={styles.insightsValueIconBg}>
                  <LinearGradient
                    colors={['rgba(201, 169, 97, 0.3)', 'rgba(212, 185, 120, 0.2)']}
                    style={styles.insightsValueIconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Heart color="#C9A961" size={20} strokeWidth={2.5} />
                  </LinearGradient>
                </View>
                <View style={styles.insightsValueContent}>
                  <Text style={styles.insightsValueHeading}>Personalized Recommendations</Text>
                  <Text style={styles.insightsValueText}>Get advice based on YOUR data, not generic tips — tailored to your unique skin</Text>
                </View>
              </View>
            </View>

            {/* Social Proof */}
            <View style={styles.insightsSocialProof}>
              <Text style={styles.insightsSocialText}>✨ Users who track daily see <Text style={styles.insightsSocialHighlight}>3x faster results</Text></Text>
            </View>

            {/* Your Progress Preview */}
            <View style={styles.insightsProgressPreview}>
              <Text style={styles.insightsProgressTitle}>Your Progress So Far:</Text>
              <View style={styles.insightsProgressStats}>
                <View style={styles.insightsProgressStat}>
                  <Camera color="#C9A961" size={18} />
                  <Text style={styles.insightsProgressValue}>{photos.length}</Text>
                  <Text style={styles.insightsProgressLabel}>Photos</Text>
                </View>
                <View style={styles.insightsProgressStat}>
                  <Calendar color="#C9A961" size={18} />
                  <Text style={styles.insightsProgressValue}>{journalEntries.length}</Text>
                  <Text style={styles.insightsProgressLabel}>Journals</Text>
                </View>
              </View>
              <Text style={styles.insightsProgressMessage}>
                {photos.length >= 5 && journalEntries.length >= 5 
                  ? "🎉 You have enough data! Unlock to see your personalized insights now."
                  : `Keep tracking! ${Math.max(0, 5 - photos.length)} more photos and ${Math.max(0, 5 - journalEntries.length)} more journal entries to unlock full insights.`}
              </Text>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={styles.insightsPaywallCTA}
              onPress={() => router.push('/start-trial')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#C9A961', '#D4B978', '#E8DED2']}
                style={styles.insightsPaywallCTAGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Trophy color="#1A1A1A" size={22} strokeWidth={2.5} />
                <View style={styles.insightsPaywallCTAContent}>
                  <Text style={styles.insightsPaywallCTAMain}>Unlock AI Insights</Text>
                  <Text style={styles.insightsPaywallCTASub}>7-day free trial • Cancel anytime</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.insightsPaywallDisclaimer}>
              Start free, then $8.99/month. Cancel before Day 8 to avoid charges.
            </Text>
          </LinearGradient>
        </View>

        {/* Continue Tracking Section */}
        <View style={styles.continueTrackingSection}>
          <Text style={styles.continueTrackingTitle}>Keep Building Your Data</Text>
          <Text style={styles.continueTrackingText}>
            Photos and journal entries are free! The more you track, the better your insights will be.
          </Text>
          <View style={styles.continueTrackingButtons}>
            <TouchableOpacity
              style={styles.continueTrackingButton}
              onPress={() => {
                setActiveTab('photos');
                pickImage();
              }}
              activeOpacity={0.9}
            >
              <LinearGradient colors={gradient.primary} style={styles.continueTrackingButtonGradient}>
                <Camera color={palette.textLight} size={18} />
                <Text style={styles.continueTrackingButtonText}>Add Photo</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueTrackingButton}
              onPress={() => {
                setActiveTab('journal');
                setShowJournalModal(true);
              }}
              activeOpacity={0.9}
            >
              <LinearGradient colors={gradient.success} style={styles.continueTrackingButtonGradient}>
                <Calendar color={palette.textLight} size={18} />
                <Text style={styles.continueTrackingButtonText}>Log Journal</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderInsightsTab = () => {
    // Check minimum requirements
    const requirements = checkMinimumRequirements(photos, journalEntries);

    // Loading state
    if (isGeneratingInsights) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.emptyState}>
            <Sparkles color={palette.primary} size={64} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Analyzing Your Data...</Text>
            <Text style={styles.emptyText}>
              Our AI is analyzing your photos, journal entries, and products to generate personalized insights
            </Text>
          </View>
        </View>
      );
    }

    // Show educational onboarding if requirements not met
    if (!requirements.met) {
      const photosProgress = Math.min((requirements.photosCount / 5) * 100, 100);
      const journalsProgress = Math.min((requirements.journalsCount / 5) * 100, 100);

      return (
        <View style={styles.tabContent}>
          <View style={styles.onboardingCard}>
            <LinearGradient colors={gradient.glow} style={styles.onboardingCardInner}>
              <Sparkles color={palette.primary} size={48} fill={palette.primary} strokeWidth={2} />
              <Text style={styles.onboardingTitle}>Unlock AI-Powered Insights</Text>
              <Text style={styles.onboardingSubtitle}>
                Track your progress for 5 days to get personalized skincare analysis
              </Text>
            </LinearGradient>
          </View>

          {/* Progress Trackers */}
          <View style={styles.progressTrackerCard}>
            <Text style={styles.progressTrackerTitle}>Your Progress</Text>
            
            {/* Photos Progress */}
            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Camera color={palette.primary} size={20} />
                <Text style={styles.progressLabel}>Photos</Text>
                <Text style={styles.progressCount}>
                  {requirements.photosCount}/5
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${photosProgress}%` }]} />
              </View>
              <Text style={styles.progressPercentage}>{Math.round(photosProgress)}%</Text>
            </View>

            {/* Journals Progress */}
            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Calendar color={palette.primary} size={20} />
                <Text style={styles.progressLabel}>Journal Entries</Text>
                <Text style={styles.progressCount}>
                  {requirements.journalsCount}/5
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${journalsProgress}%` }]} />
              </View>
              <Text style={styles.progressPercentage}>{Math.round(journalsProgress)}%</Text>
            </View>
          </View>

          {/* What You'll Get */}
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>What You'll Get</Text>
            <View style={styles.featureItem}>
              <CheckCircle color={palette.success} size={18} />
              <Text style={styles.featureText}>Daily consistency tracking with visual calendar</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle color={palette.success} size={18} />
              <Text style={styles.featureText}>Product performance analysis (what's working, what's not)</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle color={palette.success} size={18} />
              <Text style={styles.featureText}>30-day transformation report (day 1 vs day 30)</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle color={palette.success} size={18} />
              <Text style={styles.featureText}>Personalized recommendations based on YOUR data</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle color={palette.success} size={18} />
              <Text style={styles.featureText}>Pattern discovery (habits → skin improvements)</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={pickImage}
              activeOpacity={0.9}
            >
              <LinearGradient colors={gradient.primary} style={styles.actionButtonGradient}>
                <Camera color={palette.textLight} size={20} />
                <Text style={styles.actionButtonText}>Take Photo</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setActiveTab('journal');
                setShowJournalModal(true);
              }}
              activeOpacity={0.9}
            >
              <LinearGradient colors={gradient.success} style={styles.actionButtonGradient}>
                <Calendar color={palette.textLight} size={20} />
                <Text style={styles.actionButtonText}>Log Journal</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.requirementMessage}>
            <Text style={styles.requirementText}>
              {requirements.message} to unlock insights
            </Text>
          </View>
        </View>
      );
    }

    // No insights yet (but requirements met)
    if (!aiInsights) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.emptyState}>
            <Sparkles color={palette.textMuted} size={64} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Ready to Generate Insights</Text>
            <Text style={styles.emptyText}>
              You've met the minimum requirements! Click below to analyze your progress
            </Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateInsightsForUser}
              activeOpacity={0.9}
            >
              <LinearGradient colors={gradient.primary} style={styles.generateButtonGradient}>
                <Sparkles color={palette.textLight} size={20} />
                <Text style={styles.generateButtonText}>Generate Insights</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const week = Math.ceil(dailyCompletions.length / 7) || 1;
    const routineCompletionRate = dailyCompletions.length > 0 
        ? Math.round((dailyCompletions.length / (dailyCompletions.length + 3)) * 100)
      : 0;

    return (
      <View style={styles.tabContent}>
        {/* Consistency Tracker */}
        <View style={styles.consistencyCard}>
          <LinearGradient colors={gradient.glow} style={styles.consistencyCardInner}>
            <Text style={styles.consistencyTitle}>Your Consistency This Week</Text>
            <Text style={styles.consistencyPercentage}>{aiInsights.consistency.consistencyPercentage}%</Text>
            <Text style={styles.consistencySubtitle}>
              {aiInsights.consistency.totalDaysTracked} of {aiInsights.consistency.totalPossibleDays} days tracked
            </Text>
            <AnimatedProgressBar
              progress={aiInsights.consistency.consistencyPercentage}
              height={10}
              borderRadius={5}
              gradientColors={gradient.success}
              duration={1000}
            />
            
            {/* Streak Indicators */}
            <View style={styles.streakRow}>
              <View style={styles.streakItem}>
                <Camera color={palette.primary} size={18} />
                <Text style={styles.streakLabel}>Photo</Text>
                <Text style={styles.streakValue}>{aiInsights.consistency.currentPhotoStreak} day{aiInsights.consistency.currentPhotoStreak !== 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.streakItem}>
                <Calendar color={palette.primary} size={18} />
                <Text style={styles.streakLabel}>Journal</Text>
                <Text style={styles.streakValue}>{aiInsights.consistency.currentJournalStreak} day{aiInsights.consistency.currentJournalStreak !== 1 ? 's' : ''}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Daily Tracking Calendar */}
        <View style={styles.trackingCalendar}>
          <Text style={styles.calendarTitle}>Last 7 Days</Text>
          
          {/* Photo Tracking */}
          <View style={styles.trackingRow}>
            <View style={styles.trackingLabel}>
              <Camera color={palette.primary} size={16} />
              <Text style={styles.trackingLabelText}>Photos</Text>
            </View>
            <View style={styles.calendarDays}>
              {aiInsights.consistency.last7Days.map((day, idx) => (
                <View key={idx} style={styles.calendarDay}>
                  <View style={[
                    styles.calendarCheckbox,
                    day.hasPhoto ? styles.calendarCheckboxActive : styles.calendarCheckboxInactive
                  ]}>
                    {day.hasPhoto && <CheckCircle color={palette.textLight} size={14} />}
                  </View>
                  <Text style={styles.calendarDayName}>{day.dayName}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Journal Tracking */}
          <View style={styles.trackingRow}>
            <View style={styles.trackingLabel}>
              <Calendar color={palette.primary} size={16} />
              <Text style={styles.trackingLabelText}>Journal</Text>
            </View>
            <View style={styles.calendarDays}>
              {aiInsights.consistency.last7Days.map((day, idx) => (
                <View key={idx} style={styles.calendarDay}>
                  <View style={[
                    styles.calendarCheckbox,
                    day.hasJournal ? styles.calendarCheckboxActive : styles.calendarCheckboxInactive
                  ]}>
                    {day.hasJournal && <CheckCircle color={palette.textLight} size={14} />}
                  </View>
                  <Text style={styles.calendarDayName}>{day.dayName}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Wins Section */}
        <View style={styles.insightSection}>
          <View style={styles.insightHeader}>
            <Trophy color={palette.primary} size={24} />
            <Text style={styles.insightTitle}>Your Wins (Last 5 Days)</Text>
          </View>
          {aiInsights.wins.map((win, idx) => (
            <View key={idx} style={styles.insightItem}>
              <Sparkles color={palette.success} size={16} />
              <Text style={styles.insightText}>{win}</Text>
            </View>
          ))}
        </View>

        {/* Key Insights */}
        <View style={styles.insightSection}>
          <View style={styles.insightHeader}>
            <TrendingUp color={palette.primary} size={24} />
            <Text style={styles.insightTitle}>Key Patterns Discovered</Text>
          </View>
          {aiInsights.insights.map((insight, idx) => (
            <View key={idx} style={styles.insightItem}>
              <Target color={palette.primary} size={16} />
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>

        {/* Product Report */}
        {aiInsights.productReport && (
          <>
            {aiInsights.productReport.working.length > 0 && (
              <View style={styles.insightSection}>
                <View style={styles.insightHeader}>
                  <CheckCircle color={palette.success} size={24} />
                  <Text style={styles.insightTitle}>Products Working Well</Text>
                </View>
                {aiInsights.productReport.working.map((item, idx) => (
                  <View key={idx} style={styles.insightItem}>
                    <Text style={styles.productName}>{item.product}</Text>
                    <Text style={styles.productImpact}>{item.impact}</Text>
                    <Text style={styles.insightText}>{item.recommendation}</Text>
                  </View>
                ))}
              </View>
            )}

            {aiInsights.productReport.monitoring.length > 0 && (
              <View style={styles.insightSection}>
                <View style={styles.insightHeader}>
                  <Clock color={palette.gold} size={24} />
                  <Text style={styles.insightTitle}>Products to Monitor</Text>
                </View>
                {aiInsights.productReport.monitoring.map((item, idx) => (
                  <View key={idx} style={styles.insightItem}>
                    <Text style={styles.productName}>{item.product}</Text>
                    <Text style={styles.productImpact}>{item.impact}</Text>
                    <Text style={styles.insightText}>{item.recommendation}</Text>
                  </View>
                ))}
              </View>
            )}

            {aiInsights.productReport.replace.length > 0 && (
              <View style={styles.insightSection}>
                <View style={styles.insightHeader}>
                  <AlertCircle color={palette.rose} size={24} />
                  <Text style={styles.insightTitle}>Products to Replace</Text>
                </View>
                {aiInsights.productReport.replace.map((item, idx) => (
                  <View key={idx} style={styles.insightItem}>
                    <Text style={styles.productName}>{item.product}</Text>
                    <Text style={styles.insightText}>{item.reason}</Text>
                    {item.alternative && (
                      <Text style={styles.alternativeText}>💡 Alternative: {item.alternative}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Recommendations */}
        <View style={styles.insightSection}>
          <View style={styles.insightHeader}>
            <Heart color={palette.rose} size={24} />
            <Text style={styles.insightTitle}>Personalized Recommendations</Text>
          </View>
          {aiInsights.recommendations.map((rec, idx) => (
            <View key={idx} style={styles.insightItem}>
              <CheckCircle color={palette.rose} size={16} />
              <Text style={styles.insightText}>{rec}</Text>
            </View>
          ))}
        </View>

        {/* Stats Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Week {week} Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{photos.length}</Text>
              <Text style={styles.summaryLabel}>Photos Taken</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{routineCompletionRate}%</Text>
              <Text style={styles.summaryLabel}>Routine Complete</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{journalEntries.length}</Text>
              <Text style={styles.summaryLabel}>Days Logged</Text>
            </View>
          </View>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={generateInsightsForUser}
          activeOpacity={0.9}
        >
          <LinearGradient colors={gradient.card} style={styles.refreshButtonGradient}>
            <Sparkles color={palette.primary} size={18} />
            <Text style={styles.refreshButtonText}>🔄 Refresh Insights</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const getMoodEmoji = (mood: Mood) => {
    switch (mood) {
      case 'great': return '😍';
      case 'good': return '😊';
      case 'okay': return '😐';
      case 'bad': return '😞';
      default: return '📝';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      
      {/* Floating Sparkles Background */}
      <Animated.View
        style={[
          styles.floatingSparkle,
          { top: 100, left: 30 },
          {
            opacity: sparkleAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.3, 0.8, 0.3],
            }),
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              },
            ],
          },
        ]}
      >
        <Sparkles color={palette.gold} size={20} fill={palette.gold} />
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingSparkle,
          { top: 180, right: 40 },
          {
            opacity: sparkleAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.5, 1, 0.5],
            }),
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 10],
                }),
              },
            ],
          },
        ]}
      >
        <Star color={palette.blush} size={16} fill={palette.blush} />
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingSparkle,
          { bottom: 200, left: 50 },
          {
            opacity: sparkleAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.4, 0.9, 0.4],
            }),
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 15],
                }),
              },
            ],
          },
        ]}
      >
        <Heart color={palette.rose} size={18} fill={palette.rose} />
      </Animated.View>
      
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <View style={styles.backCircle}>
            <ArrowLeft color={palette.textPrimary} size={22} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Progress Tracker</Text>
          <Text style={styles.headerSubtitle}>Track your glow transformation</Text>
        </View>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Tab Navigation */}
      <Animated.View
        style={[
          styles.tabBar,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === 'photos' && styles.activeTab]}
          onPress={() => setActiveTab('photos')}
          activeOpacity={0.8}
        >
          <Camera color={activeTab === 'photos' ? palette.textLight : palette.textMuted} size={20} />
          <Text style={[styles.tabText, activeTab === 'photos' && styles.activeTabText]}>
            Photos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'journal' && styles.activeTab]}
          onPress={() => setActiveTab('journal')}
          activeOpacity={0.8}
        >
          <Calendar color={activeTab === 'journal' ? palette.textLight : palette.textMuted} size={20} />
          <Text style={[styles.tabText, activeTab === 'journal' && styles.activeTabText]}>
            Journal
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
          onPress={() => setActiveTab('insights')}
          activeOpacity={0.8}
        >
          <Sparkles color={activeTab === 'insights' ? palette.textLight : palette.textMuted} size={20} />
          <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>
            Insights
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {activeTab === 'photos' && renderPhotosTab()}
        {activeTab === 'journal' && renderJournalTab()}
        {activeTab === 'insights' && renderInsightsTab()}
      </ScrollView>

      {/* Journal Modal */}
      <Modal
        visible={showJournalModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Daily Log</Text>
            <TouchableOpacity onPress={() => setShowJournalModal(false)}>
              <X color={palette.textMuted} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
            {/* Mood */}
            <Text style={styles.formLabel}>How are you feeling?</Text>
            <View style={styles.moodSelector}>
              {(['great', 'good', 'okay', 'bad'] as Mood[]).map((mood) => (
                <TouchableOpacity
                  key={mood}
                  style={[styles.moodButton, journalMood === mood && styles.moodButtonActive]}
                  onPress={() => setJournalMood(mood)}
                >
                  <Text style={styles.moodEmoji}>{getMoodEmoji(mood)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sleep */}
            <Text style={styles.formLabel}>Sleep (hours)</Text>
            <TextInput
              style={styles.input}
              value={journalSleep}
              onChangeText={setJournalSleep}
              keyboardType="decimal-pad"
              placeholder="7.5"
              placeholderTextColor={palette.textMuted}
            />

            {/* Water */}
            <Text style={styles.formLabel}>Water (glasses)</Text>
            <TextInput
              style={styles.input}
              value={journalWater}
              onChangeText={setJournalWater}
              keyboardType="number-pad"
              placeholder="8"
              placeholderTextColor={palette.textMuted}
            />

            {/* Stress */}
            <Text style={styles.formLabel}>Stress Level (1-5)</Text>
            <View style={styles.stressSelector}>
              {[1, 2, 3, 4, 5].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.stressButton, journalStress === level && styles.stressButtonActive]}
                  onPress={() => setJournalStress(level)}
                >
                  <Text style={[styles.stressText, journalStress === level && styles.stressTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Skin Feeling */}
            <Text style={styles.formLabel}>How does your skin feel?</Text>
            <TextInput
              style={styles.input}
              value={journalSkinFeeling}
              onChangeText={setJournalSkinFeeling}
              placeholder="e.g., Smooth, hydrated, a bit dry..."
              placeholderTextColor={palette.textMuted}
            />

            {/* Notes */}
            <Text style={styles.formLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={journalNotes}
              onChangeText={setJournalNotes}
              placeholder="Any other observations?"
              placeholderTextColor={palette.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={addJournalEntry}
              activeOpacity={0.9}
            >
              <LinearGradient colors={gradient.success} style={styles.saveButtonGradient}>
                <Text style={styles.saveButtonText}>Save Entry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Upgrade Prompt for Progress Photos */}
      {/* All features free - UpgradePrompt removed */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backButton: {
    padding: 4,
    marginRight: spacing.sm,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: palette.border,
    ...shadow.elevated,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  headerContent: {
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: palette.textSecondary,
    marginTop: 4,
    letterSpacing: 0.2,
    fontWeight: '500' as const,
  },
  floatingSparkle: {
    position: 'absolute',
    zIndex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    gap: spacing.xs,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  activeTab: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
    ...shadow.card,
    shadowColor: palette.primary,
    shadowOpacity: 0.25,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: palette.textMuted,
    letterSpacing: 0.2,
  },
  activeTabText: {
    color: palette.textLight,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.xxxxl,
  },
  tabContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  sectionContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: palette.textMuted,
    fontWeight: '500' as const,
    marginLeft: spacing.xs,
  },
  addPhotoButton: {
    marginBottom: spacing.lg,
    borderRadius: 24,
    overflow: 'hidden',
    ...shadow.elevated,
    shadowColor: palette.primary,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  addPhotoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: spacing.md,
    position: 'relative',
  },
  addPhotoText: {
    color: palette.textLight,
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: spacing.xxl,
    backgroundColor: palette.surface,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: palette.borderLight,
    marginTop: spacing.lg,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 15,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400' as const,
    maxWidth: '80%',
  },
  analysisCard: {
    borderRadius: 28,
    overflow: 'hidden',
    ...shadow.elevated,
    borderWidth: 1.5,
    borderColor: palette.border,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  analysisCardInner: {
    padding: spacing.xl,
    position: 'relative',
  },
  analysisTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    marginBottom: spacing.xl,
    letterSpacing: -0.6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metricItem: {
    flex: 1,
    minWidth: (width - spacing.lg * 2 - spacing.xl * 2 - spacing.lg) / 2,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...shadow.card,
    shadowOpacity: 0.08,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: palette.primary,
    marginTop: 12,
    marginBottom: 4,
    letterSpacing: -0.8,
  },
  metricLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '600' as const,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  improvementsSection: {
    marginTop: spacing.md,
  },
  improvementsTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: palette.textPrimary,
    marginBottom: spacing.sm,
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  improvementText: {
    fontSize: typography.bodySmall,
    color: palette.success,
    fontWeight: typography.medium,
  },
  comparisonCard: {
    backgroundColor: palette.surface,
    borderRadius: 32,
    padding: 28,
    marginBottom: spacing.lg,
    ...shadow.elevated,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  comparisonTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    marginBottom: spacing.xl,
    letterSpacing: -0.5,
  },
  comparisonImages: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comparisonImageContainer: {
    alignItems: 'center',
  },
  comparisonImage: {
    width: (width - spacing.lg * 2 - spacing.xl * 2 - 48) / 2,
    height: ((width - spacing.lg * 2 - spacing.xl * 2 - 48) / 2) * 1.3,
    borderRadius: 24,
    marginBottom: spacing.sm,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...shadow.card,
    shadowOpacity: 0.1,
  },
  comparisonLabel: {
    fontSize: 13,
    color: palette.textPrimary,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  photosGrid: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    letterSpacing: -0.5,
    flex: 1,
  },
  progressComparisonCard: {
    backgroundColor: palette.surface,
    borderRadius: 28,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: palette.border,
    ...shadow.elevated,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  progressComparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressComparisonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressComparisonTitle: {
    fontSize: typography.h5,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: palette.backgroundStart,
    borderRadius: 20,
    padding: spacing.xs,
  },
  periodButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    minWidth: 50,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: palette.primary,
  },
  periodButtonText: {
    fontSize: typography.bodySmall,
    fontWeight: typography.semibold,
    color: palette.textSecondary,
  },
  periodButtonTextActive: {
    color: palette.textLight,
  },
  comparisonImagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  comparisonImageWrapper: {
    flex: 1,
    position: 'relative',
  },
  comparisonImageNew: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: 16,
    backgroundColor: palette.backgroundStart,
  },
  comparisonImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.border,
    borderStyle: 'dashed',
  },
  comparisonImageLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  comparisonLabelText: {
    color: palette.textLight,
    fontSize: typography.caption,
    fontWeight: typography.semibold,
  },
  progressSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  progressDaysText: {
    fontSize: typography.body,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
  },
  progressStatusText: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: palette.textSecondary,
  },
  progressStatusImproving: {
    color: palette.success,
  },
  progressStatusDeclining: {
    color: palette.rose,
  },
  dailyPhotosSection: {
    backgroundColor: palette.surface,
    borderRadius: 28,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: palette.border,
    ...shadow.elevated,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  dailyPhotosScrollContainer: {
    paddingRight: spacing.lg,
    gap: spacing.lg,
  },
  dailyPhotoGroup: {
    marginRight: spacing.lg,
  },
  dailyPhotoDate: {
    fontSize: typography.bodySmall,
    fontWeight: typography.semibold,
    color: palette.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dailyPhotoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dailyPhotoCard: {
    width: 100,
    aspectRatio: 0.75,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderColor: palette.border,
    ...shadow.card,
    position: 'relative',
  },
  dailyPhotoThumbnail: {
    width: '100%',
    height: '100%',
  },
  dailyPhotoBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dailyPhotoBadgeText: {
    color: palette.textLight,
    fontSize: typography.caption,
    fontWeight: typography.extrabold,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoCard: {
    width: (width - spacing.lg * 2 - spacing.sm * 2) / 3,
    aspectRatio: 0.75,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...shadow.card,
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  photoDate: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: palette.textLight,
    fontSize: typography.caption,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  addEntryButton: {
    marginBottom: spacing.lg,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  addEntryButtonDisabled: {
    opacity: 0.7,
  },
  addEntryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  addEntryText: {
    color: palette.textLight,
    fontSize: typography.h6,
    fontWeight: typography.extrabold,
    letterSpacing: 0.5,
  },
  statsCard: {
    marginBottom: spacing.lg,
    borderRadius: 24,
    overflow: 'hidden',
    ...shadow.elevated,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statsCardInner: {
    padding: spacing.xxl,
  },
  statsTitle: {
    fontSize: typography.h4,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 48,
    fontWeight: typography.black,
    color: palette.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    fontWeight: typography.semibold,
    letterSpacing: 0.3,
  },
  entriesList: {
    marginTop: spacing.lg,
  },
  entryCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  entryDate: {
    fontSize: typography.bodySmall,
    color: palette.primary,
    fontWeight: typography.semibold,
  },
  entryMood: {
    fontSize: 20,
  },
  entryStats: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  entryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  entryStatText: {
    fontSize: typography.caption,
    color: palette.textMuted,
  },
  entryNotes: {
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  consistencyCard: {
    marginBottom: spacing.lg,
    borderRadius: 28,
    overflow: 'hidden',
    ...shadow.elevated,
    borderWidth: 2,
    borderColor: palette.gold,
  },
  consistencyCardInner: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  consistencyTitle: {
    fontSize: typography.h5,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  consistencyPercentage: {
    fontSize: 64,
    fontWeight: typography.black,
    color: palette.primary,
    letterSpacing: -2,
    textShadowColor: palette.shadow,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
    marginBottom: spacing.xs,
  },
  consistencySubtitle: {
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    marginBottom: spacing.md,
  },
  streakRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  streakItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakLabel: {
    fontSize: typography.caption,
    color: palette.textSecondary,
    fontWeight: typography.medium,
  },
  streakValue: {
    fontSize: typography.h6,
    fontWeight: typography.extrabold,
    color: palette.primary,
  },
  trackingCalendar: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  calendarTitle: {
    fontSize: typography.h5,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    marginBottom: spacing.lg,
    letterSpacing: -0.3,
  },
  trackingRow: {
    marginBottom: spacing.lg,
  },
  trackingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  trackingLabelText: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: palette.textPrimary,
  },
  calendarDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  calendarDay: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  calendarCheckbox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  calendarCheckboxActive: {
    backgroundColor: palette.success,
    borderColor: palette.success,
  },
  calendarCheckboxInactive: {
    backgroundColor: palette.backgroundStart,
    borderColor: palette.border,
  },
  calendarDayName: {
    fontSize: typography.caption,
    color: palette.textSecondary,
    fontWeight: typography.medium,
  },
  insightSection: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  insightTitle: {
    fontSize: typography.h5,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  insightText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  summaryTitle: {
    fontSize: typography.h5,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    marginBottom: spacing.lg,
    letterSpacing: -0.3,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 42,
    fontWeight: typography.black,
    color: palette.primary,
    marginBottom: spacing.xs,
    letterSpacing: -1,
  },
  summaryLabel: {
    fontSize: typography.caption,
    color: palette.textSecondary,
    fontWeight: typography.medium,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  modalTitle: {
    fontSize: typography.h5,
    fontWeight: typography.bold,
    color: palette.textPrimary,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: spacing.lg,
  },
  formLabel: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: palette.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  moodSelector: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  moodButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.border,
  },
  moodButtonActive: {
    borderColor: palette.primary,
    backgroundColor: palette.overlayGold,
  },
  moodEmoji: {
    fontSize: 32,
  },
  input: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.body,
    color: palette.textPrimary,
    borderWidth: 1,
    borderColor: palette.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  stressSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  stressButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: palette.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.border,
  },
  stressButtonActive: {
    borderColor: palette.primary,
    backgroundColor: palette.overlayGold,
  },
  stressText: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: palette.textMuted,
  },
  stressTextActive: {
    color: palette.primary,
  },
  saveButton: {
    marginTop: spacing.xxl,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  saveButtonGradient: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  saveButtonText: {
    color: palette.textLight,
    fontSize: typography.h6,
    fontWeight: typography.extrabold,
    letterSpacing: 0.5,
  },
  generateButton: {
    marginTop: spacing.xl,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  generateButtonText: {
    color: palette.textLight,
    fontSize: typography.h6,
    fontWeight: typography.extrabold,
    letterSpacing: 0.5,
  },
  refreshButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
  },
  refreshButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    backgroundColor: palette.surface,
  },
  refreshButtonText: {
    color: palette.primary,
    fontSize: typography.body,
    fontWeight: typography.semibold,
    letterSpacing: 0.3,
  },
  productName: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    color: palette.textPrimary,
    marginBottom: spacing.xs,
  },
  productImpact: {
    fontSize: typography.bodySmall,
    fontWeight: typography.medium,
    color: palette.primary,
    marginBottom: spacing.xs,
  },
  alternativeText: {
    fontSize: typography.bodySmall,
    color: palette.success,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  onboardingCard: {
    marginBottom: spacing.lg,
    borderRadius: 28,
    overflow: 'hidden',
    ...shadow.elevated,
    borderWidth: 2,
    borderColor: palette.gold,
  },
  onboardingCardInner: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  onboardingTitle: {
    fontSize: typography.h4,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  onboardingSubtitle: {
    fontSize: typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: typography.medium,
  },
  progressTrackerCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  progressTrackerTitle: {
    fontSize: typography.h5,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    marginBottom: spacing.lg,
    letterSpacing: -0.3,
  },
  progressItem: {
    marginBottom: spacing.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressLabel: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: palette.textPrimary,
  },
  progressCount: {
    fontSize: typography.body,
    fontWeight: typography.extrabold,
    color: palette.primary,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: palette.backgroundStart,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: palette.primary,
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: typography.caption,
    color: palette.textSecondary,
    fontWeight: typography.medium,
  },
  featuresCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  featuresTitle: {
    fontSize: typography.h5,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  featureText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  actionButtonText: {
    color: palette.textLight,
    fontSize: typography.body,
    fontWeight: typography.extrabold,
    letterSpacing: 0.3,
  },
  requirementMessage: {
    backgroundColor: palette.overlayBlush,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
  },
  requirementText: {
    fontSize: typography.bodySmall,
    color: palette.blush,
    fontWeight: typography.semibold,
    textAlign: 'center',
  },
  insightsPaywallContainer: {
    marginBottom: spacing.lg,
    borderRadius: 24,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  insightsPaywallGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  insightsPaywallIcon: {
    marginBottom: spacing.lg,
  },
  insightsPaywallIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightsPaywallTitle: {
    fontSize: typography.h4,
    fontWeight: typography.extrabold,
    color: palette.textLight,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  insightsPaywallSubtitle: {
    fontSize: typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  insightsValueSection: {
    width: '100%',
    marginTop: spacing.md,
  },
  insightsValueTitle: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    color: palette.textLight,
    marginBottom: spacing.md,
  },
  insightsValueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  insightsValueIconBg: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  insightsValueIconGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  insightsValueContent: {
    flex: 1,
  },
  insightsValueHeading: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: palette.textLight,
    marginBottom: spacing.xs,
  },
  insightsValueText: {
    fontSize: typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  insightsSocialProof: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  insightsSocialText: {
    fontSize: typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  insightsSocialHighlight: {
    color: palette.primary,
    fontWeight: typography.bold,
  },
  insightsProgressPreview: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  insightsProgressTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: palette.textLight,
    marginBottom: spacing.sm,
  },
  insightsProgressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  insightsProgressStat: {
    alignItems: 'center',
  },
  insightsProgressValue: {
    fontSize: typography.h5,
    fontWeight: typography.extrabold,
    color: palette.primary,
  },
  insightsProgressLabel: {
    fontSize: typography.caption,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  insightsProgressMessage: {
    fontSize: typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  insightsPaywallCTA: {
    width: '100%',
    marginTop: spacing.xl,
    borderRadius: 16,
    overflow: 'hidden',
  },
  insightsPaywallCTAGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  insightsPaywallCTAContent: {
    alignItems: 'center',
  },
  insightsPaywallCTAMain: {
    fontSize: typography.h6,
    fontWeight: typography.extrabold,
    color: '#1A1A1A',
    marginBottom: spacing.xs,
  },
  insightsPaywallCTASub: {
    fontSize: typography.bodySmall,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  insightsPaywallDisclaimer: {
    fontSize: typography.caption,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  continueTrackingSection: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  continueTrackingTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: palette.textLight,
    marginBottom: spacing.xs,
  },
  continueTrackingText: {
    fontSize: typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  continueTrackingButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  continueTrackingButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  continueTrackingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  continueTrackingButtonText: {
    fontSize: typography.bodySmall,
    fontWeight: typography.semibold,
    color: palette.textLight,
  },
});
