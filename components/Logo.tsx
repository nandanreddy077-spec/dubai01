import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  style?: object;
}

export default function Logo({ size = 80, style }: LogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={[styles.logo, { width: size * 1.2, height: size * 1.2 }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 1000,
    overflow: 'hidden',
  },
  logo: {
    borderRadius: 1000,
  },
});

