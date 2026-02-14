import React, { useState, useEffect, useRef, useCallback } from "react";
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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import {
  Camera as CameraIcon,
  X,
  CheckCircle,
  ArrowRight,
  Sun,
  Glasses,
  Scissors,
  Sparkles,
  Eye,
  Move,
  ChevronRight,
} from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";
import { getPalette, getGradient, shadow } from "@/constants/theme";
import { analyzeFace } from "@/lib/vision-service";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const GUIDE_OVAL_WIDTH = SCREEN_WIDTH * 0.62;
const GUIDE_OVAL_HEIGHT = GUIDE_OVAL_WIDTH * 1.35;

interface TipItem {
  icon: React.ReactNode;
  text: string;
  emoji: string;
}

export default function GlowAnalysisScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ error?: string }>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<"instructions" | "camera">("instructions");
  const [faceStatus, setFaceStatus] = useState<"none" | "tooFar" | "centering" | "ready">("none");
  const [faceDistance, setFaceDistance] = useState<"close" | "far" | "unknown">("unknown");
  // Multi-angle capture state
  const [captureStep, setCaptureStep] = useState<"front" | "left" | "right">("front");
  const [capturedPhotos, setCapturedPhotos] = useState<{
    front?: string;
    left?: string;
    right?: string;
  }>({});
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const faceDetectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const consecutiveDetectionsRef = useRef<number>(0);
  const isCapturingRef = useRef<boolean>(false); // Prevent concurrent captures
  const isMountedRef = useRef<boolean>(true); // Track if component is mounted

  const guidePulseAnim = useRef(new Animated.Value(1)).current;
  const guideGlowAnim = useRef(new Animated.Value(0)).current;
  const feedbackSlideAnim = useRef(new Animated.Value(50)).current;
  const feedbackFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonGlowAnim = useRef(new Animated.Value(0)).current;
  const statusChangeAnim = useRef(new Animated.Value(0)).current;

  const heroFadeAnim = useRef(new Animated.Value(0)).current;
  const heroSlideAnim = useRef(new Animated.Value(40)).current;
  const tipAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const tipSlideAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(30))).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;
  const ctaSlideAnim = useRef(new Animated.Value(20)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseRingAnim = useRef(new Animated.Value(0.8)).current;
  const pulseOpacityAnim = useRef(new Animated.Value(0.6)).current;

  const cameraFadeAnim = useRef(new Animated.Value(0)).current;
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  const TIPS: TipItem[] = [
    { icon: <Eye color={palette.gold} size={20} strokeWidth={2.5} />, text: "Look straight at the camera with a neutral expression", emoji: "👁️" },
    { icon: <Sun color={palette.gold} size={20} strokeWidth={2.5} />, text: "Make sure you have even, natural lighting", emoji: "💡" },
    { icon: <Glasses color={palette.gold} size={20} strokeWidth={2.5} />, text: "Remove glasses, hats, or accessories", emoji: "👓" },
    { icon: <Scissors color={palette.gold} size={20} strokeWidth={2.5} />, text: "Pull hair away from your face", emoji: "💇" },
    { icon: <Sparkles color={palette.gold} size={20} strokeWidth={2.5} />, text: "No makeup or filters for accurate results", emoji: "🧴" },
  ];

  useEffect(() => {
    if (currentStep === "instructions") {
      Animated.parallel([
        Animated.timing(heroFadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(heroSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();

      tipAnims.forEach((anim, index) => {
        Animated.sequence([
          Animated.delay(300 + index * 120),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1,
              duration: 400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.spring(tipSlideAnims[index], {
              toValue: 0,
              tension: 60,
              friction: 9,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });

      Animated.sequence([
        Animated.delay(900),
        Animated.parallel([
          Animated.timing(ctaAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(ctaSlideAnim, {
            toValue: 0,
            tension: 50,
            friction: 9,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseRingAnim, {
            toValue: 1.15,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseRingAnim, {
            toValue: 0.8,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacityAnim, {
            toValue: 0.2,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacityAnim, {
            toValue: 0.6,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [currentStep]);

  useEffect(() => {
    if (faceStatus === "ready") {
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

    return () => {
      feedbackSlideAnim.setValue(50);
      feedbackFadeAnim.setValue(0);
    };
  }, [faceStatus]);

  useEffect(() => {
    if (faceDetected && faceStatus === "ready") {
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

  // Show error message if analysis failed
  useEffect(() => {
    if (params.error) {
      const errorMessage = params.error === 'no_face_detected' 
        ? "We couldn't detect a face in your photos. Please try again with:\n\n• Good lighting\n• Face clearly visible\n• No glasses or hair covering face"
        : "Analysis failed. Please try again.";
      
      Alert.alert(
        params.error === 'no_face_detected' ? "No Face Detected" : "Analysis Error",
        errorMessage,
        [
          {
            text: "OK",
            onPress: () => {
              // Clear error from params by navigating to same route without error
              router.setParams({ error: undefined });
            },
          },
        ]
      );
    }
  }, [params.error]);

  // Request permission on mount if not granted
  useEffect(() => {
    if (Platform.OS !== "web" && permission === null) {
      // Permission status is being checked, wait for it
      return;
    }

    if (permission && !permission.granted && permission.canAskAgain) {
      // Request permission automatically
      requestPermission();
    } else if (permission && !permission.granted && !permission.canAskAgain) {
      // Permission denied permanently
      Alert.alert(
        "Camera Permission Required",
        "We need access to your camera to scan your skin. Please enable camera permissions in your device settings.",
        [
          { text: "Cancel", onPress: () => router.back(), style: "cancel" },
          { text: "OK", onPress: () => router.back() },
        ]
      );
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (currentStep === "camera" && permission?.granted) {
      console.log("📹 Camera ready, starting detection...");
      Animated.timing(cameraFadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        if (cameraRef.current) {
          startFaceDetection();
        } else {
          const retryTimer = setTimeout(() => {
            if (cameraRef.current) {
              startFaceDetection();
            } else {
              setTimeout(() => {
                if (cameraRef.current) {
                  startFaceDetection();
                }
              }, 500);
            }
          }, 500);
          return () => clearTimeout(retryTimer);
        }
      }, 500);

      return () => {
        clearTimeout(timer);
        stopFaceDetection();
      };
    } else {
      stopFaceDetection();
      setFaceDetected(false);
      setFaceStatus("none");
      consecutiveDetectionsRef.current = 0;
    }
  }, [currentStep, permission]);

  /**
   * ROI-Based Face Detection (SkanApp-style)
   * Monitors the face guide zone (ROI) for face presence and auto-triggers when ready
   */
  const startFaceDetection = () => {
    stopFaceDetection();
    isMountedRef.current = true; // Mark as mounted
    setFaceStatus("none");
    consecutiveDetectionsRef.current = 0;
    lastDetectionTimeRef.current = 0;

    // Define ROI (Region of Interest) - the face guide area
    // The guide is centered on screen, so ROI is centered in the image
    const roiWidth = GUIDE_OVAL_WIDTH;
    const roiHeight = GUIDE_OVAL_HEIGHT;
    
    // Calculate ROI bounds in image coordinates (assuming camera matches screen aspect)
    // For front camera, we need to account for potential mirroring
    const calculateROIBounds = (imageWidth: number, imageHeight: number) => {
      const centerX = imageWidth / 2;
      const centerY = imageHeight / 2;
      const roiImageWidth = (roiWidth / SCREEN_WIDTH) * imageWidth;
      const roiImageHeight = (roiHeight / SCREEN_HEIGHT) * imageHeight;
      
      return {
        left: centerX - roiImageWidth / 2,
        right: centerX + roiImageWidth / 2,
        top: centerY - roiImageHeight / 2,
        bottom: centerY + roiImageHeight / 2,
        width: roiImageWidth,
        height: roiImageHeight,
      };
    };

    /**
     * Check if face is within ROI bounds
     * Similar to SkanApp's edge detection - validates face is in the guide zone
     */
    const isFaceInROI = (face: any, imageWidth: number, imageHeight: number, roiBounds: any): boolean => {
      if (!face.boundingPoly?.vertices || face.boundingPoly.vertices.length < 4) {
        return false;
      }

      const vertices = face.boundingPoly.vertices;
      const faceLeft = vertices[0]?.x || 0;
      const faceRight = vertices[2]?.x || imageWidth;
      const faceTop = vertices[0]?.y || 0;
      const faceBottom = vertices[2]?.y || imageHeight;
      
      const faceCenterX = (faceLeft + faceRight) / 2;
      const faceCenterY = (faceTop + faceBottom) / 2;
      
      // Check if face center is within ROI bounds (with some tolerance)
      const toleranceX = roiBounds.width * 0.15; // 15% tolerance
      const toleranceY = roiBounds.height * 0.15;
      
      const inROI = 
        faceCenterX >= roiBounds.left - toleranceX &&
        faceCenterX <= roiBounds.right + toleranceX &&
        faceCenterY >= roiBounds.top - toleranceY &&
        faceCenterY <= roiBounds.bottom + toleranceY;
      
      return inROI;
    };

    /**
     * Edge Detection & Validation
     * Similar to SkanApp's perspective correction - validates face boundaries
     */
    const validateFaceEdges = (face: any, imageWidth: number, imageHeight: number, roiBounds: any): {
      isValid: boolean;
      isCentered: boolean;
      isGoodSize: boolean;
      sizeRatio: number;
    } => {
      if (!face.boundingPoly?.vertices || face.boundingPoly.vertices.length < 4) {
        return { isValid: false, isCentered: false, isGoodSize: false, sizeRatio: 0 };
      }

      const vertices = face.boundingPoly.vertices;
      const faceLeft = vertices[0]?.x || 0;
      const faceRight = vertices[2]?.x || imageWidth;
      const faceTop = vertices[0]?.y || 0;
      const faceBottom = vertices[2]?.y || imageHeight;
      
      const faceWidth = faceRight - faceLeft;
      const faceHeight = faceBottom - faceTop;
      const faceSizeRatio = (faceWidth * faceHeight) / (imageWidth * imageHeight);
      
            // More lenient size requirements (5-85% of image) for easier capture
            const isGoodSize = faceSizeRatio >= 0.05 && faceSizeRatio <= 0.85;
      
            // Check if face is centered in ROI (more lenient for side angles)
            const faceCenterX = (faceLeft + faceRight) / 2;
            const faceCenterY = (faceTop + faceBottom) / 2;
            const roiCenterX = (roiBounds.left + roiBounds.right) / 2;
            const roiCenterY = (roiBounds.top + roiBounds.bottom) / 2;
            
            // More lenient centering for side angles (40% vs 30%)
            const centerThresholdX = roiBounds.width * (captureStep === "front" ? 0.35 : 0.45);
            const centerThresholdY = roiBounds.height * 0.35;
            const isCentered = 
                Math.abs(faceCenterX - roiCenterX) < centerThresholdX &&
                Math.abs(faceCenterY - roiCenterY) < centerThresholdY;
      
      return {
        isValid: isGoodSize && isCentered,
        isCentered,
        isGoodSize,
        sizeRatio: faceSizeRatio,
      };
    };

    /**
   * ROI Monitoring - Similar to SkanApp's motion detection
   * Monitors the ROI zone for face presence and triggers analysis
   */
    const performROIDetection = async () => {
      const now = Date.now();
      // Monitor ROI every 800ms for responsive feedback
      if (now - lastDetectionTimeRef.current < 800) {
      return;
    }
      lastDetectionTimeRef.current = now;

      // Prevent concurrent captures
      if (isCapturingRef.current) {
        return;
      }

      // Check if component is still mounted
      if (!isMountedRef.current) {
        console.log('⏸️ Component unmounted, stopping detection');
        return;
      }

      if (!cameraRef.current || Platform.OS === "web" || isLoading) {
        return;
      }

      try {
        isCapturingRef.current = true;
        
        // Double-check camera is still available before capturing
        if (!cameraRef.current || !isMountedRef.current) {
          isCapturingRef.current = false;
          return;
        }
        
        // Capture frame for ROI analysis
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.25, // Balanced quality for speed and accuracy
          base64: true,
          skipProcessing: true,
        });

        // Check if still mounted after async operation
        if (!isMountedRef.current) {
          isCapturingRef.current = false;
          return;
        }

        isCapturingRef.current = false;

        if (!photo?.base64 || !photo.width || !photo.height) {
          return;
        }

        // Calculate ROI bounds for this image
        const roiBounds = calculateROIBounds(photo.width, photo.height);

        // Analyze face in ROI
        const base64Image = `data:image/jpeg;base64,${photo.base64}`;
        const visionResult = await analyzeFace(base64Image);

        if (visionResult?.error) {
          // Keep current state on API errors
          return;
        }

        if (visionResult?.faceAnnotations && visionResult.faceAnnotations.length > 0) {
          const face = visionResult.faceAnnotations[0];
          const confidence = face?.detectionConfidence || 0;

          // Detect any face (very lenient threshold)
          if (confidence >= 0.05) {
            const rollAngle = Math.abs(face.rollAngle || 0);
            const panAngle = Math.abs(face.panAngle || 0);
            const tiltAngle = Math.abs(face.tiltAngle || 0);
            
            // More lenient angle requirements for easier capture (75 degrees)
            // For side angles, we expect higher pan angles
            const maxAngle = captureStep === "front" ? 75 : 85;
            const isWellPositioned = rollAngle <= maxAngle && panAngle <= maxAngle && tiltAngle <= maxAngle;
            
            // Check if face is within ROI (motion detection - face entered the zone)
            const inROI = isFaceInROI(face, photo.width, photo.height, roiBounds);
            
            // Edge detection & validation
            const edgeValidation = validateFaceEdges(face, photo.width, photo.height, roiBounds);

            console.log('🎯 ROI Detection:', {
              inROI,
              isWellPositioned,
              edgeValidation,
              confidence: confidence.toFixed(2),
            });

            // Auto-trigger when face is ready (all conditions met)
            if (inROI && isWellPositioned && edgeValidation.isValid) {
              if (faceStatus !== "ready" || !faceDetected) {
                console.log('✅ Face ready in ROI - Auto-enabled!');
                setFaceStatus("ready");
                setFaceDetected(true);
                consecutiveDetectionsRef.current = 1;
                setFaceDistance(edgeValidation.sizeRatio >= 0.15 ? "close" : "far");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Animated.sequence([
                  Animated.spring(statusChangeAnim, { toValue: 1, tension: 100, friction: 7, useNativeDriver: true }),
                  Animated.delay(200),
                  Animated.timing(statusChangeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                ]).start();
              }
            } else if (!inROI) {
              // Face not in ROI zone
              consecutiveDetectionsRef.current = 0;
              if (faceStatus !== "none") {
                setFaceStatus("none");
              }
              if (faceDetected) setFaceDetected(false);
            } else if (!edgeValidation.isGoodSize) {
              // Face size issue
              consecutiveDetectionsRef.current = 0;
              if (faceStatus !== "tooFar") {
                setFaceStatus("tooFar");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              if (faceDetected) setFaceDetected(false);
            } else if (!edgeValidation.isCentered) {
              // Face not centered in ROI
              consecutiveDetectionsRef.current = 0;
              if (faceStatus !== "centering") {
                setFaceStatus("centering");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              if (faceDetected) setFaceDetected(false);
            } else {
              // Face detected but not well positioned
              consecutiveDetectionsRef.current = 0;
              if (faceStatus !== "none") {
                setFaceStatus("none");
              }
              if (faceDetected) setFaceDetected(false);
            }
          } else {
            consecutiveDetectionsRef.current = 0;
            if (faceStatus !== "none") {
              setFaceStatus("none");
            }
            if (faceDetected) setFaceDetected(false);
          }
        } else {
          // No face detected in ROI
          consecutiveDetectionsRef.current = 0;
          if (faceStatus !== "none") {
            setFaceStatus("none");
          }
          if (faceDetected) setFaceDetected(false);
        }
      } catch (error: any) {
        isCapturingRef.current = false;
        const errorMessage = error?.message || 'Unknown error';
        
        // Ignore camera unmount errors and other common camera errors
        if (!errorMessage.includes('Image could not be captured') && 
            !errorMessage.includes('Camera is already taking a picture') &&
            !errorMessage.includes('Camera is busy') &&
            !errorMessage.includes('Camera unmounted') &&
            !errorMessage.includes('unmounted') &&
            !errorMessage.includes('Camera unmounted during')) {
          // Only log unexpected errors if component is still mounted
          if (isMountedRef.current) {
            console.error("❌ ROI Detection error:", errorMessage);
          }
        }
        
        // If component unmounted, stop detection
        if (!isMountedRef.current) {
          stopFaceDetection();
        }
      }
    };

    // Start ROI monitoring
    console.log('🎯 Starting ROI-based face detection (SkanApp-style)...');
    
    // Initial detection after camera is ready
    const startDetection = () => {
      if (cameraRef.current && !isCapturingRef.current) {
        performROIDetection();
      } else {
        setTimeout(startDetection, 200);
      }
    };
    
    setTimeout(startDetection, 400);
    
    // Monitor ROI every 800ms (responsive but not overwhelming)
    faceDetectionIntervalRef.current = setInterval(() => {
      if (cameraRef.current && !isCapturingRef.current && !isLoading) {
        performROIDetection();
      }
    }, 800);
  };

  const stopFaceDetection = () => {
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current);
      faceDetectionIntervalRef.current = null;
    }
    isCapturingRef.current = false; // Reset capture flag
    isMountedRef.current = false; // Mark as unmounted when stopping
  };

  const validateFaceFromBase64 = async (base64String: string): Promise<boolean> => {
    try {
      setIsValidating(true);
      if (!base64String || typeof base64String !== "string" || base64String.length === 0) return false;
      const base64Image = base64String.startsWith("data:") ? base64String : `data:image/jpeg;base64,${base64String}`;
      let visionResult;
      try {
        visionResult = await analyzeFace(base64Image);
      } catch {
        return false;
      }
      if (!visionResult || !visionResult.faceAnnotations || visionResult.faceAnnotations.length === 0) return false;
      const face = visionResult.faceAnnotations[0];
      if (!face) return false;
      const confidence = face.detectionConfidence || 0;
      // More lenient confidence threshold (0.2 instead of 0.4)
      if (confidence < 0.2) return false;
      const rollAngle = Math.abs(face.rollAngle || 0);
      const panAngle = Math.abs(face.panAngle || 0);
      const tiltAngle = Math.abs(face.tiltAngle || 0);
      // More lenient angle requirements (50 degrees instead of 30)
      // For side photos, we expect higher pan angles
      const maxAngle = captureStep === "front" ? 50 : 70;
      if (rollAngle > maxAngle || panAngle > maxAngle || tiltAngle > maxAngle) return false;
      return true;
    } catch {
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleTakePicture = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Camera not available", "Please use upload photo on web.");
      return;
    }
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Permission Required", "Camera permission is required to take photos.");
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    stopFaceDetection();

    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
          base64: true,
        });

        if (photo?.uri) {
          // Store both URI and base64 for proper processing
          // Base64 will be used for validation during processing
          const updatedPhotos = { ...capturedPhotos };
          if (captureStep === "front") {
            updatedPhotos.front = photo.uri;
            // Store base64 if available for later validation
            if (photo.base64) {
              // Store base64 in a way that can be passed to analysis
              // We'll pass it as a data URL
              const base64DataUrl = `data:image/jpeg;base64,${photo.base64}`;
              // Store in a ref or pass directly - for now, we'll pass URI and convert during processing
            }
          } else if (captureStep === "left") {
            updatedPhotos.left = photo.uri;
          } else if (captureStep === "right") {
            updatedPhotos.right = photo.uri;
          }
          setCapturedPhotos(updatedPhotos);

          // Move to next step or complete
          if (captureStep === "front") {
            // Move to left profile
            setCaptureStep("left");
            setIsLoading(false);
            setFaceStatus("none");
            setFaceDetected(false);
            startFaceDetection();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else if (captureStep === "left") {
            // Move to right profile
            setCaptureStep("right");
            setIsLoading(false);
            setFaceStatus("none");
            setFaceDetected(false);
            startFaceDetection();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            // All photos captured, proceed to analysis
            const params: any = {
              frontImage: updatedPhotos.front,
              multiAngle: "true",
            };
            if (updatedPhotos.left) params.leftImage = updatedPhotos.left;
            if (updatedPhotos.right) params.rightImage = updatedPhotos.right;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push({
              pathname: "/analysis-loading",
              params,
            });
          }
        } else {
          setIsLoading(false);
          startFaceDetection();
        }
      }
    } catch (err) {
      console.error("Error taking photo:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
      setIsLoading(false);
      startFaceDetection();
    }
  };

  const handleContinueToCamera = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (Platform.OS !== "web" && permission && !permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Camera Required", "We need camera access to scan your skin.");
        return;
      }
    }

    heroFadeAnim.setValue(1);
    Animated.timing(heroFadeAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep("camera");
    });
  }, [permission, requestPermission]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const styles = createStyles(palette);

  if (currentStep === "instructions") {
  return (
      <View style={styles.instructionRoot}>
        <LinearGradient
          colors={[palette.background, palette.surfaceAlt, palette.background]}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.instructionSafe} edges={["top", "bottom"]}>
          <Stack.Screen options={{ headerShown: false }} />

          <Animated.View
            style={[
              styles.instructionInner,
              { opacity: heroFadeAnim, transform: [{ translateY: heroSlideAnim }] },
            ]}
          >
            <View style={styles.instructionHeader}>
              <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={handleClose}
                style={styles.closeBtn}
          activeOpacity={0.7}
                testID="close-instructions"
        >
                <X color={palette.textSecondary} size={22} />
        </TouchableOpacity>
      </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              bounces={false}
            >
              <View style={styles.heroSection}>
                <View style={styles.faceIllustration}>
                  <Animated.View
                    style={[
                      styles.pulseRing,
                      {
                        transform: [{ scale: pulseRingAnim }],
                        opacity: pulseOpacityAnim,
                      },
                    ]}
                  />
                  <View style={styles.faceOvalOuter}>
                    <View style={styles.faceOvalInner}>
                      <CameraIcon color={palette.gold} size={36} strokeWidth={1.8} />
                    </View>
                  </View>
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        transform: [
                          {
                            translateY: scanLineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-40, 40],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
          </View>

                <Text style={styles.heroTitle}>Let's scan your skin</Text>
                <Text style={styles.heroSubtitle}>
                  For the best results, follow these quick tips
                </Text>
              </View>

              <View style={styles.tipsCard}>
                {TIPS.map((tip, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.tipRow,
                      index < TIPS.length - 1 && styles.tipRowBorder,
                      {
                        opacity: tipAnims[index],
                        transform: [{ translateY: tipSlideAnims[index] }],
                      },
                    ]}
                  >
                    <View style={styles.tipIconWrap}>
                      <Text style={styles.tipEmoji}>{tip.emoji}</Text>
            </View>
                    <Text style={styles.tipLabel}>{tip.text}</Text>
                  </Animated.View>
                ))}
        </View>

              <Animated.View
                style={[
                  styles.examplesSection,
                  { opacity: ctaAnim, transform: [{ translateY: ctaSlideAnim }] },
                ]}
              >
                <View style={styles.doRow}>
                  <View style={styles.doBadge}>
                    <CheckCircle color="#10B981" size={14} strokeWidth={3} />
                    <Text style={styles.doText}>DO</Text>
      </View>
                  <Text style={styles.doDescription}>
                    Clean face, even lighting, neutral expression
                  </Text>
                </View>
                <View style={styles.dontRow}>
                  <View style={styles.dontBadge}>
                    <X color="#EF4444" size={14} strokeWidth={3} />
                    <Text style={styles.dontText}>DON'T</Text>
                  </View>
                  <Text style={styles.dontDescription}>
                    Makeup, glasses, filters, or harsh shadows
                  </Text>
                </View>
              </Animated.View>
            </ScrollView>

            <Animated.View
              style={[
                styles.ctaContainer,
                { opacity: ctaAnim, transform: [{ translateY: ctaSlideAnim }] },
              ]}
            >
        <TouchableOpacity
                onPress={handleContinueToCamera}
          activeOpacity={0.9}
                style={styles.ctaButton}
                testID="continue-to-camera"
        >
          <LinearGradient
                  colors={["#1A1A1A", "#0A0A0A"]}
                  style={styles.ctaGradient}
                >
                  <Text style={styles.ctaText}>I'm Ready</Text>
                  <View style={styles.ctaArrow}>
                    <ChevronRight color="#FFFFFF" size={20} strokeWidth={2.5} />
                  </View>
          </LinearGradient>
        </TouchableOpacity>

              <Text style={styles.ctaFootnote}>Takes less than 10 seconds</Text>
            </Animated.View>
          </Animated.View>
        </SafeAreaView>
              </View>
    );
  }

  // Show loading state if permission is being checked
  if (permission === null) {
    return (
      <View style={styles.cameraRoot}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
        <View style={styles.cameraPlaceholder}>
          <ActivityIndicator color={palette.primary} size="large" />
          <Text style={styles.cameraPlaceholderText}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cameraRoot}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View style={[styles.cameraFull, { opacity: cameraFadeAnim }]}>
        {permission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="front"
            mode="picture"
          />
        ) : (
          <View style={styles.cameraPlaceholder}>
            <CameraIcon color={palette.primary} size={64} strokeWidth={2} />
            <Text style={styles.cameraPlaceholderText}>
              Camera permission required
            </Text>
            <Text style={styles.cameraPlaceholderSubtext}>
              We need access to your camera to scan your skin
            </Text>
            <TouchableOpacity 
              style={styles.permissionButton} 
              onPress={requestPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        )}

        {permission?.granted && (
          <View style={styles.cameraOverlay}>
            <SafeAreaView style={styles.cameraOverlaySafe} edges={["top"]}>
              <View style={styles.cameraHeader}>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.cameraCloseBtn}
                  activeOpacity={0.7}
                >
                  <X color="#FFFFFF" size={22} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={styles.cameraTitle}>
                    {captureStep === "front" 
                      ? "Front Photo" 
                      : captureStep === "left" 
                      ? "Left Profile" 
                      : "Right Profile"}
                  </Text>
                  <View style={styles.progressIndicator}>
                    <View style={[styles.progressDot, captureStep === "front" && styles.progressDotActive]} />
                    <View style={[styles.progressDot, captureStep === "left" && styles.progressDotActive]} />
                    <View style={[styles.progressDot, captureStep === "right" && styles.progressDotActive]} />
                  </View>
                </View>
                <View style={{ width: 40 }} />
      </View>
    </SafeAreaView>

            <View style={styles.guideContainer}>
              <Animated.View
                style={[
                  styles.faceGuideOval,
                  faceStatus === "ready" && styles.faceGuideReady,
                  faceStatus === "tooFar" && styles.faceGuideWarning,
                  faceStatus === "centering" && styles.faceGuideWarning,
                  { transform: [{ scale: guidePulseAnim }] },
                ]}
              >
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
              </Animated.View>
            </View>

            <Animated.View
              style={[
                styles.feedbackBar,
                { opacity: feedbackFadeAnim, transform: [{ translateY: feedbackSlideAnim }] },
              ]}
            >
              {faceStatus === "ready" && faceDetected && (
                <Animated.View
                  style={[
                    styles.feedbackPill,
                    styles.feedbackReady,
                    {
                      transform: [
                        {
                          scale: statusChangeAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [1, 1.08, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <CheckCircle color="#FFFFFF" size={18} strokeWidth={3} />
                  <Text style={styles.feedbackText}>
                    {captureStep === "front" 
                      ? "Perfect! Tap to capture front" 
                      : captureStep === "left" 
                      ? "Perfect! Tap to capture left profile" 
                      : "Perfect! Tap to capture right profile"}
                  </Text>
                </Animated.View>
              )}
              {faceStatus === "centering" && (
                <View style={[styles.feedbackPill, styles.feedbackWarn]}>
                  <Move color="#FFFFFF" size={18} strokeWidth={2.5} />
                  <Text style={styles.feedbackText}>Center your face</Text>
                </View>
              )}
              {faceStatus === "tooFar" && (
                <View style={[styles.feedbackPill, styles.feedbackWarn]}>
                  <Text style={styles.feedbackText}>Move closer to the camera</Text>
                </View>
              )}
              {faceStatus === "none" && (
                <View style={[styles.feedbackPill, styles.feedbackNone]}>
                  <Text style={styles.feedbackText}>
                    {captureStep === "front" 
                      ? "Position your face in the oval, then tap to capture" 
                      : captureStep === "left" 
                      ? "Turn your head to the left, then tap to capture" 
                      : "Turn your head to the right, then tap to capture"}
                  </Text>
                </View>
              )}
            </Animated.View>

            <SafeAreaView edges={["bottom"]} style={styles.cameraBottomSafe}>
            <View style={styles.captureRow}>
              <View style={{ width: 56 }} />

              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <TouchableOpacity
                  onPress={handleTakePicture}
                  disabled={isLoading || !permission?.granted || isValidating}
                  activeOpacity={0.85}
                  style={[
                    styles.captureOuter,
                    // Always show as enabled (unless actually loading/validating)
                    !isLoading && !isValidating && styles.captureOuterReady,
                    (isLoading || isValidating) && styles.captureOuterDisabled,
                  ]}
                  testID="capture-button"
                >
                  {isLoading || isValidating ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View
                      style={[
                        styles.captureInner,
                        styles.captureInnerReady, // Always show as ready
                      ]}
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>

              <View style={{ width: 56 }} />
            </View>

            <View style={styles.cameraTipsRow}>
              <View style={styles.cameraTip}>
                <Text style={styles.cameraTipEmoji}>💡</Text>
                <Text style={styles.cameraTipText}>Good light</Text>
              </View>
              <View style={styles.cameraTip}>
                <Text style={styles.cameraTipEmoji}>👓</Text>
                <Text style={styles.cameraTipText}>No glasses</Text>
              </View>
              <View style={styles.cameraTip}>
                <Text style={styles.cameraTipEmoji}>😐</Text>
                <Text style={styles.cameraTipText}>Neutral face</Text>
              </View>
              <View style={styles.cameraTip}>
                <Text style={styles.cameraTipEmoji}>💇</Text>
                <Text style={styles.cameraTipText}>Hair back</Text>
              </View>
            </View>
          </SafeAreaView>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) =>
  StyleSheet.create({
    instructionRoot: {
    flex: 1,
      backgroundColor: palette.background,
    },
    instructionSafe: {
      flex: 1,
    },
    instructionInner: {
      flex: 1,
    },
    instructionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
    paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 4,
    },
    closeBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: palette.surfaceAlt,
      justifyContent: "center",
      alignItems: "center",
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingBottom: 20,
    },
    heroSection: {
      alignItems: "center",
    paddingTop: 12,
      marginBottom: 28,
    },
    faceIllustration: {
      width: 120,
      height: 120,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    pulseRing: {
      position: "absolute",
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
      borderColor: palette.gold,
    },
    faceOvalOuter: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: palette.gold + "15",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: palette.gold + "40",
    },
    faceOvalInner: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: palette.gold + "20",
      justifyContent: "center",
      alignItems: "center",
    },
    scanLine: {
      position: "absolute",
      width: 60,
      height: 2,
      backgroundColor: palette.gold,
      borderRadius: 1,
      opacity: 0.6,
    },
    heroTitle: {
      fontSize: 30,
      fontWeight: "800" as const,
    color: palette.textPrimary,
      textAlign: "center",
      letterSpacing: -0.8,
      marginBottom: 10,
  },
    heroSubtitle: {
      fontSize: 16,
      fontWeight: "500" as const,
    color: palette.textSecondary,
      textAlign: "center",
      lineHeight: 22,
    },
    tipsCard: {
      backgroundColor: palette.surface,
      borderRadius: 20,
      paddingVertical: 4,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: palette.borderLight,
      ...shadow.soft,
    },
    tipRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
    paddingHorizontal: 20,
      gap: 14,
    },
    tipRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: palette.divider,
    },
    tipIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: palette.gold + "12",
      justifyContent: "center",
      alignItems: "center",
    },
    tipEmoji: {
      fontSize: 18,
    },
    tipLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: "500" as const,
      color: palette.textPrimary,
      lineHeight: 21,
    },
    examplesSection: {
      marginBottom: 8,
      gap: 10,
    },
    doRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#10B98112",
      borderRadius: 14,
      paddingVertical: 14,
    paddingHorizontal: 16,
      gap: 12,
    },
    doBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#10B98120",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    doText: {
    fontSize: 12,
      fontWeight: "800" as const,
      color: "#10B981",
      letterSpacing: 0.5,
  },
    doDescription: {
      flex: 1,
    fontSize: 14,
      fontWeight: "500" as const,
      color: palette.textPrimary,
    },
    dontRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#EF444412",
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 12,
    },
    dontBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#EF444420",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    dontText: {
      fontSize: 12,
      fontWeight: "800" as const,
      color: "#EF4444",
      letterSpacing: 0.5,
    },
    dontDescription: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500" as const,
      color: palette.textPrimary,
    },
    ctaContainer: {
      paddingHorizontal: 24,
      paddingBottom: 12,
      paddingTop: 8,
    },
    ctaButton: {
      borderRadius: 18,
      overflow: "hidden",
      ...shadow.medium,
    },
    ctaGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    paddingVertical: 18,
      gap: 8,
  },
    ctaText: {
      color: "#FFFFFF",
    fontSize: 18,
      fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
    ctaArrow: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.15)",
      justifyContent: "center",
      alignItems: "center",
    },
    ctaFootnote: {
      textAlign: "center",
      fontSize: 13,
      fontWeight: "500" as const,
      color: palette.textTertiary,
      marginTop: 12,
    },

    cameraRoot: {
      flex: 1,
      backgroundColor: "#000000",
    },
    cameraFull: {
      flex: 1,
    },
    cameraOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "space-between",
    },
    cameraOverlaySafe: {
      zIndex: 10,
    },
    cameraHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
    },
    cameraCloseBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      alignItems: "center",
    },
    cameraTitle: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "700" as const,
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
      marginBottom: 6,
    },
    progressIndicator: {
      flexDirection: "row",
    gap: 8,
      marginTop: 4,
    },
    progressDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "rgba(255,255,255,0.3)",
    },
    progressDotActive: {
      backgroundColor: "#FFFFFF",
      width: 20,
    },
    guideContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    faceGuideOval: {
      width: GUIDE_OVAL_WIDTH,
      height: GUIDE_OVAL_HEIGHT,
      borderRadius: GUIDE_OVAL_WIDTH,
      borderWidth: 2.5,
      borderColor: "rgba(255,255,255,0.5)",
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
    },
    faceGuideReady: {
      borderColor: "#10B981",
      borderStyle: "solid",
      shadowColor: "#10B981",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
    },
    faceGuideWarning: {
      borderColor: "#F59E0B",
    },
    cornerTL: {
      position: "absolute",
      top: -2,
      left: -2,
      width: 28,
      height: 28,
      borderTopWidth: 4,
      borderLeftWidth: 4,
      borderColor: "rgba(255,255,255,0.9)",
      borderTopLeftRadius: 14,
    },
    cornerTR: {
      position: "absolute",
      top: -2,
      right: -2,
      width: 28,
      height: 28,
      borderTopWidth: 4,
      borderRightWidth: 4,
      borderColor: "rgba(255,255,255,0.9)",
      borderTopRightRadius: 14,
    },
    cornerBL: {
      position: "absolute",
      bottom: -2,
      left: -2,
      width: 28,
      height: 28,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderColor: "rgba(255,255,255,0.9)",
      borderBottomLeftRadius: 14,
    },
    cornerBR: {
      position: "absolute",
      bottom: -2,
      right: -2,
      width: 28,
      height: 28,
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderColor: "rgba(255,255,255,0.9)",
      borderBottomRightRadius: 14,
    },
    feedbackBar: {
      alignItems: "center",
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    feedbackPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 22,
      paddingVertical: 12,
      borderRadius: 28,
      gap: 10,
    },
    feedbackReady: {
      backgroundColor: "rgba(16,185,129,0.92)",
    },
    feedbackWarn: {
      backgroundColor: "rgba(245,158,11,0.92)",
    },
    feedbackNone: {
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    feedbackText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700" as const,
      letterSpacing: 0.2,
    },
    cameraBottomSafe: {
      paddingBottom: 8,
    },
    captureRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 16,
      gap: 32,
    },
    captureOuter: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 4,
      borderColor: "rgba(255,255,255,0.4)",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.1)",
    },
    captureOuterReady: {
      borderColor: "#10B981",
      backgroundColor: "rgba(16,185,129,0.15)",
    },
    captureOuterDisabled: {
      opacity: 0.4,
    },
    captureInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "rgba(255,255,255,0.85)",
    },
    captureInnerReady: {
      backgroundColor: "#10B981",
    },
    cameraTipsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 16,
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    cameraTip: {
      alignItems: "center",
    gap: 4,
  },
    cameraTipEmoji: {
      fontSize: 16,
    },
    cameraTipText: {
      color: "rgba(255,255,255,0.7)",
      fontSize: 11,
      fontWeight: "600" as const,
    },
    cameraPlaceholder: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#1A1A1A",
      gap: 16,
    },
    cameraPlaceholderText: {
      fontSize: 18,
      color: "rgba(255,255,255,0.9)",
      fontWeight: "700" as const,
      textAlign: "center",
      paddingHorizontal: 40,
      marginTop: 8,
    },
    cameraPlaceholderSubtext: {
      fontSize: 14,
      color: "rgba(255,255,255,0.6)",
      fontWeight: "400" as const,
      textAlign: "center",
      paddingHorizontal: 40,
      marginTop: 4,
    },
    permissionButton: {
      marginTop: 12,
      backgroundColor: palette.gold,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    permissionButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700" as const,
  },
});

