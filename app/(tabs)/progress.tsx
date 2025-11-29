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
  Lock,
  Star,
  Clock,
  X,
  Plus,
  ArrowRight,
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
import AnimatedProgressBar from '@/components/AnimatedProgressBar';
import PremiumPaywall from '@/components/PremiumPaywall';
import { useSubscription } from '@/contexts/SubscriptionContext';

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
  progressScore: number; // 0-100
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
  const { subscription } = useSubscription();
  const params = useLocalSearchParams<{ tab?: string }>();
  
  const [activeTab, setActiveTab] = useState<Tab>((params.tab as Tab) || 'photos');
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [insights, setInsights] = useState<WeeklyInsight[]>([]);
  
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [photoNotes, setPhotoNotes] = useState('');

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

  const isLocked = !subscription?.active;

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

  const pickImage = async () => {
    if (isLocked) {
      setShowPaywall(true);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImagePickerAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setShowPhotoModal(true);
      const uri = result.assets[0].uri;
      
      // Simulate AI analysis (you can connect to real AI API)
      const analysis = {
        hydration: Math.floor(Math.random() * 30) + 70,
        texture: Math.floor(Math.random() * 30) + 65,
        brightness: Math.floor(Math.random() * 30) + 70,
        acne: Math.floor(Math.random() * 20) + 10,
        improvements: ['Hydration improved by 8%', 'Texture smoother'],
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
      setShowPhotoModal(false);
      setPhotoNotes('');
    }
  };

  const addJournalEntry = async () => {
    if (isLocked) {
      setShowPaywall(true);
      return;
    }

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
  };

  const resetJournalForm = () => {
    setJournalMood('good');
    setJournalSleep('7');
    setJournalWater('8');
    setJournalStress(3);
    setJournalNotes('');
    setJournalSkinFeeling('');
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

  const renderPhotosTab = () => {
    const hasPhotos = photos.length > 0;
    const latestPhoto = photos[0];
    const comparePhoto = photos.find(p => {
      const daysDiff = (Date.now() - p.timestamp) / (1000 * 60 * 60 * 24);
      return daysDiff >= 7 && daysDiff <= 10;
    });

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

        {hasPhotos && latestPhoto?.analysis && (
          <View style={styles.analysisCard}>
            <LinearGradient colors={gradient.card} style={styles.analysisCardInner}>
              <Text style={styles.analysisTitle}>Latest Analysis</Text>
              
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
        )}

        {comparePhoto && latestPhoto && (
          <View style={styles.comparisonCard}>
            <Text style={styles.comparisonTitle}>7-Day Progress</Text>
            <View style={styles.comparisonImages}>
              <View style={styles.comparisonImageContainer}>
                <Image source={{ uri: comparePhoto.uri }} style={styles.comparisonImage} />
                <Text style={styles.comparisonLabel}>Before</Text>
              </View>
              <ArrowRight color={palette.primary} size={24} />
              <View style={styles.comparisonImageContainer}>
                <Image source={{ uri: latestPhoto.uri }} style={styles.comparisonImage} />
                <Text style={styles.comparisonLabel}>Now</Text>
              </View>
            </View>
          </View>
        )}

        {/* Photos Grid */}
        {hasPhotos && (
          <View style={styles.photosGrid}>
            <Text style={styles.sectionTitle}>Your Journey</Text>
            <View style={styles.gridContainer}>
              {photos.map((photo) => (
                <TouchableOpacity key={photo.id} style={styles.photoCard} activeOpacity={0.8}>
                  <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                  <Text style={styles.photoDate}>
                    {new Date(photo.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              ))}
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

  const renderInsightsTab = () => {
    if (!canUnlockInsights) {
      return (
        <View style={styles.lockedState}>
          <Lock color={palette.primary} size={64} strokeWidth={1.5} />
          <Text style={styles.lockedTitle}>Unlock AI Insights</Text>
          <Text style={styles.lockedText}>
            Track consistently for 5+ days to unlock personalized AI insights about your transformation
          </Text>
          <View style={styles.progressRequirements}>
            <View style={styles.requirementItem}>
              <CheckCircle 
                color={journalEntries.length >= 5 ? palette.success : palette.textMuted} 
                size={20} 
              />
              <Text style={styles.requirementText}>
                Journal entries: {journalEntries.length}/5
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <CheckCircle 
                color={photos.length >= 3 ? palette.success : palette.textMuted} 
                size={20} 
              />
              <Text style={styles.requirementText}>
                Progress photos: {photos.length}/3
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // Mock insight data
    const currentInsight = {
      week: Math.ceil(dailyCompletions.length / 7),
      progressScore: 85,
      wins: [
        'Hydration levels improved by 12%',
        'Skin texture significantly smoother',
        'Consistent 7+ hours sleep this week',
      ],
      correlations: [
        'Higher water intake correlates with 15% better hydration scores',
        'Better sleep (7+ hours) shows 20% improvement in skin brightness',
      ],
      recommendations: [
        'Continue drinking 8+ glasses of water daily',
        'Add vitamin C serum to morning routine',
        'Consider weekly exfoliation for texture',
      ],
      photosCount: photos.length,
      routineCompletionRate: dailyCompletions.length > 0 
        ? Math.round((dailyCompletions.length / (dailyCompletions.length + 3)) * 100)
        : 0,
    };

    return (
      <View style={styles.tabContent}>
        {/* Progress Score */}
        <View style={styles.scoreCard}>
          <LinearGradient colors={gradient.glow} style={styles.scoreCardInner}>
            <Text style={styles.scoreTitle}>Your Progress Score</Text>
            <Text style={styles.scoreValue}>{currentInsight.progressScore}</Text>
            <Text style={styles.scoreSubtitle}>Out of 100</Text>
            <AnimatedProgressBar
              progress={currentInsight.progressScore}
              height={8}
              borderRadius={4}
              gradientColors={gradient.success}
              duration={1000}
            />
          </LinearGradient>
        </View>

        {/* Wins Section */}
        <View style={styles.insightSection}>
          <View style={styles.insightHeader}>
            <Trophy color={palette.primary} size={24} />
            <Text style={styles.insightTitle}>This Week's Wins</Text>
          </View>
          {currentInsight.wins.map((win, idx) => (
            <View key={idx} style={styles.insightItem}>
              <Sparkles color={palette.success} size={16} />
              <Text style={styles.insightText}>{win}</Text>
            </View>
          ))}
        </View>

        {/* Correlations */}
        <View style={styles.insightSection}>
          <View style={styles.insightHeader}>
            <TrendingUp color={palette.primary} size={24} />
            <Text style={styles.insightTitle}>Pattern Recognition</Text>
          </View>
          {currentInsight.correlations.map((correlation, idx) => (
            <View key={idx} style={styles.insightItem}>
              <Target color={palette.primary} size={16} />
              <Text style={styles.insightText}>{correlation}</Text>
            </View>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.insightSection}>
          <View style={styles.insightHeader}>
            <Heart color={palette.rose} size={24} />
            <Text style={styles.insightTitle}>Recommendations</Text>
          </View>
          {currentInsight.recommendations.map((rec, idx) => (
            <View key={idx} style={styles.insightItem}>
              <CheckCircle color={palette.rose} size={16} />
              <Text style={styles.insightText}>{rec}</Text>
            </View>
          ))}
        </View>

        {/* Stats Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Week {currentInsight.week} Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{currentInsight.photosCount}</Text>
              <Text style={styles.summaryLabel}>Photos Taken</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{currentInsight.routineCompletionRate}%</Text>
              <Text style={styles.summaryLabel}>Routine Complete</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{currentInsight.week}</Text>
              <Text style={styles.summaryLabel}>Week Number</Text>
            </View>
          </View>
        </View>
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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Progress Tracker</Text>
          <Text style={styles.headerSubtitle}>Track your glow transformation</Text>
        </View>
        {isLocked && (
          <TouchableOpacity
            style={styles.unlockButton}
            onPress={() => setShowPaywall(true)}
            activeOpacity={0.8}
          >
            <Lock color={palette.primary} size={20} />
          </TouchableOpacity>
        )}
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
          {!canUnlockInsights && (
            <View style={styles.lockedBadge}>
              <Lock color={palette.textLight} size={10} />
            </View>
          )}
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

      {/* Premium Paywall */}
      {showPaywall && (
        <PremiumPaywall
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          feature="Progress Tracker"
        />
      )}
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
  headerContent: {
    flex: 1,
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
  unlockButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.overlayGold,
    justifyContent: 'center',
    alignItems: 'center',
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
  lockedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: palette.rose,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.xxxxl,
  },
  tabContent: {
    paddingHorizontal: spacing.lg,
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
    marginBottom: spacing.lg,
    borderRadius: 32,
    overflow: 'hidden',
    ...shadow.elevated,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: palette.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  analysisCardInner: {
    padding: 28,
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
    gap: spacing.lg,
    marginBottom: spacing.xl,
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
    fontSize: 24,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    marginBottom: spacing.xl,
    letterSpacing: -0.6,
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
  lockedState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxxl,
    paddingHorizontal: spacing.xxl,
  },
  lockedTitle: {
    fontSize: typography.h4,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  lockedText: {
    fontSize: typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  progressRequirements: {
    width: '100%',
    gap: spacing.md,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.surface,
    padding: spacing.lg,
    borderRadius: 12,
  },
  requirementText: {
    fontSize: typography.body,
    color: palette.textPrimary,
    fontWeight: typography.medium,
  },
  scoreCard: {
    marginBottom: spacing.lg,
    borderRadius: 28,
    overflow: 'hidden',
    ...shadow.elevated,
    borderWidth: 2,
    borderColor: palette.gold,
  },
  scoreCardInner: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  scoreTitle: {
    fontSize: typography.h4,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  scoreValue: {
    fontSize: 88,
    fontWeight: typography.black,
    color: palette.primary,
    letterSpacing: -3,
    textShadowColor: palette.shadow,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  scoreSubtitle: {
    fontSize: typography.body,
    color: palette.textSecondary,
    marginBottom: spacing.lg,
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
});
