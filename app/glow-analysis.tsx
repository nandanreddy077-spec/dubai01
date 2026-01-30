import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Camera, ScanFace, ChevronLeft, Upload, Zap } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette } from '@/constants/theme';
import BiometricConsent from '@/components/BiometricConsent';

const { width } = Dimensions.get('window');

export default function GlowAnalysisScreen() {
  const { error } = useLocalSearchParams<{ error?: string }>();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [biometricConsented, setBiometricConsented] = useState<boolean>(false);
  
  // Animation for the scanner effect
  const scanAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  const palette = getPalette(theme);
  const styles = createStyles(palette);

  useEffect(() => {
    if (error === 'no_face_detected') {
      Alert.alert(
        "No Face Detected",
        "Please ensure your face is clearly visible and well-lit.",
        [{ text: "OK" }]
      );
    } else if (error === 'analysis_failed') {
      Alert.alert(
        "Analysis Failed",
        "Something went wrong. Please try again.",
        [{ text: "OK" }]
      );
    }
  }, [error]);

  const handleTakePhoto = async () => {
    if (!biometricConsented) {
      Alert.alert(
        'Consent Required',
        'Please accept the biometric consent to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (Platform.OS === 'web') {
      alert('Camera not available on web. Please use upload photo instead.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required.');
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
        // Simple single photo flow for ease of use
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
          'Consent Required',
          'Please accept the biometric consent to continue.',
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
    outputRange: [-100, 100],
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
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
          <Text style={styles.headerTitle}>Glow Scan</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.scanContainer}>
            <View style={styles.faceOutline}>
               <ScanFace color="rgba(255,255,255,0.8)" size={200} strokeWidth={0.5} />
               <Animated.View 
                  style={[
                    styles.scanLine,
                    { transform: [{ translateY }] }
                  ]} 
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0)', '#FFFFFF', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                  />
                </Animated.View>
            </View>
            <Text style={styles.scanInstruction}>
              Align your face within the frame
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
                style={styles.uploadButton}
                onPress={handleUploadPhoto}
                disabled={isLoading}
            >
                <Upload color="#FFFFFF" size={24} />
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.captureButton}
                onPress={handleTakePhoto}
                disabled={isLoading}
            >
                <View style={styles.captureInner}>
                    <Camera color="#000000" size={32} />
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.flashButton}>
                 <Zap color="#FFFFFF" size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  scanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOutline: {
    width: 280,
    height: 380,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 140,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scanLine: {
    position: 'absolute',
    width: '120%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  scanInstruction: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 32,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  consentContainer: {
    marginTop: 20,
    paddingHorizontal: 40,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  captureInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  uploadButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5, 
  }
});
