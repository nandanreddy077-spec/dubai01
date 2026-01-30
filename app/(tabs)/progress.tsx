import React, { useState, useEffect, useRef } from 'react';
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
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react-native';

import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { shadow } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import PressableScale from '@/components/PressableScale';
import { analyzeProgressPhoto } from '@/lib/ai-helpers';

const { width: screenWidth } = Dimensions.get('window');
const PHOTO_WIDTH = screenWidth - 80;

interface ProgressPhoto {
  id: string;
  uri: string;
  date: string;
  timestamp: number;
  label?: string;
  analysis?: {
    hydration: number;
    texture: number;
    brightness: number;
    acne: number;
  };
}

const STORAGE_KEY = 'progress_photos_v2';

export default function ProgressScreen() {
  useUser();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPhotos();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadPhotos = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPhotos(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading photos:', error);
    }
  };

  const savePhotos = async (newPhotos: ProgressPhoto[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPhotos));
      setPhotos(newPhotos);
    } catch (error) {
      console.log('Error saving photos:', error);
    }
  };

  const getChangeLabel = (photo: ProgressPhoto, prevPhoto?: ProgressPhoto): string => {
    if (!photo.analysis || !prevPhoto?.analysis) return '';
    
    const changes: string[] = [];
    const hydrationDiff = photo.analysis.hydration - prevPhoto.analysis.hydration;
    const textureDiff = photo.analysis.texture - prevPhoto.analysis.texture;
    const brightnessDiff = photo.analysis.brightness - prevPhoto.analysis.brightness;
    
    if (hydrationDiff > 5) changes.push('More hydrated');
    if (textureDiff > 5) changes.push('Smoother');
    if (brightnessDiff > 5) changes.push('Brighter');
    if (hydrationDiff < -5) changes.push('Drier');
    if (textureDiff < -5) changes.push('Rougher');
    
    return changes.length > 0 ? changes[0] : 'Looking good';
  };

  const processPhoto = async (uri: string) => {
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

      if (photos.length > 0) {
        newPhoto.label = getChangeLabel(newPhoto, photos[0]);
      }

      const updated = [newPhoto, ...photos].slice(0, 30);
      await savePhotos(updated);
      setCurrentIndex(0);
      
      Alert.alert('Photo Added!', 'Your progress photo has been saved.');
    } catch (error) {
      console.log('Error processing photo:', error);
      Alert.alert('Error', 'Could not analyze the photo. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddPhoto = async () => {
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
      Alert.alert(
        'Add Photo',
        'Choose an option',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please allow camera access');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
                cameraType: ImagePicker.CameraType.front,
              });

              if (!result.canceled && result.assets[0]) {
                await processPhoto(result.assets[0].uri);
              }
            },
          },
          {
            text: 'Choose from Library',
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
                await processPhoto(result.assets[0].uri);
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const goToPrevious = () => {
    if (currentIndex < photos.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({ x: newIndex * (PHOTO_WIDTH + 20), animated: true });
    }
  };

  const goToNext = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({ x: newIndex * (PHOTO_WIDTH + 20), animated: true });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysDiff = () => {
    if (photos.length < 2) return 0;
    const newest = photos[0].timestamp;
    const oldest = photos[photos.length - 1].timestamp;
    return Math.floor((newest - oldest) / (1000 * 60 * 60 * 24));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Progress</Text>
          {photos.length > 1 && (
            <Text style={styles.headerSubtitle}>{getDaysDiff()} days of progress</Text>
          )}
        </View>

        {photos.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <ImageIcon color="#9CA3AF" size={48} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Start Your Journey</Text>
            <Text style={styles.emptySubtitle}>
              Take your first progress photo to track how your skin improves over time.
            </Text>
            <PressableScale
              onPress={handleAddPhoto}
              pressedScale={0.97}
              haptics="medium"
              style={styles.emptyButton}
            >
              <LinearGradient
                colors={['#0A0A0A', '#1F2937']}
                style={styles.emptyButtonGradient}
              >
                <Camera color="#FFFFFF" size={22} />
                <Text style={styles.emptyButtonText}>Take First Photo</Text>
              </LinearGradient>
            </PressableScale>
          </View>
        ) : (
          <>
            <View style={styles.timelineContainer}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photosScroll}
                decelerationRate="fast"
                snapToInterval={PHOTO_WIDTH + 20}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / (PHOTO_WIDTH + 20));
                  setCurrentIndex(index);
                }}
              >
                {photos.map((photo, index) => (
                  <View 
                    key={photo.id} 
                    style={[
                      styles.photoCard,
                      index === 0 && { marginLeft: 40 },
                      index === photos.length - 1 && { marginRight: 40 },
                    ]}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                    <View style={styles.photoOverlay}>
                      <Text style={styles.photoDate}>{formatDate(photo.date)}</Text>
                      {photo.label && (
                        <View style={styles.labelBadge}>
                          <Sparkles color="#C9A961" size={14} />
                          <Text style={styles.labelText}>{photo.label}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>

              {photos.length > 1 && (
                <View style={styles.navigationButtons}>
                  <TouchableOpacity 
                    style={[styles.navButton, currentIndex >= photos.length - 1 && styles.navButtonDisabled]}
                    onPress={goToPrevious}
                    disabled={currentIndex >= photos.length - 1}
                  >
                    <ChevronLeft color={currentIndex >= photos.length - 1 ? '#D1D5DB' : '#374151'} size={28} />
                  </TouchableOpacity>
                  <Text style={styles.photoCounter}>
                    {currentIndex + 1} of {photos.length}
                  </Text>
                  <TouchableOpacity 
                    style={[styles.navButton, currentIndex <= 0 && styles.navButtonDisabled]}
                    onPress={goToNext}
                    disabled={currentIndex <= 0}
                  >
                    <ChevronRight color={currentIndex <= 0 ? '#D1D5DB' : '#374151'} size={28} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {photos.length >= 2 && (
              <View style={styles.comparisonHint}>
                <Text style={styles.comparisonText}>
                  ← Swipe to see older photos
                </Text>
              </View>
            )}

            <View style={styles.addButtonContainer}>
              <PressableScale
                onPress={handleAddPhoto}
                pressedScale={0.97}
                haptics="medium"
                disabled={isAnalyzing}
                style={styles.addButton}
              >
                <LinearGradient
                  colors={['#0A0A0A', '#1F2937']}
                  style={styles.addButtonGradient}
                >
                  <Camera color="#FFFFFF" size={22} />
                  <Text style={styles.addButtonText}>
                    {isAnalyzing ? 'Analyzing...' : 'Add New Photo'}
                  </Text>
                </LinearGradient>
              </PressableScale>
            </View>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    width: '100%',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 10,
  },
  emptyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timelineContainer: {
    flex: 1,
  },
  photosScroll: {
    paddingVertical: 16,
  },
  photoCard: {
    width: PHOTO_WIDTH,
    height: PHOTO_WIDTH * 1.33,
    marginRight: 20,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    ...shadow.medium,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 60,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
  },
  photoDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    alignSelf: 'flex-start',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 24,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  photoCounter: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 80,
    textAlign: 'center',
  },
  comparisonHint: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  comparisonText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  addButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
    paddingTop: 16,
  },
  addButton: {
    width: '100%',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 10,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
