import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { User, Zap } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { getPalette, getGradient, spacing, radii, shadow } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const { height } = Dimensions.get('window');

export default function GenderSelectionScreen() {
  const { updateGender } = useUser();
  const { theme } = useTheme();
  const [selected, setSelected] = useState<'male' | 'female' | null>(null);
  const [scaleAnim] = useState(new Animated.Value(1));

  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  const handleSelect = (gender: 'male' | 'female') => {
    setSelected(gender);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinue = async () => {
    if (selected) {
      await updateGender(selected);
      router.replace('/onboarding');
    }
  };

  const styles = createStyles(palette);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
      
      <LinearGradient
        colors={[palette.backgroundStart, palette.backgroundEnd]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={gradient.primary}
              style={styles.iconGradient}
            >
              <Zap size={40} color={palette.textLight} fill={palette.textLight} />
            </LinearGradient>
          </View>
          
          <Text style={styles.title}>Welcome to GlowCheck</Text>
          <Text style={styles.subtitle}>
            Let&apos;s personalize your experience.{'\n'}Are you male or female?
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            onPress={() => handleSelect('female')}
            activeOpacity={0.8}
            style={styles.optionButton}
          >
            <Animated.View style={{ transform: [{ scale: selected === 'female' ? scaleAnim : 1 }] }}>
              <LinearGradient
                colors={selected === 'female' ? gradient.primary : [palette.surface, palette.surfaceAlt]}
                style={[
                  styles.optionCard,
                  selected === 'female' && styles.optionCardSelected
                ]}
              >
                <View style={[
                  styles.optionIconContainer,
                  selected === 'female' && styles.optionIconContainerSelected
                ]}>
                  <User 
                    size={48} 
                    color={selected === 'female' ? palette.textLight : palette.primary}
                    strokeWidth={2}
                  />
                </View>
                <Text style={[
                  styles.optionTitle,
                  selected === 'female' && styles.optionTitleSelected
                ]}>
                  Female
                </Text>
                <Text style={[
                  styles.optionDescription,
                  selected === 'female' && styles.optionDescriptionSelected
                ]}>
                  Personalized skincare & beauty insights
                </Text>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSelect('male')}
            activeOpacity={0.8}
            style={styles.optionButton}
          >
            <Animated.View style={{ transform: [{ scale: selected === 'male' ? scaleAnim : 1 }] }}>
              <LinearGradient
                colors={selected === 'male' ? ['#3B82F6', '#1E40AF'] : [palette.surface, palette.surfaceAlt]}
                style={[
                  styles.optionCard,
                  selected === 'male' && styles.optionCardSelected
                ]}
              >
                <View style={[
                  styles.optionIconContainer,
                  selected === 'male' && styles.optionIconContainerSelected
                ]}>
                  <User 
                    size={48} 
                    color={selected === 'male' ? '#FFFFFF' : '#3B82F6'}
                    strokeWidth={2}
                  />
                </View>
                <Text style={[
                  styles.optionTitle,
                  selected === 'male' && styles.optionTitleSelected
                ]}>
                  Male
                </Text>
                <Text style={[
                  styles.optionDescription,
                  selected === 'male' && styles.optionDescriptionSelected
                ]}>
                  Grooming & skincare made simple
                </Text>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selected}
          style={[styles.continueButton, !selected && styles.continueButtonDisabled]}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={selected ? gradient.primary : [palette.disabled, palette.disabled]}
            style={styles.continueGradient}
          >
            <Text style={[
              styles.continueText,
              !selected && styles.continueTextDisabled
            ]}>
              Continue
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: height * 0.12,
    paddingBottom: spacing.xxxl,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.elevated,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    paddingHorizontal: spacing.lg,
  },
  optionsContainer: {
    gap: spacing.lg,
  },
  optionButton: {
    width: '100%',
  },
  optionCard: {
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.xl,
    alignItems: 'center',
    ...shadow.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: 'transparent',
    ...shadow.elevated,
  },
  optionIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  optionIconContainerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  optionTitleSelected: {
    color: palette.textLight,
  },
  optionDescription: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  optionDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  continueButton: {
    marginTop: spacing.xl,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  continueButtonDisabled: {
    opacity: 0.6,
    ...shadow.card,
  },
  continueGradient: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: palette.textLight,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  continueTextDisabled: {
    color: palette.textMuted,
  },
});
