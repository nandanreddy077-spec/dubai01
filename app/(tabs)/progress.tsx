import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  TrendingUp,
  Flame,
  Droplets,
  Sparkles,
  ArrowRight,
  Settings,
  ChevronRight,
} from 'lucide-react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palette, gradient, shadow } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useGamification } from '@/contexts/GamificationContext';
import { analyzeProgressPhoto } from '@/lib/ai-helpers';

Dimensions.get('window');

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
  };
}

const STORAGE_KEY = 'progress_photos_v1';

export default function MyGlowScreen() {
  const { user } = useUser();
  useGamification();
  
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const currentStreak = user?.stats.dayStreak || 0;

  useEffect(() => {
    loadPhotos();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const loadPhotos = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) setPhotos(JSON.parse(data));
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const savePhotos = async (newPhotos: ProgressPhoto[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPhotos));
      setPhotos(newPhotos);
    } catch (error) {
      console.error('Error saving photos:', error);
    }
  };

  const processPhoto = useCallback(async (uri: string) => {
    setIsAnalyzing(true);
    try {
      const aiAnalysis = await analyzeProgressPhoto(uri);
      
      const newPhoto: ProgressPhoto = {
        id: Date.now().toString(),
        uri,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        analysis: {
          hydration: aiAnalysis.hydration,
          texture: aiAnalysis.texture,
          brightness: aiAnalysis.brightness,
          acne: aiAnalysis.acne,
        },
      };

      const updatedPhotos = [newPhoto, ...photos].slice(0, 30);
      await savePhotos(updatedPhotos);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error processing photo:', error);
      Alert.alert('Error', 'Failed to analyze photo. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [photos]);

  const takePhoto = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (Platform.OS === 'web') {
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
        await processPhoto(result.assets[0].uri);
      }
    } else {
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
        await processPhoto(result.assets[0].uri);
      }
    }
  }, [processPhoto]);

  const comparison = useMemo(() => {
    if (photos.length < 2) return null;
    const sorted = [...photos].sort((a, b) => a.timestamp - b.timestamp);
    const first = sorted[0];
    const latest = sorted[sorted.length - 1];
    const days = Math.floor((latest.timestamp - first.timestamp) / (1000 * 60 * 60 * 24));
    return { first, latest, days };
  }, [photos]);

  const weeklyPhotos = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    return photos.filter(p => p.timestamp >= weekAgo).slice(0, 7);
  }, [photos]);

  const avgMetrics = useMemo(() => {
    if (photos.length === 0) return null;
    const recent = photos.slice(0, 5);
    const withAnalysis = recent.filter(p => p.analysis);
    if (withAnalysis.length === 0) return null;
    
    return {
      hydration: Math.round(withAnalysis.reduce((sum, p) => sum + (p.analysis?.hydration || 0), 0) / withAnalysis.length),
      brightness: Math.round(withAnalysis.reduce((sum, p) => sum + (p.analysis?.brightness || 0), 0) / withAnalysis.length),
      texture: Math.round(withAnalysis.reduce((sum, p) => sum + (p.analysis?.texture || 0), 0) / withAnalysis.length),
    };
  }, [photos]);

  const improvement = useMemo(() => {
    if (!comparison?.first?.analysis || !comparison?.latest?.analysis) return 0;
    const firstAvg = (comparison.first.analysis.hydration + comparison.first.analysis.brightness + comparison.first.analysis.texture) / 3;
    const latestAvg = (comparison.latest.analysis.hydration + comparison.latest.analysis.brightness + comparison.latest.analysis.texture) / 3;
    return Math.round(latestAvg - firstAvg);
  }, [comparison]);

  const handleSettings = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/profile');
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View>
          <Text style={styles.headerTitle}>My Glow</Text>
          <Text style={styles.headerSubtitle}>Your skin journey</Text>
        </View>
        <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
          <Settings color={palette.textSecondary} size={24} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Streak Card */}
        <Animated.View style={[styles.streakCard, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={currentStreak > 0 ? ['#FF6B35', '#FF8F5F'] : [palette.surfaceAlt, palette.surface]}
            style={styles.streakGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Flame color="#FFFFFF" size={28} fill="#FFFFFF" />
            <View style={styles.streakContent}>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
            <View style={styles.streakDots}>
              {[...Array(7)].map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.streakDot,
                    i < Math.min(currentStreak, 7) && styles.streakDotActive
                  ]} 
                />
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Before/After Comparison */}
        {comparison && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp color={palette.primary} size={22} />
              <Text style={styles.sectionTitle}>Your Progress</Text>
            </View>
            
            <View style={styles.comparisonCard}>
              <View style={styles.comparisonImages}>
                <View style={styles.comparisonItem}>
                  <Image source={{ uri: comparison.first.uri }} style={styles.comparisonPhoto} />
                  <View style={styles.comparisonLabel}>
                    <Text style={styles.comparisonLabelText}>Day 1</Text>
                  </View>
                </View>
                
                <View style={styles.comparisonArrow}>
                  <ArrowRight color={palette.gold} size={28} strokeWidth={2.5} />
                </View>
                
                <View style={styles.comparisonItem}>
                  <Image source={{ uri: comparison.latest.uri }} style={styles.comparisonPhoto} />
                  <View style={styles.comparisonLabel}>
                    <Text style={styles.comparisonLabelText}>Today</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.comparisonStats}>
                <Text style={styles.comparisonDays}>{comparison.days} Days</Text>
                <View style={[
                  styles.improvementBadge,
                  improvement >= 0 ? styles.improvementPositive : styles.improvementNegative
                ]}>
                  <TrendingUp 
                    color={improvement >= 0 ? '#10B981' : '#EF4444'} 
                    size={16} 
                    style={improvement < 0 ? { transform: [{ rotate: '180deg' }] } : undefined}
                  />
                  <Text style={[
                    styles.improvementText,
                    improvement >= 0 ? styles.improvementTextPositive : styles.improvementTextNegative
                  ]}>
                    {improvement >= 0 ? '+' : ''}{improvement}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Current Metrics */}
        {avgMetrics && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sparkles color={palette.gold} size={22} />
              <Text style={styles.sectionTitle}>Current Glow</Text>
            </View>
            
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Droplets color="#60A5FA" size={24} />
                <Text style={styles.metricValue}>{avgMetrics.hydration}%</Text>
                <Text style={styles.metricLabel}>Hydration</Text>
              </View>
              
              <View style={styles.metricCard}>
                <Sparkles color="#FBBF24" size={24} />
                <Text style={styles.metricValue}>{avgMetrics.brightness}%</Text>
                <Text style={styles.metricLabel}>Brightness</Text>
              </View>
              
              <View style={styles.metricCard}>
                <View style={styles.textureIcon}>
                  <Text style={styles.textureIconText}>✨</Text>
                </View>
                <Text style={styles.metricValue}>{avgMetrics.texture}%</Text>
                <Text style={styles.metricLabel}>Texture</Text>
              </View>
            </View>
          </View>
        )}

        {/* Weekly Photos Timeline */}
        {weeklyPhotos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Camera color={palette.primary} size={22} />
              <Text style={styles.sectionTitle}>This Week</Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timelineScroll}
            >
              {weeklyPhotos.map((photo) => (
                <View key={photo.id} style={styles.timelineItem}>
                  <Image source={{ uri: photo.uri }} style={styles.timelinePhoto} />
                  <Text style={styles.timelineDate}>
                    {new Date(photo.timestamp).toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  {photo.analysis && (
                    <View style={styles.timelineScore}>
                      <Text style={styles.timelineScoreText}>
                        {Math.round((photo.analysis.hydration + photo.analysis.brightness + photo.analysis.texture) / 3)}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Empty State */}
        {photos.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Camera color={palette.textMuted} size={48} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Start Your Journey</Text>
            <Text style={styles.emptyText}>
              Take your first photo to track your skin transformation
            </Text>
          </View>
        )}

        {/* Add Photo Button */}
        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={takePhoto}
          activeOpacity={0.9}
          disabled={isAnalyzing}
        >
          <LinearGradient colors={['#0A0A0A', '#1A1A1A']} style={styles.addPhotoGradient}>
            {isAnalyzing ? (
              <Text style={styles.addPhotoText}>Analyzing...</Text>
            ) : (
              <>
                <Camera color="#FFFFFF" size={24} />
                <Text style={styles.addPhotoText}>Take Progress Photo</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity 
            style={styles.quickLink}
            onPress={() => router.push('/(tabs)/glow-coach')}
            activeOpacity={0.8}
          >
            <Text style={styles.quickLinkText}>View Routine</Text>
            <ChevronRight color={palette.textMuted} size={20} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: palette.textSecondary,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  streakCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    ...shadow.medium,
  },
  streakGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  streakContent: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  streakLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600' as const,
    marginTop: -2,
  },
  streakDots: {
    flexDirection: 'row',
    gap: 6,
  },
  streakDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  streakDotActive: {
    backgroundColor: '#FFFFFF',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    letterSpacing: -0.4,
  },
  comparisonCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: palette.border,
    ...shadow.soft,
  },
  comparisonImages: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  comparisonItem: {
    flex: 1,
    position: 'relative',
  },
  comparisonPhoto: {
    width: '100%',
    aspectRatio: 0.8,
    borderRadius: 16,
    backgroundColor: palette.surfaceAlt,
  },
  comparisonLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comparisonLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  comparisonArrow: {
    paddingHorizontal: 12,
  },
  comparisonStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  comparisonDays: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: palette.textPrimary,
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  improvementPositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  improvementNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  improvementText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  improvementTextPositive: {
    color: '#10B981',
  },
  improvementTextNegative: {
    color: '#EF4444',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: palette.border,
    ...shadow.minimal,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    marginTop: 10,
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  textureIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textureIconText: {
    fontSize: 20,
  },
  timelineScroll: {
    paddingRight: 24,
    gap: 12,
  },
  timelineItem: {
    width: 90,
    marginRight: 12,
  },
  timelinePhoto: {
    width: 90,
    height: 120,
    borderRadius: 14,
    backgroundColor: palette.surfaceAlt,
  },
  timelineDate: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '600' as const,
    textAlign: 'center',
    marginTop: 8,
  },
  timelineScore: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timelineScoreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    backgroundColor: palette.surface,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: palette.border,
    marginBottom: 24,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  addPhotoButton: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow.medium,
  },
  addPhotoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  addPhotoText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  quickLinks: {
    gap: 12,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  quickLinkText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: palette.textPrimary,
  },
});
