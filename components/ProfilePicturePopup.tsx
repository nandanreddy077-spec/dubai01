import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Sparkles, Heart, X } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow, spacing, radii } from '@/constants/theme';
import PhotoPickerModal from './PhotoPickerModal';

interface ProfilePicturePopupProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProfilePicturePopup({ visible, onClose }: ProfilePicturePopupProps) {
  const { user } = useUser();
  const { theme } = useTheme();
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [sparkleAnim] = useState(new Animated.Value(0));
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim, sparkleAnim]);

  const handleAddPhoto = () => {
    console.log('Add photo button pressed');
    setShowPhotoPicker(true);
  };

  const handlePhotoPickerClose = () => {
    setShowPhotoPicker(false);
    if (user?.avatar) {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!visible) return null;

  const styles = createStyles(palette);

  return (
    <>
      <Modal
        visible={visible}
        animationType="none"
        statusBarTranslucent
        transparent={true}
      >
        <Animated.View 
          style={[
            styles.overlay,
            { opacity: fadeAnim }
          ]}
        >
          <Animated.View 
            style={[
              styles.container,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <LinearGradient
              colors={[palette.backgroundStart, palette.backgroundEnd]}
              style={styles.gradientBackground}
            />
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <View style={[styles.closeCircle, { backgroundColor: palette.overlayLight }]}>
                <X color={palette.textSecondary} size={20} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <Animated.View 
              style={[
                styles.sparkleTop,
                {
                  opacity: sparkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                  transform: [{
                    rotate: sparkleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  }]
                }
              ]}
            >
              <Sparkles color={palette.blush} size={20} fill={palette.blush} />
            </Animated.View>

            <Animated.View 
              style={[
                styles.sparkleBottom,
                {
                  opacity: sparkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                }
              ]}
            >
              <Heart color={palette.lavender} size={16} fill={palette.lavender} />
            </Animated.View>

            <View style={styles.content}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={gradient.primary}
                  style={styles.avatarGradient}
                >
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Camera color={palette.textLight} size={32} strokeWidth={2} />
                    </View>
                  )}
                </LinearGradient>
                <View style={[styles.avatarGlow, { backgroundColor: palette.overlayGold }]} />
              </View>

              <Text style={[styles.title, { color: palette.textPrimary }]}>
                Complete Your Beautiful Profile ✨
              </Text>
              
              <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
                Add a profile picture to personalize your glow journey and connect with our beauty community
              </Text>

              <View style={styles.benefitsContainer}>
                <View style={styles.benefitItem}>
                  <View style={[styles.benefitIcon, { backgroundColor: palette.overlayLight }]}>
                    <Sparkles color={palette.primary} size={14} fill={palette.blush} />
                  </View>
                  <Text style={[styles.benefitText, { color: palette.textSecondary }]}>
                    Personalized beauty insights
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <View style={[styles.benefitIcon, { backgroundColor: palette.overlayLight }]}>
                    <Heart color={palette.primary} size={14} fill={palette.blush} />
                  </View>
                  <Text style={[styles.benefitText, { color: palette.textSecondary }]}>
                    Connect with beauty friends
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleAddPhoto}
                activeOpacity={0.8}
                style={[styles.addPhotoButton, shadow.glow]}
              >
                <LinearGradient
                  colors={gradient.primary}
                  style={styles.addPhotoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Camera color={palette.textLight} size={20} strokeWidth={2.5} />
                  <Text style={[styles.addPhotoText, { color: palette.textLight }]}>
                    Add Profile Picture
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={[styles.skipText, { color: palette.textMuted }]}>
                  I&apos;ll do this later
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
      
      <PhotoPickerModal 
        visible={showPhotoPicker} 
        onClose={handlePhotoPickerClose} 
      />
    </>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radii.xxl,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleTop: {
    position: 'absolute',
    top: 40,
    left: 30,
    zIndex: 1,
  },
  sparkleBottom: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    zIndex: 1,
  },
  content: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.xl,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  avatarPlaceholder: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.2,
    zIndex: -1,
    top: -10,
    left: -10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
    fontWeight: '500',
    paddingHorizontal: spacing.md,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  addPhotoButton: {
    width: '100%',
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  addPhotoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});