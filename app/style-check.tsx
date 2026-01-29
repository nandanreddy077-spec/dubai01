import React, { useState } from "react";
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
import { Stack, router } from "expo-router";
import { Shirt, ChevronLeft, Upload, Camera, Sparkles } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useStyle } from "@/contexts/StyleContext";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import FeaturePaywall from '@/components/FeaturePaywall';
import { getPalette } from '@/constants/theme';
import PressableScale from "@/components/PressableScale";

const { width } = Dimensions.get('window');

export default function StyleCheckScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { setCurrentImage, resetAnalysis } = useStyle();
  const { theme } = useTheme();
  const subscription = useSubscription();
  const { canAccessStyleCheck } = subscription || { canAccessStyleCheck: false };
  
  const palette = getPalette(theme);

  // Animation for the floating effect
  const floatAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    resetAnalysis();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [resetAnalysis]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const handleTakePhoto = async () => {
    if (!canAccessStyleCheck) {
      setShowPaywall(true);
      return;
    }

    if (Platform.OS === 'web') {
      Alert.alert('Camera not available', 'Camera not available on web. Please use upload photo instead.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is required to take photos.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].base64 
          ? `data:image/jpeg;base64,${result.assets[0].base64}`
          : result.assets[0].uri;
        
        setCurrentImage(imageUri);
        router.push('/occasion-selection');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadPhoto = async () => {
    if (!canAccessStyleCheck) {
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].base64 
          ? `data:image/jpeg;base64,${result.assets[0].base64}`
          : result.assets[0].uri;
        
        setCurrentImage(imageUri);
        router.push('/occasion-selection');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
            colors={['#4F46E5', '#818CF8']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity 
                onPress={() => router.back()}
                style={styles.backButton}
            >
                <ChevronLeft color="#FFFFFF" size={28} />
            </TouchableOpacity>
        </View>
      
        <View style={styles.content}>
             <View style={styles.visualContainer}>
                 <Animated.View style={[styles.iconCircle, { transform: [{ translateY }] }]}>
                    <Shirt color="#FFFFFF" size={80} strokeWidth={1.5} />
                 </Animated.View>
                 <Text style={styles.title}>Style Check</Text>
                 <Text style={styles.subtitle}>
                    Does this outfit look good?{"\n"}Let AI decide.
                 </Text>
             </View>

            <View style={styles.buttonContainer}>
                <PressableScale
                    onPress={handleTakePhoto}
                    disabled={isLoading}
                    style={styles.mainButton}
                >
                    <View style={styles.mainButtonInner}>
                        <Camera color="#4F46E5" size={28} />
                        <Text style={styles.mainButtonText}>Take Photo</Text>
                    </View>
                </PressableScale>

                <TouchableOpacity
                    onPress={handleUploadPhoto}
                    disabled={isLoading}
                    style={styles.secondaryButton}
                >
                     <Upload color="rgba(255,255,255,0.8)" size={24} />
                     <Text style={styles.secondaryButtonText}>Upload Photo</Text>
                </TouchableOpacity>
            </View>
        </View>

      {showPaywall && (
        <FeaturePaywall
          featureType="style-check"
          onDismiss={() => setShowPaywall(false)}
          showDismiss={true}
        />
      )}
      </SafeAreaView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingTop: 40,
  },
  visualContainer: {
      alignItems: 'center',
      paddingHorizontal: 30,
  },
  iconCircle: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
  },
  title: {
      fontSize: 42,
      fontWeight: '800',
      color: '#FFFFFF',
      marginBottom: 16,
      textAlign: 'center',
      letterSpacing: -1,
  },
  subtitle: {
      fontSize: 18,
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center',
      lineHeight: 28,
      fontWeight: '500',
  },
  buttonContainer: {
      paddingHorizontal: 24,
      gap: 16,
  },
  mainButton: {
      width: '100%',
  },
  mainButtonInner: {
      backgroundColor: '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 22,
      borderRadius: 28,
      gap: 12,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
  },
  mainButtonText: {
      fontSize: 20,
      fontWeight: '700',
      color: '#4F46E5',
  },
  secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 8,
  },
  secondaryButtonText: {
      fontSize: 17,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.9)',
  },
});
