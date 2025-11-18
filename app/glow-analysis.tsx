import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Camera, AlertTriangle, RotateCcw, CheckCircle, User, Sparkles, Star, Heart } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from 'expo-linear-gradient';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface CapturedPhoto {
  uri: string;
  angle: 'front' | 'left' | 'right';
  timestamp: number;
}

export default function GlowAnalysisScreen() {
  const { error } = useLocalSearchParams<{ error?: string }>();
  const { theme } = useTheme();
  const { canScan, needsPremium, scansLeft, inTrial, isTrialExpired } = useSubscription();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [currentAngle, setCurrentAngle] = useState<'front' | 'left' | 'right'>('front');
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = createStyles(palette);

  useEffect(() => {
    if (error === 'no_face_detected') {
      setShowError(true);
      Alert.alert(
        "No Face Detected",
        "We couldn't detect a valid face in your photo. Please ensure:\n\n• Your face is clearly visible and well-lit\n• You're looking directly at the camera\n• The photo is not blurry\n• Only one face is in the photo\n• Avoid photos of objects, animals, or multiple people",
        [
          {
            text: "Try Again",
            onPress: () => setShowError(false)
          }
        ]
      );
    } else if (error === 'analysis_failed') {
      setShowError(true);
      Alert.alert(
        "Analysis Failed",
        "We encountered an error while analyzing your photo. Please try again with a clear, well-lit photo of your face.",
        [
          {
            text: "Try Again",
            onPress: () => setShowError(false)
          }
        ]
      );
    }
  }, [error]);

  const getAngleInstructions = (angle: 'front' | 'left' | 'right') => {
    switch (angle) {
      case 'front':
        return {
          title: "Front View",
          instruction: "Look directly at the camera with a gentle, natural expression. Ensure your face is well-lit and centered in the frame.",
          icon: <User color={palette.primary} size={28} strokeWidth={2.5} />
        };
      case 'left':
        return {
          title: "Left Profile",
          instruction: "Turn your head 90° to the right so your left profile faces the camera. Keep your chin level and maintain good posture.",
          icon: <RotateCcw color={palette.secondary} size={28} strokeWidth={2.5} />
        };
      case 'right':
        return {
          title: "Right Profile",
          instruction: "Turn your head 90° to the left so your right profile faces the camera. Keep your chin level and maintain good posture.",
          icon: <RotateCcw color={palette.tertiary} size={28} strokeWidth={2.5} style={{ transform: [{ scaleX: -1 }] }} />
        };
    }
  };

  const handleTakePhoto = async () => {

    if (Platform.OS === 'web') {
      alert('Camera not available on web. Please use upload photo instead.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required to take photos.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        cameraType: ImagePicker.CameraType.front,
      });

      if (!result.canceled) {
        const newPhoto: CapturedPhoto = {
          uri: result.assets[0].uri,
          angle: currentAngle,
          timestamp: Date.now()
        };
        
        const updatedPhotos = [...capturedPhotos.filter(p => p.angle !== currentAngle), newPhoto];
        setCapturedPhotos(updatedPhotos);
        
        if (currentAngle === 'front') {
          setCurrentAngle('left');
        } else if (currentAngle === 'left') {
          setCurrentAngle('right');
        } else {
          startMultiAngleAnalysis(updatedPhotos);
        }
      }
    } catch (err) {
      console.error('Error taking photo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startMultiAngleAnalysis = (photos: CapturedPhoto[]) => {
    if (photos.length < 3) {
      Alert.alert(
        "Incomplete Capture",
        "Please capture all three angles (front, left profile, right profile) for the most accurate analysis.",
        [{ text: "Continue Capturing" }]
      );
      return;
    }

    router.push({
      pathname: '/analysis-loading',
      params: { 
        frontImage: photos.find(p => p.angle === 'front')?.uri || '',
        leftImage: photos.find(p => p.angle === 'left')?.uri || '',
        rightImage: photos.find(p => p.angle === 'right')?.uri || '',
        multiAngle: 'true'
      }
    });
  };

  const retakePhoto = (angle: 'front' | 'left' | 'right') => {
    setCurrentAngle(angle);
    setCapturedPhotos(prev => prev.filter(p => p.angle !== angle));
  };

  const skipToSinglePhoto = () => {
    Alert.alert(
      "Single Photo Analysis",
      "For the most accurate results, we recommend capturing all three angles. Would you like to continue with single photo analysis instead?",
      [
        { text: "Continue Multi-Angle", style: "cancel" },
        { 
          text: "Use Single Photo", 
          onPress: () => {
            setShowInstructions(false);
            setCapturedPhotos([]);
            setCurrentAngle('front');
          }
        }
      ]
    );
  };

  const handleUploadPhoto = async () => {

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        allowsMultipleSelection: false,
      });

      if (!result.canceled) {
        router.push({
          pathname: '/analysis-loading',
          params: { 
            frontImage: result.assets[0].uri,
            multiAngle: 'false'
          }
        });
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (showError) {
    return (
      <SubscriptionGuard requiresPremium showPaywall accessMode="scan">
        <SafeAreaView style={styles.container}>
          <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
        <Stack.Screen 
          options={{ 
            title: "Glow Analysis",
            headerBackTitle: "Back",
          }} 
        />
        
        <View style={styles.content}>
          <View style={[styles.iconContainer, styles.errorIconContainer]}>
            <View style={styles.iconGlow}>
              <AlertTriangle color={palette.error} size={48} strokeWidth={2.5} />
            </View>
          </View>
          
          <Text style={[styles.title, styles.errorTitle]}>Face Not Detected</Text>
          <Text style={[styles.description, styles.errorDescription]}>
            Please ensure your face is clearly visible, well-lit, and centered in the photo. Avoid using photos of objects, animals, or multiple people.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowError(false)}
            >
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
        </SafeAreaView>
      </SubscriptionGuard>
    );
  }

  if (!showInstructions) {
    return (
      <SubscriptionGuard requiresPremium showPaywall accessMode="scan">
        <SafeAreaView style={styles.container}>
          <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
        <Stack.Screen 
          options={{ 
            title: "Quick Analysis",
            headerBackTitle: "Back",
          }} 
        />
        
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconGlow}>
              <Camera color={palette.primary} size={48} strokeWidth={2.5} />
            </View>
            <View style={styles.sparkleContainer}>
              <Sparkles color={palette.blush} size={16} fill={palette.blush} style={styles.sparkle1} />
              <Star color={palette.lavender} size={14} fill={palette.lavender} style={styles.sparkle2} />
              <Heart color={palette.peach} size={12} fill={palette.peach} style={styles.sparkle3} />
            </View>
          </View>
          
          <Text style={styles.title}>Quick Face Scan</Text>
          <Text style={styles.description}>
            Take a clear front-facing photo for basic analysis. For professional-grade results, consider the multi-angle scan.
          </Text>
          


          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.primaryButton, 
                isLoading && styles.disabledButton
              ]}
              onPress={handleTakePhoto}
              disabled={isLoading}
              testID="takePhotoBtn"
            >
              <Camera color={palette.textLight} size={20} strokeWidth={2.5} />
              <Text style={styles.primaryButtonText}>
                {isLoading ? "Processing..." : "Take Photo"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryButton, 
                isLoading && styles.disabledButton
              ]}
              onPress={handleUploadPhoto}
              disabled={isLoading}
              testID="uploadPhotoBtn"
            >
              <Text style={styles.secondaryButtonText}>
                Upload Photo
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setShowInstructions(true)}
            >
              <Text style={styles.linkButtonText}>Switch to Professional Multi-Angle Scan</Text>
            </TouchableOpacity>
          </View>
        </View>
        </SafeAreaView>
      </SubscriptionGuard>
    );
  }

  const currentInstructions = getAngleInstructions(currentAngle);
  const completedCount = capturedPhotos.length;
  const totalAngles = 3;

  return (
    <SubscriptionGuard requiresPremium showPaywall accessMode="scan">
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      <Stack.Screen 
        options={{ 
          title: "Professional Analysis",
          headerBackTitle: "Back",
          headerShown: true,
          headerStyle: {
            backgroundColor: palette.surface,
          },
          headerTintColor: palette.textPrimary,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
        }} 
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Multi-Angle Capture</Text>
            <Text style={styles.progressSubtitle}>
              {completedCount}/{totalAngles} angles captured
            </Text>
            

            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(completedCount / totalAngles) * 100}%` }
                ]} 
              />
            </View>
          </View>

          <View style={styles.instructionCard}>
            <View style={styles.instructionHeader}>
              {currentInstructions.icon}
              <Text style={styles.instructionTitle}>{currentInstructions.title}</Text>
            </View>
            <Text style={styles.instructionText}>{currentInstructions.instruction}</Text>
          </View>

          {capturedPhotos.length > 0 && (
            <View style={styles.capturedSection}>
              <Text style={styles.capturedTitle}>Captured Photos</Text>
              <View style={styles.capturedGrid}>
                {['front', 'left', 'right'].map((angle) => {
                  const photo = capturedPhotos.find(p => p.angle === angle);
                  return (
                    <View key={angle} style={styles.capturedItem}>
                      <View style={styles.capturedImageContainer}>
                        {photo ? (
                          <>
                            <Image source={{ uri: photo.uri }} style={styles.capturedImage} />
                            <View style={styles.capturedOverlay}>
                              <CheckCircle color={palette.success} size={20} strokeWidth={2.5} />
                            </View>
                            <TouchableOpacity 
                              style={styles.retakeButton}
                              onPress={() => retakePhoto(angle as 'front' | 'left' | 'right')}
                            >
                              <Text style={styles.retakeText}>Retake</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <View style={styles.placeholderImage}>
                            <Camera color={palette.textMuted} size={24} strokeWidth={2} />
                          </View>
                        )}
                      </View>
                      <Text style={styles.capturedLabel}>
                        {angle === 'front' ? 'Front' : angle === 'left' ? 'Left Profile' : 'Right Profile'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.primaryButton, 
                isLoading && styles.disabledButton
              ]}
              onPress={handleTakePhoto}
              disabled={isLoading}
            >
              <Camera color={palette.textLight} size={20} strokeWidth={2.5} />
              <Text style={styles.primaryButtonText}>
                {isLoading ? "Processing..." : 
                 completedCount === totalAngles ? "Start Analysis" :
                 `Capture ${currentInstructions.title}`}
              </Text>
            </TouchableOpacity>

            {completedCount === 0 && (
              <TouchableOpacity
                style={[
                  styles.secondaryButton, 
                  isLoading && styles.disabledButton
                ]}
                onPress={handleUploadPhoto}
                disabled={isLoading}
              >
                <Text style={styles.secondaryButtonText}>
                  Upload Single Photo
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.linkButton}
              onPress={skipToSinglePhoto}
            >
              <Text style={styles.linkButtonText}>Switch to Quick Single Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.professionalNote}>
            <Text style={styles.noteTitle}>Professional-Grade Analysis</Text>
            <Text style={styles.noteText}>
              Our multi-angle capture provides dermatologist-level accuracy by analyzing facial structure, 
              skin texture, and symmetry from multiple perspectives. This comprehensive approach delivers 
              the most precise beauty and skin health assessment available.
            </Text>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </SubscriptionGuard>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  progressHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  progressTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  progressSubtitle: {
    fontSize: 17,
    color: palette.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: palette.surface,
    borderRadius: 20,
    ...shadow.card,
  },
  progressFill: {
    height: '100%',
    borderRadius: 20,
    backgroundColor: palette.primary,
  },
  instructionCard: {
    width: '100%',
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 28,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.textPrimary,
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  instructionText: {
    fontSize: 16,
    color: palette.textSecondary,
    lineHeight: 26,
    textAlign: 'center',
  },
  capturedSection: {
    width: '100%',
    marginBottom: 24,
  },
  capturedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 16,
  },
  capturedGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  capturedItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  capturedImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.border,
    borderStyle: 'dashed',
  },
  capturedOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: palette.overlayDark,
    borderRadius: 12,
    padding: 2,
  },
  retakeButton: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    backgroundColor: palette.overlayDark,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  retakeText: {
    color: palette.textLight,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  capturedLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    textAlign: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    ...shadow.elevated,
    borderWidth: 3,
    borderColor: palette.primary,
    position: 'relative',
  },
  iconGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.overlayBlush,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle1: {
    position: 'absolute',
    top: 20,
    right: 25,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 30,
    left: 20,
  },
  sparkle3: {
    position: 'absolute',
    top: 35,
    left: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 17,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 48,
    paddingHorizontal: 24,
    maxWidth: width - 48,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: palette.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...shadow.elevated,
    minHeight: 56,
  },
  primaryButtonText: {
    color: palette.textLight,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: palette.surface,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
    minHeight: 56,
  },
  secondaryButtonText: {
    color: palette.primary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkButtonText: {
    color: palette.textMuted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  disabledButton: {
    opacity: 0.6,
  },
  premiumButton: {
    backgroundColor: palette.gold,
  },
  premiumSecondaryButton: {
    borderColor: palette.gold,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  premiumSecondaryText: {
    color: palette.gold,
  },
  trialStatus: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: palette.gold,
  },
  trialStatusCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: palette.gold,
    ...shadow.card,
  },
  trialStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.gold,
    textAlign: 'center',
  },
  errorIconContainer: {
    backgroundColor: palette.overlayLight,
    borderColor: palette.error,
  },
  errorTitle: {
    color: palette.error,
  },
  errorDescription: {
    color: palette.error,
  },
  professionalNote: {
    width: '100%',
    backgroundColor: palette.overlayLavender,
    borderRadius: 20,
    padding: 24,
    marginTop: 32,
    ...shadow.card,
    borderWidth: 1,
    borderColor: palette.divider,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  noteText: {
    fontSize: 15,
    color: palette.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
});