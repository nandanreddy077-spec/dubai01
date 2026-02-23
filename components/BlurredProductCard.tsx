import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Lock, Crown } from 'lucide-react-native';
import { palette, shadow } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;

interface BlurredProductCardProps {
  onUnlock: () => void;
  matchScore?: number;
  brand?: string;
  name?: string;
  imageUrl?: string;
}

export default function BlurredProductCard({
  onUnlock,
  matchScore = 85,
  brand = 'BRAND',
  name = 'Product Name',
  imageUrl,
}: BlurredProductCardProps) {
  return (
    <View style={styles.container}>
      {/* Blurred Product Image */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <>
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
            <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
          </>
        ) : (
          <View style={styles.placeholderImage} />
        )}
        
        {/* Lock Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.overlay}
        >
          <View style={styles.lockContainer}>
            <View style={styles.lockCircle}>
              <Lock color={palette.gold} size={24} />
            </View>
            <Text style={styles.lockText}>Premium</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Blurred Product Info */}
      <View style={styles.infoContainer}>
        <BlurView intensity={15} style={styles.blurredInfo}>
          <View style={styles.infoContent}>
            <Text style={styles.blurredBrand}>{brand}</Text>
            <Text style={styles.blurredName}>{name}</Text>
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>{matchScore}% Match</Text>
            </View>
          </View>
        </BlurView>

        {/* Unlock Button */}
        <TouchableOpacity
          style={styles.unlockButton}
          onPress={onUnlock}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[palette.gold, palette.blush]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.unlockButtonGradient}
          >
            <Crown color="#000" size={16} />
            <Text style={styles.unlockButtonText}>Unlock</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginRight: 16,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: palette.surfaceAlt,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContainer: {
    alignItems: 'center',
    gap: 8,
  },
  lockCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(201, 169, 97, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.gold,
  },
  lockText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  infoContainer: {
    position: 'relative',
  },
  blurredInfo: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  infoContent: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  blurredBrand: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  blurredName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 8,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(201, 169, 97, 0.2)',
    borderRadius: 8,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(201, 169, 97, 0.6)',
  },
  unlockButton: {
    borderRadius: 12,
    overflow: 'hidden',
    ...shadow.soft,
  },
  unlockButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  unlockButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
});

