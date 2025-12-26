import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Share,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  X, 
  Share2, 
  Users, 
  CheckCircle, 
  Sparkles,
  Copy,
  MessageCircle,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';
import { useReferral } from '@/contexts/ReferralContext';
import * as Clipboard from 'expo-clipboard';

const { height } = Dimensions.get('window');

interface ShareInviteModalProps {
  visible: boolean;
  onClose: () => void;
  score?: number;
  featureType?: 'analysis' | 'style';
}

export default function ShareInviteModal({
  visible,
  onClose,
  score = 85,
  featureType = 'analysis',
}: ShareInviteModalProps) {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const { state, invitesRemaining, progress, generateReferralLink, trackShare } = useReferral();
  
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 800,
        useNativeDriver: false,
      }).start();

      generateReferralLink(featureType).then(setShareLink);
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(height);
      scaleAnim.setValue(0.9);
    }
  }, [visible, fadeAnim, slideAnim, scaleAnim, progressAnim, progress, featureType, generateReferralLink]);

  const handleShare = async () => {
    try {
      const message = createShareMessage();
      await Share.share({
        message,
        title: 'Join me on GlowCheck! ✨',
      });
      
      await trackShare();
      console.log('📤 Shared successfully');
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const createShareMessage = () => {
    const messages = [
      `✨ Just discovered my unique beauty score on GlowCheck!\n\n🌟 My Score: ${score}/100\n\n💫 Want to discover yours? Use my link to unlock detailed analysis for FREE!\n\n${shareLink}\n\nGet personalized beauty tips, skincare recommendations, and track your glow journey! 🎉`,
      
      `Hey! 👋\n\nI just got an amazing beauty analysis on GlowCheck and thought you'd love it too!\n\n✨ My Glow Score: ${score}/100\n\n🎁 Use my link to get full access for FREE:\n${shareLink}\n\nDiscover your unique beauty strengths and get personalized tips! 💖`,
      
      `🌸 Just tried GlowCheck's AI beauty analyzer!\n\nScored ${score}/100 and got incredible personalized tips 🎯\n\n💝 Want to try it? Use my invite link:\n${shareLink}\n\nWe can compare results and support each other's glow journey! ✨`,
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  };

  const styles = createStyles(palette, gradient);

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={gradient.card}
            style={styles.content}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X color={palette.textMuted} size={24} strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.header}>
              <LinearGradient
                colors={gradient.success}
                style={styles.iconBadge}
              >
                <Users color="#FFF" size={32} strokeWidth={2.5} />
              </LinearGradient>
              <Text style={styles.title}>Share & Unlock for Free! 🎉</Text>
              <Text style={styles.subtitle}>
                Invite {invitesRemaining} {invitesRemaining === 1 ? 'friend' : 'friends'} to unlock premium features forever
              </Text>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Your Progress</Text>
                <Text style={styles.progressText}>
                  {state.successfulInvites} / 3 friends
                </Text>
              </View>
              
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progressBarWidth,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={gradient.success}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>

              <View style={styles.milestones}>
                {[1, 2, 3].map((milestone) => (
                  <View
                    key={milestone}
                    style={[
                      styles.milestone,
                      state.successfulInvites >= milestone && styles.milestoneCompleted,
                    ]}
                  >
                    {state.successfulInvites >= milestone ? (
                      <CheckCircle
                        color={palette.success}
                        size={20}
                        strokeWidth={2.5}
                        fill={palette.success}
                      />
                    ) : (
                      <View style={styles.milestoneNumber}>
                        <Text style={styles.milestoneNumberText}>{milestone}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>What You'll Unlock:</Text>
              
              <View style={styles.benefitItem}>
                <Sparkles color={palette.primary} size={18} strokeWidth={2.5} />
                <Text style={styles.benefitText}>Full detailed analysis results</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <CheckCircle color={palette.success} size={18} strokeWidth={2.5} />
                <Text style={styles.benefitText}>Compare results with friends</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <Users color={palette.blush} size={18} strokeWidth={2.5} />
                <Text style={styles.benefitText}>Track progress together</Text>
              </View>
            </View>

            <View style={styles.previewCard}>
              <LinearGradient
                colors={gradient.glow}
                style={styles.previewGradient}
              >
                <Text style={styles.previewTitle}>Your Glow Score</Text>
                <Text style={styles.previewScore}>{score}/100</Text>
                <Text style={styles.previewSubtext}>Share to unlock full details!</Text>
              </LinearGradient>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={gradient.primary}
                  style={styles.shareButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Share2 color="#FFF" size={20} strokeWidth={2.5} />
                  <Text style={styles.shareButtonText}>Share with Friends</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.linkSection}>
                <View style={styles.linkContainer}>
                  <Text style={styles.linkLabel}>Your invite link:</Text>
                  <Text style={styles.linkText} numberOfLines={1}>
                    {shareLink || 'Generating...'}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyLink}
                  activeOpacity={0.8}
                  disabled={!shareLink}
                >
                  <View style={styles.copyButtonContent}>
                    {copied ? (
                      <>
                        <CheckCircle color={palette.success} size={16} strokeWidth={2.5} />
                        <Text style={[styles.copyButtonText, { color: palette.success }]}>
                          Copied!
                        </Text>
                      </>
                    ) : (
                      <>
                        <Copy color={palette.primary} size={16} strokeWidth={2.5} />
                        <Text style={styles.copyButtonText}>Copy</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footer}>
              <MessageCircle color={palette.textMuted} size={14} strokeWidth={2.5} />
              <Text style={styles.footerText}>
                Share via text, social media, or any app!
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>, gradient: ReturnType<typeof getGradient>) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: height * 0.9,
  },
  content: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.floating,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...shadow.elevated,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  progressSection: {
    backgroundColor: palette.overlayLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: palette.divider,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.primary,
  },
  progressTrack: {
    height: 12,
    backgroundColor: palette.surfaceElevated,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  milestones: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  milestone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderColor: palette.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneCompleted: {
    backgroundColor: palette.overlayGold,
    borderColor: palette.success,
  },
  milestoneNumber: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textMuted,
  },
  benefitsSection: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  previewCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    ...shadow.card,
  },
  previewGradient: {
    padding: 24,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewScore: {
    fontSize: 48,
    fontWeight: '900',
    color: palette.primary,
    letterSpacing: -2,
  },
  previewSubtext: {
    fontSize: 13,
    color: palette.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },
  actions: {
    gap: 16,
    marginBottom: 16,
  },
  shareButton: {
    borderRadius: 24,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  shareButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  shareButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  linkSection: {
    gap: 12,
  },
  linkContainer: {
    backgroundColor: palette.overlayLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.divider,
  },
  linkLabel: {
    fontSize: 12,
    color: palette.textMuted,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  linkText: {
    fontSize: 14,
    color: palette.primary,
    fontWeight: '600',
  },
  copyButton: {
    alignSelf: 'flex-start',
  },
  copyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.divider,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: palette.textMuted,
    fontWeight: '500',
  },
});
