import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Camera, Upload, Sparkles, Shield, Zap } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, shadow } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function GlowAnalysisScreen() {
  const { error } = useLocalSearchParams<{ error?: string }>();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const palette = getPalette(theme);

  const styles = createStyles(palette);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for main button
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  useEffect(() => {
    if (error === 'no_face_detected') {
      Alert.alert(
        "Let's Try Again",
        "We couldn't detect your face. Make sure you're in good lighting and facing the camera directly.",
        [{ text: "Got It" }]
      );
    } else if (error === 'analysis_failed') {
      Alert.alert(
        "Oops!",
        "Something went wrong. Let's try again with a clear photo.",
        [{ text: "Try Again" }]
      );
    }
  }, [error]);

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      handleUploadPhoto();
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Access Needed',
        'Please allow camera access to take your glow check selfie.',
        [{ text: 'OK' }]
      );
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
        router.push({
          pathname: '/analysis-loading',
          params: { 
            frontImage: result.assets[0].uri,
            multiAngle: 'false'
          }
        });
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Could not open camera. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
      Alert.alert('Error', 'Could not access photos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={[palette.backgroundStart, palette.backgroundEnd]} 
        style={StyleSheet.absoluteFillObject} 
      />
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Visual Focus Area */}
          <View style={styles.visualArea}>
            <View style={styles.cameraPreviewArea}>
              <LinearGradient
                colors={[`${palette.primary}15`, `${palette.secondary}10`]}
                style={styles.previewGradient}
              >
                {/* Face outline hint */}
                <View style={styles.faceOutline}>
                  <View style={styles.faceOval} />
                  <Sparkles 
                    color={palette.primary} 
                    size={24} 
                    style={styles.sparkleIcon}
                  />
                </View>
              </LinearGradient>
            </View>
            
            {/* Simple instruction */}
            <Text style={styles.mainInstruction}>Take a selfie to get your glow score</Text>
            <Text style={styles.subInstruction}>Good lighting • Face the camera • Natural expression</Text>
          </View>

          {/* Main Action - BIG and obvious */}
          <View style={styles.actionArea}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
              <TouchableOpacity
                style={[styles.mainButton, isLoading && styles.buttonLoading]}
                onPress={handleTakePhoto}
                disabled={isLoading}
                activeOpacity={0.8}
                testID="takePhotoBtn"
              >
                <LinearGradient
                  colors={[palette.primary, palette.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.mainButtonGradient}
                >
                  <Camera color="#FFFFFF" size={28} strokeWidth={2.5} />
                  <Text style={styles.mainButtonText}>
                    {isLoading ? "Opening Camera..." : "Take Selfie"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Secondary option */}
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUploadPhoto}
              disabled={isLoading}
              testID="uploadPhotoBtn"
            >
              <Upload color={palette.textSecondary} size={20} strokeWidth={2} />
              <Text style={styles.uploadText}>Choose from library</Text>
            </TouchableOpacity>
          </View>

          {/* Trust badges - minimal */}
          <View style={styles.trustArea}>
            <View style={styles.trustBadge}>
              <Shield color={palette.textMuted} size={14} />
              <Text style={styles.trustText}>Private & Secure</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustBadge}>
              <Zap color={palette.textMuted} size={14} />
              <Text style={styles.trustText}>Instant Results</Text>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 17,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  visualArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  cameraPreviewArea: {
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.325,
    overflow: 'hidden',
    marginBottom: 32,
    borderWidth: 3,
    borderColor: palette.primary,
    ...shadow.elevated,
  },
  previewGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOutline: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceOval: {
    width: width * 0.35,
    height: width * 0.45,
    borderRadius: width * 0.175,
    borderWidth: 2,
    borderColor: `${palette.primary}40`,
    borderStyle: 'dashed',
  },
  sparkleIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  mainInstruction: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  subInstruction: {
    fontSize: 15,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 20,
  },
  mainButton: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  mainButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
    gap: 12,
  },
  mainButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  buttonLoading: {
    opacity: 0.8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 16,
    gap: 8,
  },
  uploadText: {
    fontSize: 16,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  trustArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    gap: 16,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 13,
    color: palette.textMuted,
    fontWeight: '500',
  },
  trustDivider: {
    width: 1,
    height: 14,
    backgroundColor: palette.divider,
  },
});
