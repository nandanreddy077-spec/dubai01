import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Camera as CameraIcon, X, Lightbulb, CheckCircle, AlertCircle, ArrowRight } from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';
import { analyzeFace } from '@/lib/vision-service';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TIPS = [
  { icon: '👓', text: 'Remove glasses' },
  { icon: '💇', text: 'Pull hair back' },
  { icon: '💡', text: 'Good lighting' },
  { icon: '📱', text: 'Look at camera' },
];

export default function GlowAnalysisScreen() {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [faceStatus, setFaceStatus] = useState<'none' | 'tooFar' | 'centering' | 'ready'>('none');
  const [faceDistance, setFaceDistance] = useState<'close' | 'far' | 'unknown'>('unknown');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const faceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const consecutiveDetectionsRef = useRef<number>(0);
  
  // Animation values
  const guidePulseAnim = useRef(new Animated.Value(1)).current;
  const guideGlowAnim = useRef(new Animated.Value(0)).current;
  const feedbackSlideAnim = useRef(new Animated.Value(50)).current;
  const feedbackFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonGlowAnim = useRef(new Animated.Value(0)).current;
  const statusChangeAnim = useRef(new Animated.Value(0)).current;
  
  // Instructions screen animations
  const instructionsFadeAnim = useRef(new Animated.Value(0)).current;
  const instructionsSlideAnim = useRef(new Animated.Value(30)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = createStyles(palette);

  // Animate guide based on status
  useEffect(() => {
    if (faceStatus === 'ready') {
      // Pulse animation for ready state
      Animated.loop(
        Animated.sequence([
          Animated.timing(guidePulseAnim, {
            toValue: 1.02,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(guidePulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(guideGlowAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(guideGlowAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Button glow
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonGlowAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(buttonGlowAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      guidePulseAnim.setValue(1);
      guideGlowAnim.setValue(0);
      buttonGlowAnim.setValue(0);
    }
  }, [faceStatus]);

  // Animate feedback messages
  useEffect(() => {
    Animated.parallel([
      Animated.spring(feedbackSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(feedbackFadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Reset for next animation
    return () => {
      feedbackSlideAnim.setValue(50);
      feedbackFadeAnim.setValue(0);
    };
  }, [faceStatus]);

  // Animate button when ready
  useEffect(() => {
    if (faceDetected && faceStatus === 'ready') {
      Animated.spring(buttonScaleAnim, {
        toValue: 1.02,
        tension: 100,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      buttonScaleAnim.setValue(1);
    }
  }, [faceDetected, faceStatus]);

  // Instructions screen entrance animation
  useEffect(() => {
    if (showInstructions) {
      Animated.parallel([
        Animated.timing(instructionsFadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(instructionsSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Icon rotation animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconRotateAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(iconRotateAnim, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showInstructions]);

  // Request camera permission when screen loads
  useEffect(() => {
    if (Platform.OS !== 'web' && permission && !permission.granted && !permission.canAskAgain) {
      Alert.alert(
        'Camera Permission Required',
        'We need access to your camera to scan your skin. Please enable camera permissions in your device settings.',
        [
          { text: 'Cancel', onPress: () => router.back(), style: 'cancel' },
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    }
  }, [permission]);

  // Start face detection when camera is ready - INSTANT START
  useEffect(() => {
    if (!showInstructions && permission?.granted) {
      console.log('📹 Camera ready, starting INSTANT detection...');
      // Minimal delay for camera initialization
      const timer = setTimeout(() => {
        if (cameraRef.current) {
          console.log('✅ Camera ref ready, starting INSTANT detection');
          startFaceDetection();
        } else {
          console.log('⏳ Camera ref not ready, retrying immediately...');
          // Retry immediately
          const retryTimer = setTimeout(() => {
            if (cameraRef.current) {
              console.log('✅ Camera ref ready on retry, starting INSTANT detection');
              startFaceDetection();
            } else {
              console.error('❌ Camera ref still not ready after retry');
              // Try one more time after a short delay
              setTimeout(() => {
                if (cameraRef.current) {
                  startFaceDetection();
                }
              }, 500);
            }
          }, 500);
          return () => clearTimeout(retryTimer);
        }
      }, 500); // Very short delay for instant start
      
      return () => {
        clearTimeout(timer);
        stopFaceDetection();
      };
    } else {
      console.log('⏸️ Stopping detection:', { showInstructions, hasPermission: !!permission?.granted });
      stopFaceDetection();
      setFaceDetected(false);
      setFaceStatus('none');
      consecutiveDetectionsRef.current = 0;
    }
  }, [showInstructions, permission]);

  const checkFaceCentered = (face: any, imageWidth: number, imageHeight: number): boolean => {
    // Check if face has boundingPoly (bounding box)
    if (!face.boundingPoly || !face.boundingPoly.vertices || face.boundingPoly.vertices.length < 4) {
      // If no boundingPoly, assume centered (more lenient)
      return true;
    }

    const vertices = face.boundingPoly.vertices;
    const faceLeft = vertices[0]?.x || 0;
    const faceRight = vertices[2]?.x || imageWidth;
    const faceTop = vertices[0]?.y || 0;
    const faceBottom = vertices[2]?.y || imageHeight;

    // Calculate face center
    const faceCenterX = (faceLeft + faceRight) / 2;
    const faceCenterY = (faceTop + faceBottom) / 2;
    const imageCenterX = imageWidth / 2;
    const imageCenterY = imageHeight / 2;

    // Very lenient centering check (within 35% of image center)
    const centerThresholdX = imageWidth * 0.35;
    const centerThresholdY = imageHeight * 0.35;
    
    const isCenteredX = Math.abs(faceCenterX - imageCenterX) < centerThresholdX;
    const isCenteredY = Math.abs(faceCenterY - imageCenterY) < centerThresholdY;

    // Very lenient size check (8-75% of image)
    const faceWidth = faceRight - faceLeft;
    const faceHeight = faceBottom - faceTop;
    const faceSizeRatio = (faceWidth * faceHeight) / (imageWidth * imageHeight);
    const isGoodSize = faceSizeRatio > 0.08 && faceSizeRatio < 0.75;

    return isCenteredX && isCenteredY && isGoodSize;
  };

  const startFaceDetection = () => {
    // Stop any existing detection
    stopFaceDetection();
    setFaceStatus('none');
    consecutiveDetectionsRef.current = 0;
    lastDetectionTimeRef.current = 0;
    
    console.log('🎯 Starting instant face detection...');
    
    // Immediate first check
    const performDetection = async () => {
      const now = Date.now();
      // Faster detection - check every 1 second for instant feedback
      if (now - lastDetectionTimeRef.current < 1000) {
        return;
      }
      lastDetectionTimeRef.current = now;

      if (!cameraRef.current || Platform.OS === 'web' || isLoading) {
        console.log('⏸️ Detection paused:', { hasCamera: !!cameraRef.current, isWeb: Platform.OS === 'web', isLoading });
        return;
      }

      try {
        console.log('📸 Taking detection photo...');
        // Take a photo for face detection (low quality, fast for instant detection)
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.08, // Very low quality for maximum speed
          base64: true,
          skipProcessing: true,
        });

        if (!photo?.base64) {
          console.log('❌ No base64 in photo');
          return;
        }

        console.log('🔍 Analyzing face...');
        const base64Image = `data:image/jpeg;base64,${photo.base64}`;
        const visionResult = await analyzeFace(base64Image);
        
        console.log('✅ Face detection result:', {
          hasAnnotations: !!visionResult?.faceAnnotations,
          count: visionResult?.faceAnnotations?.length || 0,
          photoWidth: photo.width,
          photoHeight: photo.height,
          hasError: !!visionResult?.error,
        });
        
        if (visionResult?.error) {
          console.error('❌ Vision API error:', visionResult.error);
          setFaceStatus('none');
          return;
        }
        
        if (visionResult?.faceAnnotations && visionResult.faceAnnotations.length > 0) {
          const face = visionResult.faceAnnotations[0];
          const confidence = face?.detectionConfidence || 0;
          
          console.log('👤 Face detected:', {
            confidence: confidence.toFixed(2),
            rollAngle: face.rollAngle?.toFixed(1),
            panAngle: face.panAngle?.toFixed(1),
            tiltAngle: face.tiltAngle?.toFixed(1),
            hasBoundingPoly: !!face.boundingPoly,
          });
          
          // Very lenient confidence threshold (0.1 - detect almost any face)
          if (confidence >= 0.1) {
            const rollAngle = Math.abs(face.rollAngle || 0);
            const panAngle = Math.abs(face.panAngle || 0);
            const tiltAngle = Math.abs(face.tiltAngle || 0);
            
            // Very lenient angle requirements (50 degrees)
            const isWellPositioned = rollAngle <= 50 && panAngle <= 50 && tiltAngle <= 50;
            
            // Check centering and distance
            let isCentered = true;
            let isCloseEnough = true;
            
            if (photo.width && photo.height && face.boundingPoly?.vertices) {
              isCentered = checkFaceCentered(face, photo.width, photo.height);
              
              // Check face size to determine distance
              const vertices = face.boundingPoly.vertices;
              if (vertices && vertices.length >= 4) {
                const faceLeft = vertices[0]?.x || 0;
                const faceRight = vertices[2]?.x || photo.width;
                const faceTop = vertices[0]?.y || 0;
                const faceBottom = vertices[2]?.y || photo.height;
                
                const faceWidth = faceRight - faceLeft;
                const faceHeight = faceBottom - faceTop;
                const faceSizeRatio = (faceWidth * faceHeight) / (photo.width * photo.height);
                
                // Face should be at least 12% of image (very lenient)
                isCloseEnough = faceSizeRatio >= 0.12;
                setFaceDistance(isCloseEnough ? 'close' : 'far');
                
                console.log('📏 Face metrics:', {
                  sizeRatio: faceSizeRatio.toFixed(2),
                  isCloseEnough,
                  isCentered,
                  isWellPositioned,
                });
              } else {
                isCloseEnough = true;
              }
            } else {
              // If no boundingPoly, assume centered and close
              isCentered = true;
              isCloseEnough = true;
            }
            
            // Determine status based on all conditions
            if (isWellPositioned && isCentered && isCloseEnough) {
              // INSTANT - Enable immediately when face is detected correctly
              if (faceStatus !== 'ready' || !faceDetected) {
                console.log('✅ Face ready - INSTANT ENABLE!');
                setFaceStatus('ready');
                setFaceDetected(true);
                consecutiveDetectionsRef.current = 1; // Mark as detected
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // Celebration animation
                Animated.sequence([
                  Animated.spring(statusChangeAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 7,
                    useNativeDriver: true,
                  }),
                  Animated.delay(200),
                  Animated.timing(statusChangeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                  }),
                ]).start();
              }
            } else if (!isCloseEnough) {
              consecutiveDetectionsRef.current = 0;
              if (faceStatus !== 'tooFar') {
                console.log('📏 Too far');
                setFaceStatus('tooFar');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              if (faceDetected) {
                setFaceDetected(false);
              }
            } else if (!isCentered) {
              consecutiveDetectionsRef.current = 0;
              if (faceStatus !== 'centering') {
                console.log('↔️ Need centering');
                setFaceStatus('centering');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              if (faceDetected) {
                setFaceDetected(false);
              }
            } else {
              consecutiveDetectionsRef.current = 0;
              if (faceStatus !== 'none') {
                console.log('👤 Face detected but not well positioned');
                setFaceStatus('none');
              }
              if (faceDetected) {
                setFaceDetected(false);
              }
            }
          } else {
            consecutiveDetectionsRef.current = 0;
            if (faceStatus !== 'none') {
              console.log('⚠️ Low confidence:', confidence.toFixed(2));
              setFaceStatus('none');
            }
            if (faceDetected) {
              setFaceDetected(false);
            }
          }
        } else {
          consecutiveDetectionsRef.current = 0;
          if (faceStatus !== 'none') {
            console.log('❌ No face detected');
            setFaceStatus('none');
          }
          if (faceDetected) {
            setFaceDetected(false);
          }
        }
      } catch (error: any) {
        // Log error for debugging
        console.error('❌ Face detection error:', error);
        console.error('Error details:', {
          message: error?.message,
          stack: error?.stack,
        });
        // Don't change status on error - keep current state
      }
    };

    // Perform immediate check
    performDetection();
    
    // Then set up interval for continuous INSTANT detection (every 1 second)
    faceDetectionIntervalRef.current = setInterval(performDetection, 1000);
  };

  const stopFaceDetection = () => {
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current);
      faceDetectionIntervalRef.current = null;
    }
  };

  const validateFaceFromBase64 = async (base64String: string): Promise<boolean> => {
    try {
      setIsValidating(true);
      
      if (!base64String || typeof base64String !== 'string' || base64String.length === 0) {
        console.error('Invalid base64 string');
        return false;
      }

      const base64Image = base64String.startsWith('data:') 
        ? base64String 
        : `data:image/jpeg;base64,${base64String}`;

      // Analyze face using Google Vision API
      let visionResult;
      try {
        visionResult = await analyzeFace(base64Image);
      } catch (apiError: any) {
        console.error('Vision API error:', apiError);
        return false;
      }
      
      if (!visionResult || !visionResult.faceAnnotations || visionResult.faceAnnotations.length === 0) {
        console.log('No face annotations found');
        return false;
      }

      const face = visionResult.faceAnnotations[0];
      if (!face) {
        return false;
      }

      const confidence = face.detectionConfidence || 0;
      
      // More lenient confidence threshold (0.4 instead of 0.7)
      if (confidence < 0.4) {
        console.log('Low confidence:', confidence);
        return false;
      }

      // Check if face is well-positioned (looking at camera)
      const rollAngle = Math.abs(face.rollAngle || 0);
      const panAngle = Math.abs(face.panAngle || 0);
      const tiltAngle = Math.abs(face.tiltAngle || 0);

      // More lenient angle requirements (30 degrees instead of 20)
      if (rollAngle > 30 || panAngle > 30 || tiltAngle > 30) {
        console.log('Face angles too extreme:', { rollAngle, panAngle, tiltAngle });
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Face validation error:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const validateFaceInPhoto = async (imageUri: string): Promise<boolean> => {
    try {
      setIsValidating(true);
      
      // Check if URI is valid
      if (!imageUri || typeof imageUri !== 'string') {
        console.error('Invalid image URI:', imageUri);
        return false;
      }

      // Convert image to base64
      let base64: string;
      try {
        // Check if file exists first
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists) {
          console.error('Image file does not exist:', imageUri);
          return false;
        }

        base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (fsError: any) {
        console.error('FileSystem error:', fsError);
        console.error('Error details:', {
          message: fsError?.message,
          code: fsError?.code,
          uri: imageUri,
        });
        // If FileSystem fails, return false to show error
        return false;
      }

      if (!base64 || base64.length === 0) {
        console.error('Empty base64 string');
        return false;
      }

      const base64Image = `data:image/jpeg;base64,${base64}`;

      // Analyze face using Google Vision API
      let visionResult;
      try {
        visionResult = await analyzeFace(base64Image);
      } catch (apiError: any) {
        console.error('Vision API error:', apiError);
        // If API fails, allow the photo to proceed - user can retry if needed
        return true;
      }
      
      if (!visionResult || !visionResult.faceAnnotations || visionResult.faceAnnotations.length === 0) {
        console.log('No face annotations found');
        return false;
      }

      const face = visionResult.faceAnnotations[0];
      if (!face) {
        return false;
      }

      const confidence = face.detectionConfidence || 0;
      
      // More lenient confidence threshold (0.4 instead of 0.7)
      if (confidence < 0.4) {
        console.log('Low confidence:', confidence);
        return false;
      }

      // Check if face is well-positioned (looking at camera)
      const rollAngle = Math.abs(face.rollAngle || 0);
      const panAngle = Math.abs(face.panAngle || 0);
      const tiltAngle = Math.abs(face.tiltAngle || 0);

      // More lenient angle requirements (30 degrees instead of 20)
      if (rollAngle > 30 || panAngle > 30 || tiltAngle > 30) {
        console.log('Face angles too extreme:', { rollAngle, panAngle, tiltAngle });
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Face validation error:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      // On error, allow the photo to proceed - better UX than blocking
      return true;
    } finally {
      setIsValidating(false);
    }
  };

  const handleTakePicture = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Camera not available', 'Please use upload photo on web.');
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return;
    }
    }

    // Allow taking photo even if face not detected - we'll validate after capture

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    stopFaceDetection(); // Stop detection while taking photo
    
    try {
      if (cameraRef.current) {
        // Take photo with base64 for validation
        const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
          base64: true, // Get base64 for validation
        });

        console.log('Photo captured:', {
          hasUri: !!photo?.uri,
          hasBase64: !!photo?.base64,
          photoKeys: photo ? Object.keys(photo) : [],
        });

        if (photo?.uri) {
          // Validate face detection if we have base64
          let isValid = true;
          if (photo.base64) {
            try {
              isValid = await validateFaceFromBase64(photo.base64);
            } catch (validationError: any) {
              console.error('Validation error:', validationError);
              // If validation fails, still proceed but show warning
              isValid = false;
            }
          }
          
          if (!isValid) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
              'Face Not Detected',
              "We couldn't detect a clear face in your photo. Please try again with:\n\n• Good lighting\n• Face centered and looking at camera\n• No glasses or hair covering face\n• Only one person in the photo",
              [
                {
                  text: 'Try Again',
                  onPress: () => {
                    setIsLoading(false);
                    startFaceDetection(); // Resume detection
                  },
                  style: 'default'
                }
              ]
            );
            return;
          }

          // Face is valid, proceed to analysis
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push({
          pathname: '/analysis-loading',
          params: { 
              frontImage: photo.uri,
            multiAngle: 'false'
          }
        });
        } else {
          setIsLoading(false);
          startFaceDetection(); // Resume detection
        }
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      setIsLoading(false);
      startFaceDetection(); // Resume detection
    }
  };

  const handleStartScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowInstructions(false);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Show instructions screen first
  if (showInstructions) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.instructionsContainer}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButtonTop}
            activeOpacity={0.7}
          >
            <X color={palette.textPrimary} size={24} />
          </TouchableOpacity>

          <Animated.View 
            style={[
              styles.instructionsContent,
              {
                opacity: instructionsFadeAnim,
                transform: [{ translateY: instructionsSlideAnim }],
              }
            ]}
          >
            <Animated.View 
              style={[
                styles.iconCircle,
                {
                  transform: [
                    { scale: iconScaleAnim },
                    {
                      rotate: iconRotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '5deg'],
                      }),
                    }
                  ],
                }
              ]}
            >
              <CameraIcon color={palette.primary} size={48} strokeWidth={2.5} />
            </Animated.View>
            
            <Text style={styles.instructionsTitle}>Ready to Scan Your Skin?</Text>
            <Text style={styles.instructionsSubtitle}>
              We'll analyze your skin to give you personalized recommendations
            </Text>

            <View style={styles.stepsContainer}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>Position your face in the guide</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>Tap the button to take a photo</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>Get instant AI analysis</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartScan}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#6B7F5A', '#556B47']}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>Start Scan</Text>
                <ArrowRight color="#FFFFFF" size={20} strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <CameraIcon color={palette.gold} size={28} strokeWidth={2} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Scan Your Skin</Text>
            <Text style={styles.subtitle}>Position your face in the guide</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <X color={palette.textPrimary} size={24} />
        </TouchableOpacity>
      </View>

      {/* Camera Preview Area */}
      <View style={styles.cameraContainer}>
        <View style={styles.cameraFrame}>
          {permission?.granted ? (
            <>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="front"
                mode="picture"
              >
                {/* Face Guide - Animated based on status */}
                <Animated.View 
                  style={[
                    styles.faceGuide,
                    {
                      transform: [{ scale: guidePulseAnim }],
                    }
                  ]}
                >
                  <Animated.View 
                    style={[
                      styles.faceGuideDashed,
                      faceStatus === 'ready' && styles.faceGuideReady,
                      faceStatus === 'tooFar' && styles.faceGuideTooFar,
                      faceStatus === 'centering' && styles.faceGuideCentering,
                      faceStatus === 'none' && styles.faceGuideNone,
                      faceStatus === 'ready' && {
                        shadowOpacity: guideGlowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 0.7],
                        }),
                        shadowRadius: guideGlowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 20],
                        }),
                      }
                    ]} 
                  />
                </Animated.View>

                {/* Face Detection Feedback - Animated */}
                <Animated.View
                  style={[
                    styles.feedbackContainer,
                    {
                      opacity: feedbackFadeAnim,
                      transform: [{ translateY: feedbackSlideAnim }],
                    }
                  ]}
                >
                  {faceStatus === 'ready' && faceDetected && (
                    <Animated.View 
                      style={[
                        styles.faceReadyBubble,
                        {
                          transform: [
                            {
                              scale: statusChangeAnim.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [1, 1.1, 1],
                              }),
                            }
                          ],
                        }
                      ]}
                    >
                      <CheckCircle color="#FFFFFF" size={20} strokeWidth={3} />
                      <Text style={styles.faceReadyText}>Perfect! Hold still</Text>
                    </Animated.View>
                  )}
                  {faceStatus === 'centering' && (
                    <View style={styles.faceCenteringBubble}>
                      <View style={styles.centerIcon}>
                        <Text style={styles.centerIconText}>↔</Text>
              </View>
                      <Text style={styles.faceCenteringText}>Center your face</Text>
            </View>
          )}
                  {faceStatus === 'tooFar' && (
                    <View style={styles.faceTooFarBubble}>
                      <Text style={styles.faceTooFarText}>→ Move closer to the camera</Text>
                    </View>
                  )}
                  {faceStatus === 'none' && (
                    <View style={styles.faceNoneBubble}>
                      <View style={styles.frameIcon}>
                        <Text style={styles.frameIconText}>⌜</Text>
          </View>
                      <Text style={styles.faceNoneText}>Position your face in the frame</Text>
              </View>
                  )}
                </Animated.View>
              </CameraView>
            </>
          ) : (
            <View style={styles.cameraPlaceholder}>
              <ActivityIndicator color={palette.primary} size="large" />
              <Text style={styles.cameraPlaceholderText}>
                {permission === null 
                  ? 'Requesting camera permission...' 
                  : 'Camera permission required'}
              </Text>
              {permission && !permission.granted && (
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={requestPermission}
                >
                  <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Take Picture Button */}
      <View style={styles.buttonContainer}>
        <Animated.View
          style={[
            styles.buttonWrapper,
            {
              transform: [{ scale: buttonScaleAnim }],
              shadowOpacity: faceDetected && faceStatus === 'ready' 
                ? buttonGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.6],
                  })
                : 0.2,
            }
          ]}
        >
        <TouchableOpacity
            style={[styles.takePictureButton, (isLoading || !permission?.granted || !faceDetected || faceStatus !== 'ready' || isValidating) && styles.disabledButton]}
          onPress={handleTakePicture}
            disabled={isLoading || !permission?.granted || !faceDetected || faceStatus !== 'ready' || isValidating}
          activeOpacity={0.9}
        >
          <LinearGradient
              colors={permission?.granted && faceDetected && faceStatus === 'ready' ? ['#10B981', '#059669'] : ['#9CA3AF', '#6B7280']}
            style={styles.takePictureGradient}
          >
            {isValidating ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.takePictureText}>Checking photo...</Text>
              </>
            ) : isLoading ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.takePictureText}>Processing...</Text>
              </>
            ) : (
              <>
                <CameraIcon color="#FFFFFF" size={24} strokeWidth={2.5} />
            <Text style={styles.takePictureText}>
                  {permission?.granted 
                    ? (faceStatus === 'ready' && faceDetected 
                        ? 'Take Picture' 
                        : 'Position your face')
                    : 'Preparing...'}
            </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        </Animated.View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          {TIPS.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Text style={styles.tipIcon}>{tip.icon}</Text>
              <Text style={styles.tipText}>{tip.text}</Text>
              </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  // Instructions Screen Styles
  instructionsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  closeButtonTop: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  instructionsContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    ...shadow.elevated,
    borderWidth: 3,
    borderColor: palette.primary + '20',
  },
  instructionsTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.8,
  },
  instructionsSubtitle: {
    fontSize: 17,
    color: palette.textSecondary,
    textAlign: 'center',
    marginBottom: 56,
    lineHeight: 26,
    paddingHorizontal: 24,
    fontWeight: '500' as const,
  },
  stepsContainer: {
    width: '100%',
    marginBottom: 48,
    gap: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.elevated,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800' as const,
  },
  stepText: {
    flex: 1,
    fontSize: 17,
    color: palette.textPrimary,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  startButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  // Camera Screen Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 15,
    color: palette.textSecondary,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cameraFrame: {
    width: SCREEN_WIDTH - 40,
    height: (SCREEN_WIDTH - 40) * 1.3,
    borderRadius: 24,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 3,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...shadow.elevated,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  cameraPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.surfaceAlt,
    gap: 16,
  },
  cameraPlaceholderText: {
    fontSize: 16,
    color: palette.textSecondary,
    fontWeight: '600' as const,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  permissionButton: {
    marginTop: 12,
    backgroundColor: palette.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  faceGuide: {
    width: '70%',
    height: '85%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: '7.5%',
    left: '15%',
  },
  faceGuideDashed: {
    width: '100%',
    height: '100%',
    borderRadius: 200,
    borderWidth: 3,
    borderColor: '#EF4444', // Red default (no face)
    borderStyle: 'dashed',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  faceGuideNone: {
    borderColor: '#EF4444', // Red - no face detected
  },
  faceGuideTooFar: {
    borderColor: '#F59E0B', // Orange - too far
  },
  faceGuideCentering: {
    borderColor: '#F59E0B', // Orange - need to center
  },
  faceGuideReady: {
    borderColor: '#14B8A6', // Teal/Cyan - ready
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  feedbackContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  faceReadyBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14B8A6', // Teal
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 12,
    ...shadow.elevated,
    borderWidth: 2,
    borderColor: '#FFFFFF40',
  },
  faceReadyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  faceNoneBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.95)', // Red
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF30',
  },
  faceNoneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  frameIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800' as const,
  },
  faceCenteringBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.95)', // Orange
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 12,
    ...shadow.elevated,
    borderWidth: 2,
    borderColor: '#FFFFFF30',
  },
  faceCenteringText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  centerIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800' as const,
  },
  faceTooFarBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.95)', // Orange
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 12,
    ...shadow.elevated,
    borderWidth: 2,
    borderColor: '#FFFFFF30',
  },
  faceTooFarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  loadingBubble: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B7280',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 10,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  buttonWrapper: {
    marginBottom: 20,
    ...shadow.elevated,
  },
  takePictureButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  takePictureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    gap: 12,
  },
  takePictureText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  tipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tipIcon: {
    fontSize: 16,
  },
  tipText: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '600' as const,
  },
});
