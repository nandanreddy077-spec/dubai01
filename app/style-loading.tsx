import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Eye } from 'lucide-react-native';
import { useStyle } from '@/contexts/StyleContext';
import { palette, shadow } from '@/constants/theme';

const LOADING_MESSAGES = [
  'Analyzing your style...',
  'Evaluating color harmony...',
  'Assessing fit and silhouette...',
  'Analyzing with AI precision...',
];

export default function StyleLoadingScreen() {
  const { currentImage, selectedOccasion, occasions, analyzeOutfit } = useStyle();
  const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const selectedOccasionData = occasions.find(o => o.id === selectedOccasion);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) return 0;
        return prev + 0.25;
      });
    }, 750);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [pulseAnim]);

  useEffect(() => {
    const performAnalysis = async () => {
      if (!currentImage || !selectedOccasion) {
        router.replace('/style-check');
        return;
      }

      try {
        await analyzeOutfit(currentImage, selectedOccasionData?.name || selectedOccasion);
        router.replace('/style-results');
      } catch (error) {
        console.error('Style analysis failed:', error);
        router.replace('/style-check');
      }
    };

    const timer = setTimeout(performAnalysis, 3000);
    return () => clearTimeout(timer);
  }, [currentImage, selectedOccasion, selectedOccasionData, analyzeOutfit]);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Outfit Preview */}
          {currentImage && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: currentImage }} style={styles.outfitImage} />
              <View style={styles.occasionBadge}>
                <Text style={styles.occasionEmoji}>{selectedOccasionData?.icon}</Text>
                <Text style={styles.occasionText}>{selectedOccasionData?.name}</Text>
                <View style={styles.occasionDot} />
              </View>
            </View>
          )}

          {/* Eye Icon with Pulse Animation */}
          <Animated.View 
            style={[
              styles.eyeContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Eye color={palette.rose} size={48} strokeWidth={1.5} />
          </Animated.View>

          {/* Loading Text */}
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingTitle}>AI Style Analysis</Text>
            <Text style={styles.loadingMessage}>
              {LOADING_MESSAGES[currentMessageIndex]}
            </Text>
          </View>

          {/* Progress Dots */}
          <View style={styles.progressContainer}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  progress > index * 0.25 && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          {/* Bottom Text */}
          <Text style={styles.bottomText}>
            {LOADING_MESSAGES[currentMessageIndex]}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EDE6',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  outfitImage: {
    width: 280,
    height: 360,
    borderRadius: 32,
    marginBottom: 20,
    ...shadow.elevated,
  },
  occasionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    ...shadow.card,
  },
  occasionEmoji: {
    fontSize: 18,
  },
  occasionText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
    letterSpacing: 0.2,
  },
  occasionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F2CAD6',
    marginLeft: 4,
  },
  eyeContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(242, 202, 214, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  loadingMessage: {
    fontSize: 18,
    color: palette.rose,
    textAlign: 'center',
    fontWeight: '400',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 80,
  },
  progressDot: {
    width: 40,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(242, 202, 214, 0.3)',
  },
  progressDotActive: {
    backgroundColor: palette.rose,
  },
  bottomText: {
    fontSize: 16,
    color: palette.textMuted,
    textAlign: 'center',
    fontWeight: '400',
    position: 'absolute',
    bottom: 40,
  },
});