import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Camera, ChevronLeft, Upload } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette } from '@/constants/theme';
import BiometricConsent from '@/components/BiometricConsent';
import Svg, { Ellipse, Circle, Path } from "react-native-svg";



export default function GlowAnalysisScreen() {
  const { error } = useLocalSearchParams<{ error?: string }>();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [biometricConsented, setBiometricConsented] = useState<boolean>(false);
  
  
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  getPalette(theme);

  useEffect(() => {
    if (error === 'no_face_detected') {
      Alert.alert(
        "No Face Found",
        "Make sure your face is clearly visible in good lighting.",
        [{ text: "OK" }]
      );
    } else if (error === 'analysis_failed') {
      Alert.alert(
        "Something Went Wrong",
        "Please try again.",
        [{ text: "OK" }]
      );
    }
  }, [error]);

  const handleTakePhoto = async () => {
    if (!biometricConsented) {
      Alert.alert(
        'One More Step',
        'Please accept the consent below to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (Platform.OS === 'web') {
      Alert.alert('Use Upload', 'Camera not available on web. Please upload a photo instead.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow camera access to scan your skin.');
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadPhoto = async () => {
    if (!biometricConsented) {
      Alert.alert(
        'One More Step',
        'Please accept the consent below to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

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

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  const breatheOpacity = breatheAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#0A0A0A', '#1a1a1a', '#0A0A0A']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft color="#FFFFFF" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Skin Scan</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.mirrorContainer}>
            <Animated.View 
              style={[
                styles.faceFrame,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <Animated.View style={[styles.glowRing, { opacity: breatheOpacity }]} />
              
              <Svg width={240} height={320} viewBox="0 0 240 320">
                <Ellipse 
                  cx="120" 
                  cy="160" 
                  rx="90" 
                  ry="115" 
                  fill="rgba(255,255,255,0.03)" 
                  stroke="rgba(255,255,255,0.2)" 
                  strokeWidth="2" 
                  strokeDasharray="8 4"
                />
                <Ellipse cx="80" cy="130" rx="14" ry="10" fill="rgba(255,255,255,0.08)" />
                <Ellipse cx="160" cy="130" rx="14" ry="10" fill="rgba(255,255,255,0.08)" />
                <Circle cx="80" cy="130" r="5" fill="rgba(255,255,255,0.15)" />
                <Circle cx="160" cy="130" r="5" fill="rgba(255,255,255,0.15)" />
                <Ellipse cx="120" cy="170" rx="10" ry="8" fill="rgba(255,255,255,0.08)" />
                <Path 
                  d="M 95 210 Q 120 230 145 210" 
                  stroke="rgba(255,255,255,0.2)" 
                  strokeWidth="3" 
                  fill="none" 
                  strokeLinecap="round" 
                />
              </Svg>

              <Animated.View 
                style={[
                  styles.scanLine,
                  { transform: [{ translateY }] }
                ]}
              >
                <LinearGradient
                  colors={['transparent', '#C9A961', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.scanLineGradient}
                />
              </Animated.View>

              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </Animated.View>
          </View>

          <Text style={styles.instruction}>
            Position your face in the frame
          </Text>
          <Text style={styles.subInstruction}>
            Good lighting • Look straight ahead
          </Text>

          <View style={styles.consentContainer}>
            <BiometricConsent 
              onConsentChange={setBiometricConsented}
              required={true}
              variant="dark"
            />
          </View>
        </View>

        <View style={styles.bottomControls}>
          <TouchableOpacity 
            style={styles.sideButton}
            onPress={handleUploadPhoto}
            disabled={isLoading}
          >
            <Upload color="#FFFFFF" size={24} />
            <Text style={styles.sideButtonText}>Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.captureButton,
              !biometricConsented && styles.captureButtonDisabled
            ]}
            onPress={handleTakePhoto}
            disabled={isLoading || !biometricConsented}
          >
            <View style={styles.captureRing}>
              <View style={styles.captureInner}>
                <Camera color="#0A0A0A" size={32} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.sideButton}>
            <View style={{ width: 24, height: 24 }} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mirrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceFrame: {
    width: 280,
    height: 360,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 300,
    height: 380,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: '#C9A961',
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 4,
  },
  scanLineGradient: {
    flex: 1,
    borderRadius: 2,
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#C9A961',
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#C9A961',
    borderTopRightRadius: 16,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#C9A961',
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#C9A961',
    borderBottomRightRadius: 16,
  },
  instruction: {
    color: '#FFFFFF',
    marginTop: 32,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  subInstruction: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  consentContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
    width: '100%',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 32,
  },
  sideButton: {
    alignItems: 'center',
    gap: 6,
  },
  sideButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  captureButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
