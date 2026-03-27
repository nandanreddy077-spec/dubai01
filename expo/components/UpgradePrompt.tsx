import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { X, Crown, Sparkles, Zap, Star } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
  message?: string;
}

/**
 * UpgradePrompt - Modal that appears when users try to access premium features
 * Shows compelling reasons to upgrade with clear CTA
 */
export default function UpgradePrompt({ 
  visible, 
  onClose, 
  feature = 'this feature',
  message 
}: UpgradePromptProps) {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleUpgrade = () => {
    onClose();
    router.push('/trial-offer');
  };

  const handleMaybeLater = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFillObject} tint="dark" />
        
        <Animated.View 
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#FFFFFF', '#FFF5F7']}
            style={styles.contentGradient}
          >
            {/* Close button */}
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color="#666666" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Premium badge */}
            <View style={styles.badgeContainer}>
              <LinearGradient
                colors={['#D4A574', '#C8956D']}
                style={styles.badge}
              >
                <Crown size={40} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={styles.title}>
              Unlock {feature}
            </Text>

            {/* Message */}
            <Text style={styles.message}>
              {message || `$0 to start - unlock ${feature} and all premium features free.`}
            </Text>

            {/* Features */}
            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <View style={styles.featureIconBg}>
                  <Sparkles size={16} color="#D4A574" strokeWidth={2.5} />
                </View>
                <Text style={styles.featureText}>Unlimited AI scans & analysis</Text>
              </View>

              <View style={styles.featureRow}>
                <View style={styles.featureIconBg}>
                  <Zap size={16} color="#D4A574" strokeWidth={2.5} />
                </View>
                <Text style={styles.featureText}>Personal AI beauty coach</Text>
              </View>

              <View style={styles.featureRow}>
                <View style={styles.featureIconBg}>
                  <Star size={16} color="#D4A574" strokeWidth={2.5} />
                </View>
                <Text style={styles.featureText}>Exclusive community access</Text>
              </View>
            </View>

            {/* CTA Buttons */}
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#D4A574', '#C8956D']}
                style={styles.upgradeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Sparkles size={20} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
                <Text style={styles.upgradeButtonText}>$0 - Start It Free</Text>
                <View style={styles.trialBadge}>
                  <Text style={styles.trialBadgeText}>7 DAYS</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.laterButton}
              onPress={handleMaybeLater}
              activeOpacity={0.7}
            >
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </TouchableOpacity>

            {/* Fine print */}
            <Text style={styles.finePrint}>
              Free for 7 days, then $99/year. Cancel anytime.
            </Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: width - 48,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  contentGradient: {
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    zIndex: 10,
  },
  badgeContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4A574',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  featuresList: {
    width: '100%',
    gap: 12,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  upgradeButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#D4A574',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  upgradeButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  trialBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trialBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  laterButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  laterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999999',
    textAlign: 'center',
  },
  finePrint: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});

