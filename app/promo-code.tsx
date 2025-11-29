import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tag, Check, X, ArrowLeft, Gift, Info } from 'lucide-react-native';
import { palette } from '@/constants/theme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { paymentService } from '@/lib/payments';

export default function PromoCodeScreen() {
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { state, setSubscriptionData } = useSubscription();

  const validatePromoCode = (code: string): boolean => {
    // Basic validation: at least 4 characters, alphanumeric
    const regex = /^[A-Za-z0-9]{4,}$/;
    return regex.test(code.trim());
  };

  const handleRedeemPromoCode = async () => {
    const trimmedCode = promoCode.trim().toUpperCase();

    if (!trimmedCode) {
      setValidationMessage('Please enter a promo code');
      setIsSuccess(false);
      return;
    }

    if (!validatePromoCode(trimmedCode)) {
      setValidationMessage('Invalid promo code format');
      setIsSuccess(false);
      return;
    }

    setIsRedeeming(true);
    setValidationMessage('');

    try {
      console.log('Attempting to redeem promo code:', trimmedCode);

      if (Platform.OS === 'web') {
        Alert.alert(
          'Web Not Supported',
          'Promo code redemption is only available on mobile devices. Please use the iOS or Android app.',
          [{ text: 'OK' }]
        );
        setIsRedeeming(false);
        return;
      }

      // For iOS - redirect to App Store redemption
      if (Platform.OS === 'ios') {
        // iOS App Store promo code redemption URL
        const redemptionUrl = `https://apps.apple.com/redeem?ctx=offercodes&id=YOUR_APP_ID&code=${trimmedCode}`;
        
        const canOpen = await Linking.canOpenURL(redemptionUrl);
        
        if (canOpen) {
          await Linking.openURL(redemptionUrl);
          
          // Show instructions
          Alert.alert(
            'Redeeming on App Store',
            'You will be redirected to the App Store to complete the redemption. After redeeming, return to the app and your subscription will be automatically activated.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setPromoCode('');
                  setValidationMessage('Check App Store to complete redemption');
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Manual Redemption',
            'To redeem your promo code:\n\n1. Open the App Store\n2. Tap your profile icon\n3. Tap "Redeem Gift Card or Code"\n4. Enter code: ' + trimmedCode,
            [{ text: 'OK' }]
          );
        }
      }
      // For Android - redirect to Play Store redemption
      else if (Platform.OS === 'android') {
        // Google Play Store promo code redemption URL
        const redemptionUrl = `https://play.google.com/redeem?code=${trimmedCode}`;
        
        const canOpen = await Linking.canOpenURL(redemptionUrl);
        
        if (canOpen) {
          await Linking.openURL(redemptionUrl);
          
          // Show instructions
          Alert.alert(
            'Redeeming on Play Store',
            'You will be redirected to Google Play Store to complete the redemption. After redeeming, return to the app and your subscription will be automatically activated.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setPromoCode('');
                  setValidationMessage('Check Play Store to complete redemption');
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Manual Redemption',
            'To redeem your promo code:\n\n1. Open Google Play Store\n2. Tap the menu icon\n3. Tap "Redeem"\n4. Enter code: ' + trimmedCode,
            [{ text: 'OK' }]
          );
        }
      }

      // After a delay, check subscription status
      setTimeout(async () => {
        try {
          const subscriptionStatus = await paymentService.getSubscriptionStatus();
          if (subscriptionStatus?.isActive) {
            setIsSuccess(true);
            setValidationMessage('Promo code successfully redeemed!');
            
            // Update subscription data
            await setSubscriptionData({
              isPremium: true,
              subscriptionType: subscriptionStatus.productId.includes('annual') ? 'yearly' : 'monthly',
            });

            // Navigate back after success
            setTimeout(() => {
              router.back();
            }, 2000);
          }
        } catch (error) {
          console.log('Error checking subscription status:', error);
        }
      }, 3000);

    } catch (error) {
      console.error('Error redeeming promo code:', error);
      setValidationMessage('Failed to process promo code. Please try again.');
      setIsSuccess(false);
      
      Alert.alert(
        'Redemption Error',
        'Unable to process the promo code. Please check the code and try again, or contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleInfoPress = () => {
    Alert.alert(
      'How Promo Codes Work',
      Platform.OS === 'ios'
        ? 'Promo codes are redeemed through the App Store. When you enter a valid code, you\'ll be redirected to complete the redemption. Your subscription will be automatically activated after successful redemption.'
        : 'Promo codes are redeemed through the Google Play Store. When you enter a valid code, you\'ll be redirected to complete the redemption. Your subscription will be automatically activated after successful redemption.',
      [{ text: 'Got it' }]
    );
  };

  const showManualInstructions = () => {
    const instructions = Platform.OS === 'ios'
      ? 'To manually redeem a promo code on iOS:\n\n1. Open the App Store\n2. Tap your profile icon at the top\n3. Tap "Redeem Gift Card or Code"\n4. Enter your promo code\n5. Return to the app'
      : 'To manually redeem a promo code on Android:\n\n1. Open Google Play Store\n2. Tap the menu icon (≡)\n3. Tap "Redeem"\n4. Enter your promo code\n5. Return to the app';

    Alert.alert('Manual Redemption', instructions, [{ text: 'OK' }]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />

      <LinearGradient
        colors={[palette.background, palette.overlayBlush]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <ArrowLeft color={palette.text} size={24} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleInfoPress}
                style={styles.infoButton}
              >
                <Info color={palette.textMuted} size={24} />
              </TouchableOpacity>
            </View>

            {/* Title Section */}
            <View style={styles.titleSection}>
              <View style={styles.iconContainer}>
                <Gift color={palette.primary} size={48} strokeWidth={2} />
              </View>
              <Text style={styles.title}>Redeem Promo Code</Text>
              <Text style={styles.subtitle}>
                Enter your promotional code to unlock premium features
              </Text>
            </View>

            {/* Promo Code Input */}
            <View style={styles.inputSection}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Tag color={palette.textMuted} size={20} />
                </View>
                <TextInput
                  style={styles.input}
                  value={promoCode}
                  onChangeText={(text) => {
                    setPromoCode(text.toUpperCase());
                    setValidationMessage('');
                    setIsSuccess(false);
                  }}
                  placeholder="Enter promo code"
                  placeholderTextColor={palette.textMuted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={20}
                  editable={!isRedeeming}
                />
                {promoCode.length > 0 && !isRedeeming && (
                  <TouchableOpacity
                    onPress={() => {
                      setPromoCode('');
                      setValidationMessage('');
                      setIsSuccess(false);
                    }}
                    style={styles.clearButton}
                  >
                    <X color={palette.textMuted} size={20} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Validation Message */}
              {validationMessage ? (
                <View style={[
                  styles.messageContainer,
                  isSuccess ? styles.successContainer : styles.errorContainer
                ]}>
                  {isSuccess ? (
                    <Check color={palette.success} size={16} />
                  ) : (
                    <X color={palette.error} size={16} />
                  )}
                  <Text style={[
                    styles.messageText,
                    isSuccess ? styles.successText : styles.errorText
                  ]}>
                    {validationMessage}
                  </Text>
                </View>
              ) : null}

              {/* Redeem Button */}
              <TouchableOpacity
                style={[
                  styles.redeemButton,
                  (!promoCode || isRedeeming) && styles.redeemButtonDisabled
                ]}
                onPress={handleRedeemPromoCode}
                disabled={!promoCode || isRedeeming}
              >
                {isRedeeming ? (
                  <ActivityIndicator color={palette.surface} size="small" />
                ) : (
                  <>
                    <Gift color={palette.surface} size={20} strokeWidth={2.5} />
                    <Text style={styles.redeemButtonText}>Redeem Code</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Current Status */}
            {state.isPremium && (
              <View style={styles.premiumBadge}>
                <Check color={palette.success} size={18} />
                <Text style={styles.premiumText}>
                  You have an active premium subscription
                </Text>
              </View>
            )}

            {/* Manual Instructions Link */}
            <TouchableOpacity
              style={styles.manualLink}
              onPress={showManualInstructions}
            >
              <Text style={styles.manualLinkText}>
                How to redeem manually
              </Text>
            </TouchableOpacity>

            {/* Info Cards */}
            <View style={styles.infoCards}>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Where to get codes?</Text>
                <Text style={styles.infoCardText}>
                  Promo codes are provided through special promotions, partnerships, or giveaways. Follow us on social media for exclusive offers.
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Code not working?</Text>
                <Text style={styles.infoCardText}>
                  • Check the code is entered correctly{'\n'}
                  • Verify the code hasn't expired{'\n'}
                  • Ensure you haven't used this code before{'\n'}
                  • Contact support if issues persist
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: palette.overlayBlush,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: palette.primary,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: palette.text,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  inputSection: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: palette.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 2,
    borderColor: palette.overlayBlush,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    color: palette.text,
    paddingVertical: 16,
    letterSpacing: 2,
  },
  clearButton: {
    padding: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  successContainer: {
    backgroundColor: palette.overlaySuccess,
  },
  errorContainer: {
    backgroundColor: palette.overlayError,
  },
  messageText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  successText: {
    color: palette.success,
  },
  errorText: {
    color: palette.error,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: palette.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    gap: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: palette.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  redeemButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: palette.surface,
    letterSpacing: 0.5,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.overlaySuccess,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  premiumText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: palette.success,
  },
  manualLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 32,
  },
  manualLinkText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: palette.primary,
    textDecorationLine: 'underline',
  },
  infoCards: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: palette.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: palette.text,
    marginBottom: 8,
  },
  infoCardText: {
    fontSize: 14,
    color: palette.textMuted,
    lineHeight: 20,
  },
});
