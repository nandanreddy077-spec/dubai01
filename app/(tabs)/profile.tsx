import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
  Platform,
  Animated,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Camera,
  Bell,
  Shield,
  ChevronRight,
  LogOut,
  HelpCircle,
  User as UserIcon,
  Star,
  Sparkles,
  Heart,
  Flower2,
  Gift,
  Edit2,
  X,
} from "lucide-react-native";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import PhotoPickerModal from "@/components/PhotoPickerModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { getPalette, getGradient, shadow } from "@/constants/theme";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";


const formatAnalysisTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    const days = Math.floor(diffInHours / 24);
    return `${days} days ago`;
  }
};

export default function ProfileScreen() {
  const { user, setUser } = useUser();
  const { user: authUser, signOut } = useAuth();
  const { theme } = useTheme();
  const { analysisHistory } = useAnalysis();
  const { state: subscriptionState, inTrial, daysLeft, scansLeft, setSubscriptionData } = useSubscription();
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [glowAnim] = useState(new Animated.Value(0));
  const [isRestoringPurchases, setIsRestoringPurchases] = useState<boolean>(false);
  const [soulLabel, setSoulLabel] = useState<string>('Beautiful Soul');
  const [showNameEditModal, setShowNameEditModal] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>('');
  
  const palette = getPalette(theme);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem("settings_notifications_enabled");
        if (stored !== null) setNotificationsEnabled(stored === "true");
        
        // Load onboarding data to get gender
        const onboardingData = await AsyncStorage.getItem("onboarding_data");
        if (onboardingData) {
          try {
            const data = JSON.parse(onboardingData);
            if (data.gender === 'Man') {
              setSoulLabel('Handsome Soul');
            } else {
              setSoulLabel('Beautiful Soul');
            }
          } catch (e) {
            console.log("Failed to parse onboarding data", e);
          }
        }
      } catch (e) {
        console.log("Failed to load notifications pref", e);
      }
    };
    load();
    
    // Gentle glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    glowAnimation.start();
    
    return () => glowAnimation.stop();
  }, [glowAnim]);

  const toggleNotifications = useCallback(async () => {
    try {
      const next = !notificationsEnabled;
      setNotificationsEnabled(next);
      await AsyncStorage.setItem("settings_notifications_enabled", String(next));
      console.log("Notifications preference saved", next);
    } catch (e) {
      console.log("Failed to save notifications pref", e);
      Alert.alert("Error", "Could not update notifications setting.");
    }
  }, [notificationsEnabled]);

  const handleAvatarPress = useCallback(() => {
    console.log('Avatar button pressed');
    console.log('Current user avatar:', user?.avatar);
    console.log('Setting photo picker to true');
    setShowPhotoPicker(true);
  }, [user?.avatar]);

  const handlePhotoPickerClose = useCallback(() => {
    console.log('Closing photo picker');
    console.log('Updated user avatar:', user?.avatar);
    setShowPhotoPicker(false);
  }, [user?.avatar]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            // Clear onboarding completed flag so user sees onboarding after logout
            await AsyncStorage.removeItem('@onboarding_completed');
            console.log('✅ Cleared onboarding flag on logout');
          } catch (error) {
            console.error('Error clearing onboarding flag:', error);
          }
          
          await signOut();
          // Route to onboarding instead of login
          router.replace('/onboarding');
        },
      },
    ]);
  };

  const handleHelpSupport = useCallback(async () => {
    const subject = encodeURIComponent("Help & Support - GlowCheck");
    const body = encodeURIComponent("Hi GlowCheck Team,\n\nI need help with...");
    const url = `mailto:anixagency7@gmail.com?subject=${subject}&body=${body}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else if (Platform.OS === "web") {
        (globalThis as unknown as { location: { href: string } }).location.href = url as unknown as string;
      } else {
        Alert.alert("Error", "Email app is not available on this device.");
      }
    } catch (e) {
      console.log("Failed to open mail link", e);
      Alert.alert("Error", "Could not open email composer.");
    }
  }, []);

  const handleRestorePurchases = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Not Available on Web',
        'Restore purchases is only available in the mobile app.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setIsRestoringPurchases(true);
    console.log('Restoring purchases from profile...');

    try {
      const { paymentService } = await import('@/lib/payments');
      const restored = await paymentService.restorePurchases();
      
      console.log('Restore result:', restored);

      if (restored && restored.length > 0) {
        const activeSubscription = restored[0];
        console.log('Active subscription found:', activeSubscription);
        
        await setSubscriptionData({
          isPremium: true,
          subscriptionType: activeSubscription.productId?.includes('annual') ? 'yearly' : 'monthly',
          subscriptionPrice: activeSubscription.productId?.includes('annual') ? 99 : 8.99,
          nextBillingDate: activeSubscription.expiryDate,
          purchaseToken: activeSubscription.purchaseToken,
          originalTransactionId: activeSubscription.originalTransactionId,
        });
        
        Alert.alert(
          '✨ Purchases Restored!',
          'Your premium subscription has been successfully restored.',
          [{ text: 'Great!', style: 'default' }]
        );
      } else {
        console.log('No purchases found to restore');
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any purchases associated with this account. If you believe this is an error, please contact support.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Restore purchases error:', error);
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again or contact support if the problem persists.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsRestoringPurchases(false);
    }
  }, [setSubscriptionData]);

  const displayName = useMemo(() => {
    const nameFromAuth = authUser?.user_metadata && typeof authUser.user_metadata === 'object' ? (authUser.user_metadata as { full_name?: string; name?: string }).full_name ?? (authUser.user_metadata as { full_name?: string; name?: string }).name : undefined;
    return nameFromAuth ?? user?.name ?? 'Beautiful Soul';
  }, [authUser?.user_metadata, user?.name]);

  const displayEmail = useMemo(() => {
    return authUser?.email ?? user?.email ?? 'hello@glowcheck.com';
  }, [authUser?.email, user?.email]);

  const recentActivities = useMemo(() => {
    return analysisHistory.slice(0, 3).map((analysis, index) => ({
      id: analysis.timestamp,
      type: 'glow',
      title: 'Glow Analysis',
      time: formatAnalysisTime(analysis.timestamp),
      score: Math.round(analysis.overallScore),
      icon: Camera,
      rating: analysis.rating,
    }));
  }, [analysisHistory]);

  const styles = useMemo(() => createStyles(palette), [palette]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[palette.backgroundStart, palette.backgroundEnd]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={getGradient(theme).hero} style={StyleSheet.absoluteFillObject} />
      <ScrollView showsVerticalScrollIndicator={false} testID="profileScroll" contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleAvatarPress} 
            activeOpacity={0.7} 
            testID="avatarButton" 
            style={styles.avatarContainer}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            accessible={true}
            accessibilityLabel="Change profile picture"
            accessibilityHint="Tap to select a new profile picture"
          >
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={getGradient(theme).rose} style={styles.avatarPlaceholder}>
                <UserIcon color={palette.pearl} size={36} strokeWidth={2} />
              </LinearGradient>
            )}
            <Animated.View 
              style={[
                styles.avatarGlow,
                {
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.8],
                  }),
                }
              ]} 
            />
            <View style={styles.avatarBorder} pointerEvents="none" />
            <View style={styles.cameraIconOverlay} pointerEvents="none">
              <Camera color={palette.surface} size={20} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.nameContainer}
            onPress={() => {
              setEditedName(displayName);
              setShowNameEditModal(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.name} testID="profileName">{displayName}</Text>
            <Edit2 color={palette.textSecondary} size={18} style={styles.editIcon} />
          </TouchableOpacity>
          <Text style={styles.email} testID="profileEmail">{displayEmail}</Text>
          
          <LinearGradient colors={getGradient(theme).primary} style={styles.premiumBadge}>
            <Heart color={palette.textLight} size={18} fill={palette.blush} />
            <Text style={styles.premiumText}>{soulLabel}</Text>
            <Sparkles color={palette.textLight} size={14} fill={palette.blush} />
          </LinearGradient>
        </View>

        <View style={[styles.statsContainer, shadow.card]}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: palette.overlayBlush }]}>
              <Camera color={palette.blush} size={20} strokeWidth={2.5} />
            </View>
            <Text style={styles.statNumber}>{user.stats.analyses}</Text>
            <Text style={styles.statLabel}>ANALYSES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: palette.overlayGold }]}>
              <Heart color={palette.champagne} size={20} fill={palette.champagne} strokeWidth={2.5} />
            </View>
            <Text style={styles.statNumber}>{user.stats.dayStreak}</Text>
            <Text style={styles.statLabel}>DAY STREAK</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(230,215,240,0.4)' }]}>
              <Star color={palette.lavender} size={20} fill={palette.lavender} strokeWidth={2.5} />
            </View>
            <Text style={styles.statNumber}>{user.stats.glowScore}</Text>
            <Text style={styles.statLabel}>GLOW SCORE</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Beauty Membership</Text>
            <View style={styles.sectionDivider} />
          </View>
          <LinearGradient colors={['#FFFFFF', '#FFF9F5']} style={[styles.premiumCard, shadow.glow]}>
            <View style={styles.premiumCardHeader}>
              <Heart color={palette.blush} size={28} fill={palette.blush} />
              <View style={styles.premiumCardBadge}>
                <Flower2 color={palette.lavender} size={16} fill={palette.lavender} />
                <Text style={styles.premiumCardBadgeText}>GLOW ACCESS</Text>
              </View>
            </View>
            <Text style={styles.premiumDescription}>
              Gentle access to personalized beauty insights, caring coaching, and a loving community of beautiful souls.
            </Text>
            <View style={styles.premiumFeatures}>
              <View style={styles.premiumFeature}>
                <Sparkles color={palette.gold} size={16} fill={palette.gold} />
                <Text style={styles.premiumFeatureText}>Unlimited Glow Analysis</Text>
              </View>
              <View style={styles.premiumFeature}>
                <Star color={palette.gold} size={16} fill={palette.gold} />
                <Text style={styles.premiumFeatureText}>Personal Beauty Guide</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.sectionDivider} />
          </View>
          {recentActivities.length > 0 ? recentActivities.map((activity) => (
            <TouchableOpacity key={activity.id} activeOpacity={0.8}>
              <View style={[styles.activityItem, shadow.card]}>
                <View style={styles.activityIconContainer}>
                  <View style={[styles.activityIcon, { backgroundColor: palette.overlayBlush }]}>
                    <activity.icon color={palette.blush} size={22} strokeWidth={2} />
                  </View>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                  <View style={styles.activityBadge}>
                    <Heart color={palette.blush} size={12} fill={palette.blush} />
                    <Text style={styles.activityBadgeText}>{activity.rating || 'Beautiful'}</Text>
                  </View>
                </View>
                <View style={styles.activityScoreContainer}>
                  <Text style={styles.activityScore}>{activity.score}</Text>
                  <Text style={styles.activityScoreLabel}>Glow</Text>
                </View>
              </View>
            </TouchableOpacity>
          )) : (
            <View style={[styles.activityItem, shadow.card]}>
              <View style={styles.activityIconContainer}>
                <View style={[styles.activityIcon, { backgroundColor: palette.overlayBlush }]}>
                  <Camera color={palette.blush} size={22} strokeWidth={2} />
                </View>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>No analyses yet</Text>
                <Text style={styles.activityTime}>Start your glow journey</Text>
                <View style={styles.activityBadge}>
                  <Heart color={palette.blush} size={12} fill={palette.blush} />
                  <Text style={styles.activityBadgeText}>Ready to glow</Text>
                </View>
              </View>
              <View style={styles.activityScoreContainer}>
                <Text style={styles.activityScore}>--</Text>
                <Text style={styles.activityScoreLabel}>Glow</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.sectionDivider} />
          </View>

          <View style={styles.settingsCard}>
            <View style={styles.settingItem} testID="notificationsRow">
              <View style={styles.settingIconContainer}>
                <Bell color={palette.blush} size={22} strokeWidth={2} />
              </View>
              <Text style={styles.settingText}>Gentle Notifications</Text>
              <Switch
                testID="notificationsSwitch"
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: palette.surfaceAlt, true: palette.overlayBlush }}
                thumbColor={notificationsEnabled ? palette.blush : palette.textMuted}
              />
            </View>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/start-trial')}
              activeOpacity={0.7}
              testID="subscriptionBtn"
            >
              <View style={styles.settingIconContainer}>
                <Heart color={palette.champagne} size={22} strokeWidth={2} fill={palette.champagne} />
              </View>
              <View style={styles.subscriptionInfo}>
                <Text style={styles.settingText}>Beauty Subscription</Text>
                {subscriptionState.isPremium ? (
                  <Text style={styles.subscriptionStatus}>
                    Premium {subscriptionState.subscriptionType} • ${subscriptionState.subscriptionPrice}
                  </Text>
                ) : inTrial ? (
                  <Text style={styles.subscriptionStatus}>
                    Trial • {daysLeft} days, {scansLeft} scans left
                  </Text>
                ) : (
                  <Text style={styles.subscriptionStatus}>Free • Upgrade to Premium</Text>
                )}
              </View>
              <ChevronRight color={palette.gold} size={22} strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleRestorePurchases}
              activeOpacity={0.7}
              disabled={isRestoringPurchases}
              testID="restorePurchasesBtn"
            >
              <View style={styles.settingIconContainer}>
                <Shield color={palette.lavender} size={22} strokeWidth={2} />
              </View>
              <Text style={styles.settingText}>Restore Purchases</Text>
              {isRestoringPurchases ? (
                <ActivityIndicator size="small" color={palette.lavender} style={{ marginLeft: 8 }} />
              ) : (
                <ChevronRight color={palette.gold} size={22} strokeWidth={2.5} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/promo-code')}
              activeOpacity={0.7}
              testID="promoCodeBtn"
            >
              <View style={styles.settingIconContainer}>
                <Gift color={palette.blush} size={22} strokeWidth={2} />
              </View>
              <Text style={styles.settingText}>Redeem Promo Code</Text>
              <ChevronRight color={palette.gold} size={22} strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/privacy-care')}
              activeOpacity={0.7}
              testID="privacyBtn"
            >
              <View style={styles.settingIconContainer}>
                <Shield color={palette.lavender} size={22} strokeWidth={2} />
              </View>
              <Text style={styles.settingText}>Privacy & Care</Text>
              <ChevronRight color={palette.gold} size={22} strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={handleHelpSupport} activeOpacity={0.7} testID="helpSupportBtn">
              <View style={styles.settingIconContainer}>
                <HelpCircle color={palette.mint} size={22} strokeWidth={2} />
              </View>
              <Text style={styles.settingText}>Caring Support</Text>
              <ChevronRight color={palette.gold} size={22} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={() => {
              console.log('Test button pressed - opening photo picker');
              setShowPhotoPicker(true);
            }} 
            testID="testPhotoBtn"
            style={{ marginBottom: 16 }}
          >
            <View style={[styles.logoutButton, { borderColor: palette.gold, backgroundColor: palette.surface }]}>
              <Camera color={palette.gold} size={22} strokeWidth={2} />
              <Text style={[styles.logoutText, { color: palette.gold }]}>Test Photo Picker</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity activeOpacity={0.8} onPress={handleLogout} testID="logoutBtn">
            <View style={[styles.logoutButton, shadow.card]}>
              <LogOut color={palette.error} size={22} strokeWidth={2} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showPhotoPicker && (
        <PhotoPickerModal 
          visible={showPhotoPicker} 
          onClose={handlePhotoPickerClose} 
        />
      )}

      {/* Edit Name Modal */}
      <Modal
        visible={showNameEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TouchableOpacity onPress={() => setShowNameEditModal(false)}>
              <X color={palette.textSecondary} size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter your name"
              value={editedName}
              onChangeText={setEditedName}
              placeholderTextColor={palette.textMuted}
              autoFocus
              maxLength={50}
            />
            
            <TouchableOpacity 
              style={[
                styles.modalSaveButton,
                { opacity: editedName.trim() ? 1 : 0.5 }
              ]}
              onPress={async () => {
                if (!editedName.trim()) {
                  Alert.alert('Invalid Name', 'Please enter a valid name.');
                  return;
                }
                
                try {
                  const newName = editedName.trim();
                  console.log('[Profile] Updating name to:', newName);
                  
                  // Update user in UserContext
                  if (user) {
                    const updatedUser = { ...user, name: newName };
                    console.log('[Profile] Before setUser - user.name:', user.name);
                    console.log('[Profile] After setUser will have - updatedUser.name:', updatedUser.name);
                    await setUser(updatedUser);
                    console.log('[Profile] ✅ UserContext updated with name:', newName);
                  } else {
                    console.warn('[Profile] No user object found, cannot update UserContext');
                  }
                  
                  // Update Supabase user metadata if available
                  if (authUser) {
                    const { data: updateData, error } = await supabase.auth.updateUser({
                      data: { full_name: newName, name: newName }
                    });
                    
                    if (error) {
                      console.error('[Profile] Error updating Supabase metadata:', error);
                    } else if (updateData?.user) {
                      // Refresh the session to get updated metadata immediately
                      await supabase.auth.refreshSession();
                      console.log('[Profile] ✅ Name updated in Supabase metadata:', updateData.user.user_metadata);
                      console.log('[Profile] ✅ Session refreshed, auth user should have updated metadata');
                    }
                  } else {
                    console.warn('[Profile] No authUser found, cannot update Supabase metadata');
                  }
                  
                  setShowNameEditModal(false);
                  Alert.alert('Success', 'Name updated successfully!');
                  
                  // Log what we expect to see when posting
                  console.log('[Profile] ✅ Name update complete. When you create a post, it should show:', newName);
                } catch (error) {
                  console.error('[Profile] Error updating name:', error);
                  Alert.alert('Error', 'Failed to update name. Please try again.');
                }
              }}
              disabled={!editedName.trim()}
            >
              <Text style={styles.modalSaveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarGlow: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 58,
    backgroundColor: palette.overlayGold,
    zIndex: -1,
  },
  avatarBorder: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 54,
    borderWidth: 3,
    borderColor: palette.gold,
  },
  cameraIconOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.gold,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: palette.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    gap: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: "900",
    color: palette.textPrimary,
    letterSpacing: -0.5,
  },
  editIcon: {
    marginTop: 2,
  },
  email: {
    fontSize: 16,
    color: palette.textSecondary,
    marginBottom: 16,
    fontWeight: "500",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    gap: 8,
    backgroundColor: palette.surface,
  },
  premiumText: {
    fontSize: 14,
    color: palette.textLight,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 28,
    marginBottom: 40,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.divider,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "900",
    color: palette.gold,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: palette.textSecondary,
    fontWeight: "800",
    letterSpacing: 1,
  },
  statDivider: {
    width: 2,
    height: 60,
    backgroundColor: palette.divider,
    marginHorizontal: 20,
    borderRadius: 1,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: palette.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: palette.gold,
    width: 40,
    borderRadius: 1,
  },
  premiumCard: {
    padding: 24,
    borderRadius: 20,
  },
  premiumCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  premiumCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumCardBadgeText: {
    color: palette.textPrimary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  premiumDescription: {
    fontSize: 16,
    color: palette.textPrimary,
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: "500",
  },
  premiumFeatures: {
    gap: 12,
  },
  premiumFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  premiumFeatureText: {
    fontSize: 14,
    color: palette.textPrimary,
    fontWeight: "600",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.divider,
  },
  activityIconContainer: {
    marginRight: 16,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: palette.textPrimary,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 13,
    color: palette.textSecondary,
    marginBottom: 8,
    fontWeight: "500",
  },
  activityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
    gap: 4,
  },
  activityBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: palette.gold,
    letterSpacing: 0.5,
  },
  activityScoreContainer: {
    alignItems: "center",
  },
  activityScore: {
    fontSize: 24,
    fontWeight: "900",
    color: palette.gold,
    marginBottom: 2,
  },
  activityScoreLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: palette.textMuted,
    letterSpacing: 0.5,
  },
  preferenceCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  preferenceGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  preferenceDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.textSecondary,
  },
  preferenceArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  preferenceSwitch: {
    marginLeft: 12,
  },
  themeToggle: {
    flexDirection: 'row',
    backgroundColor: palette.surfaceElevated,
    borderRadius: 12,
    padding: 2,
  },
  themeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 2,
  },
  themeOptionActive: {
    backgroundColor: palette.surface,
  },
  settingsCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.divider,
    padding: 8,
    gap: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.divider,
    gap: 12,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.surfaceElevated,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  subscriptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  subscriptionStatus: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  logoutSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.error,
    letterSpacing: 0.3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.textPrimary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.textPrimary,
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: palette.textPrimary,
    borderWidth: 1,
    borderColor: palette.borderLight,
    marginBottom: 24,
  },
  modalSaveButton: {
    backgroundColor: palette.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveButtonText: {
    color: palette.textLight,
    fontSize: 16,
    fontWeight: "600",
  },
});
