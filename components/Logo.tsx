import React from 'react';
import { Image, View, StyleSheet, Text } from 'react-native';

interface LogoProps {
  size?: number;
  style?: object;
  showText?: boolean;
  hideBackground?: boolean;
}

export default function Logo({ size = 80, style, showText = false, hideBackground = false }: LogoProps) {
  const logoSize = size * 1.2;
  const squareSize = logoSize * 1.3;

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[
        styles.squareContainer, 
        { width: squareSize, height: squareSize },
        hideBackground && styles.squareContainerNoBackground
      ]}>
      <Image
          source={require('@/assets/images/logo.png')}
          style={[styles.logo, { width: logoSize, height: logoSize }]}
        resizeMode="contain"
      />
      </View>
      {showText && (
        <Text style={styles.logoText}>GlowCheck</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareContainer: {
    backgroundColor: '#808080', // Gray square background
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // Slight rotation for tilted effect
    transform: [{ rotate: '-5deg' }],
  },
  squareContainerNoBackground: {
    backgroundColor: 'transparent',
    transform: [{ rotate: '0deg' }],
  },
  logo: {
    borderRadius: 1000,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C2C2C',
    marginTop: 16,
    letterSpacing: 0.5,
  },
});

